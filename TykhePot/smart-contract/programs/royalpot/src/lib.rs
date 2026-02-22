use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount, Mint};

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
    pub last_hourly: i64,
    pub last_daily: i64,
    pub paused: bool,
    pub bump: u8,
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
        state.last_hourly = clock.unix_timestamp;
        state.last_daily = clock.unix_timestamp;
        state.paused = false;
        state.bump = ctx.bumps.state;
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
        require!(!state.paused, ErrorCode::ContractPaused);
        require!(amount >= HOUR_MIN, ErrorCode::BelowMinDeposit);
        
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
        
        // Calculate tickets (1 TPOT = 1 ticket)
        user.hourly_tickets += prize_amount / 1_000_000_000;
        
        Ok(())
    }

    pub fn deposit_daily(ctx: Context<DepositDaily>, amount: u64, referrer: Option<Pubkey>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let user = &mut ctx.accounts.user;
        let clock = Clock::get()?;
        
        require!(!state.paused, ErrorCode::ContractPaused);
        require!(amount >= DAY_MIN, ErrorCode::BelowMinDeposit);
        require!(clock.unix_timestamp - user.last_time >= 60, ErrorCode::DepositTooFrequent);
        
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
                // Referred bonus 2% (one-time)
                if !user.has_ref_bonus {
                    user.has_ref_bonus = true;
                    user.referrer = Some(referrer_key);
                }
            }
        }
        
        // Update state
        state.daily_pool += prize_amount;
        state.daily_players += 1;
        state.burned += burn_amount;
        user.daily_tickets += prize_amount / 1_000_000_000;
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

    // 开奖：如果参与人数<10，退还用户；如果>=10，正常开奖（随机分配）
    pub fn draw_hourly(ctx: Context<DrawHourly>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let clock = Clock::get()?;
        
        // 检查是否到了开奖时间（每小时整点）
        let current_hour = clock.unix_timestamp / 3600;
        let last_draw_hour = state.last_hourly / 3600;
        
        require!(current_hour > last_draw_hour, ErrorCode::NotTimeYet);
        
        if state.hourly_players < MIN_PARTICIPANTS {
            // 人数不足，清空奖池（不转账，用户从网站查看余额）
            state.hourly_pool = 0;
            state.hourly_players = 0;
        } else {
            // 人数足够，正常开奖
            let total_pool = state.hourly_pool;
            require!(total_pool > 0, ErrorCode::InsufficientPoolBalance);
            
            // 计算奖金分配
            let first_prize = total_pool * FIRST_PRIZE_RATE / BASE;
            let second_prize = total_pool * SECOND_PRIZE_RATE / BASE;
            let third_prize = total_pool * THIRD_PRIZE_RATE / BASE;
            let lucky_prize = total_pool * LUCKY_PRIZE_RATE / BASE;
            let universal_prize = total_pool * UNIVERSAL_PRIZE_RATE / BASE;
            let rollover = total_pool * ROLLOVER_RATE / BASE;
            
            // 分配头奖
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
            
            // 分配二等奖
            if second_prize > 0 {
                let bump = state.bump;
                let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.second_prize_winner.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx, second_prize)?;
            }
            
            // 分配三等奖
            if third_prize > 0 {
                let bump = state.bump;
                let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.third_prize_winner.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx, third_prize)?;
            }
            
            // 分配幸运奖
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
            
            // 分配普惠奖
            if universal_prize > 0 {
                let bump = state.bump;
                let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.universal_prize_recipients.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx, universal_prize)?;
            }
            
            // 更新状态
            state.hourly_pool = 0;
            state.hourly_players = 0;
        }
        
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
            // 人数不足，清空奖池
            state.daily_pool = 0;
            state.daily_players = 0;
        } else {
            // 人数足够，正常开奖
            let total_pool = state.daily_pool;
            require!(total_pool > 0, ErrorCode::InsufficientPoolBalance);
            
            // 计算奖金分配
            let first_prize = total_pool * FIRST_PRIZE_RATE / BASE;
            let second_prize = total_pool * SECOND_PRIZE_RATE / BASE;
            let third_prize = total_pool * THIRD_PRIZE_RATE / BASE;
            let lucky_prize = total_pool * LUCKY_PRIZE_RATE / BASE;
            let universal_prize = total_pool * UNIVERSAL_PRIZE_RATE / BASE;
            let rollover = total_pool * ROLLOVER_RATE / BASE;
            
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
            if second_prize > 0 {
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
                token::transfer(cpi_ctx_a, second_prize)?;
                
                let cpi_ctx_b = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.second_prize_winner_b.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx_b, second_prize)?;
            }
            
            // 分配三等奖 (3人)
            if third_prize > 0 {
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
                token::transfer(cpi_ctx_a, third_prize)?;
                
                let cpi_ctx_b = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.third_prize_winner_b.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx_b, third_prize)?;
                
                let cpi_ctx_c = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.third_prize_winner_c.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx_c, third_prize)?;
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
            
            // 分配普惠奖
            if universal_prize > 0 {
                let bump = state.bump;
                let seeds: &[&[&[u8]]] = &[&[b"state", &[bump]]];
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_vault.to_account_info(),
                        to: ctx.accounts.universal_prize_recipients.to_account_info(),
                        authority: ctx.accounts.pool_vault.to_account_info(),
                    },
                    seeds,
                );
                token::transfer(cpi_ctx, universal_prize)?;
            }
            
            // 更新状态
            state.daily_pool = 0;
            state.daily_players = 0;
        }
        
        state.last_daily = clock.unix_timestamp;
        
        Ok(())
    }
}
