import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import TykhePotSDK from '../utils/tykhepot-sdk';

export const useTykhePot = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [sdk, setSdk] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (wallet && connection) {
      setSdk(new TykhePotSDK(
        connection,
        wallet,
        process.env.REACT_APP_SOLANA_NETWORK || 'devnet'
      ));
    }
  }, [wallet, connection]);

  const getBalance = useCallback(async () => {
    if (!sdk || !wallet.publicKey) return BigInt(0);
    try {
      return await sdk.getTokenBalance(wallet.publicKey);
    } catch (e) {
      console.error("getBalance failed:", e);
      return BigInt(0);
    }
  }, [sdk, wallet.publicKey]);

  const getProtocolState = useCallback(async () => {
    if (!sdk) return null;
    setIsLoading(true);
    try {
      return await sdk.getProtocolState();
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const getUserState = useCallback(async () => {
    if (!sdk || !wallet.publicKey) return null;
    try {
      return await sdk.getUserData(wallet.publicKey);
    } catch (e) {
      return null;
    }
  }, [sdk, wallet.publicKey]);

  const depositHourly = useCallback(async (amount) => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      return await sdk.depositHourly(amount);
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const depositDaily = useCallback(async (amount, referrer) => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      return await sdk.depositDaily(amount, referrer);
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const claimFreeAirdrop = useCallback(async () => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      return await sdk.claimFreeAirdrop();
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // stakeType: "ShortTerm" | "LongTerm"
  const stake = useCallback(async (amount, stakeType, stakeIndex = 0) => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      return await sdk.stake(amount, stakeType, stakeIndex);
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const releaseStake = useCallback(async (stakeIndex) => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      return await sdk.releaseStake(stakeIndex);
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const earlyWithdraw = useCallback(async (stakeIndex) => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      return await sdk.earlyWithdraw(stakeIndex);
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const claimProfitAirdrop = useCallback(async () => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      return await sdk.claimProfitAirdrop();
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const getPoolStats = useCallback(async () => {
    if (!sdk) return null;
    try {
      return await sdk.getPoolStats();
    } catch (e) {
      return null;
    }
  }, [sdk]);

  const getUserStake = useCallback(async (stakeIndex) => {
    if (!sdk || !wallet.publicKey) return null;
    try {
      return await sdk.getUserStake(wallet.publicKey, stakeIndex);
    } catch (e) {
      return null;
    }
  }, [sdk, wallet.publicKey]);

  const getUserAirdropData = useCallback(async () => {
    if (!sdk || !wallet.publicKey) return null;
    try {
      return await sdk.getUserAirdropData(wallet.publicKey);
    } catch (e) {
      return null;
    }
  }, [sdk, wallet.publicKey]);

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
    getPoolStats,
    depositHourly,
    depositDaily,
    claimFreeAirdrop,
    stake,
    releaseStake,
    earlyWithdraw,
    claimProfitAirdrop,
    getUserStake,
    getUserAirdropData,
    formatAmount,
  };
};

export default useTykhePot;
