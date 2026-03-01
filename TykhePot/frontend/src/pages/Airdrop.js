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
  const hasClaimedAirdrop = userStatus?.hasClaimedAirdrop  ?? false;
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
      setError(err.message || (language === 'en' ? 'Error' : '错误'));
    } finally {
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

  // ── Render helpers ──────────────────────────────────────────────────────────

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
                  ? 'Your 100 TPOT free bet is available for the Daily Pool.'
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
  };

  return (
    <div className="page-container">
      <div className="container" style={{ maxWidth: '700px' }}>

        {/* Header */}
        <div className="page-header-modern">
          <div className="page-badge">🎁 Airdrop</div>
          <h1 className="page-title-modern">
            {language === 'en' ? 'Free Airdrop' : '免费空投'}
          </h1>
          <p className="page-subtitle-modern">
            {language === 'en'
              ? '100 TPOT free bet for every wallet — no deposit needed'
              : '每个钱包免费获得 100 TPOT 投注机会，无需任何花费'}
          </p>
        </div>

        {/* Hero card */}
        <div className="ad-hero">
          <div className="ad-hero-icon">💰</div>
          <div className="ad-hero-amount">100 TPOT</div>
          <div className="ad-hero-label">
            {language === 'en' ? 'FREE for every wallet' : '每个钱包免费领取'}
          </div>
        </div>

        {/* Status / action card */}
        <div className="card card-glass">
          <h2 className="card-title-modern">
            🎰 {language === 'en' ? 'My Airdrop Status' : '我的空投状态'}
          </h2>

          {error && (
            <div style={{
              color: '#ff4444', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)',
            }}>⚠️ {error}</div>
          )}
          {successMsg && (
            <div style={{
              color: '#4CAF50', background: 'rgba(76,175,80,0.1)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)',
            }}>✅ {successMsg}</div>
          )}

          {renderStatus()}
        </div>

        {/* Rules */}
        <div className="card card-glass">
          <h2 className="card-title-modern">📜 {language === 'en' ? 'Airdrop Rules' : '空投规则'}</h2>
          <div className="ad-rules">
            {[
              { icon: '✅', en: 'Every wallet claims 100 TPOT — one time only', zh: '每个钱包限领一次 100 TPOT' },
              { icon: '🎰', en: 'The 100 TPOT is a free bet — deposited directly from the airdrop vault', zh: '100 TPOT 是免费投注，直接从空投库注入奖池，不扣您钱包' },
              { icon: '⚖️', en: 'Equal winning probability with regular depositors (1 wallet = 1 chance)', zh: '与普通投注者相同的中奖概率（1个钱包 = 1次机会）' },
              { icon: '♻️', en: 'If round fails (<12 players), your free bet auto-carries to the next round', zh: '若当期人数不足12人，免费投注自动续到下一期' },
              { icon: '🏆', en: 'On successful draw: 11 winners — top 6 vest over 20 days, lucky×5 and universal prize paid instantly', zh: '开奖成功：11位获奖者 — 前6名奖金20天线性归属，幸运×5和普惠奖即时到账' },
            ].map((rule, i) => (
              <div key={i} className="ad-rule-item">
                <span>{rule.icon}</span>
                <span>{language === 'en' ? rule.en : rule.zh}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="card card-glass">
          <h2 className="card-title-modern">💡 {language === 'en' ? 'Tips' : '小贴士'}</h2>
          <div className="ad-tips">
            {[
              { icon: '🌙', en: 'Free bet is exclusive to Daily Pool — draws at 00:00 UTC every day', zh: '免费投注仅限每日池 — 每天 00:00 UTC 开奖' },
              { icon: '💰', en: 'Daily Pool accumulates the largest prize pool with reserve matching', zh: '每日池奖金最丰厚，支持储备配捐翻倍' },
              { icon: '🏆', en: '11 winners per draw: 1st / 2nd×2 / 3rd×3 / Lucky×5 + universal prize for all non-winners', zh: '每期11位获奖者：头奖/二等×2/三等×3/幸运×5 + 全员普惠奖' },
              { icon: '💎', en: 'Stake TPOT tokens for additional profit-sharing rewards', zh: '质押 TPOT 代币可获得额外分红收益' },
            ].map((tip, i) => (
              <div key={i} className="ad-tip-item">
                <span>{tip.icon}</span>
                <span>{language === 'en' ? tip.en : tip.zh}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .ad-hero {
          background: linear-gradient(135deg, oklch(20% 0.05 45), oklch(15% 0.03 280));
          border: 2px solid var(--color-gold);
          border-radius: var(--radius-xl);
          padding: var(--space-10);
          text-align: center;
          margin-bottom: var(--space-6);
          box-shadow: 0 0 30px oklch(55% 0.15 45 / 0.25);
        }
        .ad-hero-icon { font-size: 3.5rem; margin-bottom: var(--space-3); }
        .ad-hero-amount {
          font-size: var(--text-4xl);
          font-weight: 700;
          color: var(--color-gold);
          margin-bottom: var(--space-2);
        }
        .ad-hero-label { font-size: var(--text-lg); color: var(--text-secondary); }

        .ad-connect {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-tertiary);
        }
        .ad-connect-icon { font-size: 2rem; display: block; margin-bottom: var(--space-3); }

        .ad-claim-section { text-align: center; }
        .ad-amount-display { margin-bottom: var(--space-4); }
        .ad-amount-label { color: var(--text-tertiary); margin-right: var(--space-2); }
        .ad-amount-value { font-size: var(--text-2xl); font-weight: 700; color: var(--color-gold); }
        .ad-claim-note {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin-bottom: var(--space-5);
          line-height: 1.6;
        }

        .ad-btn-primary {
          width: 100%;
          padding: var(--space-4) var(--space-6);
          font-size: var(--text-lg);
          font-weight: 700;
          background: linear-gradient(135deg, var(--color-gold), oklch(55% 0.18 60));
          color: oklch(10% 0.02 280);
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .ad-btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .ad-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .ad-ready-banner {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          background: oklch(55% 0.15 45 / 0.1);
          border: 1px solid oklch(55% 0.15 45 / 0.4);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          margin-bottom: var(--space-4);
          font-size: 2rem;
        }
        .ad-ready-banner strong { color: var(--color-gold); }
        .ad-ready-banner p { font-size: var(--text-sm); color: var(--text-secondary); margin: 4px 0 0; }

        .ad-pool-buttons { display: flex; flex-direction: column; gap: var(--space-3); }
        .ad-pool-btn {
          padding: var(--space-4);
          background: oklch(20% 0.02 280);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          font-size: var(--text-base);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        .ad-pool-btn:hover:not(:disabled) {
          border-color: var(--color-gold);
          background: oklch(55% 0.15 45 / 0.1);
          color: var(--color-gold);
        }
        .ad-pool-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .ad-active-banner {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          background: oklch(40% 0.15 140 / 0.15);
          border: 1px solid oklch(50% 0.15 140 / 0.4);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }
        .ad-active-icon { font-size: 2rem; flex-shrink: 0; }
        .ad-active-banner strong { color: #4ade80; }
        .ad-active-banner p { font-size: var(--text-sm); color: var(--text-secondary); margin: 4px 0 0; }
        .ad-carry-note { font-size: var(--text-xs) !important; color: var(--text-tertiary) !important; margin-top: var(--space-2) !important; }

        .ad-used-banner {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          background: oklch(20% 0.01 280 / 0.5);
          border: 1px solid oklch(40% 0.02 280 / 0.3);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          font-size: 2rem;
          color: var(--text-tertiary);
        }
        .ad-used-banner strong { color: var(--text-secondary); font-size: var(--text-base); }
        .ad-used-banner p { font-size: var(--text-sm); margin: 4px 0 0; }

        .ad-rules { display: flex; flex-direction: column; gap: var(--space-3); }
        .ad-rule-item {
          display: flex;
          gap: var(--space-3);
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: 1.5;
          padding-bottom: var(--space-3);
          border-bottom: 1px solid oklch(30% 0.02 280 / 0.3);
        }
        .ad-rule-item:last-child { border-bottom: none; padding-bottom: 0; }

        .ad-tips { display: flex; flex-direction: column; gap: var(--space-3); }
        .ad-tip-item {
          display: flex;
          gap: var(--space-3);
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default Airdrop;
