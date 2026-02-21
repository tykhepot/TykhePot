# TykhePot Devnet 部署指南

## 环境准备

### 1. 安装 Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
```

### 2. 配置 Devnet
```bash
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2  # 获取测试SOL
```

### 3. 安装 Anchor
```bash
cargo install --git https://github.com/coral-xyz/anchor avm
avm install latest
avm use latest
```

## 部署步骤

### 1. 安装依赖
```bash
cd royalpot-contract
npm install
```

### 2. 构建合约
```bash
anchor build
```

### 3. 部署到 Devnet
```bash
npm run deploy:devnet
```

这将执行以下操作：
- 创建 TPOT 代币
- 部署合约
- 初始化合约状态
- 配置各资金池
- 更新前端配置

### 4. 验证部署
```bash
# 查看部署信息
cat deploys/devnet-*.json

# Solscan 上查看
# https://solscan.io/?cluster=devnet
```

## 前端配置

部署成功后，前端配置会自动更新到：
```
royalpot-frontend/src/config/devnet.json
```

前端需要的环境变量：
```bash
REACT_APP_SOLANA_NETWORK=devnet
REACT_APP_PROGRAM_ID=<部署后生成的程序ID>
REACT_APP_TOKEN_MINT=<TPOT代币地址>
```

## 测试合约

### 1. 获取测试 TPOT
部署脚本会自动铸造测试代币到部署者钱包。

### 2. 参与测试
```bash
# 运行测试脚本
anchor test
```

### 3. 手动测试
1. 打开前端页面
2. 连接钱包 (Phantom/Solflare Devnet模式)
3. 获取测试代币
4. 参与小时池/天池

## 常见问题

### Q: 部署失败 "Insufficient funds"
A: 需要先获取 Devnet SOL:
```bash
solana airdrop 2
```

### Q: 代币账户不存在
A: 需要先创建 Associated Token Account:
```bash
spl-token create-account <TOKEN_MINT>
```

### Q: 合约调用失败
A: 检查：
1. 是否正确切换到 devnet
2. 钱包是否有足够 SOL
3. 是否有 TPOT 代币

## 重要地址 (部署后填写)

| 项目 | 地址 | 备注 |
|------|------|------|
| 程序ID | TBD | 合约程序地址 |
| TPOT代币 | TBD | SPL Token地址 |
| 状态PDA | TBD | 协议状态账户 |
| 部署者 | TBD | 部署钱包地址 |

## 下一步

1. ✅ Devnet 部署
2. 🔄 前端测试
3. 🔄 功能验证
4. ⏳ 主网部署准备
