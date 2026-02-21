import { useState, useEffect, useCallback } from 'react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import TykhePotDemoSDK from '../utils/demo-sdk';

// 演示模式 Hook - 无需真实合约
export function useTykhePotDemo() {
  const [sdk, setSdk] = useState(null);
  const [userState, setUserState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 初始化 Demo SDK
  useEffect(() => {
    const connection = new Connection(clusterApiUrl('devnet'));
    const demoSdk = new TykhePotDemoSDK(connection, null);
    setSdk(demoSdk);
    
    // 加载初始数据
    loadUserState(demoSdk);
  }, []);

  const loadUserState = async (demoSdk) => {
    try {
      setLoading(true);
      const state = await demoSdk.getUserState();
      setUserState(state);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deposit = useCallback(async (poolType, amount) => {
    if (!sdk) return;
    setLoading(true);
    try {
      const result = await sdk.deposit(poolType, amount);
      await loadUserState(sdk);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  const stake = useCallback(async (amount, duration) => {
    if (!sdk) return;
    setLoading(true);
    try {
      const result = await sdk.stake(amount, duration);
      await loadUserState(sdk);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  const claimAirdrop = useCallback(async () => {
    if (!sdk) return;
    setLoading(true);
    try {
      const result = await sdk.claimAirdrop();
      await loadUserState(sdk);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  const getLeaderboard = useCallback(async () => {
    if (!sdk) return [];
    return await sdk.getLeaderboard();
  }, [sdk]);

  const getUserHistory = useCallback(async () => {
    if (!sdk) return { deposits: [], wins: [] };
    return await sdk.getUserHistory();
  }, [sdk]);

  const getRecentWins = useCallback(async () => {
    if (!sdk) return [];
    return await sdk.getRecentWins();
  }, [sdk]);

  const getReferralInfo = useCallback(async () => {
    if (!sdk) return null;
    return await sdk.getReferralInfo();
  }, [sdk]);

  return {
    sdk,
    userState,
    loading,
    error,
    deposit,
    stake,
    claimAirdrop,
    getLeaderboard,
    getUserHistory,
    getRecentWins,
    getReferralInfo,
    isDemo: true
  };
}

export default useTykhePotDemo;
