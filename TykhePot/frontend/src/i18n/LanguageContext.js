import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    // Navigation
    home: 'Home',
    hourlyPool: 'Hourly Pool',
    dailyPool: 'Daily Pool',
    staking: 'Staking',
    airdrop: 'Airdrop',
    referral: 'Referral',
    history: 'History',
    leaderboard: 'Leaderboard',
    faq: 'FAQ',
    connectWallet: 'Connect Wallet',
    
    // Hero
    heroTitle: 'TykhePot',
    heroSubtitle: 'The On-Chain Lottery of Lady Fortune',
    heroDescription: 'Tykhe - The Greek Goddess of Fortune. A fair and transparent entertainment protocol on Solana, where destiny is decided on-chain.',
    joinNow: '🎰 Join Now',
    whitepaper: '📄 Whitepaper',
    
    // Stats
    totalPool: 'Total Pool',
    totalBurned: 'Total Burned',
    onlinePlayers: 'Online Players',
    
    // Pools
    choosePool: 'Choose Your Pool',
    hourlyTitle: '⏰ Hourly Pool',
    hourlyDesc: 'Draws every hour, fast-paced gaming',
    dailyTitle: '🌙 Daily Pool',
    dailyDesc: 'Daily grand prize with referral rewards',
    minDeposit: 'Min Deposit',
    currentPool: 'Current Pool',
    nextDraw: 'Next Draw',
    participants: 'Participants',
    enterPool: 'Enter Pool',
    poolInfo: 'Pool Info',
    joinNowBtn: 'Join Now',
    prizeDistribution: 'Prize Distribution',
    fundAllocation: 'Fund Allocation',
    
    // Features
    featuresTitle: 'Why TykhePot?',
    fairTitle: '🔮 Fair & Transparent',
    fairDesc: 'All lottery results generated on-chain using verifiable randomness',
    burnTitle: '🔥 Deflationary',
    burnDesc: '3% of every deposit is permanently burned, creating scarcity',
    prizeTitle: '💰 Generous Rewards',
    prizeDesc: '95% of deposits go to prize pools, only 2% platform fee',
    airdropTitle: '🎁 Free Airdrop',
    airdropDesc: '100 TPOT free for every wallet! One-time claim, no requirements.',
    
    // Staking
    stakingTitle: 'Staking',
    shortTerm: 'Short Term (30 days)',
    longTerm: 'Long Term (180 days)',
    apr: 'APR',
    stake: 'Stake',
    withdraw: 'Withdraw',
    myStakes: 'My Stakes',
    stakingFaq: 'Staking FAQ',
    stakingSuccessful: 'Staking successful!',
    
    // Airdrop
    airdropClaim: 'Claim Airdrop',
    airdropSubtitle: 'Free 100 TPOT for every wallet! One-time claim.',
    totalAirdropPool: 'Total Airdrop Pool',
    myAirdropStatus: 'My Airdrop Status',
    airdropRules: 'Airdrop Rules',
    needParticipate: 'Every wallet can claim 100 TPOT for FREE! One-time only.',
    participateHourly: 'Participate Hourly',
    participateDaily: 'Participate Daily',
    airdropAvailable: 'Airdrop Available',
    claimAirdrop: 'Claim 100 TPOT',
    claiming: 'Claiming...',
    claimed: 'You have claimed',
    formula: 'Formula',
    claimableAirdrop: 'Claimable Airdrop',
    minProfitRequirement: 'Min profit requirement: 1,000 TPOT',
    rule1: 'Participate in Hourly or Daily pool games.',
    rule2: 'Earn profits through prizes or staking.',
    rule3: 'Claimable = Total Profits × 10, max 10,000 TPOT.',
    
    // Referral
    referralTitle: 'Referral Rewards',
    myReferralLink: 'My Referral Link',
    copyLink: 'Copy Link',
    referralMechanism: 'Referral Mechanism',
    referralRecords: 'Referral Records',
    referralTips: 'Referral Tips',
    
    // Leaderboard
    recentWinners: 'Recent Winners',
    topWinners: 'Top Winners',
    leaderboardUpdated: 'Leaderboard updates every hour. Be an active player!',
    
    // History
    myHistory: 'My History',
    
    // Contract Test
    contractTest: 'Contract Test',
    connectWalletFirst: 'Please connect wallet first',
    contractIntegrationTest: 'Contract Integration Test',
    error: 'Error',
    balance: 'Balance',
    hourlyPoolTotal: 'Hourly Pool',
    dailyPoolTotal: 'Daily Pool',
    hourlyTickets: 'Hourly Tickets',
    dailyTickets: 'Daily Tickets',
    participating: 'Processing...',
    claimPrize: 'Claim Prize',
    
    // FAQ
    frequentlyAskedQuestions: 'Frequently Asked Questions',
    joinCommunity: 'Join our community for help',
    
    // Alerts
    walletNotConnected: 'Please connect wallet first',
    contractPaused: 'Contract is paused',
    minDeposit100: 'Minimum deposit is 100 TPOT',
    insufficientBalance: 'Insufficient balance',
    invalidReferrer: 'Invalid referrer address',
    cannotUseOwnAddress: 'Cannot use your own address as referrer',
    depositSuccess: 'Deposit successful!',
    depositFailed: 'Deposit failed',
    erroroccurred: 'Error occurred',
    
    // Language
    language: 'Language',
    english: 'English',
    chinese: '中文',
  },
  zh: {
    // Navigation
    home: '首页',
    hourlyPool: '小时池',
    dailyPool: '天池',
    staking: '质押',
    airdrop: '空投',
    referral: '推广',
    history: '历史',
    leaderboard: '排行榜',
    faq: '常见问题',
    connectWallet: '连接钱包',
    
    // Hero
    heroTitle: 'TykhePot',
    heroSubtitle: '幸运女神的链上奖池',
    heroDescription: 'Tykhe（堤喀）- 古希腊幸运女神的奖池。基于 Solana 的公平透明娱乐协议，命运由链上裁决',
    joinNow: '🎰 立即参与',
    whitepaper: '📄 查看白皮书',
    
    // Stats
    totalPool: '总奖池',
    totalBurned: '累计销毁',
    onlinePlayers: '在线玩家',
    
    // Pools
    choosePool: '选择奖池',
    hourlyTitle: '⏰ 小时池',
    hourlyDesc: '每小时开奖，快节奏游戏',
    dailyTitle: '🌙 天池',
    dailyDesc: '每日大奖，推广有奖励',
    minDeposit: '最低投入',
    currentPool: '当前奖池',
    nextDraw: '下次开奖',
    participants: '参与人数',
    enterPool: '进入奖池',
    poolInfo: '奖池信息',
    joinNowBtn: '立即参与',
    prizeDistribution: '奖金分配',
    fundAllocation: '资金分配说明',
    
    // Features
    featuresTitle: '为什么选择 TykhePot？',
    fairTitle: '🔮 公平透明',
    fairDesc: '所有开奖结果链上生成，使用可验证的随机数',
    burnTitle: '🔥 通缩机制',
    burnDesc: '每笔投入的 3% 永久销毁，创造稀缺性',
    prizeTitle: '💰 丰厚奖励',
    prizeDesc: '95% 投入进入奖池，仅 2% 平台费用',
    airdropTitle: '🎁 免费空投',
    airdropDesc: '每个钱包可免费领取100 TPOT！仅限一次，无需任何条件。',
    
    // Staking
    stakingTitle: '质押',
    shortTerm: '短期质押 (30天)',
    longTerm: '长期质押 (180天)',
    apr: '年化收益',
    stake: '质押',
    withdraw: '赎回',
    myStakes: '我的质押',
    stakingFaq: '质押常见问题',
    stakingSuccessful: '质押成功！',
    
    // Airdrop
    airdropClaim: '领取空投',
    airdropSubtitle: '每个钱包可免费领取100 TPOT！仅限一次。',
    totalAirdropPool: '总空投池',
    myAirdropStatus: '我的空投状态',
    airdropRules: '空投规则',
    needParticipate: '每个钱包可免费领取100 TPOT！仅限一次。',
    participateHourly: '参与小时池',
    participateDaily: '参与天池',
    airdropAvailable: '可领空投',
    claimAirdrop: '立即领取100 TPOT',
    claiming: '领取中...',
    claimed: '您已领取空投',
    formula: '计算公式',
    claimableAirdrop: '可领空投',
    minProfitRequirement: '最低获利要求: 1,000 TPOT',
    rule1: '每个钱包地址可免费领取100 TPOT空投。',
    rule2: '仅限领取一次，无法重复领取。',
    rule3: '领取后可在奖池中使用或参与质押。',
    
    // Referral
    referralTitle: '推广奖励',
    myReferralLink: '我的推广链接',
    copyLink: '复制链接',
    referralMechanism: '推广奖励机制',
    referralRecords: '推广记录',
    referralTips: '推广技巧',
    
    // Leaderboard
    recentWinners: '最近大奖',
    topWinners: '排行榜',
    leaderboardUpdated: '排行榜每小时更新一次。成为活跃玩家，也许下一个幸运儿就是你！',
    
    // History
    myHistory: '我的历史',
    
    // Contract Test
    contractTest: '合约测试',
    connectWalletFirst: '请先连接钱包',
    contractIntegrationTest: '合约集成测试',
    error: '错误',
    balance: '余额',
    hourlyPoolTotal: '小时池',
    dailyPoolTotal: '天池',
    hourlyTickets: '小时池票数',
    dailyTickets: '天池票数',
    participating: '处理中...',
    claimPrize: '领取奖金',
    
    // FAQ
    frequentlyAskedQuestions: '常见问题',
    joinCommunity: '加入我们的社区获取帮助',
    
    // Alerts
    walletNotConnected: '请先连接钱包',
    contractPaused: '合约已暂停',
    minDeposit100: '最低投入 100 TPOT',
    insufficientBalance: '余额不足',
    invalidReferrer: '邀请人地址无效',
    cannotUseOwnAddress: '不能使用自己的地址作为邀请人',
    depositSuccess: '参与成功！',
    depositFailed: '参与失败',
    erroroccurred: '错误',
    
    // Language
    language: '语言',
    english: 'English',
    chinese: '中文',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en'); // 默认英文
  
  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };
  
  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
}
