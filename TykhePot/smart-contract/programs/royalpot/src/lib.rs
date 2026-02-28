use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Transfer, Token, TokenAccount, Mint};

pub mod staking;
pub mod airdrop;

// ============================================================
// Constants
// ============================================================

pub const BASE: u64 = 10_000;
pub const BURN_RATE: u64 = 300;   // 3% burn on successful draw
pub const PLAT_RATE: u64 = 200;   // 2% platform fee

// Prize distribution within prize pool (basis points of prize_pool = 95% of total)
// 30 + 20 + 15 + 10 + 20 + 5 = 100% of prize_pool ✓
pub const ROLLOVER_BP: u64 = 500;         // 5%  — stays in vault for next round
pub const PRIZE_1ST_BP: u64 = 3000;       // 30% — 1 winner
pub const PRIZE_2ND_EACH_BP: u64 = 1000;  // 10% — 2 winners (10% each)
pub const PRIZE_3RD_EACH_BP: u64 = 500;   // 5%  — 3 winners (5% each)
pub const PRIZE_LUCKY_EACH_BP: u64 = 200; // 2%  — 5 lucky winners (2% each)
pub const PRIZE_UNIVERSAL_BP: u64 = 2000; // 20% — all non-prize-winners split equally

// Top-prize vesting: 5%/day over 20 days (anyone can call claim_prize_vesting each day)
// Day 0 (draw day): 5% vested (eligible immediately after draw)
// Day N: N * 5% cumulative → claimable = cumulative - already_claimed
pub const PRIZE_VEST_DAYS: u64 = 20;
pub const PRIZE_VEST_DAY_BP: u64 = 500; // 5% per day

// Referral (paid from referral_vault when remaining_accounts supplied in deposit)
pub const REFERRER_BP: u64 = 800;  // 8% to referrer
// Note: 2% one-time referee bonus — tracked off-chain by cron; on-chain TODO v3

pub const MIN_PARTICIPANTS: u32 = 12; // need ≥12 (11 prize slots + ≥1 universal)
pub const LOCK_PERIOD: i64 = 300;     // 5-min deposit lock before draw

pub const DURATION_30MIN:  i64 = 1_800;
pub const DURATION_HOURLY: i64 = 3_600;
pub const DURATION_DAILY:  i64 = 86_400;

pub const MIN_30MIN:  u64 = 500_000_000_000; // 500 TPOT
pub const MIN_HOURLY: u64 = 200_000_000_000; // 200 TPOT
pub const MIN_DAILY:  u64 = 100_000_000_000; // 100 TPOT

pub const FREE_BET_AMOUNT: u64 = 100_000_000_000; // 100 TPOT

// Account sizes (bytes)
// GlobalState: disc(8) + 6×Pubkey(192) + bump(1) + pad(7) = 208
pub const GLOBAL_STATE_SIZE: usize = 8 + 192 + 1 + 7;
// PoolState: disc(8)+pool_type(1)+round_number(8)+start(8)+end(8)+deposited(8)+
//            free_bet_total(8)+regular_count(4)+free_count(4)+vault(32)+rollover(8)+bump(1)+pad(7)=105
pub const POOL_STATE_SIZE: usize = 8 + 1 + 8 + 8 + 8 + 8 + 8 + 4 + 4 + 32 + 8 + 1 + 7;
// UserDeposit: disc(8)+user(32)+pool_type(1)+round(8)+amount(8)+referrer(32)+bump(1)+pad(6) = 96
pub const USER_DEPOSIT_SIZE: usize = 8 + 32 + 1 + 8 + 8 + 32 + 1 + 6;
// FreeDeposit: disc(8)+user(32)+pool_type(1)+is_active(1)+amount(8)+referrer(32)+bump(1)+pad(7) = 90
pub const FREE_DEPOSIT_SIZE: usize = 8 + 32 + 1 + 1 + 8 + 32 + 1 + 7;
pub const AIRDROP_CLAIM_SIZE: usize = 8 + 32 + 1 + 1 + 6;
// DrawResult: disc(8)+pool_type(1)+round(8)+top_winners(192)+top_amounts(48)+
//             top_claimed(48)+draw_timestamp(8)+bump(1) = 314
pub const DRAW_RESULT_SIZE: usize = 8 + 1 + 8 + 192 + 48 + 48 + 8 + 1;

// Staking/vesting (unchanged)
pub const VESTING_DAYS: u64 = 20;
pub const VESTING_RELEASE_PER_DAY: u64 = 500; // 5% per day

declare_id!("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");

// ============================================================
// Enums
// ============================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum PoolType {
    Min30  = 0,
    Hourly = 1,
    Daily  = 2,
}

impl PoolType {
    pub fn duration(&self) -> i64 {
        match self {
            PoolType::Min30  => DURATION_30MIN,
            PoolType::Hourly => DURATION_HOURLY,
            PoolType::Daily  => DURATION_DAILY,
        }
    }
    pub fn min_deposit(&self) -> u64 {
        match self {
            PoolType::Min30  => MIN_30MIN,
            PoolType::Hourly => MIN_HOURLY,
            PoolType::Daily  => MIN_DAILY,
        }
    }
}

pub fn pool_type_from_u8(v: u8) -> Result<PoolType> {
    match v {
        0 => Ok(PoolType::Min30),
        1 => Ok(PoolType::Hourly),
        2 => Ok(PoolType::Daily),
        _ => err!(ErrorCode::InvalidPoolType),
    }
}

// ============================================================
// Account Structs
// ============================================================

/// One-time global config. Written at initialize, never changed.
#[account]
pub struct GlobalState {
    pub token_mint:         Pubkey,
    /// Platform fee accumulator
    pub platform_fee_vault: Pubkey,
    /// Funds free-bet entries (airdrop source)
    pub airdrop_vault:      Pubkey,
    /// Referral rewards source (8% referrer bonus)
    pub referral_vault:     Pubkey,
    /// Daily-pool 1:1 deposit matching source
    pub reserve_vault:      Pubkey,
    /// Unvested top-prize escrow (holds 1st/2nd/3rd prize tokens until vested)
    pub prize_escrow_vault: Pubkey,
    pub bump: u8,
    pub _padding: [u8; 7],
}

/// Per-pool state. Three PDAs: 30min / hourly / daily.
#[account]
pub struct PoolState {
    pub pool_type:         u8,
    pub round_number:      u64,
    pub round_start_time:  i64,
    pub round_end_time:    i64,
    pub total_deposited:   u64,
    pub free_bet_total:    u64,
    pub regular_count:     u32,
    pub free_count:        u32,
    pub vault:             Pubkey,
    /// Rollover from previous successful draw (already in vault)
    pub rollover:          u64,
    pub bump:              u8,
    pub _padding:          [u8; 7],
}

