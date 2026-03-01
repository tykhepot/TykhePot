# TykhePot ($TPOT)

<p align="center">
  <strong>幸运女神的链上奖池 — 去中心化 Solana 彩票协议</strong>
</p>

<p align="center">
  <a href="https://www.tykhepot.io">🌐 官网</a> •
  <a href="https://twitter.com/PotTykhe34951">🐦 Twitter</a> •
  <a href="https://t.me/tykhepot">💬 Telegram</a> •
  <a href="https://discord.gg/tykhepot">🎮 Discord</a>
</p>

---

## 项目简介

**TykhePot** 是基于 Solana 的无管理员、完全链上可验证奖池协议。Tykhe（堤喀）是古希腊幸运女神，掌管命运与机遇——链上随机数让命运由代码裁决，任何人都可以验证。

- **线上地址**: https://www.tykhepot.io
- **网络**: Solana Devnet（主网待上线）
- **程序 ID**: `BGvzwkQy2xVLewPANR8siksZJbQD8RN4wKPQczbMRMd5`
- **代币 TPOT**: `FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY`（总量 10 亿）

---

## 仓库结构

```
TykhePot/
├── frontend/                        # React 前端（部署至 Vercel）
│   ├── src/
│   │   ├── App.js                   # 路由入口
│   │   ├── index.js                 # React 挂载点
│   │   ├── styles.css               # 全局样式
│   │   ├── config/
│   │   │   ├── contract.js          # 程序ID、vault地址、池参数常量
│   │   │   └── index.js             # 配置导出
│   │   ├── utils/
│   │   │   ├── tykhepot-sdk.js      # ★ 核心SDK（IDL、链上交互、签名策略）
│   │   │   ├── sdk.js               # 旧版SDK（兼容保留）
│   │   │   └── demo-sdk.js          # 演示模式SDK（不上链）
│   │   ├── pages/
│   │   │   ├── Home.js              # 首页（三池卡片、倒计时、全局统计）
│   │   │   ├── DailyPool.js         # 日池（存款、免费投注、奖项展示）
│   │   │   ├── HourlyPool.js        # 小时池
│   │   │   ├── Min30Pool.js         # 30分钟池
│   │   │   ├── Airdrop.js           # 免费空投 / 免费投注领取
│   │   │   ├── DrawHistory.js       # 开奖历史（多赢家展示）
│   │   │   ├── Staking.js           # 质押页面
│   │   │   ├── Referral.js          # 推荐奖励页面
│   │   │   ├── UserHistory.js       # 用户历史记录
│   │   │   ├── Leaderboard.js       # 排行榜
│   │   │   ├── Whitepaper.js        # 白皮书
│   │   │   ├── FAQ.js               # 常见问题
│   │   │   ├── ContractTest.js      # 合约调试页（开发用）
│   │   │   ├── TestPage.js          # 测试页（开发用）
│   │   │   └── InitPage.js          # 协议初始化页（管理用）
│   │   ├── components/
│   │   │   ├── Layout.js            # 导航栏 + 页脚
│   │   │   ├── PoolCard.js          # 池卡片组件
│   │   │   ├── StatsSection.js      # 全局统计组件
│   │   │   ├── RiskDisclaimer.js    # 风险提示弹窗
│   │   │   ├── DemoMode.js          # 演示模式切换
│   │   │   ├── ContractInit.js      # 合约初始化组件
│   │   │   └── ResponsiveStyles.js  # 响应式样式辅助
│   │   ├── context/
│   │   │   └── AppContext.js        # 全局状态 Context
│   │   ├── hooks/
│   │   │   ├── useTykhePot.js       # 主业务 Hook（SDK封装）
│   │   │   ├── useContractInit.js   # 合约初始化 Hook
│   │   │   └── useDemo.js           # 演示模式 Hook
│   │   ├── i18n/
│   │   │   └── LanguageContext.js   # 中英双语切换
│   │   └── styles/
│   │       └── pageStyles.js        # 共用页面样式对象
│   ├── public/
│   │   ├── index.html               # HTML 模板
│   │   └── init.html                # 初始化工具页
│   ├── vercel.json                  # Vercel 部署配置（SPA rewrite）
│   ├── config-overrides.js          # CRACO webpack 覆盖（Buffer polyfill）
│   └── package.json                 # 依赖清单
│
├── smart-contract/                  # Anchor 智能合约（Rust）
│   ├── programs/royalpot/src/
│   │   ├── lib.rs                   # ★ 核心程序（18个指令，完整业务逻辑）
│   │   ├── staking.rs               # 质押模块（stake / release / early_withdraw）
│   │   ├── airdrop.rs               # 盈利空投模块（record_profit / claim）
│   │   └── randomness.rs            # Fisher-Yates 随机抽奖（finalized blockhash seed）
│   ├── scripts/                     # 部署 / 初始化脚本（TypeScript）
│   ├── tests/
│   │   └── royalpot.ts              # Anchor 集成测试
│   ├── Anchor.toml                  # Anchor 配置（cluster = devnet）
│   └── Cargo.toml                   # Rust 依赖（anchor-lang 0.30）
│
├── scripts/                         # 运维脚本
│   ├── init-protocol.js             # 一键初始化协议（initialize + 3个池）
│   └── cron-draw.js                 # 定时开奖 Cron（execute_draw / execute_refund）
│
└── docs/                            # 文档
    ├── whitepaper.md                # 白皮书（完整版）
    ├── api.md                       # SDK API 参考
    ├── deployment-checklist.md      # 部署检查清单
    ├── PRIVACY_POLICY.md            # 隐私政策
    ├── TERMS_OF_SERVICE.md          # 服务条款
    └── RISK_DISCLOSURE.md           # 风险披露
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 智能合约 | Rust + Anchor 0.30 / anchor-lang 0.30.0 |
| 合约构建 | Anchor CLI 0.29 + cargo-build-sbf |
| 前端框架 | React 18 + React Router v6 |
| 链上交互 | @coral-xyz/anchor 0.29 + @solana/web3.js 1.x |
| 钱包适配 | @solana/wallet-adapter（Phantom / WalletConnect） |
| 部署平台 | Vercel（前端）+ Solana Devnet（合约） |
| 国际化 | 自定义 LanguageContext（中 / 英双语） |

---

## 合约架构（v3）

### 三个奖池

| 池 | pool_type | 开奖周期 | 最低入金 | 最少参与人数 |
|----|-----------|----------|----------|-------------|
| 30 分钟池 | 0 | 每小时 :00 / :30 | 500 TPOT | 12 |
| 小时池 | 1 | 每小时整点 | 200 TPOT | 12 |
| 日池 | 2 | 每天 00:00 UTC | 100 TPOT | 12 |

### 奖项分配

每期 `prize_pool = 总入金 − 3% burn − 2% platform`

```
5%      → 结转下一期 (rollover)
剩余 95%：
  30%     → 🥇 头奖 ×1    （20天线性归属，每天5%）
  10% ×2  → 🥈 二等奖 ×2  （20天线性归属，每天5%）
  5%  ×3  → 🥉 三等奖 ×3  （20天线性归属，每天5%）
  2%  ×5  → 🍀 幸运奖 ×5  （即时到账）
  20%     → 🎁 普惠奖     （即时到账，平分给所有未中奖者）
