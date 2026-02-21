# TykhePot Devnet 部署钱包

**创建时间**: 2026-02-19
**网络**: Solana Devnet

## 钱包信息

**公钥地址**: `7xSpqbSG9ikANXGDxtsn66a2GfDPKQCpHjiuCQUoJGcL`

**助记词（ seed phrase ）**:
```
sound couch bring easily gym desk carry wood kingdom steel snake buffalo
```

**私钥文件位置**: `~/.config/solana/id.json`

⚠️ **重要**: 
- 助记词是恢复钱包的唯一方式，请妥善保管
- 不要分享给任何人
- 这是 devnet 测试钱包，不要转入真实资金

## 获取 Devnet SOL

由于当前 airdrop 限流，请通过以下方式获取 SOL：

### 方式 1: 网页 Faucet
访问: https://faucet.solana.com/
输入地址: 7xSpqbSG9ikANXGDxtsn66a2GfDPKQCpHjiuCQUoJGcL

### 方式 2: Discord Faucet
加入: https://discord.gg/solana
在 #devnet-faucet 频道发送: `!drop 7xSpqbSG9ikANXGDxtsn66a2GfDPKQCpHjiuCQUoJGcL`

### 方式 3: 稍后再试
```bash
solana airdrop 2
```

## 部署准备

当钱包有 SOL 后，执行：

```bash
cd ~/.openclaw/workspace/royalpot-contract
export PATH="$HOME/.local/bin:$PATH"
npm run deploy:devnet
```

## 部署后检查

部署完成后，在 Solscan Devnet 查看：
https://solscan.io/?cluster=devnet
