use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

// 导入子模块
pub mod staking;
pub mod airdrop;
pub mod randomness;

// 使用子模块
use staking::*;
use airdrop::*;

// 重新导出质押和空投函数
pub use staking::{
    initialize_staking,
    stake,
    release_stake,
    early_withdraw,
};

pub use airdrop::{
    initialize_airdrop,
    record_profit,
    claim_airdrop,
};

// 常量定义
pub const DECIMALS: u8 = 9;
pub const BURN_RATE: u64 = 300; // 3% = 300/10000
pub const PLATFORM_RATE: u64 = 200; // 2% = 200/10000
pub const PRIZE_POOL_RATE: u64 = 9500; // 95% = 9500/10000
pub const REFERRAL_RATE: u64 = 800; // 8% = 800/10000
pub const BASE_RATE: u64 = 10000;

pub const HOURLY_POOL_MIN_DEPOSIT: u64 = 200_000_000_000; // 200 TPOT
pub const DAILY_POOL_MIN_DEPOSIT: u64 = 100_000_000_000; // 100 TPOT

pub const PRIZE_DISTRIBUTION: [(u64, usize); 5] = [
    (3000, 1),   // 头奖 30%, 1人
    (2000, 2),   // 二等奖 20%, 2人
    (1500, 3),   // 三等奖 15%, 3人
    (1000, 5),   // 幸运奖 10%, 5人
    (2000, 0),   // 普惠奖 20%, 动态人数
];

pub const VESTING_DAYS: u64 = 20;
pub const VESTING_RELEASE_PER_DAY: u64 = 500; // 5% = 500/10000

// 程序ID (部署时替换)
declare_id!("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");

#[program]
pub mod royalpot {
    use super::*;

    // 初始化协议
    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        let state = &mut ctx.accounts.state;
        
        state.authority = ctx.accounts.authority.key();
        state.token_mint = ctx.accounts.token_mint.key();
        state.reserve_mint = ctx.accounts.reserve_mint.key();
        state.platform_wallet = ctx.accounts.platform_wallet.key();
        
        // 初始化奖池账户
        state.hourly_pool = PrizePool::default();
        state.daily_pool = PrizePool::default();
        
        // 初始化储备
        state.reserve_balance = params.initial_reserve;
        state.referral_pool_balance = params.initial_referral_pool;
        state.total_burned = 0;
        
        // 时间设置
        state.last_hourly_draw = Clock::get()?.unix_timestamp;
        state.last_daily_draw = Clock::get()?.unix_timestamp;
        
        // 保存 bump
        state.bump = ctx.bumps.state;
        
        emit!(InitializeEvent {
            authority: state.authority,
            initial_reserve: params.initial_reserve,
            initial_referral_pool: params.initial_referral_pool,
        });
        
