use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount, Mint};

pub mod staking;
pub mod airdrop;
pub mod randomness;


pub const BASE: u64 = 10000;
pub const BURN: u64 = 300;
pub const PLAT: u64 = 200;
pub const REF: u64 = 800;
pub const REFERRED_BONUS: u64 = 200; // 2% for referred user
pub const HOUR_MIN: u64 = 200_000_000_000;
pub const DAY_MIN: u64 = 100_000_000_000;
pub const FREE_AIRDROP: u64 = 100_000_000_000; // 100 TPOT
pub const MAX_DEPOSIT: u64 = 1_000_000_000_000_000; // 1 million TPOT
pub const TIME_TOLERANCE: i64 = 300; // 300 seconds tolerance (Solana validators can skew ±25s)
pub const LOCK_PERIOD: i64 = 300; // 5 minutes lock before draw
pub const PAUSE_TIMELOCK: i64 = 86400 * 2; // 48h timelock before pause takes effect

// Prize distribution constants
pub const FIRST_PRIZE_RATE: u64 = 3000;  // 30%
pub const SECOND_PRIZE_RATE: u64 = 2000; // 20%
pub const THIRD_PRIZE_RATE: u64 = 1500;  // 15%
pub const LUCKY_PRIZE_RATE: u64 = 1000;  // 10%
pub const UNIVERSAL_PRIZE_RATE: u64 = 2000; // 20%
pub const ROLLOVER_RATE: u64 = 500;      // 5%

// Vesting constants
pub const VESTING_DAYS: u64 = 20;
pub const VESTING_RELEASE_PER_DAY: u64 = 500; // 5% per day

declare_id!("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");

#[account]
pub struct State {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub platform_wallet: Pubkey,
    pub pre_pool: u64,
    pub referral_pool: u64,
    pub hourly_pool: u64,
    pub hourly_players: u32,
    pub daily_pool: u64,
    pub daily_players: u32,
    pub burned: u64,
    pub paused: bool,
    pub bump: u8,
    pub last_hourly_draw: i64,
    pub last_daily_draw: i64,
    pub hourly_rollover: u64,
    pub daily_rollover: u64,
    /// Unix timestamp when a pause was scheduled (0 = none pending)
    pub pause_scheduled_at: i64,
}

#[account]
pub struct UserData {
    pub owner: Pubkey,
    pub hourly_tickets: u64,
    pub daily_tickets: u64,
    pub last_time: i64,
    pub referrer: Option<Pubkey>,
    pub has_ref_bonus: bool,
    pub airdrop_claimed: bool,
    pub total_deposit: u64,
}

impl UserData {
    // 32 (owner) + 8*3 (tickets,last_time,total_deposit) + 8 (daily_tickets) +
    // 33 (Option<Pubkey>) + 1 (has_ref_bonus) + 1 (airdrop_claimed) = 99
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 33 + 1 + 1 + 8; // 99
}

/// Records a prize that vests linearly over VESTING_DAYS days (5% per day).
/// Created by admin after each draw; winner claims daily via claim_vested.
#[account]
pub struct VestingAccount {
    pub winner: Pubkey,           // 32 — prize recipient
    pub total_amount: u64,        // 8  — total prize
    pub claimed_amount: u64,      // 8  — already claimed
    pub start_time: i64,          // 8  — vesting start (draw time)
    pub vesting_id: u64,          // 8  — unique ID (use draw timestamp)
    pub bump: u8,                 // 1
}

