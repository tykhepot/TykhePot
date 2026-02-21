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
      alert(language === 'en' ? 'Please connect wallet first' : '请先连接钱包');
      return;
    }
    setIsDepositing(true);
    // TODO: 调用合约
    setTimeout(() => {
      setIsDepositing(false);
      alert(language === 'en' ? 'Success!' : '参与成功！');
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>⏰ {t('hourlyPool')}</h1>
        <p style={styles.subtitle}>{language === 'en' ? 'Hourly draws, fast-paced gaming' : '每小时开奖，快节奏游戏'}</p>
      </div>

      <div style={styles.grid}>
        {/* 奖池信息 */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>{language === 'en' ? 'Pool Info' : '奖池信息'}</h2>
          <div style={styles.poolDisplay}>
            <span style={styles.poolLabel}>当前奖池</span>
            <span style={styles.poolValue}>🪙 {(stats.hourlyPool / 1e9).toFixed(2)}M TPOT</span>
          </div>
          <div style={styles.countdownBox}>
            <span style={styles.countdownLabel}>距离开奖</span>
            <span style={styles.countdownValue}>{formatTime(stats.hourlyNextDraw)}</span>
          </div>
          <div style={styles.infoList}>
            <div style={styles.infoItem}>
              <span>参与人数</span>
              <span style={styles.infoValue}>{stats.hourlyParticipants} 人</span>
            </div>
            <div style={styles.infoItem}>
              <span>最低投入</span>
              <span style={styles.infoValue}>200 TPOT</span>
            </div>
            <div style={styles.infoItem}>
              <span>开奖周期</span>
              <span style={styles.infoValue}>每整点</span>
            </div>
          </div>
        </div>

        {/* 参与区域 */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>立即参与</h2>
          <div style={styles.depositSection}>
            <label style={styles.label}>投入数量 (TPOT)</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              min="200"
              style={styles.input}
              placeholder="最低 200 TPOT"
            />
            <div style={styles.quickButtons}>
              <button onClick={() => setDepositAmount('200')} style={styles.quickBtn}>200</button>
              <button onClick={() => setDepositAmount('500')} style={styles.quickBtn}>500</button>
              <button onClick={() => setDepositAmount('1000')} style={styles.quickBtn}>1000</button>
              <button onClick={() => setDepositAmount('5000')} style={styles.quickBtn}>5000</button>
            </div>
            <button 
              onClick={handleDeposit}
              disabled={isDepositing}
              style={styles.depositButton}
            >
              {isDepositing ? '处理中...' : '🎰 参与抽奖'}
            </button>
          </div>
        </div>
      </div>

      {/* 奖金分配 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>💰 奖金分配</h2>
        <div style={styles.prizeDistribution}>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🥇 头奖</span>
            <span style={styles.prizePercent}>30%</span>
            <span style={styles.prizeDetail}>1人 / 20天释放</span>
          </div>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🥈 二等奖</span>
            <span style={styles.prizePercent}>20%</span>
            <span style={styles.prizeDetail}>2人 / 20天释放</span>
          </div>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🥉 三等奖</span>
            <span style={styles.prizePercent}>15%</span>
            <span style={styles.prizeDetail}>3人 / 20天释放</span>
          </div>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🎁 幸运奖</span>
            <span style={styles.prizePercent}>10%</span>
            <span style={styles.prizeDetail}>5人 / 20天释放</span>
          </div>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🌟 普惠奖</span>
            <span style={styles.prizePercent}>20%</span>
            <span style={styles.prizeDetail}>所有未中大奖者 / 立即到账</span>
          </div>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🔄 回流</span>
            <span style={styles.prizePercent}>5%</span>
            <span style={styles.prizeDetail}>滚入下期奖池</span>
          </div>
        </div>
      </div>

      {/* 资金分配说明 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📊 资金分配说明</h2>
        <div style={styles.fundDistribution}>
          <div style={styles.fundItem}>
            <span style={styles.fundLabel}>销毁</span>
            <div style={styles.fundBar}>
              <div style={{...styles.fundFill, width: '3%', background: '#FF4444'}}></div>
            </div>
            <span style={styles.fundPercent}>3%</span>
          </div>
          <div style={styles.fundItem}>
            <span style={styles.fundLabel}>平台</span>
            <div style={styles.fundBar}>
              <div style={{...styles.fundFill, width: '2%', background: '#4488FF'}}></div>
            </div>
            <span style={styles.fundPercent}>2%</span>
          </div>
          <div style={styles.fundItem}>
            <span style={styles.fundLabel}>奖池</span>
            <div style={styles.fundBar}>
              <div style={{...styles.fundFill, width: '95%', background: '#FFD700'}}></div>
            </div>
            <span style={styles.fundPercent}>95%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '36px',
    color: '#FFD700',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#A0A0A0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  card: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  cardTitle: {
    fontSize: '20px',
    color: '#FFD700',
    marginBottom: '20px',
  },
  poolDisplay: {
    textAlign: 'center',
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  poolLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#A0A0A0',
    marginBottom: '8px',
  },
  poolValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  countdownBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 215, 0, 0.1)',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  countdownLabel: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  countdownValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'monospace',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#A0A0A0',
  },
  infoValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  depositSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  input: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '18px',
    color: '#FFFFFF',
    outline: 'none',
  },
  quickButtons: {
    display: 'flex',
    gap: '8px',
  },
  quickBtn: {
    background: 'rgba(255, 215, 0, 0.1)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '6px',
    padding: '8px 16px',
    color: '#FFD700',
    cursor: 'pointer',
    fontSize: '14px',
  },
  depositButton: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  prizeDistribution: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  prizeRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
  },
  prizeName: {
    flex: 1,
    fontSize: '16px',
    color: '#FFFFFF',
  },
  prizePercent: {
    width: '60px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  prizeDetail: {
    flex: 1,
    fontSize: '14px',
    color: '#A0A0A0',
    textAlign: 'right',
  },
  fundDistribution: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fundItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  fundLabel: {
    width: '60px',
    fontSize: '14px',
    color: '#A0A0A0',
  },
  fundBar: {
    flex: 1,
    height: '24px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  fundFill: {
    height: '100%',
    borderRadius: '4px',
  },
  fundPercent: {
    width: '50px',
    fontSize: '14px',
    color: '#FFFFFF',
    textAlign: 'right',
  },
};

export default HourlyPool;
