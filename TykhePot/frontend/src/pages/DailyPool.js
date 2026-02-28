import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import { POOL_TYPE } from '../config/contract';

const MIN_DEPOSIT = 100; // TPOT

const DailyPool = () => {
  const { stats, wallet, sdk, refreshStats, userTokenBalance, userStatus } = useApp();
  const { t, language } = useTranslation();
  const [depositAmount, setDepositAmount] = useState('100');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isUsingFreeBet, setIsUsingFreeBet] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState({ hours: '00', minutes: '00', seconds: '00' });

  const freeBetActive = userStatus?.pools?.[POOL_TYPE.DAILY]?.freeBetActive ?? false;

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const diff = Math.max(0, stats.dailyNextDraw - Date.now());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
      });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [stats.dailyNextDraw]);

  const handleUseFreeBet = useCallback(async () => {
    if (!wallet.publicKey || !sdk) return;
    setIsUsingFreeBet(true);
    setErrorMessage('');
    try {
      const result = await sdk.useFreeBet();
      if (result.success) {
        alert(language === 'en'
          ? `🎉 Free bet placed! Tx: ${result.tx.slice(0, 8)}... Good luck!`
          : `🎉 免费投注成功！交易: ${result.tx.slice(0, 8)}... 祝你好运！`);
        refreshStats();
      } else {
        setErrorMessage(result.error || (language === 'en' ? 'Free bet failed' : '免费投注失败'));
      }
    } catch (err) {
      setErrorMessage(err.message || (language === 'en' ? 'Error' : '错误'));
    } finally {
      setIsUsingFreeBet(false);
    }
  }, [sdk, wallet.publicKey, language, refreshStats]);

  const handleDeposit = useCallback(async () => {
    if (!wallet.publicKey) { alert(t('walletNotConnected')); return; }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < MIN_DEPOSIT) {
      setErrorMessage(language === 'en' ? `Minimum deposit is ${MIN_DEPOSIT} TPOT` : `最低投入 ${MIN_DEPOSIT} TPOT`);
      return;
    }
    if (userTokenBalance < amount) {
      setErrorMessage(language === 'en'
        ? `Insufficient balance. You have ${userTokenBalance.toFixed(2)} TPOT`
        : `余额不足。您有 ${userTokenBalance.toFixed(2)} TPOT`);
      return;
    }

    setIsDepositing(true); setTxStatus('pending'); setErrorMessage('');
    try {
      const result = await sdk.deposit(POOL_TYPE.DAILY, amount);
      if (result.success) {
        setTxStatus('success');
        refreshStats();
        setDepositAmount('100');
      } else {
        setTxStatus('error');
        setErrorMessage(result.error || 'Transaction failed');
      }
    } catch (err) {
      setTxStatus('error');
      setErrorMessage(err.message || 'Unknown error');
    } finally {
      setIsDepositing(false);
    }
  }, [wallet, depositAmount, userTokenBalance, language, sdk, refreshStats, t]);

  return (
    <div className="page-container">
      <div className="container">
        {/* Header */}
        <div className="page-header-modern">
          <div className="page-badge">🌙 Daily Pool</div>
          <h1 className="page-title-modern">{t('dailyPool')}</h1>
          <p className="page-subtitle-modern">
            {language === 'en' 
              ? 'Daily draws at 00:00 UTC with bigger prizes!'
              : '每日 0 点开奖，更大奖池！'
            }
          </p>
        </div>

        {/* Features Tags */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          <span className="feature-tag">🎁 {language === 'en' ? 'Free Bet' : '免费投注'}</span>
          <span className="feature-tag">⚖️ {language === 'en' ? 'Equal Probability' : '等概率中奖'}</span>
          <span className="feature-tag">💎 {language === 'en' ? 'Daily 00:00 Draw' : '每日0点开奖'}</span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2" style={{ gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          {/* Pool Info Card */}
          <div className="card card-glass">
            <h2 className="card-title-modern">📊 {t('poolInfo')}</h2>
            
            <div className="pool-display-modern">
              <span className="pool-label-modern">{language === 'en' ? 'Current Pool' : '当前奖池'}</span>
              <span className="pool-value-modern">🪙 {(stats.dailyPool || 0).toFixed(2)} TPOT</span>
            </div>
            
            <div className="countdown-modern">
              <span className="countdown-label-modern">{language === 'en' ? 'Next Draw' : '距离开奖'}</span>
              <div className="countdown-timer">
                <span className="countdown-unit">{countdown.hours}</span>
                <span className="countdown-sep">:</span>
                <span className="countdown-unit">{countdown.minutes}</span>
                <span className="countdown-sep">:</span>
                <span className="countdown-unit">{countdown.seconds}</span>
              </div>
            </div>
            
            <div className="info-grid-modern">
              <div className="info-item-modern">
                <span className="info-label-modern">{language === 'en' ? 'Participants' : '参与人数'}</span>
                <span className="info-value-modern">{stats.dailyParticipants || 0} / 12</span>
              </div>
              <div className="info-item-modern">
                <span className="info-label-modern">{language === 'en' ? 'Min Deposit' : '最低投入'}</span>
                <span className="info-value-modern">100 TPOT</span>
              </div>
              <div className="info-item-modern">
                <span className="info-label-modern">{language === 'en' ? 'Draw Time' : '开奖时间'}</span>
                <span className="info-value-modern">00:00 UTC</span>
              </div>
            </div>
          </div>

          {/* Deposit Card */}
          <div className="card card-glass">
            <h2 className="card-title-modern">🎰 {t('joinNowBtn')}</h2>

            {/* ── Free Bet Banner ────────────────────────────────────────── */}
            {wallet.publicKey && (
              freeBetActive ? (
                <div className="free-bet-banner">
                  <div className="free-bet-header">
                    <span className="free-bet-icon">🎁</span>
                    <div>
                      <div className="free-bet-title">
                        {language === 'en' ? 'Free Bet Available!' : '免费投注可用！'}
                      </div>
                      <div className="free-bet-desc">
                        {language === 'en'
                          ? '100 TPOT from Airdrop → Daily Pool (no cost to you)'
                          : '100 TPOT 从空投库直接入池，无需花费'}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn free-bet-btn"
                    onClick={handleUseFreeBet}
                    disabled={isUsingFreeBet}
                  >
                    {isUsingFreeBet
                      ? (language === 'en' ? 'Placing...' : '投注中...')
                      : (language === 'en' ? '🎰 Use Free Bet' : '🎰 使用免费投注')}
                  </button>
                </div>
              ) : (
                <div className="free-bet-used">
                  <span>🎟️</span>
                  <span>
                    {language === 'en'
                      ? 'Free bet used · Claim again at Airdrop page next time'
                      : '免费投注已使用 · 下次可在空投页面重新领取'}
                  </span>
                </div>
              )
            )}
            
            <div className="form-group-modern">
              <label className="form-label-modern">{language === 'en' ? 'Amount (TPOT)' : '投入数量 (TPOT)'}</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="100"
                className="input-modern"
                placeholder="100"
              />
            </div>
            
            <div className="quick-amount-grid">
              {['100', '500', '1000', '10000'].map(amount => (
                <button
                  key={amount}
                  className={`quick-btn ${depositAmount === amount ? 'active' : ''}`}
                  onClick={() => setDepositAmount(amount)}
                >
                  {amount >= 1000 ? `${amount/1000}K` : amount}
                </button>
              ))}
            </div>

            {errorMessage && (
              <div style={{
                color: '#ff4444',
                background: 'rgba(255,68,68,0.1)',
                border: '1px solid rgba(255,68,68,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                fontSize: 'var(--text-sm)',
                marginTop: 'var(--space-3)',
              }}>
                ⚠️ {errorMessage}
              </div>
            )}
            {txStatus === 'success' && (
              <div style={{
                color: '#4CAF50',
                background: 'rgba(76,175,80,0.1)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                fontSize: 'var(--text-sm)',
                marginTop: 'var(--space-3)',
              }}>
                ✅ {language === 'en' ? 'Deposit successful!' : '存款成功！'}
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={isDepositing}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-4)' }}
            >
              {isDepositing ? (language === 'en' ? '⏳ Processing...' : '⏳ 处理中...') : `🎰 ${language === 'en' ? 'Join Now' : '参与抽奖'}`}
            </button>
          </div>
        </div>

        {/* Prize Distribution */}
        <div className="card card-glass">
          <h2 className="card-title-modern">💰 {t('prizeDistribution')}</h2>

          {/* Deductions row */}
          <div className="prize-deductions">
            {[
              { label: language === 'en' ? '🔥 Burn'     : '🔥 销毁',    pct: '3%',  color: '#EF4444' },
              { label: language === 'en' ? '🏛 Platform'  : '🏛 平台',    pct: '2%',  color: '#3B82F6' },
              { label: language === 'en' ? '🔄 Rollover'  : '🔄 结转下期', pct: '5%',  color: '#8B5CF6' },
            ].map((d, i) => (
              <div key={i} className="prize-deduct-chip" style={{ borderColor: d.color + '66', color: d.color }}>
                {d.label} <strong>{d.pct}</strong>
              </div>
            ))}
          </div>

          {/* Main prize rows (% of prize pool) */}
          <div className="prize-grid" style={{ marginTop: 'var(--space-4)' }}>
            {[
              { name: language === 'en' ? '🥇 1st Prize ×1'        : '🥇 头奖 ×1',        pct: '30%', sub: language === 'en' ? 'vested 20 days' : '20天归属', color: '#FFD700' },
              { name: language === 'en' ? '🥈 2nd Prize ×2'        : '🥈 二等奖 ×2',       pct: '10%', sub: language === 'en' ? 'each · vested 20d'  : '各10%·20天归属', color: '#C0C0C0' },
              { name: language === 'en' ? '🥉 3rd Prize ×3'        : '🥉 三等奖 ×3',       pct: '5%',  sub: language === 'en' ? 'each · vested 20d'  : '各5%·20天归属',  color: '#CD7F32' },
              { name: language === 'en' ? '🍀 Lucky ×5'            : '🍀 幸运奖 ×5',       pct: '2%',  sub: language === 'en' ? 'each · instant'     : '各2%·即时到账',  color: '#4ADE80' },
              { name: language === 'en' ? '🎁 Universal (÷ others)' : '🎁 普惠奖 ÷ 所有未中奖者', pct: '20%', sub: language === 'en' ? 'instant'            : '即时到账',       color: '#60A5FA' },
            ].map((prize, idx) => (
              <div key={idx} className="prize-item-modern">
                <div className="prize-name-block">
                  <span className="prize-name-modern">{prize.name}</span>
                  <span className="prize-sub">{prize.sub}</span>
                </div>
                <div className="prize-bar">
                  <div style={{ width: prize.pct, background: prize.color }}></div>
                </div>
                <span className="prize-percent-modern" style={{ color: prize.color }}>{prize.pct}</span>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            {language === 'en'
              ? '⚖️ Equal probability per wallet · percentages of the 90% distribution pool'
              : '⚖️ 每个钱包等概率中奖 · 百分比基于90%分配池'}
          </p>
        </div>
      </div>

      <style>{`
        .feature-tag {
          background: oklch(55% 0.15 45 / 0.2);
          color: var(--color-gold);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: var(--text-sm);
          border: 1px solid oklch(55% 0.15 45 / 0.3);
        }
        
        .countdown-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-family: var(--font-mono);
        }
        
        .countdown-unit {
          background: oklch(20% 0.02 280);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-gold);
          min-width: 50px;
          text-align: center;
        }
        
        .countdown-sep {
          font-size: var(--text-2xl);
          color: var(--text-tertiary);
        }
        
        
        .prize-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        
        .prize-deductions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
        }

        .prize-deduct-chip {
          font-size: var(--text-xs);
          border: 1px solid;
          border-radius: var(--radius-full);
          padding: 3px 10px;
          background: oklch(15% 0.02 280 / 0.5);
        }

        .prize-item-modern {
          display: grid;
          grid-template-columns: 160px 1fr 44px;
          align-items: center;
          gap: var(--space-3);
        }

        .prize-name-block {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .prize-name-modern {
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .prize-sub {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }
        
        .prize-bar {
          height: 8px;
          background: oklch(20% 0.02 280);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        
        .prize-bar div {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }
        
        .prize-percent-modern {
          font-weight: 600;
          color: var(--color-gold);
          text-align: right;
        }
        
        @media (max-width: 768px) {
          .grid-cols-2 { grid-template-columns: 1fr !important; }
          .prize-item-modern { grid-template-columns: 1fr; }
        }
        .free-bet-banner {
          background: linear-gradient(135deg, oklch(55% 0.15 45 / 0.15), oklch(55% 0.18 160 / 0.1));
          border: 1px solid oklch(55% 0.15 45 / 0.5);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          margin-bottom: var(--space-4);
          animation: freeBetPulse 2.5s ease-in-out infinite;
        }

        @keyframes freeBetPulse {
          0%, 100% { border-color: oklch(55% 0.15 45 / 0.5); }
          50%       { border-color: oklch(65% 0.18 45 / 0.9); box-shadow: 0 0 12px oklch(55% 0.15 45 / 0.3); }
        }

        .free-bet-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .free-bet-icon {
          font-size: 2rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .free-bet-title {
          font-weight: 700;
          font-size: var(--text-base);
          color: var(--color-gold);
          margin-bottom: 2px;
        }

        .free-bet-desc {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .free-bet-btn {
          width: 100%;
          background: linear-gradient(135deg, oklch(55% 0.18 45), oklch(50% 0.15 60));
          color: oklch(10% 0.02 280);
          font-weight: 700;
          font-size: var(--text-base);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .free-bet-btn:hover:not(:disabled) {
          opacity: 0.88;
        }

        .free-bet-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .free-bet-used {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: oklch(20% 0.01 280 / 0.5);
          border: 1px solid oklch(40% 0.02 280 / 0.3);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

      `}</style>
    </div>
  );
};

export default DailyPool;
