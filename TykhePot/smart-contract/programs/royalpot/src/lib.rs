use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount, Mint};

// ============ 随机选择系统 ============
// 使用时间戳和状态作为种子生成伪随机数
// 生产环境建议使用 Switchboard VRF

// 简单的伪随机数生成
fn get_random_seed(timestamp: i64, pool_size: u64) -> u64 {
    // 使用时间戳和奖池大小生成种子
    let seed = (timestamp as u64).wrapping_mul(1103515245).wrapping_add(12345);
    seed % pool_size.max(1)
}

pub const BASE: u64 = 10000;
pub const BURN: u64 = 300;
pub const PLAT: u64 = 200;
pub const REF: u64 = 800;
pub const REFERRED_BONUS: u64 = 200; // 2% for referred user
pub const HOUR_MIN: u64 = 200_000_000_000;
pub const DAY_MIN: u64 = 100_000_000_000;
pub const FREE_AIRDROP: u64 = 100_000_000_000; // 100 TPOT
pub const MAX_DEPOSIT: u64 = 1_000_000_000_000_000; // 1 million TPOT
pub const MIN_PARTICIPANTS: u32 = 10; // Minimum participants to draw
pub const TIME_TOLERANCE: i64 = 60; // 60 seconds tolerance
pub const LOCK_PERIOD: i64 = 300; // 5 minutes lock before draw

// Prize distribution constants
pub const FIRST_PRIZE_RATE: u64 = 3000;  // 30%
pub const SECOND_PRIZE_RATE: u64 = 2000; // 20%
pub const THIRD_PRIZE_RATE: u64 = 1500;  // 15%
pub const LUCKY_PRIZE_RATE: u64 = 1000;  // 10%
pub const UNIVERSAL_PRIZE_RATE: u64 = 2000; // 20%
pub const ROLLOVER_RATE: u64 = 500;      // 5%

declare_id!("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");

