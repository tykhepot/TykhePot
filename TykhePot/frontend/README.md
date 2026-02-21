# RoyalPot 前端

基于 React + Solana Wallet Adapter 的去中心化抽奖平台前端。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm build
```

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── Layout.js       # 页面布局
│   ├── PoolCard.js     # 奖池卡片
│   ├── StatsSection.js # 统计区域
│   └── WalletButton.js # 钱包按钮
├── pages/              # 页面组件
│   ├── Home.js         # 首页
│   ├── HourlyPool.js   # 小时池
│   ├── DailyPool.js    # 天池
│   ├── Staking.js      # 质押页面
│   ├── Airdrop.js      # 空投页面
│   └── Referral.js     # 推广页面
├── context/            # React Context
│   └── AppContext.js   # 全局状态
├── hooks/              # 自定义 Hooks
│   └── useRoyalPot.js  # 合约交互
├── utils/              # 工具函数
│   └── helpers.js      # 辅助函数
├── App.js              # 应用入口
├── styles.css          # 全局样式
└── index.js            # 渲染入口
```

## 🎨 设计系统

### 品牌色
- 主色: `#6B21A8` (紫色)
- 金色: `#FFD700` (金色)
- 深色: `#0A0A0A` (背景)
- 卡片: `#1A1A2E` (卡片背景)

### 字体
- 系统默认字体栈
- 中文: 系统默认中文字体

## 🔗 合约集成

```javascript
// 使用 SDK 与合约交互
import { useRoyalPot } from './hooks/useRoyalPot';

const { deposit, claim, getUserStats } = useRoyalPot();
```

## 📱 响应式设计

- 桌面: 1200px+
- 平板: 768px - 1199px
- 手机: < 768px

## 🌐 网络配置

默认连接到 Devnet，通过环境变量切换:

```bash
# Devnet (默认)
REACT_APP_SOLANA_NETWORK=devnet

# Mainnet
REACT_APP_SOLANA_NETWORK=mainnet
```

## 📦 部署

推荐使用 Vercel:

```bash
npm i -g vercel
vercel --prod
```

或手动部署到任何静态托管服务。

---

*RoyalPot - 公平透明的链上娱乐*
