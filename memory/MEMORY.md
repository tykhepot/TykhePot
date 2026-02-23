# TykhePot 项目核心记忆

## 🎯 项目定位
Solana链上彩票协议，目标是成为去中心化彩票基础设施。

## 💡 核心创新
- **自动分发**: 所有奖金在开奖时自动分发，中奖无需手动领取
- **回流机制**: 5%回流保证奖池持续增长
- **幸运奖**: 独特设计，5人各2%，提高参与感
- **票号系统**: 每笔存款对应唯一票号，链上可查
- **空投锁定**: 空投代币只能投入天池，不能转走（推广核心）

## 📊 经济模型 (更新)
```
用户存款: 100% (扣除3%销毁)
├── 奖池: 97% (用户存款 - 销毁)
└── 开奖时提取:
    ├── 平台费 2% → 自动到账平台钱包
    ├── 奖金分配 95% → 用户
    └── 回流 5% → 下期奖池

注意: 平台费不在存款时扣除，在开奖时从奖池自动提取
```

## 🔧 空投锁定机制
```
claim_airdrop():
├── 记录 airdrop_claimed = true
├── 记录 airdrop_balance = 100 TPOT
└── 代币保留在vault中（不转出）

deposit_daily_with_airdrop(amount):
├── 检查 airdrop_claimed == true
├── 检查 airdrop_balance >= amount
├── 扣减 airdrop_balance
└── 进入天池参与游戏

限制:
└── 锁定余额只能投入天池，不能转走
```

## 🔧 技术要点
- 随机数：当前用timestamp+票数种子，生产需Switchboard VRF
- 账户用UncheckedAccount减少栈占用
- <10人参与则存款返回储备池，不开奖
- State空间: 128字节, UserData自动扩展

## 📌 待办事项
- [ ] 主网上线前集成Switchboard VRF
- [ ] 合约审计
- [ ] 前端UI支持空投锁定功能

## 📌 关键地址
- Devnet合约: `5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b`
- Token: `FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY`
- 前端: `https://www.tykhepot.io`
- GitHub: `github.com/tykhepot/TykhePot`
