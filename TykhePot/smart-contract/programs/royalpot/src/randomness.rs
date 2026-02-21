use anchor_lang::prelude::*;
use crate::PoolType;

/// 随机数生成与开奖模块
/// 使用 Switchboard VRF 或自建随机数方案

/// 中奖号码生成结构
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct WinningNumbers {
    pub first_prize: u64,      // 头奖号码
    pub second_prizes: Vec<u64>, // 二等奖号码 (2个)
    pub third_prizes: Vec<u64>,  // 三等奖号码 (3个)
    pub lucky_prizes: Vec<u64>,  // 幸运奖号码 (5个)
}

/// 开奖结果
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct DrawResult {
    pub pool_type: PoolType,
    pub draw_time: i64,
    pub total_pool: u64,
    pub total_tickets: u64,
    pub winners: Vec<WinnerInfo>,
    pub universal_prize_per_ticket: u64,
    pub rollover_amount: u64,
}

/// 中奖者信息
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct WinnerInfo {
    pub user: Pubkey,
    pub prize_type: PrizeType,
    pub amount: u64,
    pub ticket_numbers: Vec<u64>, // 中奖的票号
}

/// 奖项类型
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum PrizeType {
    First,      // 头奖 30%
    Second,     // 二等奖 20% (每人10%)
    Third,      // 三等奖 15% (每人5%)
    Lucky,      // 幸运奖 10% (每人2%)
    Universal,  // 普惠奖 20%
}

/// 从VRF随机数生成中奖号码
pub fn generate_winning_numbers(
    vrf_randomness: [u8; 32],
    total_tickets: u64,
) -> Result<WinningNumbers> {
    require!(total_tickets > 0, DrawErrorCode::InvalidTicketCount);
    
    let mut numbers = WinningNumbers {
        first_prize: 0,
        second_prizes: Vec::new(),
        third_prizes: Vec::new(),
        lucky_prizes: Vec::new(),
    };
    
    // 使用随机数生成器
    let mut seed = vrf_randomness;
    
    // 生成头奖 (1个)
    numbers.first_prize = generate_unique_number(&mut seed, total_tickets, &[])?;
    
    // 生成二等奖 (2个)
    let mut used_numbers = vec![numbers.first_prize];
    for _ in 0..2 {
        let num = generate_unique_number(&mut seed, total_tickets, &used_numbers)?;
        numbers.second_prizes.push(num);
        used_numbers.push(num);
    }
    
    // 生成三等奖 (3个)
    for _ in 0..3 {
        let num = generate_unique_number(&mut seed, total_tickets, &used_numbers)?;
        numbers.third_prizes.push(num);
        used_numbers.push(num);
    }
    
    // 生成幸运奖 (5个)
    for _ in 0..5 {
        let num = generate_unique_number(&mut seed, total_tickets, &used_numbers)?;
        numbers.lucky_prizes.push(num);
        used_numbers.push(num);
    }
    
    Ok(numbers)
}

/// 生成不重复的中奖号码
fn generate_unique_number(
    seed: &mut [u8; 32],
    max: u64,
    used: &[u64],
) -> Result<u64> {
    let mut attempts = 0;
    const MAX_ATTEMPTS: u32 = 1000;
    
    loop {
        require!(attempts < MAX_ATTEMPTS, DrawErrorCode::TooManyAttempts);
        attempts += 1;
        
        // 更新seed
        *seed = hash_seed(seed);
        
        // 生成号码 (1到max)
        let number = (u64::from_le_bytes([
            seed[0], seed[1], seed[2], seed[3],
            seed[4], seed[5], seed[6], seed[7],
        ]) % max) + 1;
        
        // 检查是否已使用
        if !used.contains(&number) {
            return Ok(number);
        }
    }
}

/// 哈希seed生成新seed
fn hash_seed(seed: &[u8; 32]) -> [u8; 32] {
    use anchor_lang::solana_program::hash::hash;
    hash(seed).to_bytes()
}

/// 根据用户票号范围判断中奖
pub fn check_winner(
    user_tickets: (u64, u64), // (起始票号, 结束票号)
    winning_numbers: &WinningNumbers,
) -> Vec<(PrizeType, u64)> { // (奖项, 中奖票号)
    let mut prizes = Vec::new();
    let (start, end) = user_tickets;
    
    // 检查头奖
    if winning_numbers.first_prize >= start && winning_numbers.first_prize <= end {
        prizes.push((PrizeType::First, winning_numbers.first_prize));
    }
    
    // 检查二等奖
    for &num in &winning_numbers.second_prizes {
        if num >= start && num <= end {
            prizes.push((PrizeType::Second, num));
        }
    }
    
    // 检查三等奖
    for &num in &winning_numbers.third_prizes {
        if num >= start && num <= end {
            prizes.push((PrizeType::Third, num));
        }
    }
    
    // 检查幸运奖
    for &num in &winning_numbers.lucky_prizes {
        if num >= start && num <= end {
            prizes.push((PrizeType::Lucky, num));
        }
    }
    
    prizes
}

/// 计算普惠奖金额
pub fn calculate_universal_prize(
    total_pool: u64,
    user_tickets: u64,
    total_universal_tickets: u64,
) -> u64 {
    if total_universal_tickets == 0 {
        return 0;
    }
    
    let universal_pool = total_pool * 2000 / 10000; // 20%
    (universal_pool * user_tickets) / total_universal_tickets
}

/// 计算特定奖项金额
pub fn calculate_prize_amount(total_pool: u64, prize_type: PrizeType) -> u64 {
    match prize_type {
        PrizeType::First => total_pool * 3000 / 10000,     // 30%
        PrizeType::Second => total_pool * 2000 / 10000 / 2, // 20% / 2人
        PrizeType::Third => total_pool * 1500 / 10000 / 3,  // 15% / 3人
        PrizeType::Lucky => total_pool * 1000 / 10000 / 5,  // 10% / 5人
        PrizeType::Universal => 0, // 动态计算
    }
}

// 错误码 - 使用独立的错误码避免循环导入
#[error_code]
pub enum DrawErrorCode {
    #[msg("Invalid ticket count")]
    InvalidTicketCount,
    #[msg("Too many attempts to generate unique number")]
    TooManyAttempts,
}