```

### 主要指令（共 18 个）

```
initialize(platformFeeVault, referralVault, reserveVault, prizeEscrowVault)
initialize_pool(poolType, initialStartTime)
deposit(amount)                           — 存款，含 reserve matching + 可选推荐人
use_free_bet(poolType)                    — 免费投注，仅限 pool_type=2（日池）
execute_draw(drawSeed)                    — 开奖（≥12人），创建 DrawResult PDA
execute_refund()                          — 人数不足退款
claim_prize_vesting(winnerIndex)          — 每日 cron 调用，20天归属领奖
claim_referral(poolType, roundNumber)     — 推荐人开奖后领取 8% 奖励
claim_free_airdrop()                      — 免费领取 100 TPOT 空投
initialize_staking / stake / release_stake / early_withdraw
initialize_airdrop / record_profit / claim_profit_airdrop
init_vesting / claim_vested
```

### PDA Seeds

| 账户 | Seeds |
|------|-------|
| global_state | `[b"global_state"]` |
| pool_state | `[b"pool", &[pool_type]]` |
| user_deposit | `[b"deposit", &[pool_type], user, round.to_le_bytes()]` |
| free_deposit | `[b"free_deposit", &[pool_type], user]` |
| draw_result | `[b"draw_result", &[pool_type], round.to_le_bytes()]` |
| airdrop_claim | `[b"airdrop_claim", user]` |
| staking_state | `[b"staking_state"]` |
| user_stake | `[b"user_stake", user, stake_index.to_le_bytes()]` |

### Devnet Vault 地址

| Vault | 地址 |
|-------|------|
| 30分钟池 | `J4VwzLdrpvjCsykP7P7JUR4UhvTdLnfyjcgysdQ8YuZG` |
| 小时池 | `FJW1LuZMZbD5qobN95fMFwNQoYis23CmopZBVqzB4Xps` |
| 日池 | `GNXJ7eEtBHvh6K4Ppi3SX6skKTu7NuWCgXr99DyUeu4G` |
| 空投库 | `Gagc5bk5pNh1sk79gs13W4RSK2wwZusdSFT9ZBMAwYUo` |
| 推荐奖励库 | `85HhmvBsE6VNGYWMWdC9WCK47mPLCVrsHGu1PxokY9xS` |
| 储备配捐库 | `78zVf9GNc2DZU87jS6R5qYS4A5cdZrzR15t1LqZmboRL` |
| 奖金托管库 | `G7NNS4QdM1Zau543TwdtBHwWa9UG4U1zVzAf3eS55SCK` |
| 平台手续费 | `2Gq8ZCP1jg3FXKaMJeEQCBJuyv1VznW5ZvYdVJvKiJQe` |

---

## 本地开发

### 环境要求

- Node.js 18+
- Rust + cargo-build-sbf
- Anchor CLI 0.29
- Solana CLI（配置到 devnet）

### 启动前端

```bash
cd frontend
npm install
npm start          # http://localhost:3000
```

### 编译合约

```bash
cargo build-sbf --manifest-path smart-contract/programs/royalpot/Cargo.toml
```

### 部署到 Devnet

```bash
cd smart-contract
anchor deploy

