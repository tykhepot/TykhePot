use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

// 质押模块常量
pub const STAKING_APR_SHORT: u64 = 800; // 8% = 800/10000
pub const STAKING_APR_LONG: u64 = 4800; // 48% = 4800/10000
pub const SHORT_STAKE_DAYS: i64 = 30;
pub const LONG_STAKE_DAYS: i64 = 180;
pub const SECONDS_PER_DAY: i64 = 86400;

// 计算质押收益
pub fn calculate_reward(amount: u64, apr: u64, days: i64) -> Result<u64> {
    // 收益 = 本金 × 年化率 × 天数 / 365
    let reward = (amount as u128)
        .checked_mul(apr as u128)
        .ok_or(StakingErrorCode::MathOverflow)?
        .checked_mul(days as u128)
        .ok_or(StakingErrorCode::MathOverflow)?
        .checked_div(365)
        .ok_or(StakingErrorCode::MathOverflow)?
        .checked_div(10000)
        .ok_or(StakingErrorCode::MathOverflow)?;

    Ok(reward as u64)
}

// 数据结构
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum StakeType {
    ShortTerm, // 30天
    LongTerm,  // 180天
}

#[account]
pub struct StakingState {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub short_term_pool: u64,
    pub long_term_pool: u64,
    pub total_staked_short: u64,
    pub total_staked_long: u64,
    pub short_term_released: u64,
    pub long_term_released: u64,
    pub bump: u8,
}

impl StakingState {
    pub const SIZE: usize = 32 + 32 + 8 * 6 + 1;
}

#[account]
pub struct UserStake {
    pub owner: Pubkey,
    pub amount: u64,
    pub reward: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub stake_type: StakeType,
    pub claimed: bool,
    pub stake_index: u64,
}

impl UserStake {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 8 + 1 + 1 + 8;
}

// 初始化质押模块
pub fn initialize_staking(
    ctx: Context<crate::InitializeStaking>,
    short_term_pool: u64,
    long_term_pool: u64,
) -> Result<()> {
    let staking_state = &mut ctx.accounts.staking_state;
    
    staking_state.authority = ctx.accounts.authority.key();
    staking_state.token_mint = ctx.accounts.token_mint.key();
    staking_state.short_term_pool = short_term_pool;
    staking_state.long_term_pool = long_term_pool;
    staking_state.total_staked_short = 0;
    staking_state.total_staked_long = 0;
    staking_state.short_term_released = 0;
    staking_state.long_term_released = 0;
    staking_state.bump = ctx.bumps.staking_state;
    
    emit!(StakingInitialized {
        short_term_pool,
        long_term_pool,
    });
    
    Ok(())
}

// 质押代币
pub fn stake(
    ctx: Context<crate::Stake>,
    stake_index: u64,
    amount: u64,
    stake_type: StakeType,
) -> Result<()> {
    require!(amount > 0, StakingErrorCode::InvalidAmount);
    
    let staking_state = &mut ctx.accounts.staking_state;
    let user_stake = &mut ctx.accounts.user_stake;
    let clock = Clock::get()?;
    
    // 计算奖励和结束时间
    let (apr, days, pool_remaining) = match stake_type {
        StakeType::ShortTerm => (
            STAKING_APR_SHORT,
            SHORT_STAKE_DAYS,
            staking_state.short_term_pool
        ),
        StakeType::LongTerm => (
            STAKING_APR_LONG,
            LONG_STAKE_DAYS,
            staking_state.long_term_pool
        ),
    };
    
    let reward = calculate_reward(amount, apr, days)?;
    
    // 检查奖励池是否充足
    require!(reward <= pool_remaining, StakingErrorCode::InsufficientRewardPool);
    
    // 转账到质押金库
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.staking_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;
    
    // 更新状态
    match stake_type {
        StakeType::ShortTerm => {
            staking_state.short_term_pool -= reward;
            staking_state.total_staked_short += amount;
        },
        StakeType::LongTerm => {
            staking_state.long_term_pool -= reward;
            staking_state.total_staked_long += amount;
        },
    }
    
    // 设置用户质押信息
    user_stake.owner = ctx.accounts.user.key();
    user_stake.amount = amount;
    user_stake.reward = reward;
    user_stake.start_time = clock.unix_timestamp;
    user_stake.end_time = clock.unix_timestamp + (days * SECONDS_PER_DAY);
    user_stake.stake_type = stake_type;
    user_stake.claimed = false;
    user_stake.stake_index = stake_index;
    
    emit!(StakeEvent {
        user: ctx.accounts.user.key(),
        amount,
        reward,
        stake_type,
        end_time: user_stake.end_time,
    });
    
    Ok(())
}

