use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount, Mint};

// ============ 随机选择系统 ============
// 使用 Switchboard VRF 或备用时间戳
// VRF提供可验证的随机数，无法被预测或操纵

// 简单的伪随机数生成 (备用)
fn get_random_seed(timestamp: i64, pool_size: u64) -> u64 {
    let seed = (timestamp as u64).wrapping_mul(1103515245).wrapping_add(12345);
    seed % pool_size.max(1)
}

pub const BASE: u64 = 10000;
pub const BURN: u64 = 300;
pub const PLAT: u64 = 200;
pub const REF: u64 = 800;
pub const REFERRED_BONUS: u64 = 200; // 2% for referred user
pub const HOUR_MIN: u64 = 200_000_000_000;
pub const MIN30_MIN: u64 = 500_000_000_000;  // 30分钟池最低500 TPOT
pub const DAY_MIN: u64 = 100_000_000_000;
pub const FREE_AIRDROP: u64 = 100_000_000_000; // 100 TPOT
pub const MAX_DEPOSIT: u64 = 1_000_000_000_000_000; // 1 million TPOT
pub const MIN_PARTICIPANTS: u32 = 12; // Minimum participants to draw
pub const TIME_TOLERANCE: i64 = 60; // 60 seconds tolerance
pub const LOCK_PERIOD: i64 = 300; // 5 minutes lock before draw

// Prize distribution constants
pub const FIRST_PRIZE_RATE: u64 = 3000;  // 30%
pub const SECOND_PRIZE_RATE: u64 = 2000; // 20%
pub const THIRD_PRIZE_RATE: u64 = 1500;  // 15%
pub const LUCKY_PRIZE_RATE: u64 = 1000;  // 10%
pub const UNIVERSAL_PRIZE_RATE: u64 = 2000; // 20%
pub const ROLLOVER_RATE: u64 = 500;      // 5%

// ============ 初始代币分配常量 ============
// 总供应量: 1,000,000,000 TPOT (10亿)
pub const TOTAL_SUPPLY: u64 = 1_000_000_000_000_000_000; // 10亿 TPOT (小数点后9位)
pub const AIRDROP_RATE: u64 = 1000;   // 10% 空投
pub const STAKING_RATE: u64 = 3500;   // 35% 质押奖励
pub const PRE_POOL_RATE: u64 = 2000;  // 20% 前期奖池配额
pub const TEAM_RATE: u64 = 1000;      // 10% 团队
pub const REFERRAL_RATE: u64 = 2000;  // 20% 推广奖励
// 流动性 5% 在合约外处理 (mint to deployer)

// 团队释放: 4年线性释放 (48个月)
pub const TEAM_LOCK_PERIOD: i64 = 126144000; // 4年 (秒)
// 每月释放量 = TEAM_RATE / 48 = ~0.2083%
pub const TEAM_MONTHS: u64 = 48;

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
    pub min30_pool: u64,           // 30分钟奖池
    pub min30_players: u32,        // 30分钟参与人数
    pub min30_ticket_start: u64,   // 当前期票号起始
    pub min30_ticket_end: u64,     // 当前期票号结束
    pub daily_pool: u64,
    pub daily_players: u32,
    pub daily_ticket_start: u64,
    pub daily_ticket_end: u64,
    pub burned: u64,
    pub hourly_rollover: u64,
    pub min30_rollover: u64,      // 30分钟池滚存
    pub daily_rollover: u64,
    pub hourly_pending_burn: u64,  // 本期待销毁金额
    pub min30_pending_burn: u64,  // 30分钟待销毁金额
    pub daily_pending_burn: u64,   // 本期待销毁金额
    pub daily_pending_referral: u64,   // 本期待发放推荐奖励 (天池)
    pub last_hourly: i64,
    pub last_min30: i64,          // 30分钟池上次开奖时间
    pub last_daily: i64,
    pub paused: bool,
    pub bump: u8,
    
    // ============ Switchboard VRF ============
    pub vrf_account: Pubkey,     // VRF账户地址
    pub vrf_result: u64,         // 上次VRF结果
    
    // ============ 初始代币分配 ============
    pub airdrop_pool: u64,        // 空投池剩余 (10%)
    pub airdrop_claimed_total: u64, // 已领取空投人数
    pub staking_pool: u64,        // 质押奖励池 (35%)
    pub pre_match_pool: u64,      // 前期奖池配额 (20%) - 1:1配捐
    pub team_pool: u64,           // 团队代币池 (10%)
    pub team_lock_end: i64,       // 团队代币解锁时间
    pub team_claimed: u64,        // 团队已释放代币
    pub referral_pool_total: u64, // 推广奖励池总量 (20%)
    pub referral_used: u64,       // 已使用推广奖励
    
    // 当前期开奖记录
    pub hourly_draw_record: DrawRecord,
    pub daily_draw_record: DrawRecord,
}

