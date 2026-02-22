import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import TykhePotSDK from '../utils/tykhepot-sdk';

// 计算下一次小时池开奖时间（下一个整点）
const getNextHourlyDraw = () => {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour.getTime();
};

// 计算下一次天池开奖时间（下一个UTC 0点）
const getNextDailyDraw = () => {
  const now = new Date();
  const nextUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return nextUTC.getTime();
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [stats, setStats] = useState({
    totalPool: 0,
    totalBurned: 0,
    onlinePlayers: 0,
    hourlyPool: 0,
    dailyPool: 0,
    hourlyParticipants: 0,
    dailyParticipants: 0,
    hourlyNextDraw: getNextHourlyDraw(),
    dailyNextDraw: getNextDailyDraw(),
    isLoading: true,
    isPaused: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [sdk, setSdk] = useState(null);

  // 初始化 SDK
  useEffect(() => {
    if (connection && wallet) {
      const tykhePotSdk = new TykhePotSDK(
        connection,
        wallet,
        process.env.REACT_APP_SOLANA_NETWORK || 'devnet'
      );
      setSdk(tykhePotSdk);
    }
  }, [connection, wallet]);

  // 获取奖池统计（从链上读取）
  const fetchPoolStats = useCallback(async () => {
    if (!sdk) return;
    
    try {
      setIsLoading(true);
      const poolStats = await sdk.getPoolStats();
      
      if (poolStats) {
        const now = Date.now();
        const hourlyLastDraw = poolStats.lastHourlyDraw * 1000;
        const dailyLastDraw = poolStats.lastDailyDraw * 1000;
        
        setStats({
          totalPool: poolStats.hourlyPool + poolStats.dailyPool,
          totalBurned: poolStats.totalBurned,
          onlinePlayers: poolStats.hourlyParticipants + poolStats.dailyParticipants,
          hourlyPool: poolStats.hourlyPool,
          dailyPool: poolStats.dailyPool,
          hourlyParticipants: poolStats.hourlyParticipants,
          dailyParticipants: poolStats.dailyParticipants,
          hourlyNextDraw: getNextHourlyDraw(),
          dailyNextDraw: getNextDailyDraw(),
          isLoading: false,
          isPaused: poolStats.paused,
        });
      }
    } catch (error) {
      console.error("Failed to fetch pool stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // 初始加载和定时刷新
  useEffect(() => {
    fetchPoolStats();
    
    // 每30秒刷新一次数据
    const interval = setInterval(fetchPoolStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchPoolStats]);

  // 获取用户 SOL 余额
  useEffect(() => {
    const getBalance = async () => {
      if (wallet.publicKey) {
        try {
          const balance = await connection.getBalance(wallet.publicKey);
          setUserBalance(balance / 1e9);
        } catch (error) {
          console.error('Error fetching SOL balance:', error);
        }
      }
    };

    getBalance();
    const interval = setInterval(getBalance, 30000);

    return () => clearInterval(interval);
  }, [wallet.publicKey, connection]);

  // 获取用户 Token 余额
  useEffect(() => {
    const getTokenBalance = async () => {
      if (sdk && wallet.publicKey) {
        try {
          const balance = await sdk.getTokenBalance(wallet.publicKey);
          setUserTokenBalance(Number(balance) / 1e9);
        } catch (error) {
          console.error('Error fetching token balance:', error);
        }
      }
    };

    getTokenBalance();
    const interval = setInterval(getTokenBalance, 30000);

    return () => clearInterval(interval);
  }, [sdk, wallet.publicKey]);

  // 倒计时更新
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        hourlyNextDraw: Math.max(0, prev.hourlyNextDraw - 1000),
        dailyNextDraw: Math.max(0, prev.dailyNextDraw - 1000),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 手动刷新数据
  const refreshStats = useCallback(async () => {
    await fetchPoolStats();
    if (sdk && wallet.publicKey) {
      const balance = await sdk.getTokenBalance(wallet.publicKey);
      setUserTokenBalance(Number(balance) / 1e9);
    }
  }, [fetchPoolStats, sdk, wallet.publicKey]);

  const value = {
    stats,
    isLoading,
    userBalance,
    userTokenBalance,
    wallet,
    connection,
    sdk,
    refreshStats,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
