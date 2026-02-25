import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import TykhePotSDK from '../utils/tykhepot-sdk';
import { TOKEN_MINT, POOL_TYPE } from '../config/contract';

const AppContext = createContext();

const DEFAULT_POOL = {
  roundNumber: 0,
  roundEndTime: 0,  // ms
  totalPool: 0,
  participantCount: 0,
  regularCount: 0,
  freeCount: 0,
};

export const AppProvider = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [stats, setStats] = useState({
    pools: {
      [POOL_TYPE.MIN30]:  { ...DEFAULT_POOL },
      [POOL_TYPE.HOURLY]: { ...DEFAULT_POOL },
      [POOL_TYPE.DAILY]:  { ...DEFAULT_POOL },
    },
    // Convenience aliases for legacy components
    min30Pool:          0,
    hourlyPool:         0,
    dailyPool:          0,
    min30Participants:  0,
    hourlyParticipants: 0,
    dailyParticipants:  0,
    min30NextDraw:      0,
    hourlyNextDraw:     0,
    dailyNextDraw:      0,
    totalPool:          0,
    onlinePlayers:      0,
    isLoading:          true,
    isPaused:           false, // no pause in new design, always false
  });

  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [userBalance, setUserBalance]           = useState(0);
  const [userStatus, setUserStatus]             = useState(null);
  const [sdk, setSdk]                           = useState(null);
  const [isLoading, setIsLoading]               = useState(false);

  // ── Init SDK ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (connection && wallet) {
      setSdk(new TykhePotSDK(connection, wallet));
    }
  }, [connection, wallet]);

  // ── Fetch pool stats from chain ───────────────────────────────────────────
  const fetchPoolStats = useCallback(async () => {
    if (!sdk) return;
    try {
      setIsLoading(true);
      const poolData = await sdk.getAllPoolStats();

      const p0 = poolData[POOL_TYPE.MIN30]  || DEFAULT_POOL;
      const p1 = poolData[POOL_TYPE.HOURLY] || DEFAULT_POOL;
      const p2 = poolData[POOL_TYPE.DAILY]  || DEFAULT_POOL;

      setStats({
        pools: poolData,
        // Legacy aliases
        min30Pool:          p0.totalPool,
        hourlyPool:         p1.totalPool,
        dailyPool:          p2.totalPool,
        min30Participants:  p0.participantCount,
        hourlyParticipants: p1.participantCount,
        dailyParticipants:  p2.participantCount,
        min30NextDraw:      p0.roundEndTime,
        hourlyNextDraw:     p1.roundEndTime,
        dailyNextDraw:      p2.roundEndTime,
        totalPool:          (p0.totalPool || 0) + (p1.totalPool || 0) + (p2.totalPool || 0),
        onlinePlayers:      (p0.participantCount || 0) + (p1.participantCount || 0) + (p2.participantCount || 0),
        isLoading:          false,
        isPaused:           false,
      });
    } catch (err) {
      console.error("fetchPoolStats error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // ── Fetch user-specific status ────────────────────────────────────────────
  const fetchUserStatus = useCallback(async () => {
    if (!sdk || !wallet.publicKey) return;
    try {
      const status = await sdk.getUserStatus(wallet.publicKey);
      setUserStatus(status);
    } catch (err) {
      console.error("fetchUserStatus error:", err);
    }
  }, [sdk, wallet.publicKey]);

  // ── Fetch TPOT token balance ───────────────────────────────────────────────
  const fetchTokenBalance = useCallback(async () => {
    if (!connection || !wallet.publicKey) return;
    try {
      const ata = await getAssociatedTokenAddress(
        new PublicKey(TOKEN_MINT),
        wallet.publicKey
      );
      const info = await connection.getTokenAccountBalance(ata);
      setUserTokenBalance(Number(info.value.uiAmount ?? 0));
    } catch {
      setUserTokenBalance(0);
    }
  }, [connection, wallet.publicKey]);

  // ── Fetch SOL balance ─────────────────────────────────────────────────────
  const fetchSolBalance = useCallback(async () => {
    if (!connection || !wallet.publicKey) return;
    try {
      const bal = await connection.getBalance(wallet.publicKey);
      setUserBalance(bal / 1e9);
    } catch {}
  }, [connection, wallet.publicKey]);

  // ── Initial load + 30s refresh ───────────────────────────────────────────
  useEffect(() => {
    fetchPoolStats();
    const t = setInterval(fetchPoolStats, 30_000);
    return () => clearInterval(t);
  }, [fetchPoolStats]);

  useEffect(() => {
    fetchUserStatus();
    const t = setInterval(fetchUserStatus, 30_000);
    return () => clearInterval(t);
  }, [fetchUserStatus]);

  useEffect(() => {
    fetchTokenBalance();
    fetchSolBalance();
    const t = setInterval(() => { fetchTokenBalance(); fetchSolBalance(); }, 30_000);
    return () => clearInterval(t);
  }, [fetchTokenBalance, fetchSolBalance]);

  // ── Manual refresh (called after tx) ─────────────────────────────────────
  const refreshStats = useCallback(async () => {
    await Promise.all([fetchPoolStats(), fetchUserStatus(), fetchTokenBalance(), fetchSolBalance()]);
  }, [fetchPoolStats, fetchUserStatus, fetchTokenBalance, fetchSolBalance]);

  const value = {
    stats,
    isLoading,
    userBalance,
    userTokenBalance,
    userStatus,
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
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export default AppContext;