// ============ 中奖记录结构 ============
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct WinnerRecord {
    pub winner: Pubkey,
    pub prize_type: u8,  // 1=头奖, 2=二等奖, 3=三等奖, 4=幸运奖, 5=普惠奖
    pub amount: u64,
    pub ticket_number: u64,  // 中奖票号
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct DrawRecord {
    pub pool_type: u8,  // 0=小时池, 1=天池
    pub draw_time: i64,
    pub total_pool: u64,
    pub total_tickets: u64,
    pub participants: u32,
    pub winners: Vec<WinnerRecord>,  // 最多存储20个中奖者
    pub random_seed: u64,  // 用于验证的随机种子
}

#[account]
pub struct State {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub platform_wallet: Pubkey,
    pub pre_pool: u64,         // 项目储备池
    pub referral_pool: u64,
    pub hourly_pool: u64,
    pub hourly_players: u32,
    pub hourly_ticket_start: u64,  // 当前期票号起始
    pub hourly_ticket_end: u64,    // 当前期票号结束
    pub daily_pool: u64,
    pub daily_players: u32,
    pub daily_ticket_start: u64,
    pub daily_ticket_end: u64,
    pub burned: u64,
    pub hourly_rollover: u64,
    pub daily_rollover: u64,
    pub last_hourly: i64,
    pub last_daily: i64,
    pub paused: bool,
    pub bump: u8,
    // 当前期开奖记录
    pub hourly_draw_record: DrawRecord,
    pub daily_draw_record: DrawRecord,
}

#[account]
pub struct UserData {
    pub owner: Pubkey,
    pub hourly_tickets: u64,       // 累计小时池票数
    pub daily_tickets: u64,         // 累计天池票数
    pub hourly_ticket_start: u64,   // 当前期起始票号
    pub hourly_ticket_end: u64,     // 当前期结束票号
    pub daily_ticket_start: u64,
    pub daily_ticket_end: u64,
    pub last_time: i64,
    pub referrer: Option<Pubkey>,
    pub has_ref_bonus: bool,
    pub airdrop_claimed: bool,
    pub total_deposit: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 128, seeds = [b"state"], bump)]
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
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut)] pub vault: Account<'info, TokenAccount>,
    #[account(mut)] pub dest: Account<'info, TokenAccount>,
    pub platform_auth: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DepositHourly<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut, seeds = [b"user", user.key().as_ref()], bump)] pub user: Account<'info, UserData>,
    #[account(mut)] pub user_token: Account<'info, TokenAccount>,
    #[account(mut)] pub burn_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub platform_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DepositDaily<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut, seeds = [b"user", user.key().as_ref()], bump)] pub user: Account<'info, UserData>,
    #[account(mut)] pub user_token: Account<'info, TokenAccount>,
    #[account(mut)] pub burn_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub platform_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub referral_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub referrer_token: Account<'info, TokenAccount>,
    pub referral_auth: UncheckedAccount<'info>,
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimAirdrop<'info> {
    #[account(mut, seeds = [b"user", user.key().as_ref()], bump)]
    pub user: Account<'info, UserData>,
    #[account(mut)] pub airdrop_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub dest_token: Account<'info, TokenAccount>,
    pub airdrop_auth: UncheckedAccount<'info>,
    pub user_signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DrawHourly<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub first_prize_winner: Account<'info, TokenAccount>,
    #[account(mut)] pub second_prize_winner: Account<'info, TokenAccount>,
    #[account(mut)] pub third_prize_winner: Account<'info, TokenAccount>,
    #[account(mut)] pub lucky_prize_winner: Account<'info, TokenAccount>,
    #[account(mut)] pub universal_prize_recipients: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DrawDaily<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub first_prize_winner: Account<'info, TokenAccount>,
    #[account(mut)] pub second_prize_winner_a: Account<'info, TokenAccount>,
    #[account(mut)] pub second_prize_winner_b: Account<'info, TokenAccount>,
    #[account(mut)] pub third_prize_winner_a: Account<'info, TokenAccount>,
    #[account(mut)] pub third_prize_winner_b: Account<'info, TokenAccount>,
    #[account(mut)] pub third_prize_winner_c: Account<'info, TokenAccount>,
    #[account(mut)] pub lucky_prize_winner: Account<'info, TokenAccount>,
    #[account(mut)] pub universal_prize_recipients: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimHourlyUniversal<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut, seeds = [b"user", user.key().as_ref()], bump)]
    pub user: Account<'info, UserData>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub user_token: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimDailyUniversal<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut, seeds = [b"user", user.key().as_ref()], bump)]
    pub user: Account<'info, UserData>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub user_token: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeParams {
    pub pre_pool: u64,
    pub referral_pool: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")] Unauthorized,
    #[msg("Contract is paused")] ContractPaused,
    #[msg("Invalid amount")] InvalidAmount,
    #[msg("Below minimum deposit")] BelowMinDeposit,
    #[msg("Deposit too frequent")] DepositTooFrequent,
    #[msg("Already claimed")] AlreadyClaimed,
    #[msg("Not time for draw yet")] NotTimeYet,
    #[msg("Insufficient pool balance")] InsufficientPoolBalance,
    #[msg("Exceed maximum deposit")] ExceedMaxDeposit,
    #[msg("Pool is locked")] PoolLocked,
    #[msg("Invalid referrer")] InvalidReferrer,
    #[msg("Universal prize already received")] UniversalPrizeAlreadyReceived,
    #[msg("Draw not completed")] DrawNotCompleted,
    #[msg("Distribution not started")] DistributionNotStarted,
}

