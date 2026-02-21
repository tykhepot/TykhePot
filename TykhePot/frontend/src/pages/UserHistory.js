import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const UserHistory = () => {
  const { wallet } = useApp();
  const [activeTab, setActiveTab] = useState('participation');
  
  // 模拟历史数据
  const participationHistory = [
    { id: 1, type: 'hourly', amount: 200, time: '2026-02-19 14:30', tx: '5xK9...3mN2', result: 'pending' },
    { id: 2, type: 'daily', amount: 500, time: '2026-02-18 23:55', tx: '7xL2...8nP4', result: 'universal', reward: 25 },
    { id: 3, type: 'hourly', amount: 200, time: '2026-02-18 13:00', tx: '3mN8...4jP7', result: 'win', reward: 1200 },
  ];

  const rewardsHistory = [
    { id: 1, type: 'prize', amount: 1200, pool: 'hourly', time: '2026-02-18 14:00', tx: 'ClaimTx...9kQ1' },
    { id: 2, type: 'universal', amount: 25, pool: 'daily', time: '2026-02-19 00:00', tx: 'ClaimTx...2hR5' },
    { id: 3, type: 'referral', amount: 40, from: '7xK9...3mN2', time: '2026-02-17 10:20', tx: 'RefTx...5jM8' },
  ];

  const stakingHistory = [
    { id: 1, type: 'short', amount: 10000, startTime: '2026-02-01', endTime: '2026-03-03', status: 'active', estimatedReward: 65 },
    { id: 2, type: 'long', amount: 50000, startTime: '2026-01-15', endTime: '2026-07-14', status: 'active', estimatedReward: 3945 },
  ];

  const getResultBadge = (result) => {
    const badges = {
      pending: { text: '等待开奖', color: '#FFA500' },
      win: { text: '🎉 中奖', color: '#00FF88' },
      universal: { text: '🌟 普惠奖', color: '#4488FF' },
      lose: { text: '未中奖', color: '#888' },
    };
    const badge = badges[result] || badges.lose;
    return <span style={{...styles.badge, background: badge.color + '20', color: badge.color}}>{badge.text}</span>;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📜 我的历史</h1>
        <p style={styles.subtitle}>查看您的参与记录、收益和质押</p>
      </div>

      {/* 统计卡片 */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>总参与次数</span>
          <span style={styles.statValue}>23 次</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>累计中奖</span>
          <span style={styles.statValue}>1,245 TPOT</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>推广奖励</span>
          <span style={styles.statValue}>120 TPOT</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>质押中</span>
          <span style={styles.statValue}>60,000 TPOT</span>
        </div>
      </div>

      {/* 标签页 */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('participation')}
          style={{...styles.tab, ...(activeTab === 'participation' ? styles.tabActive : {})}}
        >
          🎮 参与记录
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          style={{...styles.tab, ...(activeTab === 'rewards' ? styles.tabActive : {})}}
        >
          💰 收益记录
        </button>
        <button
          onClick={() => setActiveTab('staking')}
          style={{...styles.tab, ...(activeTab === 'staking' ? styles.tabActive : {})}}
        >
          📊 质押记录
        </button>
      </div>

      {/* 内容区域 */}
      <div style={styles.content}>
        {activeTab === 'participation' && (
          <div>
            <h3 style={styles.sectionTitle}>参与记录</h3>
            {participationHistory.map(item => (
              <div key={item.id} style={styles.historyItem}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemType}>
                    {item.type === 'hourly' ? '⏰ 小时池' : '🌙 天池'}
                  </span>
                  <span style={styles.itemTime}>{item.time}</span>
                </div>
                <div style={styles.itemDetails}>
                  <span>投入: {item.amount} TPOT</span>
                  {getResultBadge(item.result)}
                  {item.reward && <span style={styles.reward}>+{item.reward} TPOT</span>}
                </div>
                <a 
                  href={`https://solscan.io/tx/${item.tx}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.txLink}
                >
                  查看交易 →
                </a>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rewards' && (
          <div>
            <h3 style={styles.sectionTitle}>收益记录</h3>
            {rewardsHistory.map(item => (
              <div key={item.id} style={styles.historyItem}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemType}>
                    {item.type === 'prize' ? '🏆 奖金' : 
                     item.type === 'universal' ? '🌟 普惠奖' : '🤝 推广奖励'}
                  </span>
                  <span style={styles.itemTime}>{item.time}</span>
                </div>
                <div style={styles.itemDetails}>
                  <span style={styles.rewardAmount}>+{item.amount} TPOT</span>
                  {item.pool && <span>来自: {item.pool === 'hourly' ? '小时池' : '天池'}</span>}
                  {item.from && <span>来自: {item.from}</span>}
                </div>
                <a 
                  href={`https://solscan.io/tx/${item.tx}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.txLink}
                >
                  查看交易 →
                </a>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'staking' && (
          <div>
            <h3 style={styles.sectionTitle}>质押记录</h3>
            {stakingHistory.map(item => (
              <div key={item.id} style={styles.historyItem}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemType}>
                    {item.type === 'short' ? '⚡ 短期质押 (30天)' : '💎 长期质押 (180天)'}
                  </span>
                  <span style={{...styles.status, background: item.status === 'active' ? '#00ff8820' : '#88888820', color: item.status === 'active' ? '#00ff88' : '#888'}}>
                    {item.status === 'active' ? '进行中' : '已结束'}
                  </span>
                </div>
                <div style={styles.stakingDetails}>
                  <div style={styles.detailRow}>
                    <span>质押金额: {item.amount.toLocaleString()} TPOT</span>
                    <span>预计收益: +{item.estimatedReward} TPOT</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span>开始: {item.startTime}</span>
                    <span>结束: {item.endTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 24px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    color: '#FFD700',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#A0A0A0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  statLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#A0A0A0',
    marginBottom: '8px',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  tabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
    paddingBottom: '16px',
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    color: '#A0A0A0',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.3s',
  },
  tabActive: {
    background: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
  },
  content: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#FFD700',
    marginBottom: '20px',
  },
  historyItem: {
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  itemType: {
    fontSize: '16px',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  itemTime: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  itemDetails: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '8px',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  reward: {
    color: '#00FF88',
    fontWeight: 'bold',
  },
  rewardAmount: {
    color: '#00FF88',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  txLink: {
    color: '#4488FF',
    fontSize: '14px',
    textDecoration: 'none',
  },
  status: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  stakingDetails: {
    marginTop: '12px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    color: '#A0A0A0',
    fontSize: '14px',
  },
};

export default UserHistory;
