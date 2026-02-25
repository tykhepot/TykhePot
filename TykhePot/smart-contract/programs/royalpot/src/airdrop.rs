use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

// 空投模块常量
pub const AIRDROP_CLAIM_MULTIPLIER: u64 = 10; // 获利金额的10倍
pub const MAX_AIRDROP_PER_USER: u64 = 10_000_000_000_000; // 10,000 TPOT
pub const MIN_PROFIT_TO_CLAIM: u64 = 1_000_000_000; // 1,000 TPOT

// 数据结构
#[account]
pub struct AirdropState {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub total_airdrop: u64,
    pub claimed_amount: u64,
    pub remaining_amount: u64,
    pub participant_count: u32,
    pub claimed_count: u32,
    pub bump: u8,
}

impl AirdropState {
    pub const SIZE: usize = 32 + 32 + 8 + 8 + 8 + 4 + 4 + 1;
}

#[account]
pub struct UserAirdrop {
    pub owner: Pubkey,
    pub has_participated: bool,
    pub first_participation_time: i64,
    pub total_profit: u64,
    pub eligible_airdrop: u64,
    pub has_claimed: bool,
    pub claimed_amount: u64,
    pub claim_time: i64,
}

impl UserAirdrop {
    pub const SIZE: usize = 32 + 1 + 8 + 8 + 8 + 1 + 8 + 8;
}

// 初始化空投模块
pub fn initialize_airdrop(
    ctx: Context<crate::InitializeAirdrop>,
    total_airdrop: u64,
) -> Result<()> {
    let airdrop_state = &mut ctx.accounts.airdrop_state;
    
    airdrop_state.authority = ctx.accounts.payer.key();
    airdrop_state.token_mint = ctx.accounts.token_mint.key();
    airdrop_state.total_airdrop = total_airdrop;
    airdrop_state.claimed_amount = 0;
    airdrop_state.remaining_amount = total_airdrop;
    airdrop_state.participant_count = 0;
    airdrop_state.claimed_count = 0;
    airdrop_state.bump = ctx.bumps.airdrop_state;
    
    emit!(AirdropInitialized {
        total_airdrop,
    });
    
    Ok(())
}

// 记录用户游戏盈利
pub fn record_profit(
    ctx: Context<crate::RecordProfit>,
    profit_amount: u64,
) -> Result<()> {
    require!(profit_amount > 0, AirdropErrorCode::InvalidProfit);
    
    let airdrop_state = &mut ctx.accounts.airdrop_state;
    let user_airdrop = &mut ctx.accounts.user_airdrop;
    let clock = Clock::get()?;
    
    // 首次参与
    if !user_airdrop.has_participated {
        user_airdrop.has_participated = true;
        user_airdrop.first_participation_time = clock.unix_timestamp;
        user_airdrop.owner = ctx.accounts.user.key();
        airdrop_state.participant_count += 1;
    }
    
    // 更新总盈利（saturating_add 防止溢出 abort）
    user_airdrop.total_profit = user_airdrop.total_profit.saturating_add(profit_amount);
    
    // 计算可领取空投（10倍盈利，最高10000 TPOT）
    let calculated_airdrop = user_airdrop.total_profit
        .checked_mul(AIRDROP_CLAIM_MULTIPLIER)
        .ok_or(AirdropErrorCode::MathOverflow)?
        .min(MAX_AIRDROP_PER_USER);
    
    // 已经领取的部分
    let already_claimed = if user_airdrop.has_claimed {
        user_airdrop.claimed_amount
    } else {
        0
    };
    
    // 更新可领取额度
    user_airdrop.eligible_airdrop = calculated_airdrop.saturating_sub(already_claimed);
    
    emit!(ProfitRecorded {
        user: ctx.accounts.user.key(),
        profit_amount,
        total_profit: user_airdrop.total_profit,
        eligible_airdrop: user_airdrop.eligible_airdrop,
    });
    
    Ok(())
}

// 领取基于盈利的空投
pub fn claim_profit_airdrop(
    ctx: Context<crate::ClaimProfitAirdrop>,
) -> Result<()> {
    let airdrop_state = &mut ctx.accounts.airdrop_state;
    let user_airdrop = &mut ctx.accounts.user_airdrop;
    let clock = Clock::get()?;
    
    // 检查是否已参与
    require!(user_airdrop.has_participated, AirdropErrorCode::NotParticipated);
    
    // 检查是否已领取过
    require!(!user_airdrop.has_claimed, AirdropErrorCode::AlreadyClaimedAirdrop);
    
    // 检查盈利是否达标
    require!(
        user_airdrop.total_profit >= MIN_PROFIT_TO_CLAIM,
        AirdropErrorCode::InsufficientProfit
    );
    
    // 检查可领取额度
    require!(user_airdrop.eligible_airdrop > 0, AirdropErrorCode::NoEligibleAirdrop);
    
    // 检查空投池余额
    let claim_amount = user_airdrop.eligible_airdrop.min(airdrop_state.remaining_amount);
    require!(claim_amount > 0, AirdropErrorCode::AirdropExhausted);
    
    // 转账给用户
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.airdrop_vault.to_account_info(),
                to: ctx.accounts.user_token.to_account_info(),
                authority: ctx.accounts.airdrop_authority.to_account_info(),
            },
            &[&[b"airdrop", &[ctx.bumps.airdrop_authority]]],
        ),
        claim_amount,
    )?;
    
    // 更新状态
    user_airdrop.has_claimed = true;
    user_airdrop.claimed_amount = claim_amount;
    user_airdrop.claim_time = clock.unix_timestamp;
    
    airdrop_state.claimed_amount += claim_amount;
    airdrop_state.remaining_amount -= claim_amount;
    airdrop_state.claimed_count += 1;
    
    emit!(AirdropClaimed {
        user: ctx.accounts.user.key(),
        amount: claim_amount,
        profit_based_on: user_airdrop.total_profit,
    });
    
    Ok(())
}

// Accounts structs are defined in lib.rs (crate root) as required by Anchor's #[program] macro

// 事件
#[event]
pub struct AirdropInitialized {
    pub total_airdrop: u64,
}

#[event]
pub struct ProfitRecorded {
    pub user: Pubkey,
    pub profit_amount: u64,
    pub total_profit: u64,
    pub eligible_airdrop: u64,
}

#[event]
pub struct AirdropClaimed {
    pub user: Pubkey,
    pub amount: u64,
    pub profit_based_on: u64,
}

// 错误码
#[error_code]
pub enum AirdropErrorCode {
    #[msg("Invalid profit amount")]
    InvalidProfit,
    #[msg("User has not participated in game")]
    NotParticipated,
    #[msg("Insufficient profit to claim airdrop")]
    InsufficientProfit,
    #[msg("Already claimed airdrop")]
    AlreadyClaimedAirdrop,
    #[msg("No eligible airdrop")]
    NoEligibleAirdrop,
    #[msg("Airdrop pool exhausted")]
    AirdropExhausted,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
