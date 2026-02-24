import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const MIN_DEPOSIT = 200;      // TPOT
const MAX_DEPOSIT = 1_000_000; // TPOT

const HourlyPool = () => {
  const { stats, wallet, sdk, refreshStats, userTokenBalance } = useApp();
  const { t, language } = useTranslation();
  const [depositAmount, setDepositAmount] = useState('200');
  const [isDepositing, setIsDepositing] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // null | 'pending' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

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
    if (isNaN(amount) || amount < MIN_DEPOSIT) {
      setErrorMessage(language === 'en'
        ? `Minimum deposit is ${MIN_DEPOSIT} TPOT`
        : `最低投入 ${MIN_DEPOSIT} TPOT`);
      return;
    }
    if (amount > MAX_DEPOSIT) {
      setErrorMessage(language === 'en'
        ? `Maximum deposit is ${MAX_DEPOSIT.toLocaleString()} TPOT`
        : `最高投入 ${MAX_DEPOSIT.toLocaleString()} TPOT`);
      return;
    }
    if (userTokenBalance < amount) {
      setErrorMessage(language === 'en'
        ? `Insufficient balance. You have ${userTokenBalance.toFixed(2)} TPOT`
        : `余额不足。您有 ${userTokenBalance.toFixed(2)} TPOT`);
      return;
    }

    setIsDepositing(true);
    setTxStatus('pending');
    setErrorMessage('');

    try {
      const result = await sdk.depositHourly(amount);
      if (result.success) {
        setTxStatus('success');
        alert(language === 'en'
          ? `Success! Transaction: ${result.tx.slice(0, 8)}...`
          : `成功！交易: ${result.tx.slice(0, 8)}...`);
        refreshStats();
        setDepositAmount('200');
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
  }, [wallet, depositAmount, stats.isPaused, userTokenBalance, language, sdk, refreshStats, t]);

  const formatTime = (timestamp) => {
    const diff = Math.max(0, timestamp - Date.now());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page-container">
      <div className="container">
        {/* Header */}
        <div className="page-header-modern">
          <div className="page-badge">⏰ Hourly Pool</div>
          <h1 className="page-title-modern">{t('hourlyPool')}</h1>
          <p className="page-subtitle-modern">
            {language === 'en' 
              ? 'Fast-paced gaming with hourly draws'
              : '每小时开奖，快节奏游戏体验'
            }
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2" style={{ gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          {/* Pool Info Card */}
          <div className="card card-glass">
            <h2 className="card-title-modern">📊 {t('poolInfo')}</h2>
            
            <div className="pool-display-modern">
              <span className="pool-label-modern">{language === 'en' ? 'Current Pool' : '当前奖池'}</span>
              <span className="pool-value-modern">🪙 {(stats.hourlyPool / 1e9).toFixed(2)}M TPOT</span>
            </div>
            
            <div className="countdown-modern">
              <span className="countdown-label-modern">{language === 'en' ? 'Next Draw' : '距离开奖'}</span>
              <span className="countdown-value-modern">{formatTime(stats.hourlyNextDraw)}</span>
            </div>
            
            <div className="info-grid-modern">
              <div className="info-item-modern">
                <span className="info-label-modern">{language === 'en' ? 'Participants' : '参与人数'}</span>
                <span className="info-value-modern">{stats.hourlyParticipants || '--'}</span>
              </div>
              <div className="info-item-modern">
                <span className="info-label-modern">{language === 'en' ? 'Min Deposit' : '最低投入'}</span>
                <span className="info-value-modern">200 TPOT</span>
              </div>
              <div className="info-item-modern">
                <span className="info-label-modern">{language === 'en' ? 'Draw Time' : '开奖周期'}</span>
                <span className="info-value-modern">{language === 'en' ? 'Every hour' : '每整点'}</span>
              </div>
            </div>
          </div>

          {/* Deposit Card */}
          <div className="card card-glass">
            <h2 className="card-title-modern">🎰 {t('joinNowBtn')}</h2>
            
            <div className="form-group-modern">
              <label className="form-label-modern">{language === 'en' ? 'Amount (TPOT)' : '投入数量 (TPOT)'}</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="200"
                className="input-modern"
                placeholder="200"
              />
            </div>
            
            <div className="quick-amount-grid">
              {['200', '500', '1000', '5000'].map(amount => (
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
                marginBottom: 'var(--space-3)',
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
                marginBottom: 'var(--space-3)',
              }}>
                ✅ {language === 'en' ? 'Deposit successful!' : '存款成功！'}
              </div>
            )}
            <button
              onClick={handleDeposit}
              disabled={isDepositing || stats.isPaused}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-4)' }}
            >
              {isDepositing
                ? (language === 'en' ? '⏳ Processing...' : '⏳ 处理中...')
                : stats.isPaused
                  ? (language === 'en' ? '⏸ Paused' : '⏸ 已暂停')
                  : `🎰 ${language === 'en' ? 'Join Now' : '参与抽奖'}`
              }
            </button>
          </div>
        </div>

        {/* Prize Distribution */}
        <div className="card card-glass">
          <h2 className="card-title-modern">💰 {t('prizeDistribution')}</h2>
          <div className="prize-grid">
            {[
              { name: '🥇 1st Prize', percent: '30%', color: '#FFD700' },
              { name: '🥈 2nd Prize', percent: '20%', color: '#C0C0C0' },
              { name: '🥉 3rd Prize', percent: '15%', color: '#CD7F32' },
              { name: '🎁 Lucky Prize', percent: '10%', color: '#8B5CF6' },
              { name: '🌟 Universal Prize', percent: '20%', color: '#10B981' },
              { name: '🔄 Roll Over', percent: '5%', color: '#6B7280' },
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
                <div className="fund-progress">
                  <div style={{ width: fund.percent, background: fund.color }}></div>
                </div>
                <span className="fund-percent-modern">{fund.percent}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .page-header-modern {
          text-align: center;
          padding: var(--space-12) 0;
        }
        
        .page-badge {
          display: inline-block;
          background: oklch(55% 0.2 270 / 0.2);
          color: var(--color-gold);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: 600;
          margin-bottom: var(--space-4);
        }
        
        .page-title-modern {
          font-size: var(--text-4xl);
          font-weight: 700;
          margin-bottom: var(--space-3);
          background: linear-gradient(135deg, #FFD700, #8B5CF6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .page-subtitle-modern {
          font-size: var(--text-lg);
          color: var(--text-secondary);
        }
        
        .card-title-modern {
          font-size: var(--text-xl);
          font-weight: 600;
          margin-bottom: var(--space-6);
          color: var(--text-primary);
        }
        
        .pool-display-modern {
          background: oklch(15% 0.02 280);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          text-align: center;
          margin-bottom: var(--space-4);
        }
        
        .pool-label-modern {
          display: block;
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          margin-bottom: var(--space-2);
        }
        
        .pool-value-modern {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-gold);
        }
        
        .countdown-modern {
          background: linear-gradient(135deg, oklch(55% 0.2 270 / 0.2), oklch(45% 0.15 280 / 0.2));
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          text-align: center;
          margin-bottom: var(--space-4);
        }
        
        .countdown-label-modern {
          display: block;
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin-bottom: var(--space-2);
        }
        
        .countdown-value-modern {
          font-size: var(--text-3xl);
          font-weight: 700;
          font-family: var(--font-mono);
          color: var(--text-primary);
        }
        
        .info-grid-modern {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-3);
        }
        
        .info-item-modern {
          text-align: center;
          padding: var(--space-3);
          background: oklch(15% 0.02 280);
          border-radius: var(--radius-md);
        }
        
        .info-label-modern {
          display: block;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          margin-bottom: var(--space-1);
        }
        
        .info-value-modern {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .form-group-modern {
          margin-bottom: var(--space-4);
        }
        
        .form-label-modern {
          display: block;
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: var(--space-2);
        }
        
        .input-modern {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          background: oklch(15% 0.02 280);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: var(--text-lg);
        }
        
        .input-modern:focus {
          border-color: var(--color-purple);
          box-shadow: 0 0 0 3px oklch(55% 0.2 270 / 0.2);
          outline: none;
        }
        
        .quick-amount-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-2);
        }
        
        .quick-btn {
          padding: var(--space-2) var(--space-3);
          background: oklch(15% 0.02 280);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .quick-btn:hover, .quick-btn.active {
          background: oklch(55% 0.2 270 / 0.2);
          border-color: var(--color-gold);
          color: var(--color-gold);
        }
        
        .prize-grid {
          display: grid;
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
          color: var(--text-secondary);
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
        }
        
        .prize-percent-modern {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
          text-align: right;
        }
        
        .fund-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        
        .fund-item-modern {
          display: grid;
          grid-template-columns: 100px 1fr 50px;
          align-items: center;
          gap: var(--space-3);
        }
        
        .fund-label-modern {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }
        
        .fund-progress {
          height: 12px;
          background: oklch(20% 0.02 280);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        
        .fund-progress div {
          height: 100%;
          border-radius: var(--radius-full);
        }
        
        .fund-percent-modern {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
        }
        
        @media (max-width: 768px) {
          .grid-cols-2 { grid-template-columns: 1fr !important; }
          .info-grid-modern { grid-template-columns: 1fr !important; }
          .prize-item-modern { grid-template-columns: 1fr !important; gap: var(--space-2); }
          .fund-item-modern { grid-template-columns: 1fr !important; gap: var(--space-2); }
        }
      `}</style>
    </div>
  );
};

export default HourlyPool;