# 初始化协议（仅首次部署后执行）
node scripts/init-protocol.js
```

### 运行定时开奖（本地测试）

```bash
node scripts/cron-draw.js
```

---

## 前端部署（Vercel）

```bash
cd frontend
vercel build --prod --token <VERCEL_TOKEN>
vercel deploy --prod --prebuilt --token <VERCEL_TOKEN>
```

---

## 钱包兼容性

| 钱包 | 支持 | 签名方式 |
|------|------|---------|
| Phantom（浏览器插件） | ✅ | VersionedTransaction (v0) |
| Solflare（浏览器插件） | ✅ | VersionedTransaction (v0) |
| WalletConnect 手机钱包 | ✅ | Legacy Transaction（自动检测） |

SDK 内部 `_sendTx` 使用双路径策略：
- 检测到 WalletConnect（`adapter.signAndSendTransaction` 存在）→ 优先 `solana_signAndSendTransaction`，回退 Legacy Transaction，**绝不使用 VersionedTransaction**（v0 会导致手机钱包 WS session 断开 1001）
- 其他钱包 → VersionedTransaction (v0)

---

## 代币分配

**总量**: 10 亿 TPOT

| 用途 | 比例 | 数量 |
|------|------|------|
| 空投 | 20% | 2 亿 |
| 质押奖励 | 25% | 2.5 亿 |
| 推广奖励 | 20% | 2 亿 |
| 游戏储备 | 5% | 5000 万 |
| 团队 | 15% | 1.5 亿（2年线性释放）|
| DEX 流动性 | 10% | 1 亿 |
| 生态发展 | 5% | 5000 万 |

---

## 许可证

MIT License — 详见 [LICENSE](LICENSE)

---

⚠️ **风险提示**: TykhePot 仅供娱乐用途，不构成投资建议。加密货币投资有风险，请谨慎参与。