/// One deposit per user per pool per round.
#[account]
pub struct UserDeposit {
    pub user:         Pubkey,
    pub pool_type:    u8,
    pub round_number: u64,
    pub amount:       u64,
    /// Referrer's token account (Pubkey::default = no referrer).
    /// Cleared to default once referral has been paid via claim_referral().
    pub referrer:     Pubkey,
    pub bump:         u8,
    pub _padding:     [u8; 6],
}

/// Free-bet entry. Persists across refunded rounds (is_active stays true).
/// is_active byte offset: disc(8)+user(32)+pool_type(1) = 41
#[account]
pub struct FreeDeposit {
    pub user:      Pubkey,
    pub pool_type: u8,
    pub is_active: bool,
    pub amount:    u64,
    /// Always Pubkey::default() — free bets carry no referral obligation.
    pub referrer:  Pubkey,
    pub bump:      u8,
    pub _padding:  [u8; 7],
}

/// Created once when user calls claim_free_airdrop.
#[account]
pub struct AirdropClaim {
    pub user:               Pubkey,
    pub free_bet_available: bool,
    pub bump:               u8,
    pub _padding:           [u8; 6],
}

/// Created during execute_draw for every successful (≥12-participant) round.
/// Tracks the 6 top-prize winners and their individual vested claims.
/// top_winners[0]      = 1st prize winner
/// top_winners[1..2]   = 2nd prize winners (×2)
/// top_winners[3..5]   = 3rd prize winners (×3)
/// top_amounts[i]      = total prize owed to winner i
/// top_claimed[i]      = cumulative amount already transferred to winner i
#[account]
pub struct DrawResult {
    pub pool_type:       u8,
    pub round_number:    u64,
    pub top_winners:     [Pubkey; 6],
    pub top_amounts:     [u64; 6],
    pub top_claimed:     [u64; 6],
    pub draw_timestamp:  i64,
    pub bump:            u8,
}

// ============================================================
// Error Codes
// ============================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Betting is closed for this round (within 5min of draw)")]
    BettingClosed,
    #[msg("Deposit amount is below the minimum for this pool")]
    BelowMinimum,
    #[msg("Already deposited in this round")]
    AlreadyDeposited,
    #[msg("Draw time has not arrived yet")]
    TooEarlyForDraw,
    #[msg("Number of participant accounts does not match pool state")]
    ParticipantCountMismatch,
    #[msg("Invalid or mismatched participant account")]
    InvalidParticipant,
    #[msg("No free bet available — claim airdrop first")]
    NoFreeBetAvailable,
    #[msg("Free bet is already active in this pool")]
    FreeBetAlreadyActive,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid pool type (must be 0, 1, or 2)")]
    InvalidPoolType,
    #[msg("Wrong round number in participant account")]
    WrongRoundNumber,
    #[msg("Vault address mismatch")]
    VaultMismatch,
    #[msg("Platform vault mismatch")]
    PlatformVaultMismatch,
    #[msg("Airdrop vault mismatch")]
    AirdropVaultMismatch,
    #[msg("Token mint mismatch")]
    MintMismatch,
    #[msg("Pool has enough participants — use execute_draw instead")]
    ShouldUseDraw,
    #[msg("Pool does not have enough participants — use execute_refund instead")]
    ShouldUseRefund,
    #[msg("Free bet can only be used in the Daily Pool")]
    FreeBetDailyOnly,
    #[msg("Prize escrow vault mismatch")]
    PrizeEscrowMismatch,
    #[msg("Referral vault mismatch")]
    ReferralVaultMismatch,
    #[msg("Reserve vault mismatch")]
    ReserveVaultMismatch,
    #[msg("This prize has already been fully claimed")]
    AlreadyFullyClaimed,
    #[msg("Winner index out of range (must be 0-5)")]
    InvalidWinnerIndex,
    #[msg("Winner token account does not match draw record")]
    WinnerTokenMismatch,
    #[msg("No referral recorded for this deposit")]
    NoReferral,
    #[msg("Referrer token account does not match stored referrer")]
    ReferrerMismatch,
}

// ============================================================
// Events
// ============================================================

#[event]
pub struct DrawExecuted {
    pub pool_type:        u8,
    pub round_number:     u64,
    pub total_pool:       u64,
    pub participant_count: u32,
    /// Winner pubkeys: [1st, 2nd_a, 2nd_b, 3rd_a, 3rd_b, 3rd_c]
    pub top_winners:      [Pubkey; 6],
    /// Corresponding prize amounts (full amounts, vested over 20 days)
    pub top_amounts:      [u64; 6],
    /// 5 lucky winners (immediate payout)
    pub lucky_winners:    [Pubkey; 5],
    pub lucky_amount_each: u64,
    /// Universal prize (all non-prize-winners)
    pub universal_count:  u32,
    pub universal_amount_each: u64,
    pub burn_amount:      u64,
    pub platform_amount:  u64,
    pub rollover_amount:  u64,
    pub draw_seed:        [u8; 32],
    pub timestamp:        i64,
}

#[event]
pub struct RoundRefunded {
    pub pool_type:         u8,
    pub round_number:      u64,
    pub regular_refunded:  u32,
    pub free_carried_over: u32,
    pub total_refunded:    u64,
    pub timestamp:         i64,
}

#[event]
pub struct Deposited {
    pub pool_type:    u8,
    pub round_number: u64,
    pub user:         Pubkey,
    pub amount:       u64,
    pub matched:      u64, // reserve matching amount (0 for non-daily)
    pub timestamp:    i64,
}

#[event]
pub struct FreeBetActivated {
    pub pool_type: u8,
    pub user:      Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PrizeVestingClaimed {
    pub pool_type:      u8,
    pub round_number:   u64,
    pub winner_index:   u8,
    pub winner:         Pubkey,
    pub claimed_amount: u64,
    pub total_claimed:  u64,
    pub total_prize:    u64,
    pub timestamp:      i64,
}

// ============================================================
// Helper: Pick 11 distinct winner indices via partial Fisher-Yates
// Uses LCG seeded from draw_seed[0..8].
// Returns [1st, 2nd_a, 2nd_b, 3rd_a, 3rd_b, 3rd_c, lucky×5]
// ============================================================

fn pick_winner_indices(seed: [u8; 32], total: usize) -> [usize; 11] {
    // Needs total >= 11 (guaranteed by MIN_PARTICIPANTS = 12)
    let mut pool: Vec<usize> = (0..total).collect();
    let mut rng = u64::from_le_bytes(seed[0..8].try_into().unwrap());
    for i in 0..11 {
        // LCG step
        rng = rng.wrapping_mul(6_364_136_223_846_793_005u64)
                 .wrapping_add(1_442_695_040_888_963_407u64);
        let j = i + (rng >> 33) as usize % (total - i);
        pool.swap(i, j);
    }
    let mut result = [0usize; 11];
    result.copy_from_slice(&pool[0..11]);
    result
}

// ============================================================
// Program
// ============================================================

#[program]
pub mod royalpot {
    use super::*;

