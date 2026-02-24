import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import TykhePotSDK from '../utils/tykhepot-sdk';

// ─── Timeout & Retry Helpers ──────────────────────────────────────────────────

const READ_TIMEOUT_MS = 30_000;   // 30 s for read-only RPC calls
const TX_TIMEOUT_MS   = 60_000;   // 60 s for transaction submissions

/** Reject with a timeout error if the promise takes too long. */
function withTimeout(promise, ms, label = "RPC call") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

/**
 * Retry an async function up to `maxAttempts` times.
 * Only retries on network/timeout errors, not on Anchor program errors.
 */
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 800) {
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const isTransient =
        e.message?.includes("timed out") ||
        e.message?.includes("fetch failed") ||
        e.message?.includes("ECONNREFUSED") ||
        e.message?.includes("503");
      if (!isTransient || attempt === maxAttempts - 1) throw e;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastErr;
}

// ─────────────────────────────────────────────────────────────────────────────

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
      return await withTimeout(sdk.getTokenBalance(wallet.publicKey), READ_TIMEOUT_MS, "getBalance");
    } catch (e) {
      console.error("getBalance failed:", e);
      return BigInt(0);
    }
  }, [sdk, wallet.publicKey]);

  const getProtocolState = useCallback(async () => {
    if (!sdk) return null;
    setIsLoading(true);
    try {
      return await withRetry(
        () => withTimeout(sdk.getProtocolState(), READ_TIMEOUT_MS, "getProtocolState")
      );
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
      return await withRetry(
        () => withTimeout(sdk.getUserData(wallet.publicKey), READ_TIMEOUT_MS, "getUserState")
      );
    } catch (e) {
      return null;
    }
  }, [sdk, wallet.publicKey]);

  const depositHourly = useCallback(async (amount) => {
    if (!sdk) return { success: false, error: "SDK not initialized" };
    setIsLoading(true);
    setError(null);
    try {
      return await withTimeout(sdk.depositHourly(amount), TX_TIMEOUT_MS, "depositHourly");
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
      return await withTimeout(sdk.depositDaily(amount, referrer), TX_TIMEOUT_MS, "depositDaily");
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
      return await withTimeout(sdk.claimFreeAirdrop(), TX_TIMEOUT_MS, "claimFreeAirdrop");
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
      return await withTimeout(sdk.stake(amount, stakeType, stakeIndex), TX_TIMEOUT_MS, "stake");
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
      return await withTimeout(sdk.releaseStake(stakeIndex), TX_TIMEOUT_MS, "releaseStake");
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
      return await withTimeout(sdk.earlyWithdraw(stakeIndex), TX_TIMEOUT_MS, "earlyWithdraw");
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
      return await withTimeout(sdk.claimProfitAirdrop(), TX_TIMEOUT_MS, "claimProfitAirdrop");
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
      return await withRetry(
        () => withTimeout(sdk.getPoolStats(), READ_TIMEOUT_MS, "getPoolStats")
      );
    } catch (e) {
      return null;
    }
  }, [sdk]);

  const getUserStake = useCallback(async (stakeIndex) => {
    if (!sdk || !wallet.publicKey) return null;
    try {
      return await withTimeout(
        sdk.getUserStake(wallet.publicKey, stakeIndex), READ_TIMEOUT_MS, "getUserStake"
      );
    } catch (e) {
      return null;
    }
  }, [sdk, wallet.publicKey]);

  const getUserAirdropData = useCallback(async () => {
    if (!sdk || !wallet.publicKey) return null;
    try {
      return await withTimeout(
        sdk.getUserAirdropData(wallet.publicKey), READ_TIMEOUT_MS, "getUserAirdropData"
      );
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
