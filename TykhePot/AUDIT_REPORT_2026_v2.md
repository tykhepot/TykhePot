# TykhePot (RoyalPot) 智能合约安全审计报告 v2

**审计日期**: 2026-02-25
**审计范围**: commit `1db05cc`（branch `fix/complete-contract-implementation`）
**合约地址**: `5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b`（devnet）
**审计员**: Claude Sonnet 4.6（内部审计）
**链**: Solana / Anchor 0.30.0

---

## 概览

| 严重级别 | 数量 |
|----------|------|
| 🔴 严重（Critical） | 1 |
| 🟠 高危（High） | 3 |
| 🟡 中危（Medium） | 8 |
| 🟢 低危（Low） | 7 |
| ℹ️ 信息（Informational） | 5 |
| **合计** | **24** |

审计范围文件：
- `programs/royalpot/src/lib.rs`（主程序，20 条指令）
- `programs/royalpot/src/staking.rs`（质押模块）
- `programs/royalpot/src/airdrop.rs`（盈利空投模块）
- `programs/royalpot/src/randomness.rs`（随机数工具）

---

## 🔴 严重漏洞（Critical）

---

### CRIT-1: `record_profit` 无权限校验 — 任意用户可自报利润抽空空投库

**文件**: `airdrop.rs:66` / `lib.rs:293`
**影响**: 任何人可以调用 `record_profit(大额数字)`，再调用 `claim_profit_airdrop()` 领取最多 10,000 TPOT，从而**耗尽整个 airdrop_vault**。

**漏洞代码**（`airdrop.rs`）：
```rust
pub fn record_profit(ctx: Context<crate::RecordProfit>, profit_amount: u64) -> Result<()> {
    require!(profit_amount > 0, AirdropErrorCode::InvalidProfit);
    // ❌ 无 require!(ctx.accounts.authority.key() == ...) 校验
    user_airdrop.total_profit = user_airdrop.total_profit.saturating_add(profit_amount);
    // 攻击：profit_amount = 1_000_000_000_000 (1000 TPOT)
    // → eligible_airdrop = 1000 * 10 = 10,000 TPOT → 直接 claim
```

**攻击路径**：
1. 攻击者钱包 → 调用 `record_profit(profit_amount: 1_000_000_000_000)` 自签名
2. 攻击者调用 `claim_profit_airdrop()` → 领取 10,000 TPOT
3. 多个攻击者地址重复操作 → 空投库被耗尽

**修复建议**：
```rust
// 方案 A（推荐）：仅 state.authority 可调用
require!(ctx.accounts.user.key() == ctx.accounts.state.authority, ErrorCode::Unauthorized);

// 方案 B：独立 authority 账户，仅合约自身在 draw 后 CPI 调用
// 实现：draw_hourly/draw_daily 成功后内部 CPI record_profit，
// 移除对外暴露的 record_profit 指令
```

---

## 🟠 高危漏洞（High）

---

### HIGH-1: `initialize_staking` 无 Admin 保护 — 前置攻击可劫持质押模块

**文件**: `lib.rs:194` / `staking.rs:68`
**影响**: 任何人可以在项目方之前调用 `initialize_staking`，将自己设为 `authority`，劫持质押奖励池分配权。

**漏洞代码**（`lib.rs`）：
```rust
pub struct InitializeStaking<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,   // ❌ 任何 Signer 均可
    #[account(init, payer = authority, space = 8 + staking::StakingState::SIZE, ...)]
    pub staking_state: Account<'info, staking::StakingState>,
```

**修复建议**：
```rust
pub struct InitializeStaking<'info> {
    #[account(mut, constraint = authority.key() == state.authority @ ErrorCode::Unauthorized)]
    pub authority: Signer<'info>,
    #[account(seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, State>,   // 新增：通过主 state 校验
```

---

### HIGH-2: `initialize_airdrop` 无 Admin 保护 — 同 HIGH-1

**文件**: `lib.rs:255` / `airdrop.rs:43`
**影响**: 任何人可以劫持 AirdropState，设置任意 `total_airdrop` 参数。

**修复建议**：同 HIGH-1，添加主 state 引用并校验 `authority.key() == state.authority`。

---

### HIGH-3: 开奖结果不可在链上验证 — 中心化信任风险