// 到期释放质押
pub fn release_stake(
    ctx: Context<crate::ReleaseStake>,
    _stake_index: u64,
) -> Result<()> {
    let staking_state = &mut ctx.accounts.staking_state;
    let user_stake = &mut ctx.accounts.user_stake;
    let clock = Clock::get()?;
    
    // 检查是否已领取
    require!(!user_stake.claimed, StakingErrorCode::AlreadyClaimed);
    
    // 检查是否到期
    require!(
        clock.unix_timestamp >= user_stake.end_time,
        StakingErrorCode::StakeNotMatured
    );
    
    let total_return = user_stake.amount + user_stake.reward;
    
    // 转账给用户（本金+奖励）
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.staking_vault.to_account_info(),
                to: ctx.accounts.user_token.to_account_info(),
                authority: ctx.accounts.staking_authority.to_account_info(),
            },
            &[&[b"staking", &[ctx.bumps.staking_authority]]],
        ),
        total_return,
    )?;
    
    // 更新状态
    match user_stake.stake_type {
        StakeType::ShortTerm => {
            staking_state.total_staked_short -= user_stake.amount;
            staking_state.short_term_released += total_return;
        },
        StakeType::LongTerm => {
            staking_state.total_staked_long -= user_stake.amount;
            staking_state.long_term_released += total_return;
        },
    }
    
    user_stake.claimed = true;
    
    emit!(ReleaseEvent {
        user: ctx.accounts.user.key(),
        principal: user_stake.amount,
        reward: user_stake.reward,
        total: total_return,
    });
    
    Ok(())
}

// 提前赎回（无收益）
pub fn early_withdraw(
    ctx: Context<crate::ReleaseStake>,
    _stake_index: u64,
) -> Result<()> {
    let staking_state = &mut ctx.accounts.staking_state;
    let user_stake = &mut ctx.accounts.user_stake;
    let clock = Clock::get()?;
    
    // 检查是否已领取
    require!(!user_stake.claimed, StakingErrorCode::AlreadyClaimed);
    
    // 检查是否未到期
    require!(
        clock.unix_timestamp < user_stake.end_time,
        StakingErrorCode::StakeMaturedUseRelease
    );
    
    // 只返还本金
    let principal = user_stake.amount;
    
    // 转账给用户（仅本金）
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.staking_vault.to_account_info(),
                to: ctx.accounts.user_token.to_account_info(),
                authority: ctx.accounts.staking_authority.to_account_info(),
            },
            &[&[b"staking", &[ctx.bumps.staking_authority]]],
        ),
        principal,
    )?;
    
    // 将奖励返回到奖励池
    match user_stake.stake_type {
        StakeType::ShortTerm => {
            staking_state.total_staked_short -= user_stake.amount;
            staking_state.short_term_pool += user_stake.reward;
        },
        StakeType::LongTerm => {
            staking_state.total_staked_long -= user_stake.amount;
            staking_state.long_term_pool += user_stake.reward;
        },
    }
    
    user_stake.claimed = true;
    
    emit!(EarlyWithdrawEvent {
        user: ctx.accounts.user.key(),
        principal,
        forfeited_reward: user_stake.reward,
    });
    
    Ok(())
}

// Accounts structs are defined in lib.rs (crate root) as required by Anchor's #[program] macro

// 事件
#[event]
pub struct StakingInitialized {
    pub short_term_pool: u64,
    pub long_term_pool: u64,
}

#[event]
pub struct StakeEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub reward: u64,
    pub stake_type: StakeType,
    pub end_time: i64,
}

#[event]
pub struct ReleaseEvent {
    pub user: Pubkey,
    pub principal: u64,
    pub reward: u64,
    pub total: u64,
}

#[event]
pub struct EarlyWithdrawEvent {
    pub user: Pubkey,
    pub principal: u64,
    pub forfeited_reward: u64,
}

// 错误码
#[error_code]
pub enum StakingErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Stake pool exhausted")]
    PoolExhausted,
    #[msg("Insufficient reward pool")]
    InsufficientRewardPool,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Stake not matured")]
    StakeNotMatured,
    #[msg("Stake matured, use release instead")]
    StakeMaturedUseRelease,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
