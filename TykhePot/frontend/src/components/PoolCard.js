import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';

const PoolCard = ({
  type,
  title,
  description,
  minDeposit,
  currentPool,
  nextDraw,
  participants,
  hasReferral = false 
}) => {
  const { t } = useTranslation();
  
  const formatTime = (timestamp) => {
    const diff = Math.max(0, timestamp - Date.now());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatAmount = (amount) => {
    if (amount >= 1e9) {
      return `${(amount / 1e9).toFixed(2)}M`;
    } else if (amount >= 1e6) {
      return `${(amount / 1e6).toFixed(2)}K`;
    }
    return amount.toString();
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        {hasReferral && (
          <span style={styles.badge}>🎁 {t('referral')}</span>
        )}
      </div>

      <p style={styles.description}>{description}</p>

      <div style={styles.poolInfo}>
        <div style={styles.poolAmount}>
          <span style={styles.poolLabel}>{t('currentPool')}</span>
          <span style={styles.poolValue}>🪙 {formatAmount(currentPool)} TPOT</span>
        </div>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statLabel}>{t('minDeposit')}</span>
            <span style={styles.statValue}>{minDeposit} TPOT</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>{t('participants')}</span>
            <span style={styles.statValue}>{participants}</span>
          </div>
        </div>
      </div>

      <div style={styles.countdown}>
        <span style={styles.countdownLabel}>⏰ {t('nextDraw')}</span>
        <span style={styles.countdownValue}>{formatTime(nextDraw)}</span>
      </div>

      <Link
        to={`/${type}`}
        style={styles.button}
      >
        {t('enterPool')} →
      </Link>
    </div>
  );
};

const styles = {
  card: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    color: '#FFD700',
    margin: 0,
  },
  badge: {
    background: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  description: {
    color: '#A0A0A0',
    fontSize: '14px',
    margin: 0,
  },
  poolInfo: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: '16px',
  },
  poolAmount: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  poolLabel: {
    fontSize: '12px',
    color: '#A0A0A0',
    marginBottom: '4px',
  },
  poolValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#A0A0A0',
  },
  statValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  countdown: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 215, 0, 0.1)',
    padding: '12px 16px',
    borderRadius: '8px',
  },
  countdownLabel: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  countdownValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'monospace',
  },
  button: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
};

export default PoolCard;