    // ----------------------------------------------------------
    // One-time setup
    // ----------------------------------------------------------

    /// Initialize global config. Called once at deployment.
    /// After this, no admin controls exist — everything is rule-based.
    pub fn initialize(
        ctx: Context<Initialize>,
        platform_fee_vault: Pubkey,
        referral_vault: Pubkey,
        reserve_vault: Pubkey,
        prize_escrow_vault: Pubkey,
    ) -> Result<()> {
        let state = &mut ctx.accounts.global_state;
        state.token_mint         = ctx.accounts.token_mint.key();
        state.platform_fee_vault = platform_fee_vault;
        state.airdrop_vault      = ctx.accounts.airdrop_vault.key();
        state.referral_vault     = referral_vault;
        state.reserve_vault      = reserve_vault;
        state.prize_escrow_vault = prize_escrow_vault;
        state.bump               = ctx.bumps.global_state;
        state._padding           = [0u8; 7];
        Ok(())
    }

    /// Initialize one pool. Called three times (30min / hourly / daily).
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        pool_type: u8,
        initial_start_time: i64,
    ) -> Result<()> {
        let pt = pool_type_from_u8(pool_type)?;
        let pool = &mut ctx.accounts.pool_state;
        pool.pool_type        = pool_type;
        pool.round_number     = 1;
        pool.round_start_time = initial_start_time;
        pool.round_end_time   = initial_start_time + pt.duration();
        pool.total_deposited  = 0;
        pool.free_bet_total   = 0;
        pool.regular_count    = 0;
        pool.free_count       = 0;
        pool.vault            = ctx.accounts.pool_vault.key();
        pool.rollover         = 0;
        pool.bump             = ctx.bumps.pool_state;
        pool._padding         = [0u8; 7];
        Ok(())
    }

    // ----------------------------------------------------------
    // User actions
    // ----------------------------------------------------------

    /// Regular deposit into a pool for the current round.
    ///
    /// remaining_accounts (optional):
    ///   [0] referrer's token account — pubkey is stored in UserDeposit.referrer.
    ///       Referral (8%) is paid ONLY after a successful draw via claim_referral().
    ///       No transfer happens at deposit time.
    pub fn deposit<'info>(
        ctx: Context<'_, '_, '_, 'info, Deposit<'info>>,
        amount: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let pool = &mut ctx.accounts.pool_state;
        let pt = pool_type_from_u8(pool.pool_type)?;

        require!(
            clock.unix_timestamp < pool.round_end_time - LOCK_PERIOD,
            ErrorCode::BettingClosed
        );
        require!(amount >= pt.min_deposit(), ErrorCode::BelowMinimum);

        // Record deposit PDA (init fails if already exists → prevents double deposit)
        let dep = &mut ctx.accounts.user_deposit;
        dep.user         = ctx.accounts.user.key();
        dep.pool_type    = pool.pool_type;
        dep.round_number = pool.round_number;
        dep.amount       = amount;
        // Store referrer's token account for deferred payout via claim_referral().
        // Referral is only paid after a successful draw — never on deposit or refund.
        dep.referrer     = if !ctx.remaining_accounts.is_empty() {
            ctx.remaining_accounts[0].key()
        } else {
            Pubkey::default()
        };
        dep.bump         = ctx.bumps.user_deposit;
        dep._padding     = [0u8; 6];

        // User → pool vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.user_token_account.to_account_info(),
                    to:        ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        pool.total_deposited = pool.total_deposited
            .checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
        pool.regular_count   = pool.regular_count
            .checked_add(1).ok_or(ErrorCode::MathOverflow)?;

