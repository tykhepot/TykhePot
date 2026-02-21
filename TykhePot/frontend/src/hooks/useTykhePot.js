import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import TykhePotSDK, { CONFIG } from '../utils/tykhepot-sdk';

export const useTykhePot = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [sdk, setSdk] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 初始化 SDK
  useEffect(() => {
    if (wallet && connection) {
      const tykhePotSdk = new TykhePotSDK(
        connection,
        wallet,
        process.env.REACT_APP_SOLANA_NETWORK || 'devnet'
      );
      setSdk(tykhePotSdk);
    }
  }, [wallet, connection]);

  // 获取用户余额
  const getBalance = useCallback(async () => {
    if (!sdk || !wallet.publicKey) return BigInt(0);
    try {
      return await sdk.getTokenBalance(wallet.publicKey);
    } catch (e) {
      console.error("Get balance failed:", e);
      return BigInt(0);
    }
  }, [sdk, wallet.publicKey]);

  // 获取协议状态
  const getProtocolState = useCallback(async () => {
    if (!sdk) return null;
    setIsLoading(true);
    try {
      const state = await sdk.getProtocolState();
      return state;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // 获取用户状态
  const getUserState = useCallback(async () => {
    if (!sdk || !wallet.publicKey) return null;
    try {
      return await sdk.getUserState(wallet.publicKey);
    } catch (e) {
      return null;
    }
  }, [sdk, wallet.publicKey]);

  // 参与小时池
  const depositHourly = useCallback(async (amount) => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      const result = await sdk.depositHourly(amount);
      return result;
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // 参与天池
  const depositDaily = useCallback(async (amount, referrer) => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      const result = await sdk.depositDaily(amount, referrer);
      return result;
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // 领取奖金
  const claimVested = useCallback(async () => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      const result = await sdk.claimVested();
      return result;
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // 格式化金额
  const formatAmount = useCallback((amount) => {
    if (!sdk) return "0";
    return sdk.formatAmount(amount);
  }, [sdk]);

  return {
    sdk,
    isLoading,
    error,
    isConnected: wallet.connected,
    publicKey: wallet.publicKey,
    getBalance,
    getProtocolState,
    getUserState,
    depositHourly,
    depositDaily,
    claimVested,
    formatAmount,
  };
};

export default useTykhePot;
