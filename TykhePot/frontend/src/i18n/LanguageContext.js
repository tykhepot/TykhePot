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
    
    // Features
    featuresTitle: 'Why TykhePot?',
    fairTitle: '🔮 Fair & Transparent',
    fairDesc: 'All lottery results generated on-chain using verifiable randomness',
    burnTitle: '🔥 Deflationary',
    burnDesc: '3% of every deposit is permanently burned, creating scarcity',
    prizeTitle: '💰 Generous Rewards',
    prizeDesc: '95% of deposits go to prize pools, only 2% platform fee',
    
    // Staking
    stakingTitle: 'Staking',
    shortTerm: 'Short Term (30 days)',
    longTerm: 'Long Term (180 days)',
    apr: 'APR',
    stake: 'Stake',
    withdraw: 'Withdraw',
    
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
    
    // Features
    featuresTitle: '为什么选择 TykhePot？',
    fairTitle: '🔮 公平透明',
    fairDesc: '所有开奖结果链上生成，使用可验证的随机数',
    burnTitle: '🔥 通缩机制',
    burnDesc: '每笔投入的 3% 永久销毁，创造稀缺性',
    prizeTitle: '💰 丰厚奖励',
    prizeDesc: '95% 投入进入奖池，仅 2% 平台费用',
    
    // Staking
    stakingTitle: '质押',
    shortTerm: '短期质押 (30天)',
    longTerm: '长期质押 (180天)',
    apr: '年化收益',
    stake: '质押',
    withdraw: '赎回',
    
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
    return translations[language][key] || key;
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