        // ---------------------------------------------------
        // Daily pool: 1:1 reserve matching
        // ---------------------------------------------------
        let mut matched: u64 = 0;
        if pool.pool_type == 2 {
            let reserve_balance = ctx.accounts.reserve_vault.amount;
            if reserve_balance > 0 {
                matched = amount.min(reserve_balance);
                let gs_bump = ctx.accounts.global_state.bump;
                let gs_seeds: &[&[u8]] = &[b"global_state", &[gs_bump]];
                let signer = &[gs_seeds];
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from:      ctx.accounts.reserve_vault.to_account_info(),
                            to:        ctx.accounts.pool_vault.to_account_info(),
                            authority: ctx.accounts.global_state.to_account_info(),
                        },
                        signer,
                    ),
                    matched,
                )?;
                pool.total_deposited = pool.total_deposited
                    .checked_add(matched).ok_or(ErrorCode::MathOverflow)?;
            }
        }

        emit!(Deposited {
            pool_type:    pool.pool_type,
            round_number: pool.round_number,
            user:         ctx.accounts.user.key(),
            amount,
            matched,
            timestamp:    clock.unix_timestamp,
        });
        Ok(())
    }

    /// Activate free bet — DAILY POOL ONLY.
    /// Transfers 100 TPOT from airdrop_vault → daily pool_vault.
    /// FreeDeposit PDA persists until a successful draw consumes it.
    pub fn use_free_bet(ctx: Context<UseFreeBet>, pool_type: u8) -> Result<()> {
        // Enforce daily-pool-only rule
        require!(pool_type == 2, ErrorCode::FreeBetDailyOnly);

        let clock = Clock::get()?;
        let pool = &mut ctx.accounts.pool_state;

        require!(
            clock.unix_timestamp < pool.round_end_time - LOCK_PERIOD,
            ErrorCode::BettingClosed
        );

        let claim = &mut ctx.accounts.airdrop_claim;
        require!(claim.free_bet_available, ErrorCode::NoFreeBetAvailable);

        let free_dep = &mut ctx.accounts.free_deposit;
        free_dep.user      = ctx.accounts.user.key();
        free_dep.pool_type = pool_type;
        free_dep.is_active = true;
        free_dep.amount    = FREE_BET_AMOUNT;
        free_dep.referrer  = Pubkey::default(); // free bets carry no referral
        free_dep.bump      = ctx.bumps.free_deposit;
        free_dep._padding  = [0u8; 7];

        claim.free_bet_available = false;

        // Transfer 100 TPOT: airdrop_vault → pool_vault (signed by global_state PDA)
        let gs_bump = ctx.accounts.global_state.bump;
        let gs_seeds: &[&[u8]] = &[b"global_state", &[gs_bump]];
        let signer = &[gs_seeds];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.airdrop_vault.to_account_info(),
                    to:        ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.global_state.to_account_info(),
                },
                signer,
            ),
            FREE_BET_AMOUNT,
        )?;

        pool.free_bet_total = pool.free_bet_total
            .checked_add(FREE_BET_AMOUNT).ok_or(ErrorCode::MathOverflow)?;
        pool.free_count     = pool.free_count
            .checked_add(1).ok_or(ErrorCode::MathOverflow)?;

        emit!(FreeBetActivated {
            pool_type: pool.pool_type,
            user:      ctx.accounts.user.key(),
            timestamp: clock.unix_timestamp,
        });
        Ok(())
    }

    /// Execute draw — call when total_count >= MIN_PARTICIPANTS.
    ///
    /// remaining_accounts layout:
    ///   [0 .. regular_count*2 - 1]:
    ///     pairs (user_deposit_pda, user_token_account) for regular depositors
    ///   [regular_count*2 .. (regular_count+free_count)*2 - 1]:
    ///     pairs (free_deposit_pda, user_token_account) for free-bet holders
    ///
    /// Referral payouts are NOT done here. After a successful draw, the cron
    /// calls claim_referral() for each deposit that has a non-default referrer.
    ///
    /// Prize flow:
    ///   3% burn · 2% platform · 5% rollover (stays in vault)
    ///   Of remaining 90% prize pool (= 95% − 5% rollover):
    ///     1st: 30% · 2nd: 10%×2 · 3rd: 5%×3 → prize_escrow_vault (vested 20 days)
    ///     lucky: 2%×5 → immediate payment
    ///     universal: 20% ÷ (total−11) → immediate payment to all non-prize-winners
    pub fn execute_draw<'info>(
        ctx: Context<'_, '_, '_, 'info, ExecuteDraw<'info>>,
        draw_seed: [u8; 32],
    ) -> Result<()> {
        let clock = Clock::get()?;

        // Snapshot pool fields before mutable borrow
        let pool_type       = ctx.accounts.pool_state.pool_type;
        let pool_bump       = ctx.accounts.pool_state.bump;
        let round_number    = ctx.accounts.pool_state.round_number;
        let round_end       = ctx.accounts.pool_state.round_end_time;
        let regular_count   = ctx.accounts.pool_state.regular_count as usize;
        let free_count      = ctx.accounts.pool_state.free_count as usize;
        let total_deposited = ctx.accounts.pool_state.total_deposited;
        let free_bet_total  = ctx.accounts.pool_state.free_bet_total;
        let prev_rollover   = ctx.accounts.pool_state.rollover;
        let vault_key       = ctx.accounts.pool_state.vault;

        require!(clock.unix_timestamp >= round_end, ErrorCode::TooEarlyForDraw);
        require!(ctx.accounts.pool_vault.key() == vault_key, ErrorCode::VaultMismatch);

        let total_count = regular_count + free_count;
        require!(
            (total_count as u32) >= MIN_PARTICIPANTS,
            ErrorCode::ShouldUseRefund
        );
        require!(
            ctx.remaining_accounts.len() == total_count * 2,
            ErrorCode::ParticipantCountMismatch
        );

        // -------------------------------------------------------
        // Compute prize amounts
        // -------------------------------------------------------
        let total_pool = total_deposited
            .checked_add(free_bet_total).ok_or(ErrorCode::MathOverflow)?
            .checked_add(prev_rollover).ok_or(ErrorCode::MathOverflow)?;

        let burn_amount = total_pool
            .checked_mul(BURN_RATE).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;
        let plat_amount = total_pool
            .checked_mul(PLAT_RATE).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;

        // prize_pool = 95% of total_pool
        let prize_pool = total_pool
            .checked_sub(burn_amount).ok_or(ErrorCode::MathOverflow)?
            .checked_sub(plat_amount).ok_or(ErrorCode::MathOverflow)?;

        // Rollover: 5% of prize_pool stays in vault
        let rollover_amount = prize_pool
            .checked_mul(ROLLOVER_BP).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;

        // distributable = prize_pool - rollover
        let distributable = prize_pool
            .checked_sub(rollover_amount).ok_or(ErrorCode::MathOverflow)?;

        let prize_1st = distributable
            .checked_mul(PRIZE_1ST_BP).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;
        let prize_2nd_each = distributable
            .checked_mul(PRIZE_2ND_EACH_BP).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;
        let prize_3rd_each = distributable
            .checked_mul(PRIZE_3RD_EACH_BP).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;
        let prize_lucky_each = distributable
            .checked_mul(PRIZE_LUCKY_EACH_BP).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;
        let prize_universal_total = distributable
            .checked_mul(PRIZE_UNIVERSAL_BP).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;

        // universal_count = total participants - 11 prize winners
        let universal_count = total_count.saturating_sub(11);
        let prize_universal_each = if universal_count > 0 {
            prize_universal_total
                .checked_div(universal_count as u64)
                .ok_or(ErrorCode::MathOverflow)?
        } else {
            0u64
        };

        // Total going to prize_escrow = 1st + 2×2nd + 3×3rd
        let top_prize_total = prize_1st
            .checked_add(prize_2nd_each.checked_mul(2).ok_or(ErrorCode::MathOverflow)?)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_add(prize_3rd_each.checked_mul(3).ok_or(ErrorCode::MathOverflow)?)
            .ok_or(ErrorCode::MathOverflow)?;

        // -------------------------------------------------------
        // Select 11 distinct winners
        // -------------------------------------------------------
        let winner_indices = pick_winner_indices(draw_seed, total_count);
        // Build is_winner mask
        let mut is_winner = vec![false; total_count];
        for &w in &winner_indices {
            is_winner[w] = true;
        }

        let pool_seeds: &[&[u8]] = &[b"pool", &[pool_type], &[pool_bump]];
        let pool_signer = &[pool_seeds];

        // -------------------------------------------------------
        // 1. Burn 3%
        // -------------------------------------------------------
        token::burn(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint:      ctx.accounts.token_mint.to_account_info(),
                    from:      ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.pool_state.to_account_info(),
                },
                pool_signer,
            ),
            burn_amount,
        )?;

        // -------------------------------------------------------
        // 2. Platform fee 2%
        // -------------------------------------------------------
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.pool_vault.to_account_info(),
                    to:        ctx.accounts.platform_vault.to_account_info(),
                    authority: ctx.accounts.pool_state.to_account_info(),
                },
                pool_signer,
            ),
            plat_amount,
        )?;

        // -------------------------------------------------------
        // 3. Transfer ALL top prizes to prize_escrow_vault (vested 20 days)
        // -------------------------------------------------------
        if top_prize_total > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from:      ctx.accounts.pool_vault.to_account_info(),
                        to:        ctx.accounts.prize_escrow_vault.to_account_info(),
                        authority: ctx.accounts.pool_state.to_account_info(),
                    },
                    pool_signer,
                ),
                top_prize_total,
            )?;
        }

        // -------------------------------------------------------
        // 4. Immediate payouts: lucky winners (indices 6..10)
        // -------------------------------------------------------
        let mut lucky_winners = [Pubkey::default(); 5];
        for i in 0..5 {
            let idx = winner_indices[6 + i];
            let tok_acc = &ctx.remaining_accounts[idx * 2 + 1];
            if prize_lucky_each > 0 {
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from:      ctx.accounts.pool_vault.to_account_info(),
                            to:        tok_acc.to_account_info(),
                            authority: ctx.accounts.pool_state.to_account_info(),
                        },
                        pool_signer,
                    ),
                    prize_lucky_each,
                )?;
            }
            // Read lucky winner pubkey (from deposit or free-deposit PDA)
            lucky_winners[i] = read_participant_pubkey(
                &ctx.remaining_accounts[idx * 2],
                idx < regular_count,
                pool_type,
                round_number,
            )?;
        }

        // -------------------------------------------------------
        // 5. Immediate payouts: universal winners (all non-prize-winners)
        // -------------------------------------------------------
        for idx in 0..total_count {
            if !is_winner[idx] && prize_universal_each > 0 {
                let tok_acc = &ctx.remaining_accounts[idx * 2 + 1];
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from:      ctx.accounts.pool_vault.to_account_info(),
                            to:        tok_acc.to_account_info(),
                            authority: ctx.accounts.pool_state.to_account_info(),
                        },
                        pool_signer,
                    ),
                    prize_universal_each,
                )?;
            }
        }

        // -------------------------------------------------------
        // 6. Build DrawResult (top-6 winners + amounts)
        // -------------------------------------------------------
        let top_amounts: [u64; 6] = [
            prize_1st,
            prize_2nd_each,
            prize_2nd_each,
            prize_3rd_each,
            prize_3rd_each,
            prize_3rd_each,
        ];
        let mut top_winners = [Pubkey::default(); 6];
        for i in 0..6 {
            let idx = winner_indices[i];
            top_winners[i] = read_participant_pubkey(
                &ctx.remaining_accounts[idx * 2],
                idx < regular_count,
                pool_type,
                round_number,
            )?;
        }

        let draw_result = &mut ctx.accounts.draw_result;
        draw_result.pool_type      = pool_type;
        draw_result.round_number   = round_number;
        draw_result.top_winners    = top_winners;
        draw_result.top_amounts    = top_amounts;
        draw_result.top_claimed    = [0u64; 6];
        draw_result.draw_timestamp = clock.unix_timestamp;
        draw_result.bump           = ctx.bumps.draw_result;

        // -------------------------------------------------------
        // 7. Mark all free-bet accounts as consumed (is_active = false)
        //    is_active byte offset in FreeDeposit: disc(8)+user(32)+pool_type(1) = offset 41
        // -------------------------------------------------------
        for i in 0..free_count {
            let free_acc = &ctx.remaining_accounts[(regular_count + i) * 2];
            let mut data = free_acc.try_borrow_mut_data()?;
            data[41] = 0u8;
        }

        // -------------------------------------------------------
        // 8. Emit event
        // -------------------------------------------------------
        emit!(DrawExecuted {
            pool_type,
            round_number,
            total_pool,
            participant_count: total_count as u32,
            top_winners,
            top_amounts,
            lucky_winners,
            lucky_amount_each: prize_lucky_each,
            universal_count: universal_count as u32,
            universal_amount_each: prize_universal_each,
            burn_amount,
            platform_amount: plat_amount,
            rollover_amount,
            draw_seed,
            timestamp: clock.unix_timestamp,
        });

        // -------------------------------------------------------
        // 9. Advance to next round
        // -------------------------------------------------------
        let pt = pool_type_from_u8(pool_type)?;
        let pool = &mut ctx.accounts.pool_state;
        pool.round_number     = pool.round_number
            .checked_add(1).ok_or(ErrorCode::MathOverflow)?;
        pool.round_start_time = round_end;
        pool.round_end_time   = round_end + pt.duration();
        pool.total_deposited  = 0;
        pool.free_bet_total   = 0;
        pool.regular_count    = 0;
        pool.free_count       = 0;
        pool.rollover         = rollover_amount;

        Ok(())
    }

    /// Execute refund — call when total_count < MIN_PARTICIPANTS.
    ///
    /// remaining_accounts: (user_deposit_pda, user_token_account) × regular_count
    /// Free-bet entries carry over automatically (no accounts needed).
    pub fn execute_refund<'info>(
        ctx: Context<'_, '_, '_, 'info, ExecuteRefund<'info>>,
    ) -> Result<()> {
        let clock = Clock::get()?;

        let pool_type     = ctx.accounts.pool_state.pool_type;
        let pool_bump     = ctx.accounts.pool_state.bump;
        let round_number  = ctx.accounts.pool_state.round_number;
        let round_end     = ctx.accounts.pool_state.round_end_time;
        let regular_count = ctx.accounts.pool_state.regular_count as usize;
        let free_count    = ctx.accounts.pool_state.free_count as usize;
        let total_deposited = ctx.accounts.pool_state.total_deposited;
        let vault_key     = ctx.accounts.pool_state.vault;

        require!(clock.unix_timestamp >= round_end, ErrorCode::TooEarlyForDraw);
        require!(ctx.accounts.pool_vault.key() == vault_key, ErrorCode::VaultMismatch);

        let total_count = regular_count + free_count;
        require!(
            (total_count as u32) < MIN_PARTICIPANTS,
            ErrorCode::ShouldUseDraw
        );
        require!(
            ctx.remaining_accounts.len() == regular_count * 2,
            ErrorCode::ParticipantCountMismatch
        );

        let pool_seeds: &[&[u8]] = &[b"pool", &[pool_type], &[pool_bump]];
        let signer = &[pool_seeds];

        for i in 0..regular_count {
            let dep_acc      = &ctx.remaining_accounts[i * 2];
            let user_tok_acc = &ctx.remaining_accounts[i * 2 + 1];

            let dep_data = UserDeposit::try_deserialize(
                &mut dep_acc.data.borrow().as_ref(),
            )?;
            require!(dep_data.pool_type == pool_type, ErrorCode::InvalidParticipant);
            require!(dep_data.round_number == round_number, ErrorCode::WrongRoundNumber);

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from:      ctx.accounts.pool_vault.to_account_info(),
                        to:        user_tok_acc.to_account_info(),
                        authority: ctx.accounts.pool_state.to_account_info(),
                    },
                    signer,
                ),
                dep_data.amount,
            )?;
        }

        emit!(RoundRefunded {
            pool_type,
            round_number,
            regular_refunded:  regular_count as u32,
            free_carried_over: free_count as u32,
            total_refunded:    total_deposited,
            timestamp:         clock.unix_timestamp,
        });

        let pt = pool_type_from_u8(pool_type)?;
        let pool = &mut ctx.accounts.pool_state;
        pool.round_number     = pool.round_number
            .checked_add(1).ok_or(ErrorCode::MathOverflow)?;
        pool.round_start_time = round_end;
        pool.round_end_time   = round_end + pt.duration();
        pool.total_deposited  = 0;
        pool.regular_count    = 0;
        // free_bet_total and free_count intentionally preserved

        Ok(())
    }

    /// Claim vested top prize. Permissionless — the protocol cron calls this daily.
    ///
    /// Vesting schedule: 5% per day over 20 days.
    /// elapsed_days = (now - draw_timestamp) / 86400
    /// vested = total_amount × min(elapsed_days + 1, 20) / 20
    /// claimable = vested - already_claimed
    pub fn claim_prize_vesting(
        ctx: Context<ClaimPrizeVesting>,
        winner_index: u8,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let wi = winner_index as usize;
        require!(wi < 6, ErrorCode::InvalidWinnerIndex);

        let draw = &mut ctx.accounts.draw_result;
        let total_amount = draw.top_amounts[wi];
        let already_claimed = draw.top_claimed[wi];

        require!(already_claimed < total_amount, ErrorCode::AlreadyFullyClaimed);

        // Verify winner_token_account belongs to the recorded winner
        require!(
            ctx.accounts.winner_token_account.owner == draw.top_winners[wi],
            ErrorCode::WinnerTokenMismatch
        );

        let elapsed_days =
            ((clock.unix_timestamp - draw.draw_timestamp) / 86_400) as u64;
        let vested_days = (elapsed_days + 1).min(PRIZE_VEST_DAYS);
        let vested_amount = total_amount
            .checked_mul(vested_days).ok_or(ErrorCode::MathOverflow)?
            .checked_div(PRIZE_VEST_DAYS).ok_or(ErrorCode::MathOverflow)?;

        let claimable = vested_amount.saturating_sub(already_claimed);
        require!(claimable > 0, ErrorCode::BelowMinimum);

        let gs_bump = ctx.accounts.global_state.bump;
        let gs_seeds: &[&[u8]] = &[b"global_state", &[gs_bump]];
        let signer = &[gs_seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.prize_escrow_vault.to_account_info(),
                    to:        ctx.accounts.winner_token_account.to_account_info(),
                    authority: ctx.accounts.global_state.to_account_info(),
                },
                signer,
            ),
            claimable,
        )?;

        draw.top_claimed[wi] = already_claimed
            .checked_add(claimable).ok_or(ErrorCode::MathOverflow)?;

        emit!(PrizeVestingClaimed {
            pool_type:      draw.pool_type,
            round_number:   draw.round_number,
            winner_index:   winner_index,
            winner:         draw.top_winners[wi],
            claimed_amount: claimable,
            total_claimed:  draw.top_claimed[wi],
            total_prize:    total_amount,
            timestamp:      clock.unix_timestamp,
        });

        Ok(())
    }

    /// Register user for one free bet (one-time per wallet).
    pub fn claim_free_airdrop(ctx: Context<ClaimFreeAirdrop>) -> Result<()> {
        let claim = &mut ctx.accounts.airdrop_claim;
        claim.user               = ctx.accounts.user.key();
        claim.free_bet_available = true;
        claim.bump               = ctx.bumps.airdrop_claim;
        claim._padding           = [0u8; 6];
        Ok(())
    }

    /// Pay 8% referral reward to the referrer stored in a deposit PDA.
    ///
    /// Permissionless — the protocol cron calls this after every successful draw
    /// for each deposit that has a non-default referrer.
    ///
    /// Security invariants:
    ///   - draw_result PDA for (pool_type, round_number) must exist (draw was successful)
    ///   - dep.referrer must be non-default (there is a referrer)
    ///   - referrer_token_account.key() must match dep.referrer (no spoofing)
    ///   - dep.referrer is cleared to Pubkey::default() after payment (no double-claim)
    pub fn claim_referral(
        ctx: Context<ClaimReferral>,
        pool_type: u8,
        round_number: u64,
    ) -> Result<()> {
        // Verify draw_result matches the claimed pool/round (draw was successful, not refunded)
        require!(
            ctx.accounts.draw_result.pool_type == pool_type,
            ErrorCode::InvalidParticipant
        );
        require!(
            ctx.accounts.draw_result.round_number == round_number,
            ErrorCode::WrongRoundNumber
        );

        let dep = &mut ctx.accounts.user_deposit;
        require!(dep.pool_type == pool_type, ErrorCode::InvalidParticipant);
        require!(dep.round_number == round_number, ErrorCode::WrongRoundNumber);
        require!(dep.referrer != Pubkey::default(), ErrorCode::NoReferral);
        require!(
            ctx.accounts.referrer_token_account.key() == dep.referrer,
            ErrorCode::ReferrerMismatch
        );

        let referral_amount = dep.amount
            .checked_mul(REFERRER_BP).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;

        if referral_amount > 0
            && ctx.accounts.referral_vault.amount >= referral_amount
        {
            let gs_bump = ctx.accounts.global_state.bump;
            let gs_seeds: &[&[u8]] = &[b"global_state", &[gs_bump]];
            let signer = &[gs_seeds];
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from:      ctx.accounts.referral_vault.to_account_info(),
                        to:        ctx.accounts.referrer_token_account.to_account_info(),
                        authority: ctx.accounts.global_state.to_account_info(),
                    },
                    signer,
                ),
                referral_amount,
            )?;
        }

        // Clear referrer to prevent double-claim
        dep.referrer = Pubkey::default();
        Ok(())
    }

    // ----------------------------------------------------------
    // Staking (delegated)
    // ----------------------------------------------------------
    pub fn initialize_staking(
        ctx: Context<InitializeStaking>,
        short_term_pool: u64,
        long_term_pool: u64,
    ) -> Result<()> {
        staking::initialize_staking(ctx, short_term_pool, long_term_pool)
    }
    pub fn stake(
        ctx: Context<Stake>,
        stake_index: u64,
        amount: u64,
        stake_type: staking::StakeType,
    ) -> Result<()> {
        staking::stake(ctx, stake_index, amount, stake_type)
    }
    pub fn release_stake(ctx: Context<ReleaseStake>, stake_index: u64) -> Result<()> {
        staking::release_stake(ctx, stake_index)
    }
    pub fn early_withdraw(ctx: Context<ReleaseStake>, stake_index: u64) -> Result<()> {
        staking::early_withdraw(ctx, stake_index)
    }

    // ----------------------------------------------------------
    // Profit airdrop (delegated)
    // ----------------------------------------------------------
    pub fn initialize_airdrop(
        ctx: Context<InitializeAirdrop>,
        total_airdrop: u64,
    ) -> Result<()> {
        airdrop::initialize_airdrop(ctx, total_airdrop)
    }
    pub fn record_profit(ctx: Context<RecordProfit>, profit_amount: u64) -> Result<()> {
        airdrop::record_profit(ctx, profit_amount)
    }
    pub fn claim_profit_airdrop(ctx: Context<ClaimProfitAirdrop>) -> Result<()> {
        airdrop::claim_profit_airdrop(ctx)
    }

    // ----------------------------------------------------------
    // Vesting (for staking prizes / team vesting)
    // ----------------------------------------------------------
    pub fn init_vesting(ctx: Context<InitVesting>, total_amount: u64) -> Result<()> {
        let clock = Clock::get()?;
        let v = &mut ctx.accounts.vesting_account;
        v.beneficiary    = ctx.accounts.beneficiary.key();
        v.total_amount   = total_amount;
        v.claimed_amount = 0;
        v.start_time     = clock.unix_timestamp;
        v.bump           = ctx.bumps.vesting_account;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.funder_token_account.to_account_info(),
                    to:        ctx.accounts.vesting_vault.to_account_info(),
                    authority: ctx.accounts.funder.to_account_info(),
                },
            ),
            total_amount,
        )?;
        Ok(())
    }

    pub fn claim_vested(ctx: Context<ClaimVested>) -> Result<()> {
        let clock = Clock::get()?;
        let v = &ctx.accounts.vesting_account;

        let elapsed_days = ((clock.unix_timestamp - v.start_time) / 86400) as u64;
        let vested_days  = elapsed_days.min(VESTING_DAYS);
        let vested_amount = v.total_amount
            .checked_mul(vested_days * VESTING_RELEASE_PER_DAY)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10_000)
            .ok_or(ErrorCode::MathOverflow)?;
        let claimable = vested_amount.saturating_sub(v.claimed_amount);
        require!(claimable > 0, ErrorCode::BelowMinimum);

        let bump = v.bump;
        let vesting_seeds: &[&[u8]] = &[b"vesting", v.beneficiary.as_ref(), &[bump]];
        let signer = &[vesting_seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.vesting_vault.to_account_info(),
                    to:        ctx.accounts.beneficiary_token_account.to_account_info(),
                    authority: ctx.accounts.vesting_account.to_account_info(),
                },
                signer,
            ),
            claimable,
        )?;

        ctx.accounts.vesting_account.claimed_amount = ctx
            .accounts.vesting_account.claimed_amount
            .checked_add(claimable).ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }
}