        Ok(())
    }

    // 参与小时池
    pub fn deposit_hourly(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount >= HOURLY_POOL_MIN_DEPOSIT, ErrorCode::BelowMinDeposit);
        
        let state = &mut ctx.accounts.state;
        let user = &mut ctx.accounts.user_state;
        
        // 计算分配
        let burn_amount = amount * BURN_RATE / BASE_RATE;
        let platform_amount = amount * PLATFORM_RATE / BASE_RATE;
        let prize_amount = amount - burn_amount - platform_amount;
        
        // 执行转账
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.burn_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            burn_amount,
        )?;
        
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.platform_token.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            platform_amount,
        )?;
        
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.hourly_prize_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            prize_amount,
        )?;
        
        // 更新状态
        state.hourly_pool.total_amount += prize_amount;
        state.hourly_pool.participants += 1;
        state.total_burned += burn_amount;
        
        // 记录用户参与 (向下取整)
        let ticket_amount = prize_amount / 1_000_000_000; // 1 RYPOT = 1票
        user.hourly_tickets += ticket_amount;
        
        // 小数部分捐赠给奖池
        let donated = prize_amount - (ticket_amount * 1_000_000_000);
        state.hourly_pool.total_amount += donated;
        
        emit!(DepositEvent {
            user: ctx.accounts.user.key(),
            pool_type: PoolType::Hourly,
            amount,
            tickets: ticket_amount,
            burn_amount,
        });
        
        Ok(())
    }

    // 参与天池 (带推广)
    pub fn deposit_daily(ctx: Context<DepositDaily>, amount: u64, referrer: Option<Pubkey>) -> Result<()> {
        require!(amount >= DAILY_POOL_MIN_DEPOSIT, ErrorCode::BelowMinDeposit);
        
        let state = &mut ctx.accounts.state;
        let user = &mut ctx.accounts.user_state;
        let clock = Clock::get()?;
        
        // 检查是否处于锁仓期 (开奖前5分钟)
        let time_to_draw = calculate_time_to_daily_draw(state.last_daily_draw, clock.unix_timestamp);
        require!(time_to_draw > 300, ErrorCode::PoolLocked); // 5分钟 = 300秒
        
        // 计算基础分配
        let burn_amount = amount * BURN_RATE / BASE_RATE;
        let platform_amount = amount * PLATFORM_RATE / BASE_RATE;
        let user_contribution = amount - burn_amount - platform_amount;
        
        // 储备配比
        let reserve_match = if state.reserve_balance > 0 {
            let match_amount = user_contribution.min(state.reserve_balance);
            state.reserve_balance -= match_amount;
            match_amount
        } else {
            0
        };
        
        let total_prize_amount = user_contribution + reserve_match;
        
        // 转账到销毁账户
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.burn_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            burn_amount,
        )?;
        
        // 转账到平台账户
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.platform_token.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            platform_amount,
        )?;
        
        // 转账到奖池
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.daily_prize_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            user_contribution,
        )?;
        
        // 从储备转账配比
        if reserve_match > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.reserve_vault.to_account_info(),
                        to: ctx.accounts.daily_prize_vault.to_account_info(),
                        authority: ctx.accounts.reserve_authority.to_account_info(),
                    },
                    &[&[b"reserve", &[ctx.bumps.reserve_authority]]],
                ),
                reserve_match,
            )?;
        }
        
        // 处理推广奖励 (仅天池)
        // 推广奖励通过外部转账处理，减少栈使用
        let referral_reward_result = if let Some(referrer_key) = referrer {
            if referrer_key != ctx.accounts.user.key() && state.referral_pool_balance > 0 {
                let referral_reward = amount * REFERRAL_RATE / BASE_RATE;
                let actual_reward = referral_reward.min(state.referral_pool_balance);
                Some((referrer_key, actual_reward))
            } else {
                None
            }
        } else {
            None
        };
        
        // 更新状态
        if let Some((referrer_key, actual_reward)) = referral_reward_result {
            state.referral_pool_balance -= actual_reward;
            
            // 记录推广关系 (首次参与时)
            if user.referrer.is_none() {
                user.referrer = Some(referrer_key);
            }
            
            emit!(ReferralRewardEvent {
                referrer: referrer_key,
                user: ctx.accounts.user.key(),
                amount: actual_reward,
            });
        }
        
        // 更新状态
        state.daily_pool.total_amount += total_prize_amount;
        state.daily_pool.participants += 1;
        state.total_burned += burn_amount;
        
        // 记录用户参与
        let ticket_amount = user_contribution / 1_000_000_000;
        user.daily_tickets += ticket_amount;
        
        // 小数捐赠
        let donated = user_contribution - (ticket_amount * 1_000_000_000);
        state.daily_pool.total_amount += donated;
        
        emit!(DepositDailyEvent {
            user: ctx.accounts.user.key(),
            amount,
            tickets: ticket_amount,
            burn_amount,
            reserve_match,
            referral_reward: if user.referrer.is_some() { amount * REFERRAL_RATE / BASE_RATE } else { 0 },
        });
        
        Ok(())
    }

    // 小时池开奖
    pub fn draw_hourly(ctx: Context<DrawHourly>, randomness: [u8; 32]) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;
        
        // 检查时间 (每小时开奖)
        let time_since_last_draw = clock.unix_timestamp - state.last_hourly_draw;
        require!(time_since_last_draw >= 3600, ErrorCode::DrawTooEarly); // 1小时
        
        // 检查参与人数
        require!(state.hourly_pool.participants >= 2, ErrorCode::NotEnoughParticipants);
        
        // 使用随机数开奖
        let total_tickets = state.hourly_pool.total_amount / 1_000_000_000;
        let winning_numbers = randomness::generate_winning_numbers(randomness, total_tickets)
            .map_err(|_| ErrorCode::InvalidRandomness)?;
        
        // 执行开奖逻辑 (简化版 - 实际需要通过oracle回调)
        let rollover = state.hourly_pool.total_amount * 500 / BASE_RATE;
        
        // 重置奖池
        state.hourly_pool = PrizePool {
            total_amount: rollover,
            participants: 0,
        };
        state.last_hourly_draw = clock.unix_timestamp;
        
        emit!(DrawEvent {
            pool_type: PoolType::Hourly,
            total_amount: state.hourly_pool.total_amount,
            rollover,
            timestamp: clock.unix_timestamp,
        });
        
        Ok(())
    }

    // 天池开奖 (需要VRF随机数)
    pub fn draw_daily(ctx: Context<DrawDaily>, randomness: [u8; 32]) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;
        
        // 检查时间
        let time_since_last_draw = clock.unix_timestamp - state.last_daily_draw;
        require!(time_since_last_draw >= 86400, ErrorCode::DrawTooEarly); // 24小时
        
        // 检查参与人数
        require!(state.daily_pool.participants >= 3, ErrorCode::NotEnoughParticipants);
        
        // 生成中奖号码
        let total_tickets = state.daily_pool.total_amount / 1_000_000_000;
        let winning_numbers = randomness::generate_winning_numbers(randomness, total_tickets)
            .map_err(|_| ErrorCode::InvalidRandomness)?;
        
        // 分配奖金 - 创建vesting记录
        for (idx, (distribution, count)) in PRIZE_DISTRIBUTION.iter().enumerate() {
            if idx == 4 { // 普惠奖
                break;
            }
            
            let prize_amount = state.daily_pool.total_amount * distribution / BASE_RATE;
            let per_winner = prize_amount / (*count as u64);
            
            // 创建vesting记录 (通过事件通知前端处理)
            emit!(PrizeAwardedEvent {
                prize_type: idx as u8,
                total_amount: prize_amount,
                per_winner,
                winner_count: *count as u8,
                winning_numbers: match idx {
                    0 => vec![winning_numbers.first_prize],
                    1 => winning_numbers.second_prizes.clone(),
                    2 => winning_numbers.third_prizes.clone(),
                    3 => winning_numbers.lucky_prizes.clone(),
                    _ => vec![],
                },
            });
        }
        
        // 普惠奖分配计算
        let universal_pool = state.daily_pool.total_amount * 2000 / BASE_RATE;
        let universal_tickets = total_tickets.saturating_sub(11); // 减去中大奖的票数
        
        if universal_tickets > 0 {
            emit!(UniversalPrizeEvent {
                total_pool: universal_pool,
                eligible_tickets: universal_tickets,
                per_ticket: universal_pool / universal_tickets,
            });
        }
        
        // 回流
        let rollover = state.daily_pool.total_amount * 500 / BASE_RATE;
        
        // 重置奖池
        state.daily_pool = PrizePool {
            total_amount: rollover,
            participants: 0,
        };
        state.last_daily_draw = clock.unix_timestamp;
        
        emit!(DrawEvent {
            pool_type: PoolType::Daily,
            total_amount: state.daily_pool.total_amount,
            rollover,
            timestamp: clock.unix_timestamp,
        });
        
        Ok(())
    }

    // 领取已解锁的奖金
    pub fn claim_vested(ctx: Context<ClaimVested>) -> Result<()> {
        let user = &mut ctx.accounts.user_state;
        let clock = Clock::get()?;
        
        let mut total_claimable = 0u64;
        
        for vesting in &mut user.vesting_schedules {
            if vesting.claimed >= vesting.total {
                continue;
            }
            
            let days_passed = ((clock.unix_timestamp - vesting.start_time) / 86400) as u64;
            let releasable_days = days_passed.min(VESTING_DAYS);
            
            let total_releasable = vesting.total * releasable_days * VESTING_RELEASE_PER_DAY / BASE_RATE;
            let claimable = total_releasable - vesting.claimed;
            
            if claimable > 0 {
                total_claimable += claimable;
                vesting.claimed += claimable;
            }
        }
        
        require!(total_claimable > 0, ErrorCode::NoClaimableAmount);
        
        // 转账到用户钱包
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.prize_vault.to_account_info(),
                    to: ctx.accounts.user_token.to_account_info(),
                    authority: ctx.accounts.prize_authority.to_account_info(),
                },
                &[&[b"prize", &[ctx.bumps.prize_authority]]],
            ),
            total_claimable,
        )?;
        
        emit!(ClaimEvent {
            user: ctx.accounts.user.key(),
            amount: total_claimable,
        });
        
        Ok(())
    }
}

