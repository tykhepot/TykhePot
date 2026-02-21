// TykhePot Demo SDK - 模拟模式，无需真实合约
// 用于演示和 UI 测试

const DEMO_DATA = {
  wallet: {
    address: 'BUCYeeS2ZWqFnTEV2bNQnmvHGkZPAoGJiNaMmRf39s1h',
    balance: 1000000, // 1M TPOT
    staked: {
      short: { amount: 50000, lockedUntil: Date.now() + 30 * 24 * 60 * 60 * 1000 },
      long: { amount: 200000, lockedUntil: Date.now() + 180 * 24 * 60 * 60 * 1000 }
    },
    tickets: {
      hourly: 5,
      daily: 3
    },
    airdropClaimed: false,
    referralCode: 'TYKHE123',
    referrals: 12,
    referralEarnings: 15000
  },
  pools: {
    hourly: {
      totalDeposits: 50000,
      participants: 87,
      nextDraw: Date.now() + 3600 * 1000,
      lastWinner: '7xSp...GcL',
      lastPrize: 15000
    },
    daily: {
      totalDeposits: 250000,
      participants: 234,
      reservePool: 50000,
      nextDraw: Date.now() + 86400 * 1000,
      lastWinner: 'BUCY...9s1h',
      lastPrize: 75000
    }
  },
  leaderboard: [
    { rank: 1, address: '7xSp...GcL', totalWon: 500000, winCount: 15 },
    { rank: 2, address: 'BUCY...9s1h', totalWon: 320000, winCount: 12 },
    { rank: 3, address: '3xK9...mN2p', totalWon: 180000, winCount: 8 },
    { rank: 4, address: '9aBc...xYz1', totalWon: 95000, winCount: 5 },
    { rank: 5, address: '2fGh...jKl4', totalWon: 68000, winCount: 4 }
  ],
  recentWins: [
    { time: '2分钟前', address: '7xSp...GcL', pool: '小时池', amount: 12000 },
    { time: '15分钟前', address: 'BUCY...9s1h', pool: '小时池', amount: 8500 },
    { time: '1小时前', address: '3xK9...mN2p', pool: '天池', amount: 45000 },
    { time: '3小时前', address: '9aBc...xYz1', pool: '小时池', amount: 15000 },
    { time: '5小时前', address: '2fGh...jKl4', pool: '天池', amount: 32000 }
  ]
};

// 延迟模拟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class TykhePotDemoSDK {
  constructor(connection, wallet) {
    this.connection = connection;
    this.wallet = wallet;
    this.isDemo = true;
  }

  // 获取用户状态
  async getUserState() {
    await delay(500);
    return DEMO_DATA.wallet;
  }

  // 获取奖池状态
  async getPoolState(poolType) {
    await delay(300);
    return poolType === 'hourly' ? DEMO_DATA.pools.hourly : DEMO_DATA.pools.daily;
  }

  // 参与奖池（模拟）
  async deposit(poolType, amount) {
    await delay(1000);
    console.log(`[DEMO] Deposited ${amount} TPOT to ${poolType} pool`);
    return { signature: 'demo_tx_' + Date.now(), success: true };
  }

  // 质押（模拟）
  async stake(amount, duration) {
    await delay(1000);
    console.log(`[DEMO] Staked ${amount} TPOT for ${duration} days`);
    return { signature: 'demo_stake_' + Date.now(), success: true };
  }

  // 领取空投（模拟）
  async claimAirdrop() {
    await delay(800);
    if (DEMO_DATA.wallet.airdropClaimed) {
      throw new Error('Already claimed');
    }
    DEMO_DATA.wallet.airdropClaimed = true;
    DEMO_DATA.wallet.balance += 1000;
    return { signature: 'demo_airdrop_' + Date.now(), amount: 1000 };
  }

  // 获取排行榜
  async getLeaderboard() {
    await delay(300);
    return DEMO_DATA.leaderboard;
  }

  // 获取用户历史
  async getUserHistory() {
    await delay(400);
    return {
      deposits: [
        { time: '2026-02-19 20:30', pool: '小时池', amount: 200 },
        { time: '2026-02-19 19:15', pool: '天池', amount: 100 },
        { time: '2026-02-19 18:00', pool: '小时池', amount: 500 }
      ],
      wins: [
        { time: '2026-02-19 15:30', pool: '小时池', amount: 1200, type: '三等奖' },
        { time: '2026-02-18 22:00', pool: '天池', amount: 5000, type: '普惠奖' }
      ]
    };
  }

  // 获取最近中奖
  async getRecentWins() {
    await delay(300);
    return DEMO_DATA.recentWins;
  }

  // 获取推广信息
  async getReferralInfo() {
    await delay(300);
    return {
      code: DEMO_DATA.wallet.referralCode,
      referrals: DEMO_DATA.wallet.referrals,
      earnings: DEMO_DATA.wallet.referralEarnings,
      link: `https://tykhepot.com/?ref=${DEMO_DATA.wallet.referralCode}`
    };
  }
}

export default TykhePotDemoSDK;