// ============================================================
// Helper: read participant pubkey from deposit PDA (remaining_accounts)
// ============================================================
fn read_participant_pubkey(
    pda_acc: &AccountInfo,
    is_regular: bool,
    pool_type: u8,
    round_number: u64,
) -> Result<Pubkey> {
    if is_regular {
        let dep = UserDeposit::try_deserialize(&mut pda_acc.data.borrow().as_ref())?;
        require!(dep.pool_type == pool_type, ErrorCode::InvalidParticipant);
        require!(dep.round_number == round_number, ErrorCode::WrongRoundNumber);
        Ok(dep.user)
    } else {
        let dep = FreeDeposit::try_deserialize(&mut pda_acc.data.borrow().as_ref())?;
        require!(dep.pool_type == pool_type, ErrorCode::InvalidParticipant);
        require!(dep.is_active, ErrorCode::InvalidParticipant);
        Ok(dep.user)
    }
}

// ============================================================
// Account Contexts
// ============================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = GLOBAL_STATE_SIZE,
        seeds = [b"global_state"],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    pub token_mint: Account<'info, Mint>,

    /// The token account that funds free bets. Authority must be global_state PDA.
    pub airdrop_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(pool_type: u8)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = POOL_STATE_SIZE,
        seeds = [b"pool".as_ref(), &[pool_type]],
        bump,
    )]
    pub pool_state: Account<'info, PoolState>,

    /// Token account for this pool. Authority must be pool_state PDA.
    pub pool_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool".as_ref(), &[pool_state.pool_type]],
        bump = pool_state.bump,
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        init,
        payer = user,
        space = USER_DEPOSIT_SIZE,
        seeds = [
            b"deposit".as_ref(),
            &[pool_state.pool_type],
            user.key().as_ref(),
            &pool_state.round_number.to_le_bytes(),
        ],
        bump,
    )]
    pub user_deposit: Account<'info, UserDeposit>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == pool_vault.mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = pool_vault.key() == pool_state.vault @ ErrorCode::VaultMismatch,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    /// Reserve vault for daily 1:1 matching. Authority = global_state PDA.
    #[account(
        mut,
        constraint = reserve_vault.key() == global_state.reserve_vault @ ErrorCode::ReserveVaultMismatch,
    )]
    pub reserve_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    // remaining_accounts[0] (optional, read-only): referrer's token account pubkey stored in PDA.
    // No transfer happens at deposit time — referral is deferred to claim_referral().
}

