# TykhePot 项目核心记忆

## 🎯 项目定位
Solana链上彩票协议，目标是成为去中心化彩票基础设施。

## 💡 核心创新
- **自动分发**: 所有奖金在开奖时自动分发，中奖无需手动领取
- **回流机制**: 5%回流保证奖池持续增长
- **幸运奖**: 独特设计，5人各2%，提高参与感
- **票号系统**: 每笔存款对应唯一票号，链上可查
- **空投锁定**: 空投代币只能投入天池，不能转走（推广核心）
- **前期配额**: 1:1配捐让前期奖池更丰厚

## 📊 初始代币分配 (10亿TPOT)
| 用途 | 比例 | 数量 | 说明 |
|------|------|------|------|
| 初始流动性 | 5% | 5000万 | DEX流动性 |
| 空投池 | 10% | 1亿 | 100TPOT/人，约1000万用户 |
| 质押奖励池 | 35% | 3.5亿 | 质押用户奖励 |
| 前期奖池配额 | 20% | 2亿 | 1:1配捐，用完即止 |
| 团队代币 | 10% | 1亿 | 4年线性释放 |
| 推广奖励池 | 20% | 2亿 | 推荐奖励 |

## 📊 经济模型 (更新)
```
用户存款: 100% (扣除3%销毁)
├── 奖池: 97% (用户存款 - 销毁 + 前期配额)
└── 开奖时提取:
    ├── 平台费 2% → 自动到账平台钱包
    ├── 奖金分配 93% → 用户
    └── 回流 5% → 下期奖池
```

## 🔧 合约状态查询
- get_pool_status() - 查询各池子余额和状态
- claim_team_tokens() - 团队领取锁定的代币

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
- 规则文档: `TykhePot/RULES.md`
