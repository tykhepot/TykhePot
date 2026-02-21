import React from 'react';
import { useApp } from '../context/AppContext';

const StatsSection = () => {
  const { stats, isLoading } = useApp();

  const formatAmount = (amount) => {
    if (amount >= 1e9) {
      return `${(amount / 1e9).toFixed(2)}M`;
    } else if (amount >= 1e6) {
      return `${(amount / 1e6).toFixed(2)}K`;
    }
    return amount.toString();
  };

  const statItems = [
    { label: '总奖池', value: formatAmount(stats.totalPool), icon: '🏆' },
    { label: '累计销毁', value: formatAmount(stats.totalBurned), icon: '🔥' },
    { label: '在线玩家', value: stats.onlinePlayers.toLocaleString(), icon: '👥' },
    { label: '小时池', value: formatAmount(stats.hourlyPool), icon: '⏰' },
    { label: '天池', value: formatAmount(stats.dailyPool), icon: '🌙' },
    { label: '总参与人次', value: (stats.hourlyParticipants + stats.dailyParticipants).toLocaleString(), icon: '🎮' },
  ];

  return (
    <section style={styles.section}>
      <div className="container">
        <h2 style={styles.title}>实时数据</h2>
        <div style={styles.grid}>
          {statItems.map((item, index) => (
            <div key={index} style={styles.statCard}>
              <span style={styles.icon}>{item.icon}</span>
              <span style={styles.value}>
                {isLoading ? '...' : item.value}
              </span>
              <span style={styles.label}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const styles = {
  section: {
    padding: '60px 0',
    background: 'linear-gradient(180deg, #0A0A0A 0%, #1A1A2E 100%)',
  },
  title: {
    fontSize: '32px',
    textAlign: 'center',
    marginBottom: '40px',
    color: '#FFFFFF',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid rgba(255, 215, 0, 0.1)',
    transition: 'transform 0.3s ease',
  },
  icon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  value: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: '8px',
  },
  label: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
};

export default StatsSection;