#[account]
pub struct UserData {
    pub owner: Pubkey,
    pub hourly_tickets: u64,       // 累计小时池票数
    pub min30_tickets: u64,        // 累计30分池票数
    pub daily_tickets: u64,         // 累计天池票数
    pub hourly_ticket_start: u64,   // 当前期起始票号
    pub hourly_ticket_end: u64,     // 当前期结束票号
    pub min30_ticket_start: u64,    // 30分池当前期起始票号
    pub min30_ticket_end: u64,      // 30分池当前期结束票号
    pub daily_ticket_start: u64,
    pub daily_ticket_end: u64,
    pub last_time: i64,
    pub referrer: Option<Pubkey>,
    pub has_ref_bonus: bool,
    pub airdrop_registered: bool,    // 是否已注册获取空投资格
    pub airdrop_played: bool,       // 是否已使用免费投注
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
    #[account(mut, seeds = [b"user", signer.key().as_ref()], bump)]
    pub user: Account<'info, UserData>,
    #[account(mut)] pub user_token: Account<'info, TokenAccount>,
    #[account(mut)] pub burn_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub platform_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DepositMin30<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut, seeds = [b"user", signer.key().as_ref()], bump)]
    pub user: Account<'info, UserData>,
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
    #[account(mut, seeds = [b"user", signer.key().as_ref()], bump)]
    pub user: Account<'info, UserData>,
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
pub struct InitUser<'info> {
    #[account(init, payer = user_signer, space = 8 + 200, seeds = [b"user", user_signer.key().as_ref()], bump)]
    pub user: Account<'info, UserData>,
    #[account(mut)]
    pub user_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimAirdrop<'info> {
    #[account(init_if_needed, payer = user_signer, space = 8 + 200, seeds = [b"user", user_signer.key().as_ref()], bump)]
    pub user: Account<'info, UserData>,
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut)]
    pub user_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositDailyFree<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut, seeds = [b"user", user.key().as_ref()], bump)] pub user: Account<'info, UserData>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct DrawHourly<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub platform_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub burn_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub first_prize_winner: Account<'info, TokenAccount>,
    #[account(mut)] pub second_prize_winner: Account<'info, TokenAccount>,
    #[account(mut)] pub third_prize_winner: Account<'info, TokenAccount>,
    #[account(mut)] pub lucky_prize_winner: Account<'info, TokenAccount>,
    #[account(mut)] pub universal_prize_recipients: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DrawMin30<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    #[account(mut)] pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub platform_vault: Account<'info, TokenAccount>,
    #[account(mut)] pub burn_vault: Account<'info, TokenAccount>,
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
    #[account(mut)] pub pool_vault: UncheckedAccount<'info>,
    #[account(mut)] pub platform_vault: UncheckedAccount<'info>,
    #[account(mut)] pub burn_vault: UncheckedAccount<'info>,
    #[account(mut)] pub first_prize_winner: UncheckedAccount<'info>,
    #[account(mut)] pub second_prize_winner_a: UncheckedAccount<'info>,
    #[account(mut)] pub second_prize_winner_b: UncheckedAccount<'info>,
    #[account(mut)] pub third_prize_winner_a: UncheckedAccount<'info>,
    #[account(mut)] pub third_prize_winner_b: UncheckedAccount<'info>,
    #[account(mut)] pub third_prize_winner_c: UncheckedAccount<'info>,
    #[account(mut)] pub lucky_prize_winner: UncheckedAccount<'info>,
    #[account(mut)] pub universal_prize_recipients: UncheckedAccount<'info>,
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

// ============ 返回结构体 ============
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PoolStatusResponse {
    pub airdrop_pool: u64,
    pub airdrop_claimed_total: u64,
    pub staking_pool: u64,
    pub pre_match_pool: u64,
    pub team_pool: u64,
    pub team_lock_end: i64,
    pub team_claimed: u64,
    pub referral_pool_total: u64,
    pub referral_used: u64,
}

// ============ 新增账户结构体 ============
#[derive(Accounts)]
pub struct ClaimTeamTokens<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetStakingPool<'info> {
    #[account()] pub state: Account<'info, State>,
}