// 数据结构
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct PrizePool {
    pub total_amount: u64,
    pub participants: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VestingSchedule {
    pub total: u64,
    pub claimed: u64,
    pub start_time: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub enum PoolType {
    Hourly,
    Daily,
}

// 初始化参数
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeParams {
    pub initial_reserve: u64,
    pub initial_referral_pool: u64,
}

// 账户结构
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolState::SIZE,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, ProtocolState>,
    
    pub token_mint: Account<'info, Mint>,
    pub reserve_mint: Account<'info, Mint>,
    /// CHECK: 平台钱包地址
    pub platform_wallet: AccountInfo<'info>,
    
    /// CHECK: 推广奖励授权PDA
    #[account(seeds = [b"referral"], bump)]
    pub referral_authority: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump
    )]
    pub state: Account<'info, ProtocolState>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserState::SIZE,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub burn_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub platform_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub hourly_prize_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositDaily<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, ProtocolState>,
    
    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    
    /// CHECK: 销毁账户
    #[account(mut)]
    pub burn_account: AccountInfo<'info>,
    
    /// CHECK: 平台账户
    #[account(mut)]
    pub platform_token: AccountInfo<'info>,
    
    /// CHECK: 天池奖库
    #[account(mut)]
    pub daily_prize_vault: AccountInfo<'info>,
    
    /// CHECK: 储备金库
    #[account(mut)]
    pub reserve_vault: AccountInfo<'info>,
    
    /// CHECK: 储备授权PDA
    #[account(seeds = [b"reserve"], bump)]
    pub reserve_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DrawHourly<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, ProtocolState>,
    
    /// CHECK: VRF随机数账户
    pub randomness_account: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DrawDaily<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, ProtocolState>,
    
    /// CHECK: VRF随机数账户
    pub randomness_account: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimVested<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub prize_vault: Account<'info, TokenAccount>,
    
    /// CHECK: 奖池授权PDA
    #[account(seeds = [b"prize"], bump)]
    pub prize_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

