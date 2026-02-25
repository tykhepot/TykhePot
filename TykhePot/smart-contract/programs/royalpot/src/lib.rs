use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Transfer, Token, TokenAccount, Mint};

pub mod staking;
pub mod airdrop;

// ============================================================
// Constants
// ============================================================

pub const BASE: u64 = 10_000;
pub const BURN_RATE: u64 = 300;   // 3%  — only on successful draw
pub const PLAT_RATE: u64 = 200;   // 2%  — only on successful draw
// Prize = 100% - 3% - 2% = 95%

pub const MIN_PARTICIPANTS: u32 = 12;
pub const LOCK_PERIOD: i64 = 300; // 5 min before draw, betting closes

// Pool durations (UTC seconds)
pub const DURATION_30MIN:  i64 = 1_800;
pub const DURATION_HOURLY: i64 = 3_600;
pub const DURATION_DAILY:  i64 = 86_400;

// Minimum deposits (9-decimal TPOT)
pub const MIN_30MIN:  u64 = 500_000_000_000;  // 500 TPOT
pub const MIN_HOURLY: u64 = 200_000_000_000;  // 200 TPOT
pub const MIN_DAILY:  u64 = 100_000_000_000;  // 100 TPOT

pub const FREE_BET_AMOUNT: u64 = 100_000_000_000; // 100 TPOT

// Vesting (kept for staking module)
pub const VESTING_DAYS: u64 = 20;
pub const VESTING_RELEASE_PER_DAY: u64 = 500; // 5% per day (basis points)

// Account space
pub const GLOBAL_STATE_SIZE: usize = 8 + 32 + 32 + 32 + 1 + 32; // extra padding
pub const POOL_STATE_SIZE:   usize = 8 + 1 + 8 + 8 + 8 + 8 + 8 + 4 + 4 + 32 + 1 + 16;
pub const USER_DEPOSIT_SIZE: usize = 8 + 32 + 1 + 8 + 8 + 1 + 8;
pub const FREE_DEPOSIT_SIZE: usize = 8 + 32 + 1 + 1 + 8 + 1 + 8;
pub const AIRDROP_CLAIM_SIZE: usize = 8 + 32 + 1 + 1 + 8;

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
    pub token_mint: Pubkey,
    /// TPOT token account where platform fees accumulate
    pub platform_fee_vault: Pubkey,
    /// Token account that funds free bets (airdrop source)
    pub airdrop_vault: Pubkey,
    pub bump: u8,
    /// Reserved for future use
    pub _padding: [u8; 32],
}

/// Per-pool state. Three PDAs: 30min / hourly / daily.
#[account]
pub struct PoolState {
    pub pool_type: u8,
    pub round_number: u64,
    pub round_start_time: i64,
    pub round_end_time: i64,
    /// Sum of regular deposits in current round
    pub total_deposited: u64,
    /// Sum of free-bet tokens currently in vault
    pub free_bet_total: u64,
    /// Number of regular depositors in current round
    pub regular_count: u32,
    /// Number of active free-bet holders (persists across failed rounds)
    pub free_count: u32,
    /// SPL token account (authority = this PoolState PDA)
    pub vault: Pubkey,
    pub bump: u8,
    pub _padding: [u8; 15],
}

/// Created per user per pool per round. Closed (zeroed) on refund.
#[account]
pub struct UserDeposit {
    pub user: Pubkey,
    pub pool_type: u8,
    pub round_number: u64,
    pub amount: u64,
    pub bump: u8,
    pub _padding: [u8; 7],
}

/// Created once per user per pool when they activate a free bet.
/// Persists across failed rounds (is_active stays true).
/// Set is_active = false on successful draw (consumed).
#[account]
pub struct FreeDeposit {
    pub user: Pubkey,
    pub pool_type: u8,
    pub is_active: bool,
    pub amount: u64, // always FREE_BET_AMOUNT
    pub bump: u8,
    pub _padding: [u8; 7],
}

/// Created once when user calls claim_free_airdrop.
/// free_bet_available = true means they can activate one free bet.
#[account]
pub struct AirdropClaim {
    pub user: Pubkey,
    pub free_bet_available: bool,
    pub bump: u8,
    pub _padding: [u8; 6],
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
}