impl VestingAccount {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 8 + 1; // 65
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 200, seeds = [b"state"], bump)]
    pub state: Account<'info, State>,
    #[account(mut)] pub authority: Signer<'info>,
    pub token_mint: Account<'info, Mint>,
    pub platform_wallet: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Resume<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFee<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)] pub state: Account<'info, State>,
    #[account(mut)] pub vault: Account<'info, TokenAccount>,
    #[account(mut)] pub dest: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DepositHourly<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + UserData::SIZE,
        seeds = [b"user", signer.key().as_ref()],
        bump
    )]
    pub user: Account<'info, UserData>,
    #[account(mut)] pub user_token: Account<'info, TokenAccount>,
    #[account(mut)] pub burn_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub platform_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositDaily<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)] pub state: Account<'info, State>,
    #[account(mut, seeds = [b"user", signer.key().as_ref()], bump)]
    pub user: Account<'info, UserData>,
    #[account(mut)] pub user_token: Account<'info, TokenAccount>,
    #[account(mut)] pub burn_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub platform_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub referral_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub referrer_token: Account<'info, TokenAccount>,
    #[account(mut)] pub user_referrer_bonus: Account<'info, TokenAccount>,
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimFreeAirdrop<'info> {
    #[account(mut, seeds = [b"user", user_signer.key().as_ref()], bump)]
    pub user: Account<'info, UserData>,
    #[account(mut)] pub airdrop_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub dest_token: Account<'info, TokenAccount>,
    /// CHECK: airdrop authority PDA — signs CPI transfers from airdrop_vault
    #[account(seeds = [b"airdrop"], bump)]
    pub airdrop_auth: AccountInfo<'info>,
    pub user_signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DrawHourly<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)] pub state: Account<'info, State>,
    pub authority: Signer<'info>,
    /// Token vault holding the hourly prize pool (authority must be state PDA)
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DrawDaily<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)] pub state: Account<'info, State>,
    pub authority: Signer<'info>,
    /// Token vault holding the daily prize pool (authority must be state PDA)
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

// ─── Staking Accounts (Anchor requires these at crate root) ─────────────────

#[derive(Accounts)]
pub struct InitializeStaking<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + staking::StakingState::SIZE,
        seeds = [b"staking_state"],
        bump
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
        bump
    )]
    pub user_stake: Account<'info, staking::UserStake>,
    #[account(mut)] pub user_token: Account<'info, TokenAccount>,
    #[account(mut)] pub staking_vault: Account<'info, TokenAccount>,
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
        constraint = user_stake.owner == user.key()
    )]
    pub user_stake: Account<'info, staking::UserStake>,
    #[account(mut)] pub user_token: Account<'info, TokenAccount>,
    #[account(mut)] pub staking_vault: Account<'info, TokenAccount>,
    /// CHECK: staking authority PDA
    #[account(seeds = [b"staking"], bump)]
    pub staking_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

// ─── Profit-Based Airdrop Accounts (Anchor requires these at crate root) ────

#[derive(Accounts)]
pub struct InitializeAirdrop<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + airdrop::AirdropState::SIZE,
        seeds = [b"airdrop_state"],
        bump
    )]
    pub airdrop_state: Account<'info, airdrop::AirdropState>,
    pub token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordProfit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"airdrop_state"], bump = airdrop_state.bump)]
    pub airdrop_state: Account<'info, airdrop::AirdropState>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + airdrop::UserAirdrop::SIZE,
        seeds = [b"user_airdrop", user.key().as_ref()],
        bump
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
        constraint = user_airdrop.owner == user.key()
    )]
    pub user_airdrop: Account<'info, airdrop::UserAirdrop>,
    #[account(mut)] pub user_token: Account<'info, TokenAccount>,
    #[account(mut)] pub airdrop_vault: Account<'info, TokenAccount>,
    /// CHECK: airdrop authority PDA
    #[account(seeds = [b"airdrop"], bump)]
    pub airdrop_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

// ─── Vesting Accounts ────────────────────────────────────────────────────────

/// Admin creates a vesting record after draw and transfers prize to vesting_vault.
#[derive(Accounts)]
#[instruction(winner: Pubkey, amount: u64, vesting_id: u64)]
pub struct InitVesting<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// Prize source: the hourly or daily pool vault (authority = state PDA)
    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,
    /// Vesting holding vault (authority = vesting_auth PDA [b"vesting_auth"])
    #[account(mut)]
    pub vesting_vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = authority,
        space = 8 + VestingAccount::SIZE,
        seeds = [b"vesting", winner.as_ref(), &vesting_id.to_le_bytes()],
        bump,
    )]
    pub vesting_account: Account<'info, VestingAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

/// Winner claims unlocked vesting tokens.
#[derive(Accounts)]
#[instruction(vesting_id: u64)]
pub struct ClaimVested<'info> {
    pub winner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vesting", winner.key().as_ref(), &vesting_id.to_le_bytes()],
        bump = vesting_account.bump,
        constraint = vesting_account.winner == winner.key() @ ErrorCode::Unauthorized,
    )]
    pub vesting_account: Account<'info, VestingAccount>,
    #[account(mut)]
    pub vesting_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    /// CHECK: vesting authority PDA — signs CPI transfers from vesting_vault
    #[account(seeds = [b"vesting_auth"], bump)]
    pub vesting_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeParams {
    pub pre_pool: u64,
    pub referral_pool: u64,
}

