# TykhePot Devnet 部署验证指南

## 当前状态

**时间**: 2026-02-19  
**网络**: Solana Devnet  
**钱包**: 7xSpqbSG9ikANXGDxtsn66a2GfDPKQCpHjiuCQUoJGcL  
**余额**: 0 SOL (需要获取)  

---

## 步骤 1: 获取 Devnet SOL

由于空投限流，使用以下方式：

### 方式 1: 网页 Faucet (推荐)
```
1. 访问 https://faucet.solana.com/
2. 选择 Devnet
3. 输入: 7xSpqbSG9ikANXGDxtsn66a2GfDPKQCpHjiuCQUoJGcL
4. 点击 Confirm Airdrop
5. 等待 5-10 秒，收到 2 SOL
```

### 方式 2: Discord
```
1. 加入 https://discord.gg/solana
2. 进入 #devnet-faucet 频道
3. 发送: !drop 7xSpqbSG9ikANXGDxtsn66a2GfDPKQCpHjiuCQUoJGcL
```

### 方式 3: QuickNode
```
https://faucet.quicknode.com/solana/devnet
```

---

## 步骤 2: 验证余额

```bash
export PATH="$HOME/.local/bin:$PATH"
solana balance
```

预期输出: `2 SOL` 或更多

---

## 步骤 3: 部署合约

```bash
cd ~/Desktop/TykhePot
./deploy.sh devnet
```

或手动执行:

```bash
cd smart-contract
npm install
anchor build
anchor deploy --provider.cluster devnet
```

---

## 步骤 4: 初始化合约

```bash
npm run initialize:devnet
```

---

## 步骤 5: 验证部署

### 检查合约
```bash
# 查看程序 ID
solana program show <PROGRAM_ID>

# 查看账户
solana account <STATE_PDA>
```

### Solscan 查看
- 访问: https://solscan.io/?cluster=devnet
- 搜索程序 ID 或交易签名

---

## 步骤 6: 前端配置

更新 `frontend/.env`:

```
REACT_APP_SOLANA_NETWORK=devnet
REACT_APP_PROGRAM_ID=<部署后生成的程序ID>
REACT_APP_TOKEN_MINT=<TPOT代币地址>
REACT_APP_STATE_PDA=<状态PDA地址>
```

---

## 步骤 7: 功能测试

### 测试清单

- [ ] 连接钱包
- [ ] 查看余额
- [ ] 参与小时池 (200 TPOT)
- [ ] 参与天池 (100 TPOT)
- [ ] 查看用户历史
- [ ] 查看排行榜
- [ ] 测试推广链接
- [ ] 测试空投领取

### 测试页面
访问: `http://localhost:3000/test`

---

## 步骤 8: 压力测试

### 并发测试
```bash
# 模拟多用户同时参与
# 使用脚本批量发送交易
```

### 边界测试
- 最小投入 (200 TPOT)
- 最大投入 (100K TPOT)
- 开奖时间边界
- 空奖池情况

---

## 预期结果

### 部署成功标志
1. ✅ 合约程序 ID 生成
2. ✅ TPOT 代币创建
3. ✅ 状态账户初始化
4. ✅ 前端可以连接
5. ✅ 交易可以发送

### 功能正常标志
1. ✅ 存款交易成功
2. ✅ 开奖逻辑正确
3. ✅ 奖金分配正确
4. ✅ 事件正常触发

---

## 常见问题

### Q: 部署失败 "Insufficient funds"
A: 需要至少 2-3 SOL，通过 Faucet 获取

### Q: "Program failed to complete"
A: 可能是账户空间不足或权限问题，检查日志

### Q: 交易超时
A: Devnet 可能拥堵，增加计算预算或稍后重试

### Q: 代币显示不正确
A: 需要添加代币元数据（符号、小数位）

---

## 验证脚本

创建 `verify-deployment.sh`:

```bash
#!/bin/bash

echo "🔍 部署验证"
echo "==========="

# 检查余额
echo "1. 检查余额..."
solana balance

# 检查程序
echo "2. 检查合约程序..."
solana program show <PROGRAM_ID>

# 检查代币
echo "3. 检查代币..."
spl-token supply <TOKEN_MINT>

# 检查状态账户
echo "4. 检查状态账户..."
solana account <STATE_PDA>

echo "✅ 验证完成"
```

---

## 下一步

部署验证完成后:
1. 📋 记录所有地址
2. 🧪 全面功能测试
3. 📝 更新文档
4. 🚀 准备主网部署

---

**准备就绪，等待 SOL 获取后立即部署！**