// ============================================================
// Events
// ============================================================

#[event]
pub struct DrawExecuted {
    pub pool_type: u8,
    pub round_number: u64,
    pub winner: Pubkey,
    pub prize_amount: u64,
    pub burn_amount: u64,
    pub platform_amount: u64,
    pub total_pool: u64,
    pub participant_count: u32,
    pub draw_seed: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct RoundRefunded {
    pub pool_type: u8,
    pub round_number: u64,
    pub regular_refunded: u32,
    pub free_carried_over: u32,
    pub total_refunded: u64,
    pub timestamp: i64,
}

#[event]
pub struct Deposited {
    pub pool_type: u8,
    pub round_number: u64,
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct FreeBetActivated {
    pub pool_type: u8,
    pub user: Pubkey,
    pub timestamp: i64,
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
    ) -> Result<()> {
        let state = &mut ctx.accounts.global_state;
        state.token_mint = ctx.accounts.token_mint.key();
        state.platform_fee_vault = platform_fee_vault;
        state.airdrop_vault = ctx.accounts.airdrop_vault.key();
        state.bump = ctx.bumps.global_state;
        state._padding = [0u8; 32];
        Ok(())
    }

    /// Initialize one pool. Called three times (30min / hourly / daily).
    /// initial_start_time: UTC unix timestamp aligned to pool boundary.
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        pool_type: u8,
        initial_start_time: i64,
    ) -> Result<()> {
        let pt = pool_type_from_u8(pool_type)?;
        let pool = &mut ctx.accounts.pool_state;
        pool.pool_type = pool_type;
        pool.round_number = 1;
        pool.round_start_time = initial_start_time;
        pool.round_end_time = initial_start_time + pt.duration();
        pool.total_deposited = 0;
        pool.free_bet_total = 0;
        pool.regular_count = 0;
        pool.free_count = 0;
        pool.vault = ctx.accounts.pool_vault.key();
        pool.bump = ctx.bumps.pool_state;
        pool._padding = [0u8; 15];
        Ok(())
    }

    // ----------------------------------------------------------
    // User actions
    // ----------------------------------------------------------

    /// Regular deposit into a pool for the current round.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let clock = Clock::get()?;
        let pool = &mut ctx.accounts.pool_state;
        let pt = pool_type_from_u8(pool.pool_type)?;

        // Betting closes 5 minutes before draw
        require!(
            clock.unix_timestamp < pool.round_end_time - LOCK_PERIOD,
            ErrorCode::BettingClosed
        );

        // Enforce per-pool minimum
        require!(amount >= pt.min_deposit(), ErrorCode::BelowMinimum);

        // Record deposit (init fails if PDA already exists → prevents double deposit)
        let dep = &mut ctx.accounts.user_deposit;
        dep.user = ctx.accounts.user.key();
        dep.pool_type = pool.pool_type;
        dep.round_number = pool.round_number;
        dep.amount = amount;
        dep.bump = ctx.bumps.user_deposit;
        dep._padding = [0u8; 7];

