import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// 程序ID
export const ROYALPOT_PROGRAM_ID = new PublicKey('RoyaltPot1111111111111111111111111111111111');

// 常量
export const BURN_RATE = 0.03;
export const PLATFORM_RATE = 0.02;
export const REFERRAL_RATE = 0.08;
export const HOURLY_MIN_DEPOSIT = 200;
export const DAILY_MIN_DEPOSIT = 100;

export interface DepositResult {
  burnAmount: number;
  platformFee: number;
  prizeAmount: number;
  reserveMatch: number;
  referralReward: number;
  tickets: number;
}

export interface PrizeDistribution {
  first: { percentage: number; winners: number };
  second: { percentage: number; winners: number };
  third: { percentage: number; winners: number };
  lucky: { percentage: number; winners: number };
  universal: { percentage: number };
}

export const PRIZE_DISTRIBUTION: PrizeDistribution = {
  first: { percentage: 30, winners: 1 },
  second: { percentage: 20, winners: 2 },
  third: { percentage: 15, winners: 3 },
  lucky: { percentage: 10, winners: 5 },
  universal: { percentage: 20 },
};

export class RoyalPotSDK {
  private program: Program;
  private provider: AnchorProvider;

  constructor(provider: AnchorProvider, programId?: PublicKey) {
    this.provider = provider;
    // 这里需要加载IDL
    // this.program = new Program(idl, programId || ROYALPOT_PROGRAM_ID, provider);
  }

  /**
   * 计算投入分配
   */
  static calculateDeposit(
    amount: number,
    hasReferrer: boolean = false,
    hasReserve: boolean = true
  ): DepositResult {
    const burnAmount = amount * BURN_RATE;
    const platformFee = amount * PLATFORM_RATE;
    const userContribution = amount - burnAmount - platformFee;
    
    const reserveMatch = hasReserve ? userContribution : 0;
    const referralReward = hasReferrer ? amount * REFERRAL_RATE : 0;
    const tickets = Math.floor(userContribution);
    
    return {
      burnAmount,
      platformFee,
      prizeAmount: userContribution + reserveMatch,
      reserveMatch,
      referralReward,
      tickets,
    };
  }

  /**
   * 计算普惠奖
   */
  static calculateUniversalPrize(
    totalPool: number,
    userTickets: number,
    totalTickets: number
  ): number {
    const universalPool = totalPool * 0.20; // 20% for universal
    return (universalPool * userTickets) / totalTickets;
  }

  /**
   * 计算vesting释放
   */
  static calculateVestingClaim(
    totalAmount: number,
    startTime: number,
    currentTime: number
  ): { claimable: number; remaining: number } {
    const DAYS_TO_RELEASE = 20;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    
    const daysPassed = Math.floor((currentTime - startTime) / MS_PER_DAY);
    const releasableDays = Math.min(daysPassed, DAYS_TO_RELEASE);
    
    const dailyRelease = totalAmount / DAYS_TO_RELEASE;
    const totalReleasable = dailyRelease * releasableDays;
    
    return {
      claimable: totalReleasable,
      remaining: totalAmount - totalReleasable,
    };
  }

  /**
   * 获取PDA地址
   */
  static async getStatePDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('state')],
      ROYALPOT_PROGRAM_ID
    );
  }

  static async getUserPDA(user: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user'), user.toBuffer()],
      ROYALPOT_PROGRAM_ID
    );
  }

  /**
   * 获取下一次开奖时间
   */
  static getNextDrawTime(lastDrawTime: number, isDaily: boolean): Date {
    const interval = isDaily ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    const nextDraw = lastDrawTime + interval;
    return new Date(nextDraw);
  }

  /**
   * 检查是否在锁仓期
   */
  static isPoolLocked(lastDrawTime: number, isDaily: boolean): boolean {
    const now = Date.now();
    const lockDuration = 5 * 60 * 1000; // 5分钟
    const drawInterval = isDaily ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    
    const nextDraw = lastDrawTime + drawInterval;
    return now >= nextDraw - lockDuration;
  }

  /**
   * 格式化金额显示
   */
  static formatAmount(amount: number, decimals: number = 9): string {
    const value = amount / Math.pow(10, decimals);
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
}

// React Hook 示例
export const useRoyalPot = () => {
  // TODO: 实现React Hook用于前端状态管理
  return {
    depositHourly: async () => {},
    depositDaily: async () => {},
    claimPrize: async () => {},
    getUserStats: async () => {},
  };
};

// 工具函数
export const generateReferralCode = (userPubkey: PublicKey): string => {
  return `ROYAL-${userPubkey.toBase58().slice(0, 8).toUpperCase()}`;
};

export const parseReferralCode = (code: string): string | null => {
  const match = code.match(/^ROYAL-([A-Z0-9]{8})$/);
  return match ? match[1] : null;
};