#[derive(Accounts)]
#[instruction(pool_type: u8)]
pub struct UseFreeBet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        seeds = [b"pool".as_ref(), &[pool_type]],
        bump = pool_state.bump,
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        mut,
        seeds = [b"airdrop_claim", user.key().as_ref()],
        bump = airdrop_claim.bump,
    )]
    pub airdrop_claim: Account<'info, AirdropClaim>,

    #[account(
        init,
        payer = user,
        space = FREE_DEPOSIT_SIZE,
        seeds = [b"free_deposit".as_ref(), &[pool_type], user.key().as_ref()],
        bump,
    )]
    pub free_deposit: Account<'info, FreeDeposit>,

    #[account(
        mut,
        constraint = airdrop_vault.key() == global_state.airdrop_vault @ ErrorCode::AirdropVaultMismatch,
    )]
    pub airdrop_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = pool_vault.key() == pool_state.vault @ ErrorCode::VaultMismatch,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Box<Account<...>> keeps large accounts on the heap to stay within the
// 4096-byte BPF stack frame limit in try_accounts().
#[derive(Accounts)]
pub struct ExecuteDraw<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool".as_ref(), &[pool_state.pool_type]],
        bump = pool_state.bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    #[account(
        mut,
        constraint = pool_vault.key() == pool_state.vault @ ErrorCode::VaultMismatch,
    )]
    pub pool_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = platform_vault.key() == global_state.platform_fee_vault @ ErrorCode::PlatformVaultMismatch,
    )]
    pub platform_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = prize_escrow_vault.key() == global_state.prize_escrow_vault @ ErrorCode::PrizeEscrowMismatch,
    )]
    pub prize_escrow_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    /// DrawResult PDA — created during this draw, records top-prize vesting data.
    #[account(
        init,
        payer = caller,
        space = DRAW_RESULT_SIZE,
        seeds = [
            b"draw_result".as_ref(),
            &[pool_state.pool_type],
            pool_state.round_number.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub draw_result: Box<Account<'info, DrawResult>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteRefund<'info> {
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool".as_ref(), &[pool_state.pool_type]],
        bump = pool_state.bump,
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        mut,
        constraint = pool_vault.key() == pool_state.vault @ ErrorCode::VaultMismatch,
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimFreeAirdrop<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = AIRDROP_CLAIM_SIZE,
        seeds = [b"airdrop_claim", user.key().as_ref()],
        bump,
    )]
    pub airdrop_claim: Account<'info, AirdropClaim>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimPrizeVesting<'info> {
    /// Anyone can call — permissionless (cron service calls daily)
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"draw_result".as_ref(),
            &[draw_result.pool_type],
            draw_result.round_number.to_le_bytes().as_ref(),
        ],
        bump = draw_result.bump,
    )]
    pub draw_result: Account<'info, DrawResult>,

    #[account(
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        constraint = prize_escrow_vault.key() == global_state.prize_escrow_vault @ ErrorCode::PrizeEscrowMismatch,
    )]
    pub prize_escrow_vault: Account<'info, TokenAccount>,

    /// Winner's TPOT token account — verified in instruction body
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// Context for claim_referral().
/// Permissionless — cron (or anyone) calls this after a successful draw.
#[derive(Accounts)]
pub struct ClaimReferral<'info> {
    pub caller: Signer<'info>,

    /// Proves the round was a successful draw (not a refund).
    /// Seeds are validated inside the instruction body against pool_type/round_number args.
    pub draw_result: Account<'info, DrawResult>,

    /// The deposit whose referrer should be paid.
    /// Validated in instruction body: pool_type, round_number, referrer key.
    #[account(mut)]
    pub user_deposit: Account<'info, UserDeposit>,

    #[account(
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    /// Referral rewards vault. Authority = global_state PDA.
    #[account(
        mut,
        constraint = referral_vault.key() == global_state.referral_vault @ ErrorCode::ReferralVaultMismatch,
    )]
    pub referral_vault: Account<'info, TokenAccount>,

    /// Must match user_deposit.referrer — verified in instruction body.
    #[account(mut)]
    pub referrer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ============================================================
