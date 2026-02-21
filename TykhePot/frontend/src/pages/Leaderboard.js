import React, { useState } from 'react';

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('winners');

  // 模拟排行榜数据
  const topWinners = [
    { rank: 1, address: '7xK9...3mN2', totalWon: 125000, biggestWin: 50000, wins: 5 },
    { rank: 2, address: '9pL4...8kQ1', totalWon: 98000, biggestWin: 35000, wins: 8 },
    { rank: 3, address: '2mN8...4jP7', totalWon: 87500, biggestWin: 45000, wins: 4 },
    { rank: 4, address: '5qR3...9hT6', totalWon: 72000, biggestWin: 28000, wins: 6 },
    { rank: 5, address: '8sU2...6gW5', totalWon: 68000, biggestWin: 30000, wins: 5 },
    { rank: 6, address: '3vX7...2dZ9', totalWon: 54000, biggestWin: 20000, wins: 7 },
    { rank: 7, address: '6yC1...5fV4', totalWon: 48000, biggestWin: 18000, wins: 6 },
    { rank: 8, address: '4bE9...8aN3', totalWon: 42000, biggestWin: 15000, wins: 8 },
    { rank: 9, address: '1hJ5...3kM8', totalWon: 38000, biggestWin: 12000, wins: 9 },
    { rank: 10, address: '9wQ2...7pL6', totalWon: 35000, biggestWin: 10000, wins: 10 },
  ];

  const topPlayers = [
    { rank: 1, address: '7xK9...3mN2', totalDeposit: 500000, participation: 156, referrals: 12 },
    { rank: 2, address: 'AbC3...DeF5', totalDeposit: 480000, participation: 142, referrals: 8 },
    { rank: 3, address: 'GhI7...JkL9', totalDeposit: 450000, participation: 138, referrals: 15 },
    { rank: 4, address: 'MnO1...PqR3', totalDeposit: 420000, participation: 125, referrals: 6 },
    { rank: 5, address: 'StU5...VwX7', totalDeposit: 380000, participation: 118, referrals: 10 },
  ];

  const recentBigWins = [
    { address: '7xK9...3mN2', amount: 50000, pool: 'daily', time: '10分钟前' },
    { address: '2mN8...4jP7', amount: 35000, pool: 'hourly', time: '35分钟前' },
    { address: '9pL4...8kQ1', amount: 28000, pool: 'daily', time: '1小时前' },
    { address: '5qR3...9hT6', amount: 22000, pool: 'hourly', time: '2小时前' },
    { address: '8sU2...6gW5', amount: 18000, pool: 'daily', time: '3小时前' },
  ];

  const getRankStyle = (rank) => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', color: '#000' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #CD7F32, #B87333)', color: '#fff' };
    return { background: 'rgba(255,255,255,0.1)', color: '#fff' };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏆 排行榜</h1>
        <p style={styles.subtitle}>TykhePot 最幸运的玩家</p>
      </div>

      {/* 最近大奖 */}
      <div style={styles.bigWinsSection}>
        <h2 style={styles.sectionTitle}>🎉 最近大奖</h2>
        <div style={styles.bigWinsList}>
          {recentBigWins.map((win, index) => (
            <div key={index} style={styles.bigWinItem}>
              <span style={styles.bigWinAddress}>{win.address}</span>
              <span style={styles.bigWinAmount}>+{win.amount.toLocaleString()} TPOT</span>
              <span style={styles.bigWinMeta}>
                {win.pool === 'daily' ? '🌙 天池' : '⏰ 小时池'} • {win.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 标签页 */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('winners')}
          style={{...styles.tab, ...(activeTab === 'winners' ? styles.tabActive : {})}}
        >
          💰 中奖榜
        </button>
        <button
          onClick={() => setActiveTab('players')}
          style={{...styles.tab, ...(activeTab === 'players' ? styles.tabActive : {})}}
        >
          🎮 活跃榜
        </button>
      </div>

      {/* 排行榜内容 */}
      <div style={styles.leaderboardContainer}>
        {activeTab === 'winners' ? (
          <div>
            <div style={styles.leaderboardHeader}>
              <span style={styles.colRank}>排名</span>
              <span style={styles.colAddress}>地址</span>
              <span style={styles.colAmount}>总中奖</span>
              <span style={styles.colAmount}>最大单奖</span>
              <span style={styles.colCount}>中奖次数</span>
            </div>
            {topWinners.map((player) => (
              <div key={player.rank} style={styles.leaderboardRow}>
                <span style={{...styles.rankBadge, ...getRankStyle(player.rank)}}>
                  {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                </span>
                <span style={styles.address}>{player.address}</span>
                <span style={styles.amount}>{player.totalWon.toLocaleString()}</span>
                <span style={styles.amount}>{player.biggestWin.toLocaleString()}</span>
                <span style={styles.count}>{player.wins}</span>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={styles.leaderboardHeader}>
              <span style={styles.colRank}>排名</span>
              <span style={styles.colAddress}>地址</span>
              <span style={styles.colAmount}>总投入</span>
              <span style={styles.colCount}>参与次数</span>
              <span style={styles.colCount}>邀请人数</span>
            </div>
            {topPlayers.map((player) => (
              <div key={player.rank} style={styles.leaderboardRow}>
                <span style={{...styles.rankBadge, ...getRankStyle(player.rank)}}>
                  {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                </span>
                <span style={styles.address}>{player.address}</span>
                <span style={styles.amount}>{player.totalDeposit.toLocaleString()}</span>
                <span style={styles.count}>{player.participation}</span>
                <span style={styles.count}>{player.referrals}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 提示 */}
      <div style={styles.tip}>
        <p>💡 排行榜每小时更新一次。成为活跃玩家，也许下一个幸运儿就是你！</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 24px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
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
  bigWinsSection: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#FFD700',
    marginBottom: '16px',
  },
  bigWinsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  bigWinItem: {
    background: 'rgba(0, 255, 136, 0.1)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  },
  bigWinAddress: {
    display: 'block',
    fontSize: '14px',
    color: '#A0A0A0',
    marginBottom: '4px',
  },
  bigWinAmount: {
    display: 'block',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#00FF88',
    marginBottom: '4px',
  },
  bigWinMeta: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
  },
  tabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  tab: {
    flex: 1,
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    borderRadius: '8px',
    color: '#A0A0A0',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  tabActive: {
    background: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    borderColor: '#FFD700',
  },
  leaderboardContainer: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  leaderboardHeader: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 120px 120px 100px',
    gap: '16px',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '14px',
    color: '#A0A0A0',
    fontWeight: 'bold',
  },
  leaderboardRow: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 120px 120px 100px',
    gap: '16px',
    padding: '16px 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  colRank: { textAlign: 'center' },
  colAddress: {},
  colAmount: { textAlign: 'right' },
  colCount: { textAlign: 'center' },
  rankBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '0 auto',
  },
  address: {
    fontSize: '14px',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  amount: {
    fontSize: '14px',
    color: '#00FF88',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  count: {
    fontSize: '14px',
    color: '#A0A0A0',
    textAlign: 'center',
  },
  tip: {
    marginTop: '24px',
    padding: '16px',
    background: 'rgba(255, 215, 0, 0.1)',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#A0A0A0',
    fontSize: '14px',
  },
};

export default Leaderboard;