**文件**: `lib.rs:680`（`draw_hourly`）、`lib.rs:762`（`draw_daily`）
**影响**: `draw_seed` 仅作为事件发出，合约不校验 `payouts` 与 `draw_seed` 的对应关系。Authority 可在不被合约拦截的情况下传入任意中奖地址和金额。

**现状**：
```rust
pub fn draw_hourly<'info>(ctx: ..., payouts: Vec<WinnerPayout>, draw_seed: [u8; 32]) {
    // draw_seed 只用于 DrawCompleted 事件，不参与任何 payouts 校验
    emit!(DrawCompleted { ..., draw_seed });  // 链上可审计但不可自动验证
}
```

**说明**：此问题属于协议设计层面的信任假设（authority 诚实运行），非实现 bug。
**缓解措施（现有）**：
- `draw_seed` 来自最终确认的 blockhash，可公开重现
- 白皮书记录了第 5 章可验证审计流程
- 任何人可用相同 seed 重算中奖者并比对

**长期建议**：
集成 Switchboard VRF 或 Pyth Entropy，在链上验证 `payouts[0].winner == derive_winner(draw_seed, tickets)`。

---

## 🟡 中危漏洞（Medium）

---

### MED-1: 旧版 UserData PDA（SIZE=99）与新结构（SIZE=100）不兼容

**文件**: `lib.rs:73`
**影响**: 所有在本次更新前已初始化的 `UserData` 账户（分配空间 8+99=107 字节）读取新结构时会触发 Borsh 反序列化错误（尝试读取第 108 字节），导致相关指令（`deposit_daily`、`deposit_hourly`、`use_free_bet_daily` 等）完全不可用。

**受影响场景**: devnet 重新部署后旧测试账户。主网（尚未部署）不受影响。
**修复建议**: devnet 重新部署后需手动关闭旧 PDA 或指引用户用新地址重建。主网部署前已知，无需额外操作。

---

### MED-2: Staking 模块多处 `+=`/`-=` 无溢出保护

**文件**: `staking.rs:141–146, 207–213, 267–273`
**影响**: 以下操作在 SBF release 模式下整数溢出/下溢会直接 abort 交易：

```rust
staking_state.total_staked_short += amount;   // 行 142
staking_state.total_staked_long  += amount;   // 行 146
staking_state.total_staked_short -= user_stake.amount;  // 行 208（early_withdraw）
staking_state.long_term_released += total_return;       // 行 213
```

实际发生概率极低（超 18.4B TPOT 才溢出），但属代码安全规范问题。
**修复建议**: 全部改用 `saturating_add` / `saturating_sub`。

---

### MED-3: `deposit_hourly` 无时间冷却 — 单用户可无限刷票

**文件**: `lib.rs:477`
**影响**: `deposit_daily` 有 60 秒冷却，但 `deposit_hourly` 没有任何冷却期。单个大户可在一个区块内提交多笔交易，叠加大量小时池票数，在固定 `hourly_pool` 中获得远超应有的权重优势（尽管票数权重仅供参考，实际开奖仍由 authority 执行）。

**修复建议**: 对 `deposit_hourly` 同样添加 60 秒冷却：
```rust
require!(clock.unix_timestamp - user.last_hourly_time >= 60, ErrorCode::DepositTooFrequent);
```

---

### MED-4: `deposit_daily` 账户结构始终要求推荐人账户，即便无推荐

**文件**: `lib.rs:144`
**影响**: `DepositDaily` 结构中 `referrer_token` 和 `user_referrer_bonus` 是必填账户。当用户不使用推荐人时（`referrer = None`），客户端必须传入占位账户（通常为自己的 token account），容易导致混淆错误。

**修复建议**: 将推荐相关账户改为通过 `remaining_accounts` 动态传入（类似 MED-2 中 referrer UserData 的处理方式）。

---

### MED-5: `airdrop_vault` 同时服务两种用途，无独立记账

**文件**: `lib.rs:840`（`claim_free_airdrop`，已改为只注册）、`lib.rs:862`（`use_free_bet_daily`）、`airdrop.rs:141`（`claim_profit_airdrop`）
**影响**: 同一个 `airdrop_vault`（PDA authority = `[b"airdrop"]`）既供免费投注使用（100 TPOT/次），也供盈利空投使用（最多 10,000 TPOT/次）。`AirdropState.remaining_amount` 只追踪盈利空投部分，免费投注消耗的金额没有独立计数，实际可用余额可能低于 `remaining_amount`。