// Vesting Accounts & Struct (unchanged)
// ============================================================

#[account]
pub struct VestingAccount {
    pub beneficiary:    Pubkey,
    pub total_amount:   u64,
    pub claimed_amount: u64,
    pub start_time:     i64,
    pub bump:           u8,
}

impl VestingAccount {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8 + 1;
}

#[derive(Accounts)]
pub struct InitVesting<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    /// CHECK: beneficiary can be any wallet
    pub beneficiary: UncheckedAccount<'info>,

    #[account(
        init,
        payer = funder,
        space = VestingAccount::SIZE,
        seeds = [b"vesting", beneficiary.key().as_ref()],
        bump,
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vesting_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimVested<'info> {
    #[account(mut)]
    pub beneficiary: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vesting", beneficiary.key().as_ref()],
        bump = vesting_account.bump,
        constraint = vesting_account.beneficiary == beneficiary.key(),
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(mut)]
    pub vesting_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub beneficiary_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ============================================================
// Staking Accounts (Anchor requires #[derive(Accounts)] at crate root)
// ============================================================

#[derive(Accounts)]
pub struct InitializeStaking<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + staking::StakingState::SIZE,
        seeds = [b"staking_state"],
        bump,
    )]
    pub staking_state: Account<'info, staking::StakingState>,
    pub token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(stake_index: u64)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"staking_state"], bump = staking_state.bump)]
    pub staking_state: Account<'info, staking::StakingState>,
    #[account(
        init,
        payer = user,
        space = 8 + staking::UserStake::SIZE,
        seeds = [b"user_stake", user.key().as_ref(), &stake_index.to_le_bytes()],
        bump,
    )]
    pub user_stake: Account<'info, staking::UserStake>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub staking_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(stake_index: u64)]
