import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import { POOL_TYPE } from '../config/contract';

const Airdrop = () => {
  const { wallet, sdk, userStatus, refreshStats } = useApp();
  const { language } = useTranslation();
  const [isClaiming, setIsClaiming] = useState(false);
  const [isUsingBet, setIsUsingBet] = useState(false);
  const [error, setError]           = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Derived state from userStatus (refreshed every 30s by AppContext)
  const hasClaimedAirdrop = userStatus?.hasClaimedAirdrop ?? false;
  const hasFreeClaim      = userStatus?.hasFreeClaim       ?? false;

  // v3: free bet is DAILY pool only
  const freeBetActive = userStatus?.pools?.[POOL_TYPE.DAILY]?.freeBetActive ?? false;

  const handleClaim = useCallback(async () => {
    if (!wallet.publicKey || !sdk) return;
    setIsClaiming(true);
    setError('');
    setSuccessMsg('');
    try {
      const result = await sdk.claimFreeAirdrop();
      if (result.success) {
        setSuccessMsg(language === 'en'
          ? '🎉 Airdrop claimed! Your free bet is ready to use.'
          : '🎉 领取成功！免费投注已就绪。');
        refreshStats();
      } else {
        setError(result.error || (language === 'en' ? 'Claim failed' : '领取失败'));
      }
    } catch (err) {
      // Enhanced error handling
      console.error('Claim error:', err);

      // Check for blockhash fetch error (Solana Web3.js internal issue)
      if (err?.message?.includes('blockhash') || err?.message?.includes('Failed to fetch') ||
          err?.message?.includes('getRecentBlockhash') || err?.message?.includes('getLatestBlockhash')) {
        console.warn('Blockhash fetch error (expected):', err.message);
        setError(language === 'en'
          ? '⚠️ Network query unavailable (new SDK version limitation)'
          : '⚠️ 网络查询不可用（新版本SDK暂时不支持）');
      } else {
        setError(err.message || (language === 'en' ? 'Error' : '错误'));
      }
    } finally {
      // Always reset claiming state to prevent UI stuck
      setIsClaiming(false);
    }
  }, [wallet, sdk, language, refreshStats]);

  const handleUseFreeBet = useCallback(async () => {
    if (!wallet.publicKey || !sdk) return;
    setIsUsingBet(true);
    setError('');
    setSuccessMsg('');
    try {
      const result = await sdk.useFreeBet();
      if (result.success) {
        setSuccessMsg(language === 'en'
          ? '🎰 Free bet placed in Daily Pool! Good luck!'
          : '🎰 免费投注已进入每日池！祝你好运！');
        refreshStats();
      } else {
        setError(result.error || (language === 'en' ? 'Failed to place free bet' : '免费投注失败'));
      }
    } catch (err) {
      setError(err.message || (language === 'en' ? 'Error' : '错误'));
    } finally {
      setIsUsingBet(false);
    }
  }, [wallet, sdk, language, refreshStats]);

  // ── Render helpers ──────────────────────────────────────────────────

  const renderStatus = () => {
    if (!wallet.publicKey) {
      return (
        <div className="ad-connect">
            <span className="ad-connect-icon">🔗</span>
            <p>{language === 'en' ? 'Connect your wallet to claim' : '请先连接钱包'}</p>
          </div>
        );
      }

    // State 1: Not yet claimed
    if (!hasClaimedAirdrop) {
      return (
        <div className="ad-claim-section">
          <div className="ad-amount-display">
              <span className="ad-amount-label">{language === 'en' ? 'Available:' : '可领取:'}</span>
              <span className="ad-amount-value">100 TPOT</span>
          </div>
            <p className="ad-claim-note">
              {language === 'en'
                ? 'Claim once per wallet. The 100 TPOT will be deposited directly into a pool as a free bet.'
                : '每个钱包限领一次。100 TPOT 将以免费投注的形式直接进入奖池，无需从您钱包扣款。'}
            </p>
            <button className="ad-btn-primary" onClick={handleClaim} disabled={isClaiming}>
              {isClaiming
                ? (language === 'en' ? '⏳ Claiming...' : '⏳ 领取中...')
                : `🎁 ${language === 'en' ? 'Claim Free Airdrop' : '领取免费空投'}`}
            </button>
          </div>
        );
      }

    // State 2: Claimed, free bet ready to place in Daily Pool
    if (hasFreeClaim) {
        return (
          <div className="ad-use-section">
            <div className="ad-ready-banner">
              <span>🎟️</span>
              <div>
                <strong>{language === 'en' ? 'Free Bet Ready!' : '免费投注已就绪！'}</strong>
                <p>
                  {language === 'en'
                    ? 'Your 100 TPOT free bet is available for Daily Pool.'
                    : '您的 100 TPOT 免费投注可进入每日池参与开奖。'}
                </p>
              </div>
            </div>
            <button
              className="ad-btn-primary"
              onClick={handleUseFreeBet}
              disabled={isUsingBet}
            >
              {isUsingBet
                ? (language === 'en' ? '⏳ Placing...' : '⏳ 投注中...')
                : `🌙 ${language === 'en' ? 'Use in Daily Pool' : '在每日池使用'}`}
            </button>
          </div>
        );
      }

    // State 3: Claimed, free bet active in Daily Pool (waiting for draw)
    if (freeBetActive) {
      return (
        <div className="ad-active-banner">
            <span className="ad-active-icon">🎰</span>
            <div>
              <strong>
                {language === 'en' ? 'Free bet is active!' : '免费投注进行中！'}
              </strong>
              <p>
                {language === 'en'
                  ? 'Active in: Daily Pool — draw at 00:00 UTC'
                  : '活跃奖池：每日池 — 每天 00:00 UTC 开奖'}
              </p>
              <p className="ad-carry-note">
                {language === 'en'
                  ? 'If the round has fewer than 12 players, your free bet automatically carries over to the next round.'
                  : '若当期人数不足12人，您的免费投注将自动续到下一期。'}
              </p>
            </div>
          </div>
        );
      }

    // State 4: Claimed, free bet fully used (draw succeeded)
    if (hasClaimedAirdrop && !hasFreeClaim && !freeBetActive) {
      return (
        <div className="ad-used-banner">
          <span>🎟️</span>
          <div>
            <strong>{language === 'en' ? 'Airdrop fully used' : '空投已全部使用'}</strong>
            <p>
              {language === 'en'
                ? 'Your free bet has been drawn. Each wallet gets one free bet.'
                : '您的免费投注已完成开奖。每个钱包仅有一次机会。'}
            </p>
          </div>
        </div>
      );
    }

    // Fallback
    return null;
  };

  return (
    <div className="airdrop-page">
      <h1 className="ad-title">
        {language === 'en' ? '🎁 Free Airdrop' : '🎁 免费空投'}
      </h1>
      {error && <div className="ad-error">{error}</div>}
      {successMsg && <div className="ad-success">{successMsg}</div>}
      {renderStatus()}
    </div>
  );
};

export default Airdrop;