        // Transfer tokens: user → pool vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        pool.total_deposited = pool
            .total_deposited
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        pool.regular_count = pool
            .regular_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(Deposited {
            pool_type: pool.pool_type,
            round_number: pool.round_number,
            user: ctx.accounts.user.key(),
            amount,
            timestamp: clock.unix_timestamp,
        });
        Ok(())
    }

    /// Activate free bet for a pool.
    /// Transfers 100 TPOT from airdrop_vault → pool_vault.
    /// FreeDeposit PDA persists until a successful draw consumes it.
    pub fn use_free_bet(ctx: Context<UseFreeBet>, pool_type: u8) -> Result<()> {
        let clock = Clock::get()?;
        let pool = &mut ctx.accounts.pool_state;

        // Betting closes 5 min before draw
        require!(
            clock.unix_timestamp < pool.round_end_time - LOCK_PERIOD,
            ErrorCode::BettingClosed
        );

        // Verify airdrop claim is available
        let claim = &mut ctx.accounts.airdrop_claim;
        require!(claim.free_bet_available, ErrorCode::NoFreeBetAvailable);

        // Init FreeDeposit (init fails if already active for this pool)
        let free_dep = &mut ctx.accounts.free_deposit;
        free_dep.user = ctx.accounts.user.key();
        free_dep.pool_type = pool_type;
        free_dep.is_active = true;
        free_dep.amount = FREE_BET_AMOUNT;
        free_dep.bump = ctx.bumps.free_deposit;
        free_dep._padding = [0u8; 7];

        // Consume the airdrop claim (one-time use)
        claim.free_bet_available = false;

        // Transfer 100 TPOT: airdrop_vault → pool_vault
        // Signed by global_state PDA
        let gs_bump = ctx.accounts.global_state.bump;
        let global_seeds: &[&[u8]] = &[b"global_state", &[gs_bump]];
        let signer = &[global_seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.airdrop_vault.to_account_info(),
                    to: ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.global_state.to_account_info(),
                },
                signer,
            ),
            FREE_BET_AMOUNT,
        )?;

        pool.free_bet_total = pool
            .free_bet_total
            .checked_add(FREE_BET_AMOUNT)
            .ok_or(ErrorCode::MathOverflow)?;
        pool.free_count = pool
            .free_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(FreeBetActivated {
            pool_type: pool.pool_type,
            user: ctx.accounts.user.key(),
            timestamp: clock.unix_timestamp,
        });
        Ok(())
    }

    /// Execute draw. Permissionless — anyone can call after round_end_time.
    ///
    /// remaining_accounts layout (must match pool state exactly):
    ///   [0 .. regular_count*2 - 1]:
    ///     pairs (user_deposit_pda, user_token_account) for regular depositors
    ///   [regular_count*2 .. (regular_count+free_count)*2 - 1]:
    ///     pairs (free_deposit_pda, user_token_account) for free-bet holders
    ///
    /// On < 12 participants:  refund regular, free bets carry over to next round.
    /// On >= 12 participants: burn 3%, platform 2%, winner 95% — equal probability.
    pub fn execute_draw<'info>(
        ctx: Context<'_, '_, '_, 'info, ExecuteDraw<'info>>,
        draw_seed: [u8; 32],
    ) -> Result<()> {
        let clock = Clock::get()?;

        // --- read pool fields before mutably borrowing pool ---
        let pool_type    = ctx.accounts.pool_state.pool_type;
        let pool_bump    = ctx.accounts.pool_state.bump;
        let round_number = ctx.accounts.pool_state.round_number;
        let round_end    = ctx.accounts.pool_state.round_end_time;
        let regular_count = ctx.accounts.pool_state.regular_count as usize;
        let free_count    = ctx.accounts.pool_state.free_count as usize;
        let total_deposited = ctx.accounts.pool_state.total_deposited;
        let free_bet_total  = ctx.accounts.pool_state.free_bet_total;
        let vault_key       = ctx.accounts.pool_state.vault;

        // Time check
        require!(clock.unix_timestamp >= round_end, ErrorCode::TooEarlyForDraw);

        // Vault sanity
        require!(ctx.accounts.pool_vault.key() == vault_key, ErrorCode::VaultMismatch);

        let total_count = regular_count + free_count;

        // Account count must match exactly
        require!(
            ctx.remaining_accounts.len() == total_count * 2,
            ErrorCode::ParticipantCountMismatch
        );

        let pool_seeds: &[&[u8]] = &[b"pool", &[pool_type], &[pool_bump]];
        let signer = &[pool_seeds];

        // ----------------------------------------------------------------
        // BRANCH A: Not enough participants — refund regular, carry free
        // ----------------------------------------------------------------
        if total_count < MIN_PARTICIPANTS as usize {
            // Refund each regular depositor
            for i in 0..regular_count {
                let dep_acc      = &ctx.remaining_accounts[i * 2];
                let user_tok_acc = &ctx.remaining_accounts[i * 2 + 1];

                // Verify and read UserDeposit
                let dep_data = UserDeposit::try_deserialize(
                    &mut dep_acc.data.borrow().as_ref(),
                )?;
                require!(dep_data.pool_type == pool_type, ErrorCode::InvalidParticipant);
                require!(dep_data.round_number == round_number, ErrorCode::WrongRoundNumber);

                // Refund: pool_vault → user token account
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.pool_vault.to_account_info(),
                            to: user_tok_acc.to_account_info(),
                            authority: ctx.accounts.pool_state.to_account_info(),
                        },
                        signer,
                    ),
                    dep_data.amount,
                )?;
            }
            // Free-bet accounts: do nothing — they carry over.
            // Their 100 TPOT stays in vault; free_count preserved in next round.

            emit!(RoundRefunded {
                pool_type,
                round_number,
                regular_refunded: regular_count as u32,
                free_carried_over: free_count as u32,
                total_refunded: total_deposited,
                timestamp: clock.unix_timestamp,
            });

            // Advance to next round, preserving free bet state
            let pt = pool_type_from_u8(pool_type)?;
            let pool = &mut ctx.accounts.pool_state;
            pool.round_number = pool
                .round_number
                .checked_add(1)
                .ok_or(ErrorCode::MathOverflow)?;
            pool.round_start_time = round_end;
            pool.round_end_time = round_end + pt.duration();
            pool.total_deposited = 0;
            pool.regular_count = 0;
            // free_bet_total and free_count intentionally preserved
            return Ok(());
        }

        // ----------------------------------------------------------------
        // BRANCH B: Enough participants — draw!
        // ----------------------------------------------------------------

        let total_pool = total_deposited
            .checked_add(free_bet_total)
            .ok_or(ErrorCode::MathOverflow)?;

        // Equal-probability winner selection
        let winner_idx = (u64::from_le_bytes(draw_seed[0..8].try_into().unwrap())
            % total_count as u64) as usize;

        // Resolve winner's token account and pubkey
        let (winner_pubkey, winner_token_acc) = if winner_idx < regular_count {
            let dep_acc = &ctx.remaining_accounts[winner_idx * 2];
            let tok_acc = &ctx.remaining_accounts[winner_idx * 2 + 1];
            let dep = UserDeposit::try_deserialize(&mut dep_acc.data.borrow().as_ref())?;
            require!(dep.pool_type == pool_type, ErrorCode::InvalidParticipant);
            require!(dep.round_number == round_number, ErrorCode::WrongRoundNumber);
            (dep.user, tok_acc)
        } else {
            let free_idx = winner_idx - regular_count;
            let dep_acc = &ctx.remaining_accounts[(regular_count + free_idx) * 2];
            let tok_acc = &ctx.remaining_accounts[(regular_count + free_idx) * 2 + 1];
            let dep = FreeDeposit::try_deserialize(&mut dep_acc.data.borrow().as_ref())?;
            require!(dep.pool_type == pool_type, ErrorCode::InvalidParticipant);
            require!(dep.is_active, ErrorCode::InvalidParticipant);
            (dep.user, tok_acc)
        };

        // Distributions — only executed on successful draw
        let burn_amount = total_pool
            .checked_mul(BURN_RATE).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;
        let plat_amount = total_pool
            .checked_mul(PLAT_RATE).ok_or(ErrorCode::MathOverflow)?
            .checked_div(BASE).ok_or(ErrorCode::MathOverflow)?;
        let prize_amount = total_pool
            .checked_sub(burn_amount).ok_or(ErrorCode::MathOverflow)?
            .checked_sub(plat_amount).ok_or(ErrorCode::MathOverflow)?;

        // 3% burn (reduces total supply)
        token::burn(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    from: ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.pool_state.to_account_info(),
                },
                signer,
            ),
            burn_amount,
        )?;

        // 2% platform fee
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.platform_vault.to_account_info(),
                    authority: ctx.accounts.pool_state.to_account_info(),
                },
                signer,
            ),
            plat_amount,
        )?;

        // 95% prize to winner
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: winner_token_acc.to_account_info(),
                    authority: ctx.accounts.pool_state.to_account_info(),
                },
                signer,
            ),
            prize_amount,
        )?;

        // Mark all free-bet accounts as consumed (is_active = false)
        // Layout after 8-byte discriminator: user(32) pool_type(1) is_active(1) ...
        // is_active byte offset = 8 + 32 + 1 = 41
        for i in 0..free_count {
            let free_acc = &ctx.remaining_accounts[(regular_count + i) * 2];
            let mut data = free_acc.try_borrow_mut_data()?;
            data[41] = 0u8; // is_active = false
        }

        emit!(DrawExecuted {
            pool_type,
            round_number,
            winner: winner_pubkey,
            prize_amount,
            burn_amount,
            platform_amount: plat_amount,
            total_pool,
            participant_count: total_count as u32,
            draw_seed,
            timestamp: clock.unix_timestamp,
        });

        // Advance to next round (full reset)
        let pt = pool_type_from_u8(pool_type)?;
        let pool = &mut ctx.accounts.pool_state;
        pool.round_number = pool
            .round_number
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;
        pool.round_start_time = round_end;
        pool.round_end_time = round_end + pt.duration();
        pool.total_deposited = 0;
        pool.free_bet_total = 0;
        pool.regular_count = 0;
        pool.free_count = 0;

        Ok(())
    }

    /// Register user for one free bet.
    /// Creates AirdropClaim PDA with free_bet_available = true.
    pub fn claim_free_airdrop(ctx: Context<ClaimFreeAirdrop>) -> Result<()> {
        let claim = &mut ctx.accounts.airdrop_claim;
        claim.user = ctx.accounts.user.key();
        claim.free_bet_available = true;
        claim.bump = ctx.bumps.airdrop_claim;
        claim._padding = [0u8; 6];
        Ok(())
    }

    // ----------------------------------------------------------
    // Staking module (delegated)
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
    // Profit airdrop module (delegated)
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
    // Vesting (kept for prize winner vesting option)
    // ----------------------------------------------------------
    pub fn init_vesting(
        ctx: Context<InitVesting>,
        total_amount: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let v = &mut ctx.accounts.vesting_account;
        v.beneficiary = ctx.accounts.beneficiary.key();
        v.total_amount = total_amount;
        v.claimed_amount = 0;
        v.start_time = clock.unix_timestamp;
        v.bump = ctx.bumps.vesting_account;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.funder_token_account.to_account_info(),
                    to: ctx.accounts.vesting_vault.to_account_info(),
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
        let vested_days = elapsed_days.min(VESTING_DAYS);
        let vested_amount = v
            .total_amount
            .checked_mul(vested_days * VESTING_RELEASE_PER_DAY)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10_000)
            .ok_or(ErrorCode::MathOverflow)?;
        let claimable = vested_amount.saturating_sub(v.claimed_amount);
        require!(claimable > 0, ErrorCode::BelowMinimum);

        let bump = v.bump;
        let vesting_seeds: &[&[u8]] = &[
            b"vesting",
            v.beneficiary.as_ref(),
            &[bump],
        ];
        let signer = &[vesting_seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vesting_vault.to_account_info(),
                    to: ctx.accounts.beneficiary_token_account.to_account_info(),
                    authority: ctx.accounts.vesting_account.to_account_info(),
                },
                signer,
            ),
            claimable,
        )?;

        ctx.accounts.vesting_account.claimed_amount = ctx
            .accounts
            .vesting_account
            .claimed_amount
            .checked_add(claimable)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
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

    /// UserDeposit PDA — init ensures one deposit per user per round.
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

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
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

    /// AirdropClaim PDA — must exist and have free_bet_available = true
    #[account(
        mut,
        seeds = [b"airdrop_claim", user.key().as_ref()],
        bump = airdrop_claim.bump,
    )]
    pub airdrop_claim: Account<'info, AirdropClaim>,

    /// FreeDeposit PDA — init (fails if already active, preventing double-use)
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

#[derive(Accounts)]
pub struct ExecuteDraw<'info> {
    /// Anyone can call — no signer authority check.
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

    /// Token mint — needed for burn CPI
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    /// Platform fee destination — verified against GlobalState
    #[account(
        mut,
        constraint = platform_vault.key() == global_state.platform_fee_vault @ ErrorCode::PlatformVaultMismatch,
    )]
    pub platform_vault: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    pub token_program: Program<'info, Token>,
    // remaining_accounts: [deposit_pda, user_tok_acc] × regular_count
    //                   + [free_dep_pda, user_tok_acc] × free_count
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

// ============================================================
// Vesting Accounts & Struct
// ============================================================

#[account]
pub struct VestingAccount {
    pub beneficiary: Pubkey,
    pub total_amount: u64,
    pub claimed_amount: u64,
    pub start_time: i64,
    pub bump: u8,
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
    /// Permissionless in no-admin design — anyone can record profit
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