pub struct ReleaseStake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"staking_state"], bump = staking_state.bump)]
    pub staking_state: Account<'info, staking::StakingState>,
    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref(), &stake_index.to_le_bytes()],
        bump,
        constraint = user_stake.owner == user.key(),
    )]
    pub user_stake: Account<'info, staking::UserStake>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub staking_vault: Account<'info, TokenAccount>,
    /// CHECK: staking authority PDA
    #[account(seeds = [b"staking"], bump)]
    pub staking_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

// ============================================================
// Profit Airdrop Accounts
// ============================================================

#[derive(Accounts)]
pub struct InitializeAirdrop<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + airdrop::AirdropState::SIZE,
        seeds = [b"airdrop_state"],
        bump,
    )]
    pub airdrop_state: Account<'info, airdrop::AirdropState>,
    pub token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordProfit<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: beneficiary whose profit is being recorded
    pub user: UncheckedAccount<'info>,
    #[account(mut, seeds = [b"airdrop_state"], bump = airdrop_state.bump)]
    pub airdrop_state: Account<'info, airdrop::AirdropState>,
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + airdrop::UserAirdrop::SIZE,
        seeds = [b"user_airdrop", user.key().as_ref()],
        bump,
    )]
    pub user_airdrop: Account<'info, airdrop::UserAirdrop>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimProfitAirdrop<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"airdrop_state"], bump = airdrop_state.bump)]
    pub airdrop_state: Account<'info, airdrop::AirdropState>,
    #[account(
        mut,
        seeds = [b"user_airdrop", user.key().as_ref()],
        bump,
        constraint = user_airdrop.owner == user.key(),
    )]
    pub user_airdrop: Account<'info, airdrop::UserAirdrop>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub airdrop_vault: Account<'info, TokenAccount>,
    /// CHECK: airdrop authority PDA
    #[account(seeds = [b"airdrop"], bump)]
    pub airdrop_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}
