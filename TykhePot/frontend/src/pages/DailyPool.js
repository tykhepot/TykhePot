import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const DailyPool = () => {
  const { stats, wallet, sdk, refreshStats, userTokenBalance } = useApp();
  const { t, language } = useTranslation();
  const [depositAmount, setDepositAmount] = useState('100');
  const [referrer, setReferrer] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isUsingFreeBet, setIsUsingFreeBet] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [freeBetAvailable, setFreeBetAvailable] = useState(false);
  const [freeBetChecked, setFreeBetChecked] = useState(false); // 是否已查询过

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

  const isValidReferrer = (address) => {
    if (!address) return true;
    try {
      return address.length >= 32 && address.length <= 44;
    } catch {
      return false;
    }
  };

  // Fetch free_bet_available from chain whenever wallet or sdk changes
  useEffect(() => {
    if (!sdk || !wallet.publicKey) {
      setFreeBetAvailable(false);
      setFreeBetChecked(false);
      return;
    }
    let cancelled = false;
    sdk.getUserData(wallet.publicKey).then(data => {
      if (!cancelled) {
        setFreeBetAvailable(data?.freeBetAvailable === true);
        setFreeBetChecked(true);
      }
    }).catch(() => {
      if (!cancelled) setFreeBetChecked(true);
    });
    return () => { cancelled = true; };
  }, [sdk, wallet.publicKey]);

  const handleUseFreeBet = useCallback(async () => {
    if (!wallet.publicKey || !sdk) return;
    setIsUsingFreeBet(true);
    setErrorMessage('');
    try {
      const result = await sdk.useFreeBetDaily();
      if (result.success) {
        setFreeBetAvailable(false);
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
    if (!wallet.publicKey) {
      alert(t('walletNotConnected'));
      return;
    }

    if (stats.isPaused) {
      alert(t('contractPaused'));
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      setErrorMessage(language === 'en' ? 'Minimum deposit is 100 TPOT' : '最低投入 100 TPOT');
      return;
    }
    if (amount > 1_000_000) {
      setErrorMessage(language === 'en' ? 'Maximum deposit is 1,000,000 TPOT' : '最高投入 1,000,000 TPOT');
      return;
    }

    // 普通存款
    if (userTokenBalance < amount) {
      setErrorMessage(language === 'en'
        ? `Insufficient balance. You have ${userTokenBalance.toFixed(2)} TPOT`
        : `余额不足。您有 ${userTokenBalance.toFixed(2)} TPOT`);
      return;
    }

    if (referrer && !isValidReferrer(referrer)) {
      setErrorMessage(language === 'en' ? 'Invalid referrer address' : '推荐人地址无效');
      return;
    }

    if (referrer === wallet.publicKey.toString()) {
      setErrorMessage(language === 'en' ? 'Cannot use your own address as referrer' : '不能使用自己的地址作为推荐人');
      return;
    }

    setIsDepositing(true);
    setTxStatus('pending');
    setErrorMessage('');

    try {
      const result = await sdk.depositDaily(amount, referrer || null);
      
      if (result.success) {
        setTxStatus('success');
        alert(language === 'en' 
          ? `Success! Transaction: ${result.tx.slice(0, 8)}...` 
          : `成功！交易: ${result.tx.slice(0, 8)}...`);
        refreshStats();
        setDepositAmount('100');
        setReferrer('');
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
  }, [wallet, depositAmount, referrer, stats.isPaused, userTokenBalance, language, sdk, refreshStats, t, setErrorMessage]);

  const getButtonText = () => {
    if (isDepositing) return language === 'en' ? 'Processing...' : '处理中...';
    if (stats.isPaused) return language === 'en' ? 'Paused' : '已暂停';
    return language === 'en' ? 'Join Now' : '立即参与';
  };

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
          <span className="feature-tag">🎁 {language === 'en' ? 'Referral 8%' : '推广奖励 8%'}</span>
          <span className="feature-tag">⚡ {language === 'en' ? '1:1 Reserve' : '储备1:1配比'}</span>
          <span className="feature-tag">💎 {language === 'en' ? 'Daily 00:00 Draw' : '每日0点开奖'}</span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2" style={{ gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          {/* Pool Info Card */}
          <div className="card card-glass">
            <h2 className="card-title-modern">📊 {t('poolInfo')}</h2>
            
            <div className="pool-display-modern">
              <span className="pool-label-modern">{language === 'en' ? 'Current Pool' : '当前奖池'}</span>
              <span className="pool-value-modern">🪙 {(stats.dailyPool / 1e9).toFixed(2)}M TPOT</span>
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
                <span className="info-value-modern">{stats.dailyParticipants || '--'}</span>
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
            {wallet.publicKey && freeBetChecked && (
              freeBetAvailable ? (
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
                    disabled={isUsingFreeBet || stats.isPaused}
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

            <div className="form-group-modern" style={{ marginTop: 'var(--space-4)' }}>
              <label className="form-label-modern">{language === 'en' ? 'Referrer (Optional)' : '邀请人地址 (可选)'}</label>
              <input
                type="text"
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
                className="input-modern"
                placeholder={language === 'en' ? 'Enter referrer wallet address' : '输入邀请人钱包地址'}
              />
            </div>

            <p className="referral-note">
              🎁 {language === 'en' ? 'Referrer gets 8% reward' : '使用邀请码，邀请人可获得 8% 奖励'}
            </p>

            {errorMessage && (
              <div className="error-message">
                ❌ {errorMessage}
              </div>
            )}

            <button 
              onClick={handleDeposit}
              disabled={isDepositing || stats.isPaused}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-4)' }}
            >
              {isDepositing ? (language === 'en' ? 'Processing...' : '处理中...') : (stats.isPaused ? (language === 'en' ? 'Paused' : '已暂停') : `🎰 ${language === 'en' ? 'Join Now' : '参与抽奖'}`)}
            </button>
          </div>
        </div>

        {/* Reserve Matching */}
        <div className="card card-glass">
          <h2 className="card-title-modern">⚡ {language === 'en' ? 'Reserve Matching' : '储备配比机制'}</h2>
          <div className="reserve-visual">
            <div className="reserve-box">
              <span className="reserve-label">{language === 'en' ? 'Your Deposit' : '您的投入'}</span>
              <span className="reserve-arrow">→</span>
              <span className="reserve-value">100 TPOT</span>
            </div>
            <span className="reserve-plus">+</span>
            <div className="reserve-box">
              <span className="reserve-label">{language === 'en' ? 'Reserve Match' : '储备配比'}</span>
              <span className="reserve-arrow">→</span>
              <span className="reserve-value">100 TPOT</span>
            </div>
            <span className="reserve-equals">=</span>
            <div className="reserve-box-total">
              <span className="reserve-label">{language === 'en' ? 'Total in Pool' : '实际入池'}</span>
              <span className="reserve-value-total">200 TPOT</span>
            </div>
          </div>
          <p className="reserve-desc">
            {language === 'en' 
              ? 'Every deposit gets 1:1 matched from reserve pool, doubling your winning chance!' 
              : '您的每笔投入都将获得储备池 1:1 配比，翻倍您的中奖机会！'}
          </p>
        </div>

        {/* Prize Distribution */}
        <div className="card card-glass" style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="card-title-modern">💰 {t('prizeDistribution')}</h2>
          <div className="prize-grid">
            {[
              { name: language === 'en' ? '🥇 1st Prize' : '🥇 头奖', percent: '30% - 1人', color: '#FFD700' },
              { name: language === 'en' ? '🥈 2nd Prize' : '🥈 二奖', percent: '20% - 2人(各10%)', color: '#C0C0C0' },
              { name: language === 'en' ? '🥉 3rd Prize' : '🥉 三奖', percent: '15% - 3人(各5%)', color: '#CD7F32' },
              { name: language === 'en' ? '🎁 Lucky Prize' : '🎁 幸运奖', percent: '10% - 5人(各2%)', color: '#8B5CF6' },
              { name: language === 'en' ? '🌟 Universal Prize' : '🌟 普惠奖', percent: '20% - 全员', color: '#10B981' },
              { name: language === 'en' ? '🔄 Roll Over' : '🔄 回流', percent: '5%', color: '#6B7280' },
            ].map((prize, idx) => (
              <div key={idx} className="prize-item-modern">
                <span className="prize-name-modern">{prize.name}</span>
                <div className="prize-bar">
                  <div style={{ width: prize.percent, background: prize.color }}></div>
                </div>
                <span className="prize-percent-modern">{prize.percent}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fund Allocation */}
        <div className="card card-glass" style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="card-title-modern">📊 {t('fundAllocation')}</h2>
          <div className="fund-grid">
            {[
              { label: language === 'en' ? 'Burn' : '销毁', percent: '3%', color: '#EF4444' },
              { label: language === 'en' ? 'Platform' : '平台', percent: '2%', color: '#3B82F6' },
              { label: language === 'en' ? 'Pool' : '奖池', percent: '95%', color: '#FFD700' },
            ].map((fund, idx) => (
              <div key={idx} className="fund-item-modern">
                <span className="fund-label-modern">{fund.label}</span>
                <div className="fund-bar">
                  <div style={{ width: fund.percent, background: fund.color }}></div>
                </div>
                <span className="fund-percent-modern">{fund.percent}</span>
              </div>
            ))}
          </div>
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
        
        .reserve-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          flex-wrap: wrap;
          margin-bottom: var(--space-4);
        }
        
        .reserve-box, .reserve-box-total {
          background: oklch(15% 0.02 280);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          text-align: center;
          min-width: 120px;
        }
        
        .reserve-box-total {
          background: oklch(55% 0.15 45 / 0.2);
          border: 1px solid oklch(55% 0.15 45 / 0.3);
        }
        
        .reserve-label {
          display: block;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          margin-bottom: var(--space-2);
        }
        
        .reserve-value, .reserve-value-total {
          display: block;
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-gold);
        }
        
        .reserve-plus, .reserve-equals {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-gold);
        }
        
        .reserve-desc {
          text-align: center;
          color: var(--text-secondary);
          font-size: var(--text-sm);
          line-height: 1.6;
        }
        
        .referral-note {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          margin-top: var(--space-2);
        }
        
        .error-message {
          background: oklch(60% 0.18 25 / 0.15);
          border: 1px solid oklch(60% 0.18 25 / 0.3);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          margin-top: var(--space-3);
          color: var(--color-error);
          font-size: var(--text-sm);
        }
        
        .prize-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        
        .prize-item-modern {
          display: grid;
          grid-template-columns: 120px 1fr 50px;
          align-items: center;
          gap: var(--space-3);
        }
        
        .prize-name-modern {
          font-size: var(--text-sm);
          color: var(--text-primary);
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
        
        .fund-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
        }
        
        .fund-item-modern {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }
        
        .fund-label-modern {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }
        
        .fund-bar {
          width: 100%;
          height: 8px;
          background: oklch(20% 0.02 280);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        
        .fund-bar div {
          height: 100%;
          border-radius: var(--radius-full);
        }
        
        .fund-percent-modern {
          font-size: var(--text-lg);
          font-weight: 700;
        }
        
        @media (max-width: 768px) {
          .reserve-visual {
            flex-direction: column;
          }
          .reserve-plus, .reserve-equals {
            transform: rotate(90deg);
          }
          .fund-grid {
            grid-template-columns: 1fr;
          }
          .prize-item-modern {
            grid-template-columns: 1fr;
          }
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
