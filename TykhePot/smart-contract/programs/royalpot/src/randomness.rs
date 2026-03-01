use crate::PoolType;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

pub const VRF_IR_RETRIES: u8 = 5;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct WinningNumbers {
    pub first_prize: u64,
    pub second_prizes: Vec<u64>,
    pub third_prizes: Vec<u64>,
    pub lucky_prizes: Vec<u64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct DrawResultData {
    pub pool_type: PoolType,
    pub draw_time: i64,
    pub total_pool: u64,
    pub total_tickets: u64,
    pub winners: Vec<WinnerInfo>,
    pub universal_prize_per_ticket: u64,
    pub rollover_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct WinnerInfo {
    pub user: Pubkey,
    pub prize_type: PrizeType,
    pub amount: u64,
    pub ticket_numbers: Vec<u64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum PrizeType {
    First,
    Second,
    Third,
    Lucky,
    Universal,
}

#[account]
pub struct VrfState {
    pub authority: Pubkey,
    pub vrf: Pubkey,
    pub pending_draw: Option<PendingDraw>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PendingDraw {
    pub pool_type: u8,
    pub round_number: u64,
    pub request_slot: u64,
    pub request_timestamp: i64,
}

impl VrfState {
    pub const SIZE: usize = 32 + 32 + (1 + 1 + 8 + 8 + 8) + 1 + 64;
}

impl PendingDraw {
    pub const SIZE: usize = 1 + 8 + 8 + 8;
}

pub fn pick_winner_indices_vrf(randomness: [u8; 32], total: usize) -> Result<[usize; 11]> {
    require!(total >= 11, VrfErrorCode::InsufficientParticipants);

    let mut pool: Vec<usize> = (0..total).collect();
    let mut seed = randomness;

    for i in 0..11 {
        seed = hash(&seed).to_bytes();
        let random_u64 = u64::from_le_bytes([
            seed[0], seed[1], seed[2], seed[3], seed[4], seed[5], seed[6], seed[7],
        ]);
        let j = i + (random_u64 as usize) % (total - i);
        pool.swap(i, j);
    }

    let mut result = [0usize; 11];
    result.copy_from_slice(&pool[0..11]);
    Ok(result)
}

pub fn generate_winning_numbers(
    vrf_randomness: [u8; 32],
    total_tickets: u64,
) -> Result<WinningNumbers> {
    require!(total_tickets > 0, VrfErrorCode::InvalidTicketCount);
    require!(total_tickets >= 11, VrfErrorCode::InsufficientTickets);

    let mut numbers = WinningNumbers {
        first_prize: 0,
        second_prizes: Vec::new(),
        third_prizes: Vec::new(),
        lucky_prizes: Vec::new(),
    };

    let mut seed = vrf_randomness;

    numbers.first_prize = generate_unique_number(&mut seed, total_tickets, &[])?;

    let mut used_numbers = vec![numbers.first_prize];
    for _ in 0..2 {
        let num = generate_unique_number(&mut seed, total_tickets, &used_numbers)?;
        numbers.second_prizes.push(num);
        used_numbers.push(num);
    }

    for _ in 0..3 {
        let num = generate_unique_number(&mut seed, total_tickets, &used_numbers)?;
        numbers.third_prizes.push(num);
        used_numbers.push(num);
    }

    for _ in 0..5 {
        let num = generate_unique_number(&mut seed, total_tickets, &used_numbers)?;
        numbers.lucky_prizes.push(num);
        used_numbers.push(num);
    }

    Ok(numbers)
}

fn generate_unique_number(seed: &mut [u8; 32], max: u64, used: &[u64]) -> Result<u64> {
    let mut attempts = 0;
    const MAX_ATTEMPTS: u32 = 1000;

    loop {
        require!(attempts < MAX_ATTEMPTS, VrfErrorCode::TooManyAttempts);
        attempts += 1;

        *seed = hash(seed).to_bytes();

        let number = (u64::from_le_bytes([
            seed[0], seed[1], seed[2], seed[3], seed[4], seed[5], seed[6], seed[7],
        ]) % max)
            + 1;

        if !used.contains(&number) {
            return Ok(number);
        }
    }
}

pub fn check_winner(
    user_tickets: (u64, u64),
    winning_numbers: &WinningNumbers,
) -> Vec<(PrizeType, u64)> {
    let mut prizes = Vec::new();
    let (start, end) = user_tickets;

    if winning_numbers.first_prize >= start && winning_numbers.first_prize <= end {
        prizes.push((PrizeType::First, winning_numbers.first_prize));
    }

    for &num in &winning_numbers.second_prizes {
        if num >= start && num <= end {
            prizes.push((PrizeType::Second, num));
        }
    }

    for &num in &winning_numbers.third_prizes {
        if num >= start && num <= end {
            prizes.push((PrizeType::Third, num));
        }
    }

    for &num in &winning_numbers.lucky_prizes {
        if num >= start && num <= end {
            prizes.push((PrizeType::Lucky, num));
        }
    }

    prizes
}

pub fn calculate_universal_prize(
    total_pool: u64,
    user_tickets: u64,
    total_universal_tickets: u64,
) -> u64 {
    if total_universal_tickets == 0 {
        return 0;
    }

    let universal_pool = total_pool * 2000 / 10000;
    (universal_pool * user_tickets) / total_universal_tickets
}

pub fn calculate_prize_amount(total_pool: u64, prize_type: PrizeType) -> u64 {
    match prize_type {
        PrizeType::First => total_pool * 3000 / 10000,
        PrizeType::Second => total_pool * 2000 / 10000 / 2,
        PrizeType::Third => total_pool * 1500 / 10000 / 3,
        PrizeType::Lucky => total_pool * 1000 / 10000 / 5,
        PrizeType::Universal => 0,
    }
}

#[error_code]
pub enum VrfErrorCode {
    #[msg("Invalid ticket count")]
    InvalidTicketCount,
    #[msg("Insufficient tickets for draw (need at least 11)")]
    InsufficientTickets,
    #[msg("Too many attempts to generate unique number")]
    TooManyAttempts,
    #[msg("Insufficient participants for draw")]
    InsufficientParticipants,
    #[msg("VRF escrow not found")]
    VrfEscrowNotFound,
    #[msg("VRF randomness not ready yet")]
    RandomnessNotReady,
    #[msg("VRF client mismatch")]
    VrfClientMismatch,
    #[msg("VRF request already pending")]
    VrfRequestPending,
    #[msg("No pending VRF request")]
    NoPendingVrfRequest,
    #[msg("VRF request timeout")]
    VrfRequestTimeout,
}