**修复建议**: 使用两个独立 vault，或在 `State` 中新增 `free_bet_remaining: u64` 字段追踪免费投注余额。

---

### MED-6: `use_free_bet_daily` 不防止同一用户多次计入 `daily_players`

**文件**: `lib.rs:462`
**影响**: 同一用户先调用 `deposit_daily` 再调用 `use_free_bet_daily`（或反之），`state.daily_players` 会被计入两次。5 人开奖最低人数可能被少数用户伪造满足。

**修复建议**: 在 `UserData` 中增加 `is_in_daily_round: bool` 标志，确保每轮每用户只计一次；或改用对 **唯一用户数** 的计数。

---

### MED-7: `StakingState` 和 `AirdropState` 的 `authority` 字段存储但从未验证

**文件**: `staking.rs:75`、`airdrop.rs:49`
**影响**: 两个模块都存储了 `authority` 字段，但任何后续操作均不校验调用者是否是该 authority，使该字段形同虚设。未来若需要 authority 执行管理操作（如更新奖励池参数）将无法安全实现。

---

### MED-8: `DepositHourly` 缺少 token mint 校验

**文件**: `lib.rs:124`
**影响**: `burn_vault`、`platform_vault`、`pool_vault`、`user_token` 均为 `Account<TokenAccount>` 类型，但无 `token::mint = state.token_mint` 约束。恶意客户端可传入任意 token 的账户（SPL 转账会因 mint 不匹配而失败，不会成功偷取资金，但会产生混淆性错误）。

**修复建议**:
```rust
#[account(mut, token::mint = state.token_mint, token::authority = signer)]
pub user_token: Account<'info, TokenAccount>,
#[account(mut, token::mint = state.token_mint)]
pub burn_vault: Account<'info, TokenAccount>,
```

---

## 🟢 低危问题（Low）

---

### LOW-1: `randomness.rs` 完全为死代码

**文件**: `randomness.rs`（全文）
**影响**: `generate_winning_numbers`、`check_winner`、`calculate_universal_prize`、`calculate_prize_amount` 均未被 `draw_hourly`/`draw_daily` 调用。该模块增加了代码体积，但不参与任何实际执行路径，可能误导审计者。
**建议**: 删除或归入 off-chain SDK；若计划未来链上验证可保留但加注释。

---

### LOW-2: 质押最低金额为 0

**文件**: `staking.rs:100`
```rust
require!(amount > 0, StakingErrorCode::InvalidAmount);
```
允许 1 lamport 的质押，可能产生奖励为 0 的无意义记录（`calculate_reward` 对极小金额返回 0）。
**建议**: 设置合理最低质押额（如 1 TPOT = 1_000_000_000）。

---

### LOW-3: `calculate_reward` 对小金额静默返回 0

**文件**: `staking.rs:12`
对极小本金，奖励计算结果可能为 0，但 `stake` 不检查 `reward == 0` 的情况，允许零收益质押存在。
**建议**: 添加 `require!(reward > 0, StakingErrorCode::RewardTooSmall)` 校验。

---

### LOW-4: `init_vesting` 不验证 `winner` 是否真实中奖

**文件**: `lib.rs:921`
`winner: Pubkey` 参数完全由 admin 决定，合约不验证其是否来自真实的开奖结果。属设计层面的信任假设（admin 诚实），但值得记录。

---

### LOW-5: `early_withdraw` 恢复奖励池的操作缺乏上限检查

**文件**: `staking.rs:268`
```rust
staking_state.short_term_pool += user_stake.reward;
```
提前赎回时将奖励归还奖励池，使用裸 `+=`。理论上不会溢出（奖励来自原有奖励池），但缺乏防御性编码。

---

### LOW-6: `deposit_hourly` 中 `state.hourly_pool += prize_amount` 使用裸 `+=`

**文件**: `lib.rs:526`
参见 MED-2。`deposit_hourly`、`deposit_daily` 中多处 `+=` 操作（`hourly_pool`、`daily_pool`、`burned`、`hourly_players` 等）无溢出保护。实际不可触发，但不符合防御性编程规范。

