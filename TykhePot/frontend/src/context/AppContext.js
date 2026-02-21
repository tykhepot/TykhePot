import React, { createContext, useContext, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [stats, setStats] = useState({
    totalPool: 1234567000000,
    totalBurned: 89012000000,
    onlinePlayers: 1234,
    hourlyPool: 234567000000,
    dailyPool: 1000000000000,
    hourlyParticipants: 89,
    dailyParticipants: 456,
    hourlyNextDraw: Date.now() + 45 * 60 * 1000, // 45分钟后
    dailyNextDraw: Date.now() + 8 * 60 * 60 * 1000, // 8小时后
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  // 获取用户余额
  useEffect(() => {
    const getBalance = async () => {
      if (wallet.publicKey) {
        try {
          const balance = await connection.getBalance(wallet.publicKey);
          setUserBalance(balance / 1e9); // 转换为 SOL
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };

    getBalance();
    const interval = setInterval(getBalance, 30000); // 每30秒更新

    return () => clearInterval(interval);
  }, [wallet.publicKey, connection]);

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        hourlyNextDraw: prev.hourlyNextDraw - 1000,
        dailyNextDraw: prev.dailyNextDraw - 1000,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    stats,
    isLoading,
    userBalance,
    wallet,
    connection,
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