/// Specifies a single winner and their prize amount for distribution at draw time.
/// Authority computes winners off-chain (using VRF seed) and submits payouts on-chain.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct WinnerPayout {
    pub winner: Pubkey,
    pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum PoolType {
    Hourly,
    Daily,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")] Unauthorized,
    #[msg("Contract is paused")] ContractPaused,
    #[msg("Invalid amount")] InvalidAmount,
    #[msg("Below minimum deposit")] BelowMinDeposit,
    #[msg("Deposit too frequent")] DepositTooFrequent,
    #[msg("Already claimed")] AlreadyClaimed,
    #[msg("Exceed maximum deposit")] ExceedMaxDeposit,
    #[msg("Pool is locked, draw in progress")] PoolLocked,
    #[msg("Draw too early")] DrawTooEarly,
    #[msg("Not enough participants")] NotEnoughParticipants,
    #[msg("Insufficient pool balance")] InsufficientPoolBalance,
    #[msg("Invalid referrer")] InvalidReferrer,
    #[msg("Referrer has not participated in the game")] ReferrerNotParticipated,
    #[msg("A pause is already scheduled")] PauseAlreadyScheduled,
    #[msg("No pause has been scheduled")] NoPauseScheduled,
    #[msg("Pause timelock has not expired yet")] PauseTimelockNotExpired,
    #[msg("Nothing to claim yet")] NothingToClaim,
    #[msg("All vesting already claimed")] VestingFullyClaimed,
}

