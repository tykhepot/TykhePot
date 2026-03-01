# TykhePot 部署指南

本文档详细说明如何部署 TykhePot 协议到 Solana 主网。

---

## 目录

1. [前置条件](#前置条件)
2. [智能合约部署](#智能合约部署)
3. [VRF 配置](#vrf-配置)
4. [协议初始化](#协议初始化)
5. [前端部署](#前端部署)
6. [Cron 服务部署](#cron-服务部署)
7. [安全检查清单](#安全检查清单)

---

## 前置条件

### 1. 环境要求

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# 安装 Anchor CLI
npm install -g @coral-xyz/anchor-cli@0.30.0

# 安装 Node.js 依赖
cd smart-contract && npm install
cd ../frontend && npm install
```

### 2. 配置 Solana CLI

```bash
# 配置到主网
solana config set --url mainnet-beta

# 检查配置
solana config get

# 确保有足够 SOL（建议至少 10 SOL）
solana balance
```

### 3. 准备密钥

```bash
# 生成部署密钥（如果还没有）
solana-keygen new --outfile ~/.config/solana/tykhepot-deploy.json

# 设置为默认密钥
solana config set --keypair ~/.config/solana/tykhepot-deploy.json

# 生成 Cron 服务密钥
solana-keygen new --outfile ~/.config/solana/tykhepot-cron.json
```

---

## 智能合约部署

### 1. 编译合约

```bash
cd TykhePot/smart-contract

# 构建
anchor build

# 检查程序大小
ls -lh target/deploy/royalpot.so
```

### 2. 获取程序 ID

```bash
# 如果是新部署，生成新的程序密钥
solana-keygen new --no-bip39-passphrase -o target/deploy/royalpot-keypair.json

# 获取程序 ID
solana-keygen pubkey target/deploy/royalpot-keypair.json
```

**重要**: 更新以下文件中的 `PROGRAM_ID`:
- `programs/royalpot/src/lib.rs` (declare_id!)
- `frontend/src/config/contract.js`
- `scripts/cron-draw-vrf.js`

### 3. 部署

```bash
# 检查部署成本
anchor deploy --provider.cluster mainnet --print-overview

# 执行部署
anchor deploy --provider.cluster mainnet
```

### 4. 验证部署

```bash
# 检查程序是否已部署
solana program show <PROGRAM_ID> --url mainnet
```

---

## VRF 配置

### 1. 安装 Switchboard CLI

```bash
npm install -g @switchboard-xyz/cli
```

### 2. 创建 VRF 账户

```bash
# 登录 Switchboard
sb config set --network mainnet

# 创建 VRF
sb create:vrf --queue <SWITCHBOARD_QUEUE>

# 记录输出的 VRF 公钥
```

**Switchboard 主网 VRF Queue**: `8FXqW2fHt7cxh3zGHUTMZv7xJ1V4ePuo5Vn4wYp5kLxM

### 3. 更新配置

```bash
# 设置 VRF 账户地址
node scripts/set-vrf-config.js <VRF_PUBKEY>
```

### 4. 初始化 VRF 状态

```bash
cd smart-contract
ts-node scripts/init-vrf.ts
```

---

## 协议初始化

### 1. 创建 Token 账户

```bash
# 创建各个 Vault 账户（如果还没有）
# 这些通常在 initialize 时自动创建，但需要预存代币

# 常用命令
spl-token create-account <TPOT_MINT>
spl-token transfer <TPOT_MINT> <AMOUNT> <VAULT_ACCOUNT>
```

### 2. 初始化协议

```bash
cd smart-contract

# 运行初始化脚本
ts-node scripts/initialize.ts
```

这会：
1. 创建 `GlobalState` PDA
2. 初始化三个池（30分钟池、小时池、日池）
3. 设置各个 Vault 地址

### 3. 验证初始化

```bash
# 检查 GlobalState
solana account <GLOBAL_STATE_PDA> --url mainnet

# 检查池状态
solana account <POOL_STATE_PDA> --url mainnet
```

---

## 前端部署

### 1. 更新配置

编辑 `frontend/src/config/contract.js`:

```javascript
export const PROGRAM_ID  = "<YOUR_PROGRAM_ID>";
export const TOKEN_MINT  = "<TPOT_MINT>";
export const NETWORK     = "mainnet-beta";
export const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";

// Vault 地址
export const POOL_30MIN_VAULT  = "...";
export const POOL_HOURLY_VAULT = "...";
export const POOL_DAILY_VAULT  = "...";
export const AIRDROP_VAULT     = "...";
export const PLATFORM_FEE_VAULT = "...";
export const REFERRAL_VAULT    = "...";
export const RESERVE_VAULT     = "...";
export const PRIZE_ESCROW_VAULT = "...";
export const VRF_ACCOUNT       = "...";
export const AUTHORITY_WALLET  = "...";
```

### 2. 构建

```bash
cd frontend
npm run build
```

### 3. 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod

# 或者使用环境变量
vercel build --prod --token <VERCEL_TOKEN>
vercel deploy --prod --prebuilt --token <VERCEL_TOKEN>
```

### 4. 配置域名

```bash
# 添加自定义域名
vercel domains add tykhepot.com

# 配置 DNS 记录（按 Vercel 提示操作）
```

---

## Cron 服务部署

### 1. 准备服务器

推荐使用 AWS、GCP 或 DigitalOcean 的轻量实例。

```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 克隆代码
git clone <REPO_URL>
cd TykhePot/TykhePot
npm install
```

### 2. 配置环境变量

创建 `~/.env/tykhepot`:

```bash
# Cron 配置
CRON_KEYPAIR=/path/to/tykhepot-cron.json
RPC_URL=https://api.mainnet-beta.solana.com
POLL_INTERVAL=60000

# Pool Vaults
POOL_30MIN_VAULT=...
POOL_HOURLY_VAULT=...
POOL_DAILY_VAULT=...

# Other Vaults
PLATFORM_FEE_VAULT=...
PRIZE_ESCROW_VAULT=...
REFERRAL_VAULT=...

# VRF
VRF_ACCOUNT=...
VRF_REQUEST_DELAY=30
```

### 3. 使用 PM2 运行

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start scripts/cron-draw-vrf.js --name tykhepot-cron

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs tykhepot-cron
```

### 4. 监控

```bash
# 设置告警（可选）
pm2 install pm2-server-monit
```

---

## 安全检查清单

### 部署前检查

- [ ] 程序 ID 已正确更新到所有文件
- [ ] 所有 Vault 地址已正确配置
- [ ] Authority 钱包密钥安全存储
- [ ] Cron 服务密钥与部署密钥分离
- [ ] RPC 节点稳定可用

### 资金检查

- [ ] Airdrop Vault 有足够 TPOT（100M+）
- [ ] Reserve Vault 有足够 TPOT（用于日池配捐）
- [ ] Referral Vault 有足够 TPOT（用于推荐奖励）
- [ ] Cron 钱包有足够 SOL（建议 5+ SOL）

### 权限检查

- [ ] GlobalState 的 authority 设置正确
- [ ] 各 Vault 的 authority 设置为正确的 PDA
- [ ] 程序升级权限已撤销或设置时间锁

### 功能测试

```bash
# 1. 测试存款
# 在前端存入小额 TPOT

# 2. 测试免费投注
# 领取空投并使用免费投注

# 3. 测试开奖
# 等待开奖时间或手动触发 cron

# 4. 测试奖金归属
# 中奖后每日领取归属奖金

# 5. 测试推荐奖励
# 验证推荐人收到 8% 奖励
```

### 紧急情况处理

**暂停协议**:
```bash
# 使用 Authority 钱包
ts-node scripts/admin-pause.ts
```

**恢复协议**:
```bash
# 需要等待 24 小时时间锁
ts-node scripts/admin-unpause.ts
```

---

## 常见问题

### Q: 开奖失败怎么办？

A: 检查以下内容：
1. Cron 服务是否正常运行
2. Cron 钱包是否有足够 SOL
3. VRF 是否正确配置
4. 查看链上日志定位具体错误

### Q: 如何升级合约？

A: 
1. 构建新版本合约
2. 使用 `solana program deploy --program-id <KEYPAIR>` 升级
3. 更新前端 IDL
4. 重新部署前端

### Q: 如何添加新的池？

A: 调用 `initialize_pool` 指令创建新池 PDA。

---

## 联系方式

如有问题，请联系：
- Email: guo5feng5@gmail.com
- Telegram: t.me/tykhepot
- Discord: discord.gg/tykhepot
