# Audit Report & Fix Plan

## 1. Security Vulnerabilities

### 1.1 Public `execute_draw` with User-Controlled Seed
- **Severity:** Critical
- **Location:** `lib.rs`, `execute_draw` function.
- **Issue:** The `execute_draw` function is public and accepts a `draw_seed` argument from the caller. A malicious user can simulate the draw locally and submit a seed that ensures they win, draining the prize pool.
- **Whitepaper Alignment:** The Whitepaper mentions "Switchboard VRF". The code implements an insecure local randomness generator seeded by the caller.
- **Fix:** Restrict `execute_draw` to be callable only by a trusted `operator` (admin) account. While true VRF integration is complex, ensuring only the operator can trigger the draw prevents user manipulation.

### 1.2 Public `record_profit` in Airdrop Module
- **Severity:** Critical
- **Location:** `airdrop.rs`, `record_profit` function.
- **Issue:** This function is public and allows any user to record arbitrary profit for themselves. This inflates their "eligible airdrop" amount, allowing them to drain the airdrop vault via `claim_profit_airdrop`.
- **Whitepaper Alignment:** The logic in `airdrop.rs` (Profit x10 airdrop) does not match the Whitepaper's description of the airdrop mechanism (Locked 1,000 TPOT for gaming).
- **Fix:** Restrict `record_profit` to the `operator`.

## 2. Logic & Design Inconsistencies

### 2.1 Airdrop Amount & Mechanism
- **Severity:** High
- **Location:** `lib.rs`, `claim_free_airdrop` and `use_free_bet`.
- **Issue:**
    - **Whitepaper:** Users receive **1,000 TPOT** locked for gaming.
    - **Code:** Users receive a single boolean flag `free_bet_available` which allows **one** free bet of 100 TPOT. This is 1/10th of the promised amount.
- **Fix:**
    - Modify `AirdropClaim` to store `remaining_amount` (u64).
    - `claim_free_airdrop` sets this to 1,000 TPOT.
    - `use_free_bet` deducts 100 TPOT from `remaining_amount` and allows repeated use until depleted.

### 2.2 Lucky Prize Vesting
- **Severity:** Medium
- **Location:** `lib.rs`, `execute_draw`.
- **Issue:**
    - **Whitepaper:** "Top prize (30%), 2nd (20%), 3rd (15%), **Lucky (10%)** -> **20 days linear vesting**".
    - **Code:** Lucky winners (2% * 5) are paid **immediately**. Only 1st, 2nd, and 3rd prizes are vested.
- **Fix:** Update `DrawResult` and `execute_draw` to include Lucky winners in the vesting schedule.

### 2.3 Referral Restrictions
- **Severity:** Low
- **Location:** `lib.rs`, `deposit`.
- **Issue:**
    - **Whitepaper:** Referral rewards (8%) apply **only** to the **Daily Pool**.
    - **Code:** The `deposit` function records a referrer for any pool type, potentially paying out referral rewards for hourly/30min pools.
- **Fix:** In `deposit`, only record the referrer if `pool_type == PoolType::Daily`.

## 3. Plan of Action

1.  **Refactor `GlobalState`:** Add an `operator` public key to control privileged functions.
2.  **Refactor `AirdropClaim`:** Change `free_bet_available` (bool) to `remaining_amount` (u64).
3.  **Refactor `DrawResult`:** Expand arrays to hold 11 winners (1st + 2x2nd + 3x3rd + 5xLucky).
4.  **Update `lib.rs`:**
    - `initialize`: Set `operator`.
    - `deposit`: Enforce referral rules.
    - `use_free_bet`: Logic for 1,000 TPOT pool.
    - `execute_draw`: Require operator signature, vest Lucky prizes.
    - `claim_prize_vesting`: Support all 11 winners.
5.  **Update `airdrop.rs`:** Restrict `record_profit` to operator.