#[program]
pub mod royalpot {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.token_mint = ctx.accounts.token_mint.key();
        state.platform_wallet = ctx.accounts.platform_wallet.key();
        state.pre_pool = params.pre_pool;
        state.referral_pool = params.referral_pool;
        state.hourly_pool = 0;
        state.hourly_players = 0;
        state.daily_pool = 0;
        state.daily_players = 0;
        state.burned = 0;
        state.paused = false;
        state.bump = ctx.bumps.state;
        state.last_hourly_draw = Clock::get()?.unix_timestamp;
        state.last_daily_draw = Clock::get()?.unix_timestamp;
        state.hourly_rollover = 0;
        state.daily_rollover = 0;
        state.pause_scheduled_at = 0;
        Ok(())
    }

    /// Schedule a pause 48 hours in the future. Call execute_pause after the delay.
    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(ctx.accounts.authority.key() == state.authority, ErrorCode::Unauthorized);
        require!(state.pause_scheduled_at == 0, ErrorCode::PauseAlreadyScheduled);
        let clock = Clock::get()?;
        state.pause_scheduled_at = clock.unix_timestamp + PAUSE_TIMELOCK;
        Ok(())
    }

    /// Execute the scheduled pause after the 48h timelock has elapsed.
    pub fn execute_pause(ctx: Context<Pause>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(ctx.accounts.authority.key() == state.authority, ErrorCode::Unauthorized);
        require!(state.pause_scheduled_at > 0, ErrorCode::NoPauseScheduled);
        let clock = Clock::get()?;
        require!(clock.unix_timestamp >= state.pause_scheduled_at, ErrorCode::PauseTimelockNotExpired);
        state.paused = true;
        state.pause_scheduled_at = 0;
        Ok(())
    }

    /// Resume operation immediately and cancel any pending pause schedule.
    pub fn resume(ctx: Context<Resume>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(ctx.accounts.authority.key() == state.authority, ErrorCode::Unauthorized);
        state.paused = false;
        state.pause_scheduled_at = 0;
        Ok(())
    }

    pub fn withdraw_platform_fee(ctx: Context<WithdrawFee>, amount: u64) -> Result<()> {
        require!(ctx.accounts.authority.key() == ctx.accounts.state.authority, ErrorCode::Unauthorized);
        require!(!ctx.accounts.state.paused, ErrorCode::ContractPaused);
        require!(amount > 0, ErrorCode::InvalidAmount);

        let bump = ctx.accounts.state.bump;
        let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.dest.to_account_info(),
                authority: ctx.accounts.state.to_account_info(),
            },
            seeds,
        );
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn deposit_hourly(ctx: Context<DepositHourly>, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let user = &mut ctx.accounts.user;
        let clock = Clock::get()?;
        
        require!(!state.paused, ErrorCode::ContractPaused);
        require!(amount >= HOUR_MIN, ErrorCode::BelowMinDeposit);
        require!(user.total_deposit + amount <= MAX_DEPOSIT, ErrorCode::ExceedMaxDeposit);
        
        let time_since_last_draw = clock.unix_timestamp - state.last_hourly_draw;
        require!(time_since_last_draw < 3600 - LOCK_PERIOD || time_since_last_draw >= 3600, ErrorCode::PoolLocked);
        
        let pre_match = state.pre_pool.min(amount);
        state.pre_pool = state.pre_pool.saturating_sub(pre_match);
        
        let burn_amount = amount * BURN / BASE;
        let platform_amount = amount * PLAT / BASE;
        let prize_amount = amount - burn_amount - platform_amount + pre_match;
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.burn_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, burn_amount)?;
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.platform_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, platform_amount)?;
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, prize_amount)?;
        
        state.hourly_pool += prize_amount;
        state.hourly_players += 1;
        state.burned += burn_amount;
        user.total_deposit += amount;
        user.hourly_tickets += prize_amount / 1_000_000_000;
        
        Ok(())
    }

    pub fn deposit_daily(ctx: Context<DepositDaily>, amount: u64, referrer: Option<Pubkey>) -> Result<()> {
        // Extract state AccountInfo before taking mutable borrow (same pattern as draw_hourly)
        let state_account_info = ctx.accounts.state.to_account_info();
        let state = &mut ctx.accounts.state;
        let user = &mut ctx.accounts.user;
        let clock = Clock::get()?;
        
        require!(!state.paused, ErrorCode::ContractPaused);
        require!(amount >= DAY_MIN, ErrorCode::BelowMinDeposit);
        require!(clock.unix_timestamp - user.last_time >= 60, ErrorCode::DepositTooFrequent);
        require!(user.total_deposit + amount <= MAX_DEPOSIT, ErrorCode::ExceedMaxDeposit);
        
        let time_since_last_draw = clock.unix_timestamp - state.last_daily_draw;
        require!(time_since_last_draw < 86400 - LOCK_PERIOD || time_since_last_draw >= 86400, ErrorCode::PoolLocked);
        
        if let Some(referrer_key) = referrer {
            require!(referrer_key != ctx.accounts.signer.key(), ErrorCode::InvalidReferrer);

            // MED-2: Verify referrer has a valid UserData account (has participated).
            // Client must supply the referrer's UserData PDA as remaining_accounts[0].
            require!(!ctx.remaining_accounts.is_empty(), ErrorCode::ReferrerNotParticipated);
            let referrer_data_info = &ctx.remaining_accounts[0];

            // Must be owned by this program
            require!(
                referrer_data_info.owner == &crate::ID,
                ErrorCode::InvalidReferrer
            );
            // Must be initialised (non-empty data)
            require!(
                !referrer_data_info.data_is_empty(),
                ErrorCode::ReferrerNotParticipated
            );
            // Must match the expected PDA seeds [b"user", referrer_key]
            let (expected_pda, _) = Pubkey::find_program_address(
                &[b"user", referrer_key.as_ref()],
                &crate::ID,
            );
            require!(
                *referrer_data_info.key == expected_pda,
                ErrorCode::InvalidReferrer
            );
        }
        
        let pre_match = state.pre_pool.min(amount);
        state.pre_pool = state.pre_pool.saturating_sub(pre_match);
        
        let burn_amount = amount * BURN / BASE;
        let platform_amount = amount * PLAT / BASE;
        let prize_amount = amount - burn_amount - platform_amount + pre_match;
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.burn_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, burn_amount)?;
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.platform_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, platform_amount)?;
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, prize_amount)?;
        
        if let Some(referrer_key) = referrer {
            if referrer_key != ctx.accounts.signer.key() && state.referral_pool == 0 {
                emit!(ReferralPoolExhausted {
                    referrer: referrer_key,
                    depositor: ctx.accounts.signer.key(),
                    requested: amount * REF / BASE,
                    available: 0,
                    timestamp: clock.unix_timestamp,
                });
            } else if referrer_key != ctx.accounts.signer.key() && state.referral_pool > 0 {
                let referral_reward = (amount * REF / BASE).min(state.referral_pool);
                if referral_reward > 0 {
                    let bump = state.bump;
                    let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
                    let cpi_ctx = CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.referral_vault.to_account_info(),
                            to: ctx.accounts.referrer_token.to_account_info(),
                            authority: state_account_info.clone(),
                        },
                        seeds,
                    );
                    token::transfer(cpi_ctx, referral_reward)?;
                    state.referral_pool = state.referral_pool.saturating_sub(referral_reward);
                }

                if !user.has_ref_bonus {
                    let referred_bonus = amount * REFERRED_BONUS / BASE;
                    if referred_bonus > 0 {
                        let bump = state.bump;
                        let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
                        let cpi_ctx = CpiContext::new_with_signer(
                            ctx.accounts.token_program.to_account_info(),
                            Transfer {
                                from: ctx.accounts.referral_vault.to_account_info(),
                                to: ctx.accounts.user_referrer_bonus.to_account_info(),
                                authority: state_account_info.clone(),
                            },
                            seeds,
                        );
                        token::transfer(cpi_ctx, referred_bonus)?;
                        state.referral_pool = state.referral_pool.saturating_sub(referred_bonus);
                    }
                    user.has_ref_bonus = true;
                    user.referrer = Some(referrer_key);
                }
            }
        }
        
        state.daily_pool += prize_amount;
        state.daily_players += 1;
        state.burned += burn_amount;
        user.total_deposit += amount;
        user.daily_tickets += prize_amount / 1_000_000_000;
        user.last_time = clock.unix_timestamp;
        
        Ok(())
    }

    /// Draw the hourly lottery. Authority provides winner payouts computed off-chain
    /// using `draw_seed` as the randomness source. The seed (e.g. derived from a recent
    /// slot hash) is emitted on-chain so anyone can audit the draw by replaying the
    /// winner-selection algorithm with the same seed.
    pub fn draw_hourly<'info>(
        ctx: Context<'_, '_, '_, 'info, DrawHourly<'info>>,
        payouts: Vec<WinnerPayout>,
        draw_seed: [u8; 32],
    ) -> Result<()> {
        let clock = Clock::get()?;

        require!(!ctx.accounts.state.paused, ErrorCode::ContractPaused);
        require!(ctx.accounts.authority.key() == ctx.accounts.state.authority, ErrorCode::Unauthorized);
        require!(ctx.accounts.state.hourly_players >= 3, ErrorCode::NotEnoughParticipants);

        let time_since_last_draw = clock.unix_timestamp - ctx.accounts.state.last_hourly_draw;
        require!(time_since_last_draw >= 3600 - TIME_TOLERANCE, ErrorCode::DrawTooEarly);

        let total_pool = ctx.accounts.state.hourly_pool + ctx.accounts.state.hourly_rollover;
        require!(total_pool > 0, ErrorCode::InsufficientPoolBalance);

        let rollover = total_pool * ROLLOVER_RATE / BASE;
        let distributable = total_pool - rollover;

        // Validate total payouts do not exceed the distributable amount
        let total_payout: u64 = payouts.iter().fold(0u64, |acc, p| acc.saturating_add(p.amount));
        require!(total_payout <= distributable, ErrorCode::InsufficientPoolBalance);
        require!(payouts.len() <= ctx.remaining_accounts.len(), ErrorCode::InvalidAmount);

        // Extract AccountInfos before the loop to avoid lifetime conflicts
        let bump = ctx.accounts.state.bump;
        let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
        let token_program = ctx.accounts.token_program.to_account_info();
        let pool_vault = ctx.accounts.pool_vault.to_account_info();
        let state_authority = ctx.accounts.state.to_account_info();
        let winner_accounts: Vec<AccountInfo> = ctx.remaining_accounts.iter()
            .take(payouts.len())
            .cloned()
            .collect();

        // Transfer prizes to each winner
        for (i, payout) in payouts.iter().enumerate() {
            if payout.amount == 0 {
                continue;
            }
            token::transfer(
                CpiContext::new_with_signer(
                    token_program.clone(),
                    Transfer {
                        from: pool_vault.clone(),
                        to: winner_accounts[i].clone(),
                        authority: state_authority.clone(),
                    },
                    seeds,
                ),
                payout.amount,
            )?;
        }

        // Reset pool state
        let state = &mut ctx.accounts.state;
        state.hourly_rollover = rollover;
        state.hourly_pool = 0;
        state.hourly_players = 0;
        state.last_hourly_draw = clock.unix_timestamp;

        // Validate draw_seed is not all-zeros (must be a real block hash)
        require!(draw_seed != [0u8; 32], ErrorCode::InvalidAmount);

        emit!(DrawCompleted {
            pool_type: PoolType::Hourly,
            total_pool,
            distributed: total_payout,
            rollover,
            winner_count: payouts.len() as u32,
            timestamp: clock.unix_timestamp,
            draw_seed,
        });

        Ok(())
    }

    /// Draw the daily lottery. Authority provides winner payouts computed off-chain
    /// using `draw_seed` as the randomness source. The seed (e.g. derived from a recent
    /// slot hash) is emitted on-chain so anyone can audit the draw by replaying the
    /// winner-selection algorithm with the same seed.
    pub fn draw_daily<'info>(
        ctx: Context<'_, '_, '_, 'info, DrawDaily<'info>>,
        payouts: Vec<WinnerPayout>,
        draw_seed: [u8; 32],
    ) -> Result<()> {
        let clock = Clock::get()?;

        require!(!ctx.accounts.state.paused, ErrorCode::ContractPaused);
        require!(ctx.accounts.authority.key() == ctx.accounts.state.authority, ErrorCode::Unauthorized);
        require!(ctx.accounts.state.daily_players >= 5, ErrorCode::NotEnoughParticipants);

        let time_since_last_draw = clock.unix_timestamp - ctx.accounts.state.last_daily_draw;
        require!(time_since_last_draw >= 86400 - TIME_TOLERANCE, ErrorCode::DrawTooEarly);

        let total_pool = ctx.accounts.state.daily_pool + ctx.accounts.state.daily_rollover;
        require!(total_pool > 0, ErrorCode::InsufficientPoolBalance);

        let rollover = total_pool * ROLLOVER_RATE / BASE;
        let distributable = total_pool - rollover;

        // Validate total payouts do not exceed the distributable amount
        let total_payout: u64 = payouts.iter().fold(0u64, |acc, p| acc.saturating_add(p.amount));
        require!(total_payout <= distributable, ErrorCode::InsufficientPoolBalance);
        require!(payouts.len() <= ctx.remaining_accounts.len(), ErrorCode::InvalidAmount);

        // Extract AccountInfos before the loop to avoid lifetime conflicts
        let bump = ctx.accounts.state.bump;
        let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
        let token_program = ctx.accounts.token_program.to_account_info();
        let pool_vault = ctx.accounts.pool_vault.to_account_info();
        let state_authority = ctx.accounts.state.to_account_info();
        let winner_accounts: Vec<AccountInfo> = ctx.remaining_accounts.iter()
            .take(payouts.len())
            .cloned()
            .collect();

        // Transfer prizes to each winner
        for (i, payout) in payouts.iter().enumerate() {
            if payout.amount == 0 {
                continue;
            }
            token::transfer(
                CpiContext::new_with_signer(
                    token_program.clone(),
                    Transfer {
                        from: pool_vault.clone(),
                        to: winner_accounts[i].clone(),
                        authority: state_authority.clone(),
                    },
                    seeds,
                ),
                payout.amount,
            )?;
        }

        // Reset pool state
        let state = &mut ctx.accounts.state;
        state.daily_rollover = rollover;
        state.daily_pool = 0;
        state.daily_players = 0;
        state.last_daily_draw = clock.unix_timestamp;

        // Validate draw_seed is not all-zeros (must be a real block hash)
        require!(draw_seed != [0u8; 32], ErrorCode::InvalidAmount);

        emit!(DrawCompleted {
            pool_type: PoolType::Daily,
            total_pool,
            distributed: total_payout,
            rollover,
            winner_count: payouts.len() as u32,
            timestamp: clock.unix_timestamp,
            draw_seed,
        });

        Ok(())
    }

    pub fn claim_free_airdrop(ctx: Context<ClaimFreeAirdrop>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        require!(!user.airdrop_claimed, ErrorCode::AlreadyClaimed);
        
        let auth_bump = ctx.bumps.airdrop_auth;
        let seeds: &[&[&[u8]]] = &[&[b"airdrop", &[auth_bump]]];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.airdrop_vault.to_account_info(),
                to: ctx.accounts.dest_token.to_account_info(),
                authority: ctx.accounts.airdrop_auth.to_account_info(),
            },
            seeds,
        );
        token::transfer(cpi_ctx, FREE_AIRDROP)?;
        
        user.airdrop_claimed = true;
        Ok(())
    }

    // ─── Staking Instructions ────────────────────────────────────────────────

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

    pub fn release_stake(
        ctx: Context<ReleaseStake>,
        stake_index: u64,
    ) -> Result<()> {
        staking::release_stake(ctx, stake_index)
    }

    pub fn early_withdraw(
        ctx: Context<ReleaseStake>,
        stake_index: u64,
    ) -> Result<()> {
        staking::early_withdraw(ctx, stake_index)
    }

    // ─── Profit-Based Airdrop Instructions ──────────────────────────────────

    pub fn initialize_airdrop(
        ctx: Context<InitializeAirdrop>,
        total_airdrop: u64,
    ) -> Result<()> {
        airdrop::initialize_airdrop(ctx, total_airdrop)
    }

    pub fn record_profit(
        ctx: Context<RecordProfit>,
        profit_amount: u64,
    ) -> Result<()> {
        airdrop::record_profit(ctx, profit_amount)
    }

    pub fn claim_profit_airdrop(
        ctx: Context<ClaimProfitAirdrop>,
    ) -> Result<()> {
        airdrop::claim_profit_airdrop(ctx)
    }

    // ─── Prize Vesting Instructions ──────────────────────────────────────────

    /// Admin: lock a winner's prize in the vesting vault and create a vesting record.
    /// Call this after draw_hourly/draw_daily for each winner instead of direct transfer.
    /// `vesting_id` should be the draw timestamp (unique per draw per winner).
    pub fn init_vesting(
        ctx: Context<InitVesting>,
        winner: Pubkey,
        amount: u64,
        vesting_id: u64,
    ) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.state.authority,
            ErrorCode::Unauthorized
        );
        require!(amount > 0, ErrorCode::InvalidAmount);

        let clock = Clock::get()?;
        let bump = ctx.accounts.state.bump;
        let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];

        // Transfer prize from pool_vault → vesting_vault (signed by state PDA)
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.vesting_vault.to_account_info(),
                    authority: ctx.accounts.state.to_account_info(),
                },
                seeds,
            ),
            amount,
        )?;

        let va = &mut ctx.accounts.vesting_account;
        va.winner = winner;
        va.total_amount = amount;
        va.claimed_amount = 0;
        va.start_time = clock.unix_timestamp;
        va.vesting_id = vesting_id;
        va.bump = ctx.bumps.vesting_account;

        Ok(())
    }

    /// Winner: claim all currently unlocked vesting tokens.
    /// 5% (500 bps) unlocks per day; fully vested after 20 days.
    pub fn claim_vested(ctx: Context<ClaimVested>, _vesting_id: u64) -> Result<()> {
        let clock = Clock::get()?;
        let va = &mut ctx.accounts.vesting_account;

        require!(va.claimed_amount < va.total_amount, ErrorCode::VestingFullyClaimed);

        let elapsed_days = (clock.unix_timestamp - va.start_time) / 86400;
        let unlocked_bps = (elapsed_days as u64)
            .min(VESTING_DAYS)
            .saturating_mul(VESTING_RELEASE_PER_DAY); // max = 20 * 500 = 10000
        let unlocked_amount = va.total_amount * unlocked_bps / BASE;
        let claimable = unlocked_amount.saturating_sub(va.claimed_amount);

        require!(claimable > 0, ErrorCode::NothingToClaim);

        // Transfer from vesting_vault → user_token (signed by vesting_auth PDA)
        let auth_bump = ctx.bumps.vesting_authority;
        let vesting_seeds: &[&[&[u8]]] = &[&[b"vesting_auth", &[auth_bump]]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vesting_vault.to_account_info(),
                    to: ctx.accounts.user_token.to_account_info(),
                    authority: ctx.accounts.vesting_authority.to_account_info(),
                },
                vesting_seeds,
            ),
            claimable,
        )?;

        va.claimed_amount += claimable;
        Ok(())
    }
}

// ─── Events ────────────────────────────────────────────────────────────────

#[event]
pub struct DrawCompleted {
    pub pool_type: PoolType,
    pub total_pool: u64,
    pub distributed: u64,
    pub rollover: u64,
    pub winner_count: u32,
    pub timestamp: i64,
    /// Verifiable randomness seed used to derive winner selection.
    /// Publicly emitted so anyone can replay the draw algorithm and audit results.
    pub draw_seed: [u8; 32],
}

#[event]
pub struct ReferralPoolExhausted {
    pub referrer: Pubkey,
    pub depositor: Pubkey,
    pub requested: u64,
    pub available: u64,
    pub timestamp: i64,
}