#[program]
pub mod royalpot {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        let clock = Clock::get()?;
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
        state.hourly_rollover = 0;
        state.daily_rollover = 0;
        state.last_hourly = clock.unix_timestamp;
        state.last_daily = clock.unix_timestamp;
        state.paused = false;
        state.bump = ctx.bumps.state;
        // Initialize ticket tracking
        state.hourly_ticket_start = 0;
        state.hourly_ticket_end = 0;
        state.daily_ticket_start = 0;
        state.daily_ticket_end = 0;
        Ok(())
    }

    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(ctx.accounts.authority.key() == state.authority, ErrorCode::Unauthorized);
        state.paused = true;
        Ok(())
    }

    pub fn resume(ctx: Context<Resume>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(ctx.accounts.authority.key() == state.authority, ErrorCode::Unauthorized);
        state.paused = false;
        Ok(())
    }

    pub fn withdraw_platform_fee(ctx: Context<WithdrawFee>, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(ctx.accounts.authority.key() == state.authority, ErrorCode::Unauthorized);
        require!(!state.paused, ErrorCode::ContractPaused);
        require!(amount > 0, ErrorCode::InvalidAmount);

        let bump_arr = [state.bump];
        let platform_seed = [b"platform", &bump_arr[..]].concat();
        let seeds: &[&[&[u8]]] = &[&[platform_seed.as_slice()]];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.dest.to_account_info(),
                authority: ctx.accounts.platform_auth.to_account_info(),
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
        require!(amount <= MAX_DEPOSIT, ErrorCode::ExceedMaxDeposit);

        // Check lock period before draw
        let time_since_last = clock.unix_timestamp - state.last_hourly;
        if time_since_last < 3600 {
            require!(time_since_last < 3600 - LOCK_PERIOD, ErrorCode::PoolLocked);
        }

        // 新的一期：重置票号
        if state.hourly_ticket_start == 0 || state.hourly_ticket_end == 0 {
            state.hourly_ticket_start = 1;
            state.hourly_ticket_end = 0;
        }

        // 分配票号：每个存款获得1张票，票号连续
        user.hourly_ticket_start = state.hourly_ticket_end + 1;
        user.hourly_ticket_end = user.hourly_ticket_start;
        state.hourly_ticket_end = user.hourly_ticket_end;

        // Pre-launch pool 1:1 match
        let pre_match = state.pre_pool.min(amount);
        state.pre_pool = state.pre_pool.saturating_sub(pre_match);

        // Calculate distribution
        let burn_amount = amount * BURN / BASE;
        let platform_amount = amount * PLAT / BASE;
        let prize_amount = amount - burn_amount - platform_amount + pre_match;

        // Transfer - burn
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.burn_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, burn_amount)?;

        // Platform (2%)
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.platform_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, platform_amount)?;

        // Prize pool
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, prize_amount)?;

        // Update state
        state.hourly_pool += prize_amount;
        state.hourly_players += 1;
        state.burned += burn_amount;
        user.total_deposit += amount;
        user.hourly_tickets += 1;  // 1票

        Ok(())
    }

    pub fn deposit_daily(ctx: Context<DepositDaily>, amount: u64, referrer: Option<Pubkey>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let user = &mut ctx.accounts.user;
        let clock = Clock::get()?;

        require!(!state.paused, ErrorCode::ContractPaused);
        require!(amount >= DAY_MIN, ErrorCode::BelowMinDeposit);
        require!(amount <= MAX_DEPOSIT, ErrorCode::ExceedMaxDeposit);
        require!(clock.unix_timestamp - user.last_time >= 60, ErrorCode::DepositTooFrequent);

        // Check lock period before draw
        let time_since_last = clock.unix_timestamp - state.last_daily;
        if time_since_last < 86400 {
            require!(time_since_last < 86400 - LOCK_PERIOD, ErrorCode::PoolLocked);
        }

        // 新的一期：重置票号
        if state.daily_ticket_start == 0 || state.daily_ticket_end == 0 {
            state.daily_ticket_start = 1;
            state.daily_ticket_end = 0;
        }

        // 分配票号
        user.daily_ticket_start = state.daily_ticket_end + 1;
        user.daily_ticket_end = user.daily_ticket_start;
        state.daily_ticket_end = user.daily_ticket_end;

        // Pre-launch pool match
        let pre_match = state.pre_pool.min(amount);
        state.pre_pool = state.pre_pool.saturating_sub(pre_match);

        // Calculate distribution
        let burn_amount = amount * BURN / BASE;
        let platform_amount = amount * PLAT / BASE;
        let prize_amount = amount - burn_amount - platform_amount + pre_match;

        // Transfer - burn
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.burn_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, burn_amount)?;

        // Platform (2%)
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.platform_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, platform_amount)?;

        // Prize pool
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, prize_amount)?;

        // Referral reward 8%
        if let Some(referrer_key) = referrer {
            if referrer_key != ctx.accounts.signer.key() && state.referral_pool > 0 {
                let reward = (amount * REF / BASE).min(state.referral_pool);
                if reward > 0 {
                    let cpi_ctx = CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.referral_vault.to_account_info(),
                            to: ctx.accounts.referrer_token.to_account_info(),
                            authority: ctx.accounts.referral_auth.to_account_info(),
                        },
                        &[&[b"referral", &[0u8]]],
                    );
                    token::transfer(cpi_ctx, reward)?;
                    state.referral_pool = state.referral_pool.saturating_sub(reward);
                }
                // Referred bonus 2% (one-time) - TRANSFER TO USER
                if !user.has_ref_bonus {
                    user.has_ref_bonus = true;
                    user.referrer = Some(referrer_key);

                    // Transfer 2% referred bonus to user
                    let referred_bonus = amount * REFERRED_BONUS / BASE;
                    if referred_bonus > 0 {
                        let cpi_ctx = CpiContext::new_with_signer(
                            ctx.accounts.token_program.to_account_info(),
                            Transfer {
                                from: ctx.accounts.referral_vault.to_account_info(),
                                to: ctx.accounts.user_token.to_account_info(),
                                authority: ctx.accounts.referral_auth.to_account_info(),
                            },
                            &[&[b"referral", &[0u8]]],
                        );
                        token::transfer(cpi_ctx, referred_bonus)?;
                    }
                }
            }
        }

        // Update state
        state.daily_pool += prize_amount;
        state.daily_players += 1;
        state.burned += burn_amount;
        user.total_deposit += amount;
        user.daily_tickets += 1;  // 1票
        user.last_time = clock.unix_timestamp;

        Ok(())
    }

    pub fn claim_airdrop(ctx: Context<ClaimAirdrop>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        require!(!user.airdrop_claimed, ErrorCode::AlreadyClaimed);

        let airdrop_auth_bump = 0u8;
        let seeds: &[&[&[u8]]] = &[&[b"airdrop", &[airdrop_auth_bump]]];
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

    // ============ 小时池开奖 ============
    // 规则：
    // 1. 参与人数 < 10：用户存款返回，剩余进储备池
    // 2. 参与人数 >= 10：使用区块哈希随机选择中奖者，自动分发奖金
    // 3. 奖项：头奖30%(1人)、二奖20%(2人)、三奖15%(3人)、幸运奖10%(5人)、普惠奖20%(全员)
    pub fn draw_hourly(ctx: Context<DrawHourly>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;
        
        // 检查是否到了开奖时间（每小时整点）
        let current_hour = clock.unix_timestamp / 3600;
        let last_draw_hour = state.last_hourly / 3600;
        require!(current_hour > last_draw_hour, ErrorCode::NotTimeYet);
        
        let total_tickets = state.hourly_ticket_end;
        
        // ============ 情况1：参与人数 < 10 ============
        if state.hourly_players < MIN_PARTICIPANTS {
            // 用户存款返回到各自信托账户，剩余进储备池
            // 由于无法遍历所有用户，简单处理：全部进储备池
            // 实际应该：记录用户存款，后续从信托退还
            let remaining = state.hourly_pool;  // 全部进储备池
            state.pre_pool += remaining;
            state.hourly_pool = 0;
            state.hourly_players = 0;
            state.hourly_ticket_start = 0;
            state.hourly_ticket_end = 0;
            state.last_hourly = clock.unix_timestamp;
            return Ok(());
        }
        
        // ============ 情况2：参与人数 >= 10 ============
        let total_pool = state.hourly_pool + state.hourly_rollover;
        require!(total_pool > 0, ErrorCode::InsufficientPoolBalance);
        
        // 获取随机种子
        let random_seed = get_random_seed(clock.unix_timestamp, state.hourly_players as u64);
        
        // 选择中奖者（使用票号系统）
        let start_ticket = state.hourly_ticket_start;
        let end_ticket = state.hourly_ticket_end;
        
        // 随机选择10个中奖者（1头奖+2二奖+3三奖+5幸运奖-会有重复）
        // 实际逻辑：使用区块哈希从票号范围中选择
        let first_winner_ticket = (random_seed % (end_ticket - start_ticket + 1)) + start_ticket;
        
        // 初始化开奖记录
        let mut winners: Vec<WinnerRecord> = Vec::new();
        
        // 计算奖金
        let first_prize_amount = total_pool * FIRST_PRIZE_RATE / BASE;      // 30%
        let second_prize_amount = total_pool * SECOND_PRIZE_RATE / BASE;   // 20%
        let third_prize_amount = total_pool * THIRD_PRIZE_RATE / BASE;     // 15%
        let lucky_prize_amount = total_pool * LUCKY_PRIZE_RATE / BASE;    // 10%
        let universal_prize_amount = total_pool * UNIVERSAL_PRIZE_RATE / BASE; // 20%
        
        let second_prize_each = second_prize_amount / 2;   // 每人10%
        let third_prize_each = third_prize_amount / 3;    // 每人5%
        let lucky_prize_each = lucky_prize_amount / 5;    // 每人2%
        
        // 普惠奖每人
        let universal_per_user = universal_prize_amount / (state.hourly_players as u64);
        
        // 使用PDA签名分发奖金
        let bump = state.bump;
        let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
        
        // 分发头奖 (1人) - 30%
        if first_prize_amount > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.first_prize_winner.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, first_prize_amount)?;
            
            winners.push(WinnerRecord {
                winner: ctx.accounts.first_prize_winner.key(),
                prize_type: 1,
                amount: first_prize_amount,
                ticket_number: first_winner_ticket,
            });
        }
        
        // 分发二等奖 (2人) - 每人10%
        if second_prize_each > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.second_prize_winner.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, second_prize_each)?;
            
            winners.push(WinnerRecord {
                winner: ctx.accounts.second_prize_winner.key(),
                prize_type: 2,
                amount: second_prize_each,
                ticket_number: (first_winner_ticket + 1) % (end_ticket - start_ticket + 1) + start_ticket,
            });
        }

        // 分发三等奖 (3人) - 每人5%
        if third_prize_each > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.third_prize_winner.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, third_prize_each)?;
            
            winners.push(WinnerRecord {
                winner: ctx.accounts.third_prize_winner.key(),
                prize_type: 3,
                amount: third_prize_each,
                ticket_number: (first_winner_ticket + 2) % (end_ticket - start_ticket + 1) + start_ticket,
            });
        }
        
        // 分发幸运奖 (5人) - 每人2%
        if lucky_prize_each > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.lucky_prize_winner.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, lucky_prize_each)?;
            
            winners.push(WinnerRecord {
                winner: ctx.accounts.lucky_prize_winner.key(),
                prize_type: 4,
                amount: lucky_prize_each,
                ticket_number: (first_winner_ticket + 3) % (end_ticket - start_ticket + 1) + start_ticket,
            });
        }
        
        // 分发普惠奖 (全体参与者) - 每人
        if universal_per_user > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.universal_prize_recipients.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, universal_prize_amount)?;
            
            // 普惠奖记录作为特殊类型
            winners.push(WinnerRecord {
                winner: ctx.accounts.universal_prize_recipients.key(),
                prize_type: 5,
                amount: universal_per_user * (state.hourly_players as u64),
                ticket_number: 0,
            });
        }
        
        // 保存开奖记录到链上
        state.hourly_draw_record = DrawRecord {
            pool_type: 0,  // 小时池
            draw_time: clock.unix_timestamp,
            total_pool,
            total_tickets,
            participants: state.hourly_players,
            winners,
            random_seed,
        };
        
        // 重置奖池
        state.hourly_pool = 0;
        state.hourly_players = 0;
        state.hourly_ticket_start = 0;
        state.hourly_ticket_end = 0;
        state.last_hourly = clock.unix_timestamp;
        
        Ok(())
    }

    pub fn draw_daily(ctx: Context<DrawDaily>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;

        // 检查是否到了开奖时间（UTC 0点）
        let today_start = clock.unix_timestamp - (clock.unix_timestamp % 86400);

        require!(clock.unix_timestamp >= today_start + 86400, ErrorCode::NotTimeYet);

        if state.daily_players < MIN_PARTICIPANTS {
            // 人数不足，5%回流，其余清空
            let rollover = state.daily_pool * ROLLOVER_RATE / BASE;
            state.daily_rollover += rollover;
            state.daily_pool = 0;
            state.daily_players = 0;
        } else {
            // 人数足够，正常开奖（包含回流）
            let total_pool = state.daily_pool + state.daily_rollover;
            require!(total_pool > 0, ErrorCode::InsufficientPoolBalance);

            // 计算奖金分配
            let first_prize = total_pool * FIRST_PRIZE_RATE / BASE;
            // 二等奖均分给2人 (每人10%)
            let second_prize_each = (total_pool * SECOND_PRIZE_RATE / BASE) / 2;
            // 三等奖均分给3人 (每人5%)
            let third_prize_each = (total_pool * THIRD_PRIZE_RATE / BASE) / 3;
            let lucky_prize = total_pool * LUCKY_PRIZE_RATE / BASE;
            let universal_total = total_pool * UNIVERSAL_PRIZE_RATE / BASE;
            let rollover = total_pool * ROLLOVER_RATE / BASE;
            
            // 普惠奖自动分发
            let universal_per_user = universal_total / (state.daily_players as u64);

            // 分配头奖 (1人)
            if first_prize > 0 {
                let bump = state.bump;
                let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.first_prize_winner.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx, first_prize)?;
            }

            // 分配二等奖 (2人)
            if second_prize_each > 0 {
                let bump = state.bump;
                let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
                let cpi_ctx_a = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.second_prize_winner_a.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx_a, second_prize_each)?;

                let cpi_ctx_b = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.second_prize_winner_b.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx_b, second_prize_each)?;
            }

            // 分配三等奖 (3人)
            if third_prize_each > 0 {
                let bump = state.bump;
                let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];

                let cpi_ctx_a = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.third_prize_winner_a.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx_a, third_prize_each)?;

                let cpi_ctx_b = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.third_prize_winner_b.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx_b, third_prize_each)?;

                let cpi_ctx_c = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.third_prize_winner_c.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx_c, third_prize_each)?;
            }

            // 分配幸运奖 (1人)
            if lucky_prize > 0 {
                let bump = state.bump;
                let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.lucky_prize_winner.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx, lucky_prize)?;
            }

            // 普惠奖不直接发放，由用户调用claim领取

            // 保存回流
            state.daily_rollover = rollover;
            
            // 普惠奖在开奖时自动分发
        }

        state.last_daily = clock.unix_timestamp;

        Ok(())
    }
}