---

### LOW-7: `draw_seed != [0u8; 32]` 校验过弱

**文件**: `lib.rs:743`
```rust
require!(draw_seed != [0u8; 32], ErrorCode::InvalidAmount);
```
只排除了全零 seed，无法防止 authority 使用伪随机性极差的 seed（如全 1）。完整的 seed 质量验证应在链下配合 VDF/blockhash 验证完成。

---

## ℹ️ 信息性提示（Informational）

---

### INFO-1: `platform_wallet` 和 `state.authority` 初始化后不可更新

合约没有 `update_platform_wallet` 或 `transfer_authority` 指令。一旦部署后密钥泄露或需要迁移，合约将无法恢复控制权。建议主网上线前实现 `propose_authority` + 两步权限转移机制。

---

### INFO-2: `state.pre_pool` 耗尽后无法补充

`pre_pool` 在初始化时设定，被 `deposit_hourly`/`deposit_daily` 消耗后不可补充（无 `refill_pre_pool` 指令）。当 `pre_pool = 0` 时激励效果消失。

---

### INFO-3: `pause` 时间锁为 48 小时但无紧急暂停机制

当出现严重安全事件时，48 小时的 `PAUSE_TIMELOCK` 可能导致损失扩大。建议增加 `emergency_pause` 指令（需要 2/3 多签），绕过 timelock。

---

### INFO-4: `60s DepositTooFrequent` 冷却计时使用 `last_time` 字段，但 `use_free_bet_daily` 不更新该字段

`deposit_daily` 执行后更新 `user.last_time`，但 `use_free_bet_daily` 不更新。用户可以免费投注后立即再付费投注，不受 60 秒冷却约束。这可能是有意设计（免费投注不算"存款"），但需明确记录。

---

### INFO-5: `VestingAccount` 的 `vesting_id` 建议使用自增序号而非时间戳

使用 `draw_timestamp` 作为 `vesting_id` 可能在同一秒内两次开奖时冲突（虽极不可能）。建议使用自增序号或 `(winner, draw_index)` 组合。

---

## 架构风险总结

```
高中心化风险区域：
┌─────────────────────────────────────────────────────────┐
│  draw_hourly / draw_daily                               │
│  ├─ payouts 完全由 authority 决定                         │
│  ├─ draw_seed 可审计但不可在链上强制验证                     │
│  └─ 无任何用户可提交的申诉机制                               │
│                                                         │
│  record_profit (CRIT-1)                                 │
│  └─ 任意用户可自报利润，直接耗尽空投库                         │
└─────────────────────────────────────────────────────────┘
```

---

## 修复优先级建议

| 优先级 | 问题 | 上线阻塞 |
|--------|------|----------|
| P0 | CRIT-1: record_profit 无权限 | ✅ 必须修复 |
| P0 | HIGH-1/2: initialize_staking/airdrop 无 admin 保护 | ✅ 必须修复 |
| P1 | MED-1: 旧 UserData PDA 迁移 | ✅ devnet 重部署前必须处理 |
| P1 | MED-2: Staking 溢出保护 | 强烈建议 |
| P1 | MED-5: airdrop_vault 双重用途记账 | 强烈建议 |
| P2 | MED-3/4/6/7/8 | 主网前修复 |
| P3 | LOW-1~7, INFO-1~5 | 上线后改进 |

---

## 已知良好设计（无需修复）

- `claim_free_airdrop` 使用 `init_if_needed` + `[b"user", signer.key()]` 种子绑定，正确防止跨用户利用
- `draw_hourly`/`draw_daily` PDA 签名模式正确（`seeds = [b"state", bump]`）
- `deposit_daily` referrer 验证通过 `remaining_accounts` 校验了 owner、seeds、非空，防止无效推荐人
- `claim_vested` 使用 `constraint = vesting_account.winner == winner.key()` 防止非中奖者领取
- `pause/execute_pause` 两步时间锁设计合理
- `draw_seed != [0u8; 32]` 虽然弱，但基本排除了哑数据提交
- `claim_profit_airdrop` 的 PDA 签名（`[b"airdrop", &[bump]]`）正确传递 bump

---

*报告版本: v2.0 | 基于 commit 1db05cc | 下次审计建议在 CRIT-1 修复后重审*
