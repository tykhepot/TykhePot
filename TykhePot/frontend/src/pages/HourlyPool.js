import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const HourlyPool = () => {
  const { stats, wallet } = useApp();
  const { t, language } = useTranslation();
  const [depositAmount, setDepositAmount] = useState('200');
  const [isDepositing, setIsDepositing] = useState(false);

  const handleDeposit = async () => {
    if (!wallet.publicKey) {
      alert(t('walletNotConnected'));
      return;
    }
    setIsDepositing(true);
    setTimeout(() => {
      setIsDepositing(false);
      alert(t('depositSuccess'));
    }, 2000);
  };

  const formatTime = (timestamp) => {
    const diff = Math.max(0, timestamp - Date.now());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⏰ {t('hourlyPool')}</h1>
        <p className="page-subtitle">{language === 'en' ? 'Hourly draws, fast-paced gaming' : '每小时开奖，快节奏游戏'}</p>
      </div>

      <div className="card-grid card-grid-2" style={{ marginBottom: '1rem' }}>
        {/* Pool Info */}
        <div className="content-card">
          <h2 className="card-title">{t('poolInfo')}</h2>
          
          <div className="pool-display">
            <span className="pool-label">{language === 'en' ? 'Current Pool' : '当前奖池'}</span>
            <span className="pool-value">🪙 {(stats.hourlyPool / 1e9).toFixed(2)}M TPOT</span>
          </div>
          
          <div className="countdown-box">
            <span className="countdown-label">{language === 'en' ? 'Next Draw' : '距离开奖'}</span>
            <span className="countdown-value">{formatTime(stats.hourlyNextDraw)}</span>
          </div>
          
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">{language === 'en' ? 'Participants' : '参与人数'}</span>
              <span className="info-value">{stats.hourlyParticipants}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{language === 'en' ? 'Min Deposit' : '最低投入'}</span>
              <span className="info-value">200 TPOT</span>
            </div>
            <div className="info-row">
              <span className="info-label">{language === 'en' ? 'Draw Time' : '开奖周期'}</span>
              <span className="info-value">{language === 'en' ? 'Every hour' : '每整点'}</span>
            </div>
          </div>
        </div>

        {/* Deposit Section */}
        <div className="content-card">
          <h2 className="card-title">{t('joinNowBtn')}</h2>
          
          <div className="form-group">
            <label className="form-label">{language === 'en' ? 'Amount (TPOT)' : '投入数量 (TPOT)'}</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              min="200"
              className="form-input"
              placeholder="200"
            />
          </div>
          
          <div className="quick-amount-grid">
            <button className="quick-amount-btn" onClick={() => setDepositAmount('200')}>200</button>
            <button className="quick-amount-btn" onClick={() => setDepositAmount('500')}>500</button>
            <button className="quick-amount-btn" onClick={() => setDepositAmount('1000')}>1K</button>
            <button className="quick-amount-btn" onClick={() => setDepositAmount('5000')}>5K</button>
          </div>
          
          <button 
            onClick={handleDeposit}
            disabled={isDepositing}
            className="btn-block btn-primary-gradient"
          >
            {isDepositing ? (language === 'en' ? 'Processing...' : '处理中...') : '🎰 ' + (language === 'en' ? 'Join Now' : '参与抽奖')}
          </button>
        </div>
      </div>

      {/* Prize Distribution */}
      <div className="content-card">
        <h2 className="card-title">💰 {t('prizeDistribution')}</h2>
        <div className="prize-list">
          <div className="prize-row">
            <span className="prize-name">🥇 {language === 'en' ? '1st Prize' : '头奖'}</span>
            <span className="prize-percent">30%</span>
          </div>
          <div className="prize-row">
            <span className="prize-name">🥈 {language === 'en' ? '2nd Prize' : '二等奖'}</span>
            <span className="prize-percent">20%</span>
          </div>
          <div className="prize-row">
            <span className="prize-name">🥉 {language === 'en' ? '3rd Prize' : '三等奖'}</span>
            <span className="prize-percent">15%</span>
          </div>
          <div className="prize-row">
            <span className="prize-name">🎁 {language === 'en' ? 'Lucky Prize' : '幸运奖'}</span>
            <span className="prize-percent">10%</span>
          </div>
          <div className="prize-row">
            <span className="prize-name">🌟 {language === 'en' ? 'Universal Prize' : '普惠奖'}</span>
            <span className="prize-percent">20%</span>
          </div>
          <div className="prize-row">
            <span className="prize-name">🔄 {language === 'en' ? 'Roll Over' : '回流'}</span>
            <span className="prize-percent">5%</span>
          </div>
        </div>
      </div>

      {/* Fund Allocation */}
      <div className="content-card">
        <h2 className="card-title">📊 {t('fundAllocation')}</h2>
        <div className="fund-list">
          <div className="fund-item">
            <span className="fund-label">{language === 'en' ? 'Burn' : '销毁'}</span>
            <div className="fund-bar">
              <div style={{ width: '3%', background: '#FF4444' }} className="fund-fill"></div>
            </div>
            <span className="fund-percent">3%</span>
          </div>
          <div className="fund-item">
            <span className="fund-label">{language === 'en' ? 'Platform' : '平台'}</span>
            <div className="fund-bar">
              <div style={{ width: '2%', background: '#4488FF' }} className="fund-fill"></div>
            </div>
            <span className="fund-percent">2%</span>
          </div>
          <div className="fund-item">
            <span className="fund-label">{language === 'en' ? 'Pool' : '奖池'}</span>
            <div className="fund-bar">
              <div style={{ width: '95%', background: '#FFD700' }} className="fund-fill"></div>
            </div>
            <span className="fund-percent">95%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HourlyPool;