// 状态账户
#[account]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub reserve_mint: Pubkey,
    pub platform_wallet: Pubkey,
    
    pub hourly_pool: PrizePool,
    pub daily_pool: PrizePool,
    
    pub reserve_balance: u64,
    pub referral_pool_balance: u64,
    pub total_burned: u64,
    
    pub last_hourly_draw: i64,
    pub last_daily_draw: i64,
    
    pub bump: u8,
}

impl ProtocolState {
    pub const SIZE: usize = 32 * 4 + (8 + 4) * 2 + 8 * 4 + 8 * 2 + 1;
}

#[account]
pub struct UserState {
    pub owner: Pubkey,
    pub referrer: Option<Pubkey>,
    pub hourly_tickets: u64,
    pub daily_tickets: u64,
    pub vesting_schedules: Vec<VestingSchedule>,
}

impl UserState {
    pub const SIZE: usize = 32 + 33 + 8 * 2 + 4 + (8 + 8 + 8) * 10; // 预留10个vesting
}

// 事件
#[event]
pub struct InitializeEvent {
    pub authority: Pubkey,
    pub initial_reserve: u64,
    pub initial_referral_pool: u64,
}

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub pool_type: PoolType,
    pub amount: u64,
    pub tickets: u64,
    pub burn_amount: u64,
}

#[event]
pub struct DepositDailyEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub tickets: u64,
    pub burn_amount: u64,
    pub reserve_match: u64,
    pub referral_reward: u64,
}

#[event]
pub struct ReferralRewardEvent {
    pub referrer: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct DrawEvent {
    pub pool_type: PoolType,
    pub total_amount: u64,
    pub rollover: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimEvent {
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct PrizeAwardedEvent {
    pub prize_type: u8,        // 0=头奖, 1=二等奖, 2=三等奖, 3=幸运奖
    pub total_amount: u64,
    pub per_winner: u64,
    pub winner_count: u8,
    pub winning_numbers: Vec<u64>,
}

#[event]
pub struct UniversalPrizeEvent {
    pub total_pool: u64,
    pub eligible_tickets: u64,
    pub per_ticket: u64,
}

// 错误码
#[error_code]
pub enum ErrorCode {
    #[msg("Deposit amount below minimum")]
    BelowMinDeposit,
    #[msg("Pool is locked (draw in progress)")]
    PoolLocked,
    #[msg("Draw too early")]
    DrawTooEarly,
    #[msg("Not enough participants")]
    NotEnoughParticipants,
    #[msg("No claimable amount")]
    NoClaimableAmount,
    #[msg("Invalid randomness")]
    InvalidRandomness,
    #[msg("Unauthorized")]
    Unauthorized,
}

// 辅助函数
fn calculate_time_to_daily_draw(last_draw: i64, current_time: i64) -> i64 {
    let next_draw = last_draw + 86400; // 24小时后
    next_draw - current_time
}