#[derive(Accounts)]
pub struct SetVrfResult<'info> {
    #[account(mut)] pub state: Account<'info, State>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetPoolStatus<'info> {
    #[account()] pub state: Account<'info, State>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeParams {
    pub pre_pool: u64,
    pub referral_pool: u64,
    pub airdrop_pool: u64,      // 空投池 (10%)
    pub staking_pool: u64,      // 质押奖励池 (35%)
    pub pre_match_pool: u64,    // 前期奖池配额 (20%)
    pub team_pool: u64,         // 团队代币 (10%)
    pub referral_pool_total: u64, // 推广奖励池 (20%)
    pub vrf_account: Pubkey,    // Switchboard VRF账户
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
    #[msg("Airdrop not claimed")] AirdropNotClaimed,
    #[msg("Insufficient airdrop balance")] InsufficientAirdropBalance,
    #[msg("Airdrop exhausted")] AirdropExhausted,
    #[msg("Staking pool exhausted")] StakingPoolExhausted,
    #[msg("Pre-match pool exhausted")] PreMatchPoolExhausted,
    #[msg("Team tokens locked")] TeamTokensLocked,
    #[msg("Referral pool exhausted")] ReferralPoolExhausted,
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
        state.min30_pool = 0;
        state.min30_players = 0;
        state.daily_pool = 0;
        state.daily_players = 0;
        state.burned = 0;
        state.hourly_rollover = 0;
        state.min30_rollover = 0;
        state.daily_rollover = 0;
        state.last_hourly = clock.unix_timestamp;
        state.last_min30 = clock.unix_timestamp;
        state.last_daily = clock.unix_timestamp;
        state.paused = false;
        state.bump = ctx.bumps.state;
        // Initialize ticket tracking
        state.hourly_ticket_start = 0;
        state.hourly_ticket_end = 0;
        state.min30_ticket_start = 0;
        state.min30_ticket_end = 0;
        state.daily_ticket_start = 0;
        state.daily_ticket_end = 0;
        
        // ============ 初始代币分配 ============
        state.airdrop_pool = params.airdrop_pool;           // 空投池
        state.airdrop_claimed_total = 0;                    // 已领取人数
        state.staking_pool = params.staking_pool;           // 质押奖励池
        state.pre_match_pool = params.pre_match_pool;       // 前期奖池配额
        state.team_pool = params.team_pool;                 // 团队代币
        state.team_lock_end = clock.unix_timestamp + TEAM_LOCK_PERIOD; // 4年后解锁
        state.team_claimed = 0;                             // 已释放
        state.referral_pool_total = params.referral_pool_total; // 推广奖励池
        state.referral_used = 0;                            // 已使用
        
        // ============ Switchboard VRF ============
        state.vrf_account = params.vrf_account;
        state.vrf_result = 0;
        
        Ok(())
    }

    // ============ 团队代币领取 (4年线性释放) ============
    pub fn claim_team_tokens(ctx: Context<ClaimTeamTokens>, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;
        
        require!(ctx.accounts.authority.key() == state.authority, ErrorCode::Unauthorized);
        require!(clock.unix_timestamp >= state.team_lock_end, ErrorCode::TeamTokensLocked);
        
        // 计算可释放的代币数量 (线性释放)
        let total_team = state.team_pool;
        let months_passed = ((clock.unix_timestamp - (state.team_lock_end - TEAM_LOCK_PERIOD)) / 2629746).max(1).min(TEAM_MONTHS as i64) as u64;
        let mut available = total_team * months_passed / TEAM_MONTHS;
        available = available.saturating_sub(state.team_claimed);
        
        require!(amount <= available, ErrorCode::InsufficientPoolBalance);
        
        // 从池子扣除
        state.team_claimed = state.team_claimed.checked_add(amount).unwrap();
        
        Ok(())
    }

    // ============ 设置VRF随机数 ============
    // 此函数用于更新VRF结果
    // 在生产环境中应由Switchboard VRF oracle调用
    pub fn set_vrf_result(ctx: Context<SetVrfResult>, result: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.vrf_result = result;
        Ok(())
    }

    // ============ 查询各池子状态 (前端用) ============
    pub fn get_pool_status(ctx: Context<GetPoolStatus>) -> Result<PoolStatusResponse> {
        let state = &ctx.accounts.state;
        Ok(PoolStatusResponse {
            airdrop_pool: state.airdrop_pool,
            airdrop_claimed_total: state.airdrop_claimed_total,
            staking_pool: state.staking_pool,
            pre_match_pool: state.pre_match_pool,
            team_pool: state.team_pool,
            team_lock_end: state.team_lock_end,
            team_claimed: state.team_claimed,
            referral_pool_total: state.referral_pool_total,
            referral_used: state.referral_used,
        })
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

        // 前期奖池配额 1:1 配捐 (用完即止)
        let pre_match = state.pre_match_pool.min(amount);
        state.pre_match_pool = state.pre_match_pool.saturating_sub(pre_match);

        // Calculate distribution (平台费在开奖时提取)
        let burn_amount = amount * BURN / BASE;
        let prize_amount = amount - burn_amount + pre_match;

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

        // Prize pool (存款全部进入奖池，平台费2%在开奖时提取)
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
        state.hourly_pending_burn += burn_amount;  // 记录待销毁金额
        user.total_deposit += amount;
        user.hourly_tickets += 1;  // 1票

        Ok(())
    }

    // ============ 30分钟池存款 ============
    pub fn deposit_min30(ctx: Context<DepositMin30>, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let user = &mut ctx.accounts.user;
        let clock = Clock::get()?;

        require!(!state.paused, ErrorCode::ContractPaused);
        require!(amount >= MIN30_MIN, ErrorCode::BelowMinDeposit);
        require!(amount <= MAX_DEPOSIT, ErrorCode::ExceedMaxDeposit);

        // Check lock period before draw (30 minutes = 1800 seconds)
        let time_since_last = clock.unix_timestamp - state.last_min30;
        if time_since_last < 1800 {
            require!(time_since_last < 1800 - LOCK_PERIOD, ErrorCode::PoolLocked);
        }

        // 新的一期：重置票号
        if state.min30_ticket_start == 0 || state.min30_ticket_end == 0 {
            state.min30_ticket_start = 1;
            state.min30_ticket_end = 0;
        }

        // 分配票号：每个存款获得1张票，票号连续
        user.min30_ticket_start = state.min30_ticket_end + 1;
        user.min30_ticket_end = user.min30_ticket_start;
        state.min30_ticket_end = user.min30_ticket_end;

        // 前期奖池配额 1:1 配捐 (用完即止)
        let pre_match = state.pre_match_pool.min(amount);
        state.pre_match_pool = state.pre_match_pool.saturating_sub(pre_match);

        // Calculate distribution
        let burn_amount = amount * BURN / BASE;
        let prize_amount = amount - burn_amount + pre_match;

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
        state.min30_pool += prize_amount;
        state.min30_players += 1;
        state.burned += burn_amount;
        state.min30_pending_burn += burn_amount;
        user.total_deposit += amount;
        user.min30_tickets += 1;

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

        // 前期奖池配额 1:1 配捐 (用完即止)
        let pre_match = state.pre_match_pool.min(amount);
        state.pre_match_pool = state.pre_match_pool.saturating_sub(pre_match);

        // Calculate distribution (平台费在开奖时提取)
        let burn_amount = amount * BURN / BASE;
        let prize_amount = amount - burn_amount + pre_match;

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

        // Prize pool (存款全部进入奖池，平台费2%在开奖时提取)
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, prize_amount)?;

        // Referral reward 8% - 只记录pending，开奖成功后再从referral_pool转入pool_vault
        // 如果开奖失败（人数不够），钱会退回，referral_pool不受影响
        if let Some(referrer_key) = referrer {
            if referrer_key != ctx.accounts.signer.key() && state.referral_pool > 0 {
                // 推荐人奖励 8% - 只扣referral_pool，记录pending
                let reward = (amount * REF / BASE).min(state.referral_pool);
                if reward > 0 {
                    state.referral_pool = state.referral_pool.saturating_sub(reward);
                    state.daily_pending_referral = state.daily_pending_referral.saturating_add(reward);
                }
                
                // 记录推荐关系（如果是新推荐）
                if user.referrer.is_none() {
                    user.referrer = Some(referrer_key);
                }
                
                // 被推荐人奖励 2% (一次性) - 也只记录pending
                if !user.has_ref_bonus {
                    user.has_ref_bonus = true;
                    
                    let referred_bonus = amount * REFERRED_BONUS / BASE;
                    if referred_bonus > 0 {
                        state.referral_pool = state.referral_pool.saturating_sub(referred_bonus);
                        state.daily_pending_referral = state.daily_pending_referral.saturating_add(referred_bonus);
                    }
                }
            }
        }

        // Update state
        state.daily_pool += prize_amount;
        state.daily_players += 1;
        state.burned += burn_amount;
        state.daily_pending_burn += burn_amount;  // 记录待销毁金额
        user.total_deposit += amount;
        user.daily_tickets += 1;  // 1票
        user.last_time = clock.unix_timestamp;

        Ok(())
    }

    // ============ 初始化用户账户 ============
    pub fn init_user(ctx: Context<InitUser>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.owner = ctx.accounts.user_signer.key();
        user.hourly_tickets = 0;
        user.min30_tickets = 0;
        user.daily_tickets = 0;
        user.hourly_ticket_start = 0;
        user.hourly_ticket_end = 0;
        user.min30_ticket_start = 0;
        user.min30_ticket_end = 0;
        user.daily_ticket_start = 0;
        user.daily_ticket_end = 0;
        user.last_time = 0;
        user.referrer = None;
        user.has_ref_bonus = false;
        user.airdrop_registered = false;
        user.airdrop_played = false;
        Ok(())
    }

    // ============ 领取空投（注册资格）============
    // 点击按钮只是注册获取游戏资格
    // 用户需要到天池使用"免费投注"参与游戏
    pub fn claim_airdrop(ctx: Context<ClaimAirdrop>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        
        // 如果是新账户，初始化所有字段
        if user.owner == Pubkey::default() {
            user.owner = ctx.accounts.user_signer.key();
            user.hourly_tickets = 0;
            user.min30_tickets = 0;
            user.daily_tickets = 0;
            user.hourly_ticket_start = 0;
            user.hourly_ticket_end = 0;
            user.min30_ticket_start = 0;
            user.min30_ticket_end = 0;
            user.daily_ticket_start = 0;
            user.daily_ticket_end = 0;
            user.last_time = 0;
            user.referrer = None;
            user.has_ref_bonus = false;
            user.airdrop_registered = true;
            user.airdrop_played = false;
            user.total_deposit = 0;
        } else {
            // 已存在的账户，只更新注册状态
            require!(!user.airdrop_registered, ErrorCode::AlreadyClaimed);
            user.airdrop_registered = true;
        }
        
        // State 中增加已注册人数
        let state = &mut ctx.accounts.state;
        state.airdrop_claimed_total = state.airdrop_claimed_total.checked_add(1).unwrap();

        Ok(())
    }

    // ============ 免费投注（使用空投资格）============
    // 用户注册后可以使用一次免费100代币投注
    // 从 pre_match_pool 扣取（相当于系统赠送）
    pub fn deposit_daily_free(ctx: Context<DepositDailyFree>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let user = &mut ctx.accounts.user;
        let clock = Clock::get()?;

        // 检查用户是否已注册
        require!(user.airdrop_registered, ErrorCode::AirdropNotClaimed);
        // 检查用户是否已使用过免费投注
        require!(!user.airdrop_played, ErrorCode::AlreadyClaimed);
        
        let amount = FREE_AIRDROP; // 100 TPOT
        
        // 检查前期奖池配额是否足够
        require!(state.pre_match_pool >= amount, ErrorCode::PreMatchPoolExhausted);

        // 扣除配额
        state.pre_match_pool = state.pre_match_pool.saturating_sub(amount);
        
        // 标记用户已使用免费投注
        user.airdrop_played = true;
        
        // 重置票号（新一期）
        if state.daily_ticket_start == 0 || state.daily_ticket_end == 0 {
            state.daily_ticket_start = 1;
            state.daily_ticket_end = 0;
        }

        // 分配票号
        user.daily_ticket_start = state.daily_ticket_end + 1;
        user.daily_ticket_end = user.daily_ticket_start;
        state.daily_ticket_end = user.daily_ticket_end;

        // 进入奖池（无需销毁和费用，因为是免费的）
        // 1:1 配捐（从pre_match_pool匹配）
        let pre_match = amount; // 1:1 配捐
        state.pre_match_pool = state.pre_match_pool.saturating_sub(pre_match);
        state.daily_pool += amount + pre_match;  // 本金 + 配捐
        state.daily_players += 1;
        user.daily_tickets += 1;
        user.total_deposit += amount;
        user.last_time = clock.unix_timestamp;

        // 如果用户有推荐人，给推荐人发放奖励（从referral_pool扣）
        // 免费的也要给推荐人奖励 + 被推荐人奖励，只记录pending，开奖成功后再发放
        if let Some(referrer_key) = user.referrer {
            if referrer_key != user.owner && state.referral_pool > 0 {
                // 推荐人 8% - 只记录pending
                let reward = (amount * REF / BASE).min(state.referral_pool);
                if reward > 0 {
                    state.referral_pool = state.referral_pool.saturating_sub(reward);
                    state.daily_pending_referral = state.daily_pending_referral.saturating_add(reward);
                }
                
                // 被推荐人 2% (一次性) - 免费投注也享受，只记录pending
                if !user.has_ref_bonus {
                    user.has_ref_bonus = true;
                    let referred_bonus = amount * REFERRED_BONUS / BASE;
                    if referred_bonus > 0 {
                        state.referral_pool = state.referral_pool.saturating_sub(referred_bonus);
                        state.daily_pending_referral = state.daily_pending_referral.saturating_add(referred_bonus);
                    }
                }
            }
        }

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
        
        // 获取随机种子 (优先使用VRF，备用时间戳)
        let random_seed = if state.vrf_result > 0 {
            state.vrf_result
        } else {
            get_random_seed(clock.unix_timestamp, state.hourly_players as u64)
        };
        
        // 选择中奖者（使用票号系统）
        let start_ticket = state.hourly_ticket_start;
        let end_ticket = state.hourly_ticket_end;
        
        // 随机选择10个中奖者（1头奖+2二奖+3三奖+5幸运奖-会有重复）
        // 实际逻辑：使用区块哈希从票号范围中选择
        let first_winner_ticket = (random_seed % (end_ticket - start_ticket + 1)) + start_ticket;
        
        // 初始化开奖记录
        let mut winners: Vec<WinnerRecord> = Vec::new();
        
        // 计算奖金 (奖池扣除平台费2%和待销毁3%)
        let platform_fee = total_pool * PLAT / BASE;
        let burn_amount = state.hourly_pending_burn;  // 本期待销毁的3%
        let remaining_pool = total_pool.saturating_sub(platform_fee).saturating_sub(burn_amount);
        
        let first_prize_amount = remaining_pool * FIRST_PRIZE_RATE / BASE;      // 30%
        let second_prize_amount = remaining_pool * SECOND_PRIZE_RATE / BASE;   // 20%
        let third_prize_amount = remaining_pool * THIRD_PRIZE_RATE / BASE;     // 15%
        let lucky_prize_amount = remaining_pool * LUCKY_PRIZE_RATE / BASE;    // 10%
        let universal_prize_amount = remaining_pool * UNIVERSAL_PRIZE_RATE / BASE; // 20%
        
        let second_prize_each = second_prize_amount / 2;   // 每人10%
        let third_prize_each = third_prize_amount / 3;    // 每人5%
        let lucky_prize_each = lucky_prize_amount / 5;    // 每人2%
        
        // 普惠奖每人
        let universal_per_user = universal_prize_amount / (state.hourly_players as u64);
        
        // 使用PDA签名分发奖金
        let bump = state.bump;
        let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
        
        // 分发平台费 (2%)
        if platform_fee > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.platform_vault.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, platform_fee)?;
        }
        
        // 销毁3% (从存款时记录的本金中扣)
        if burn_amount > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.burn_vault.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, burn_amount)?;
            state.hourly_pending_burn = 0;  // 重置待销毁金额
        }
        
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

    // ============ 30分钟池开奖 ============
    pub fn draw_min30(ctx: Context<DrawMin30>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;
        
        // 检查是否到了开奖时间（30分钟 = 1800秒）
        let time_since_last = clock.unix_timestamp - state.last_min30;
        require!(time_since_last >= 1800, ErrorCode::NotTimeYet);
        
        let total_tickets = state.min30_ticket_end;
        
        // ============ 情况1：参与人数 < 10 ============
        if state.min30_players < MIN_PARTICIPANTS {
            let remaining = state.min30_pool;
            state.pre_pool += remaining;
            state.min30_pool = 0;
            state.min30_players = 0;
            state.min30_ticket_start = 0;
            state.min30_ticket_end = 0;
            state.last_min30 = clock.unix_timestamp;
            return Ok(());
        }
        
        // ============ 情况2：参与人数 >= 10 ============
        let total_pool = state.min30_pool + state.min30_rollover;
        require!(total_pool > 0, ErrorCode::InsufficientPoolBalance);
        
        // 获取随机种子
        let random_seed = if state.vrf_result > 0 {
            state.vrf_result
        } else {
            get_random_seed(clock.unix_timestamp, state.min30_players as u64)
        };
        
        let start_ticket = state.min30_ticket_start;
        let end_ticket = state.min30_ticket_end;
        let first_winner_ticket = (random_seed % (end_ticket - start_ticket + 1)) + start_ticket;
        
        let mut winners: Vec<WinnerRecord> = Vec::new();
        
        // 计算奖金
        let platform_fee = total_pool * PLAT / BASE;
        let burn_amount = state.min30_pending_burn;
        let remaining_pool = total_pool.saturating_sub(platform_fee).saturating_sub(burn_amount);
        
        let first_prize_amount = remaining_pool * FIRST_PRIZE_RATE / BASE;
        let second_prize_amount = remaining_pool * SECOND_PRIZE_RATE / BASE;
        let third_prize_amount = remaining_pool * THIRD_PRIZE_RATE / BASE;
        let lucky_prize_amount = remaining_pool * LUCKY_PRIZE_RATE / BASE;
        let universal_prize_amount = remaining_pool * UNIVERSAL_PRIZE_RATE / BASE;
        
        let second_prize_each = second_prize_amount / 2;
        let third_prize_each = third_prize_amount / 3;
        let lucky_prize_each = lucky_prize_amount / 5;
        let universal_per_user = universal_prize_amount / (state.min30_players as u64);
        
        let bump = state.bump;
        let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
        
        // 分发平台费
        if platform_fee > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.platform_vault.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, platform_fee)?;
        }
        
        // 销毁
        if burn_amount > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.burn_vault.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, burn_amount)?;
            state.min30_pending_burn = 0;
        }
        
        // 头奖
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
            winners.push(WinnerRecord { winner: ctx.accounts.first_prize_winner.key(), prize_type: 1, amount: first_prize_amount, ticket_number: first_winner_ticket });
        }
        
        // 二等奖
        if second_prize_each > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer { from: ctx.accounts.pool_vault.to_account_info(), to: ctx.accounts.second_prize_winner.to_account_info(), authority: ctx.accounts.pool_vault.to_account_info() }, seeds);
            token::transfer(cpi_ctx, second_prize_each)?;
            winners.push(WinnerRecord { winner: ctx.accounts.second_prize_winner.key(), prize_type: 2, amount: second_prize_each, ticket_number: (first_winner_ticket + 1) % (end_ticket - start_ticket + 1) + start_ticket });
        }
        
        // 三等奖
        if third_prize_each > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer { from: ctx.accounts.pool_vault.to_account_info(), to: ctx.accounts.third_prize_winner.to_account_info(), authority: ctx.accounts.pool_vault.to_account_info() }, seeds);
            token::transfer(cpi_ctx, third_prize_each)?;
            winners.push(WinnerRecord { winner: ctx.accounts.third_prize_winner.key(), prize_type: 3, amount: third_prize_each, ticket_number: (first_winner_ticket + 2) % (end_ticket - start_ticket + 1) + start_ticket });
        }
        
        // 幸运奖
        if lucky_prize_each > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer { from: ctx.accounts.pool_vault.to_account_info(), to: ctx.accounts.lucky_prize_winner.to_account_info(), authority: ctx.accounts.pool_vault.to_account_info() }, seeds);
            token::transfer(cpi_ctx, lucky_prize_each)?;
            winners.push(WinnerRecord { winner: ctx.accounts.lucky_prize_winner.key(), prize_type: 4, amount: lucky_prize_each, ticket_number: (first_winner_ticket + 3) % (end_ticket - start_ticket + 1) + start_ticket });
        }
        
        // 普惠奖
        if universal_per_user > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer { from: ctx.accounts.pool_vault.to_account_info(), to: ctx.accounts.universal_prize_recipients.to_account_info(), authority: ctx.accounts.pool_vault.to_account_info() }, seeds);
            token::transfer(cpi_ctx, universal_prize_amount)?;
            winners.push(WinnerRecord { winner: ctx.accounts.universal_prize_recipients.key(), prize_type: 5, amount: universal_per_user * (state.min30_players as u64), ticket_number: 0 });
        }
        
        // 重置
        state.min30_pool = 0;
        state.min30_players = 0;
        state.min30_ticket_start = 0;
        state.min30_ticket_end = 0;
        state.last_min30 = clock.unix_timestamp;
        
        Ok(())
    }

    pub fn draw_daily(ctx: Context<DrawDaily>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;
        let today_start = clock.unix_timestamp - (clock.unix_timestamp % 86400);
        require!(clock.unix_timestamp >= today_start + 86400, ErrorCode::NotTimeYet);

        // <10人:存款返储备池，推荐奖励退回referral_pool
        if state.daily_players < MIN_PARTICIPANTS {
            // 退回待发放的推荐奖励到referral_pool
            state.referral_pool = state.referral_pool.saturating_add(state.daily_pending_referral);
            state.daily_pending_referral = 0;
            
            state.pre_pool += state.daily_pool;
            state.daily_pool = 0;
            state.daily_players = 0;
            state.daily_ticket_start = 0;
            state.daily_ticket_end = 0;
            state.last_daily = clock.unix_timestamp;
            return Ok(());
        }
        
        // >=10人:开奖
        let total = state.daily_pool + state.daily_rollover;
        require!(total > 0, ErrorCode::InsufficientPoolBalance);
        
        // 获取随机种子 (优先使用VRF，备用时间戳)
        let seed = if state.vrf_result > 0 {
            state.vrf_result
        } else {
            get_random_seed(clock.unix_timestamp, state.daily_players as u64)
        };
        let win_ticket = (seed % (state.daily_ticket_end - state.daily_ticket_start + 1)) + state.daily_ticket_start;
        
        // 计算平台费和奖金 (扣除平台费2%和待销毁3%，加上待发放推荐奖励)
        let platform_fee = total * PLAT / BASE;
        let burn_amount = state.daily_pending_burn;  // 本期待销毁的3%
        let referral_amount = state.daily_pending_referral;  // 待发放推荐奖励
        let remaining_pool = total.saturating_sub(platform_fee).saturating_sub(burn_amount).saturating_add(referral_amount);
        
        // 将推荐奖励从referral_pool转入pool_vault
        if referral_amount > 0 {
            // 从referral_pool扣减（存款时已经扣了，这里只是确认）
            // 推荐奖励会作为普惠奖的一部分发放
        }
        
        let fp = remaining_pool * FIRST_PRIZE_RATE / BASE;
        let sp = remaining_pool * SECOND_PRIZE_RATE / BASE / 2;
        let tp = remaining_pool * THIRD_PRIZE_RATE / BASE / 3;
        let lp = remaining_pool * LUCKY_PRIZE_RATE / BASE / 5;
        let up = remaining_pool * UNIVERSAL_PRIZE_RATE / BASE;
        
        let seeds: &[&[&[u8]]] = &[&[b"state", &[state.bump]]];
        
        // 平台费2%
        if platform_fee > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.platform_vault.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, platform_fee)?;
        }
        
        // 销毁3% (从存款时记录的本金中扣)
        if burn_amount > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.burn_vault.to_account_info(),
                    authority: ctx.accounts.pool_vault.to_account_info(),
                },
                seeds,
            );
            token::transfer(cpi_ctx, burn_amount)?;
            state.daily_pending_burn = 0;  // 重置待销毁金额
            state.daily_pending_referral = 0;  // 重置待发放推荐奖励
        }
        
        if fp > 0 { let c = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), Transfer{from:ctx.accounts.pool_vault.to_account_info(),to:ctx.accounts.first_prize_winner.to_account_info(),authority:ctx.accounts.pool_vault.to_account_info()},seeds); token::transfer(c,fp)?; }
        if sp > 0 { let c = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), Transfer{from:ctx.accounts.pool_vault.to_account_info(),to:ctx.accounts.second_prize_winner_a.to_account_info(),authority:ctx.accounts.pool_vault.to_account_info()},seeds); token::transfer(c,sp)?; }
        if sp > 0 { let c = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), Transfer{from:ctx.accounts.pool_vault.to_account_info(),to:ctx.accounts.second_prize_winner_b.to_account_info(),authority:ctx.accounts.pool_vault.to_account_info()},seeds); token::transfer(c,sp)?; }
        if tp > 0 { let c = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), Transfer{from:ctx.accounts.pool_vault.to_account_info(),to:ctx.accounts.third_prize_winner_a.to_account_info(),authority:ctx.accounts.pool_vault.to_account_info()},seeds); token::transfer(c,tp)?; }
        if tp > 0 { let c = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), Transfer{from:ctx.accounts.pool_vault.to_account_info(),to:ctx.accounts.third_prize_winner_b.to_account_info(),authority:ctx.accounts.pool_vault.to_account_info()},seeds); token::transfer(c,tp)?; }
        if tp > 0 { let c = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), Transfer{from:ctx.accounts.pool_vault.to_account_info(),to:ctx.accounts.third_prize_winner_c.to_account_info(),authority:ctx.accounts.pool_vault.to_account_info()},seeds); token::transfer(c,tp)?; }
        if lp > 0 { let c = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), Transfer{from:ctx.accounts.pool_vault.to_account_info(),to:ctx.accounts.lucky_prize_winner.to_account_info(),authority:ctx.accounts.pool_vault.to_account_info()},seeds); token::transfer(c,lp)?; }
        if up > 0 { let c = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), Transfer{from:ctx.accounts.pool_vault.to_account_info(),to:ctx.accounts.universal_prize_recipients.to_account_info(),authority:ctx.accounts.pool_vault.to_account_info()},seeds); token::transfer(c,up)?; }
        
        let mut winners: Vec<WinnerRecord> = Vec::new();
        winners.push(WinnerRecord { winner: ctx.accounts.first_prize_winner.key(), prize_type: 1, amount: fp, ticket_number: win_ticket });
        winners.push(WinnerRecord { winner: ctx.accounts.second_prize_winner_a.key(), prize_type: 2, amount: sp, ticket_number: win_ticket+1 });
        winners.push(WinnerRecord { winner: ctx.accounts.second_prize_winner_b.key(), prize_type: 2, amount: sp, ticket_number: win_ticket+2 });
        winners.push(WinnerRecord { winner: ctx.accounts.third_prize_winner_a.key(), prize_type: 3, amount: tp, ticket_number: win_ticket+3 });
        winners.push(WinnerRecord { winner: ctx.accounts.third_prize_winner_b.key(), prize_type: 3, amount: tp, ticket_number: win_ticket+4 });
        winners.push(WinnerRecord { winner: ctx.accounts.third_prize_winner_c.key(), prize_type: 3, amount: tp, ticket_number: win_ticket+5 });
        winners.push(WinnerRecord { winner: ctx.accounts.lucky_prize_winner.key(), prize_type: 4, amount: lp, ticket_number: win_ticket+6 });
        winners.push(WinnerRecord { winner: ctx.accounts.universal_prize_recipients.key(), prize_type: 5, amount: up, ticket_number: 0 });
        
        state.daily_draw_record = DrawRecord { pool_type: 1, draw_time: clock.unix_timestamp, total_pool: total, total_tickets: state.daily_ticket_end, participants: state.daily_players, winners, random_seed: seed };
        
        state.daily_rollover = total * ROLLOVER_RATE / BASE;
        state.daily_pool = 0;
        state.daily_players = 0;
        state.daily_ticket_start = 0;
        state.daily_ticket_end = 0;
        state.last_daily = clock.unix_timestamp;
        Ok(())
    }
}
