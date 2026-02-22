import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('winners');
  const { t, language } = useTranslation();

  const topWinners = [
    { rank: 1, address: '7xK9...3mN2', totalWon: 125000, biggestWin: 50000, wins: 5 },
    { rank: 2, address: '9pL4...8kQ1', totalWon: 98000, biggestWin: 35000, wins: 8 },
    { rank: 3, address: '2mN8...4jP7', totalWon: 87500, biggestWin: 45000, wins: 4 },
    { rank: 4, address: '5qR3...9hT6', totalWon: 72000, biggestWin: 28000, wins: 6 },
    { rank: 5, address: '8sU2...6gW5', totalWon: 68000, biggestWin: 30000, wins: 5 },
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
  ];

  const getRankStyle = (rank) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', color: '#000' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #CD7F32, #B87333)', color: '#fff' };
    return { bg: 'rgba(255,255,255,0.1)', color: '#fff' };
  };

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header-modern">
          <div className="page-badge">🏆 Leaderboard</div>
          <h1 className="page-title-modern">{t('leaderboard')}</h1>
          <p className="page-subtitle-modern">
            {language === 'en' 
              ? 'Top players and recent winners'
              : '顶级玩家和最近的中奖者'
            }
          </p>
        </div>

        {/* Recent Big Wins */}
        <div className="recent-wins">
          <h3>🎉 {t('recentWinners')}</h3>
          <div className="wins-grid">
            {recentBigWins.map((win, idx) => (
              <div key={idx} className="win-card">
                <span className="win-address">{win.address}</span>
                <span className="win-amount">+{win.amount.toLocaleString()} TPOT</span>
                <span className="win-meta">
                  {win.pool === 'daily' ? '🌙' : '⏰'} {win.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-modern">
          <button 
            className={`tab-modern ${activeTab === 'winners' ? 'active' : ''}`}
            onClick={() => setActiveTab('winners')}
          >
            💰 {language === 'en' ? 'Winners' : '中奖榜'}
          </button>
          <button 
            className={`tab-modern ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            🎮 {language === 'en' ? 'Active Players' : '活跃榜'}
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="leaderboard-table">
          <div className="table-header">
            <span>#</span>
            <span>{language === 'en' ? 'Address' : '地址'}</span>
            <span>{activeTab === 'winners' ? (language === 'en' ? 'Total Won' : '总中奖') : (language === 'en' ? 'Total Deposit' : '总投入')}</span>
            <span>{activeTab === 'winners' ? (language === 'en' ? 'Wins' : '中奖次数') : (language === 'en' ? 'Participation' : '参与次数')}</span>
          </div>
          {(activeTab === 'winners' ? topWinners : topPlayers).map((player) => (
            <div key={player.rank} className="table-row">
              <span>
                <span className="rank-badge" style={getRankStyle(player.rank)}>
                  {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                </span>
              </span>
              <span className="address">{player.address}</span>
              <span className="amount">
                {activeTab === 'winners' 
                  ? player.totalWon.toLocaleString() 
                  : player.totalDeposit.toLocaleString()
                } TPOT
              </span>
              <span className="count">
                {activeTab === 'winners' ? player.wins : player.participation}
              </span>
            </div>
          ))}
        </div>

        <div className="leaderboard-note">
          <p>💡 {t('leaderboardUpdated')}</p>
        </div>
      </div>

      <style>{`
        .recent-wins {
          margin-bottom: var(--space-8);
        }
        
        .recent-wins h3 {
          font-size: var(--text-xl);
          margin-bottom: var(--space-4);
          color: var(--text-primary);
        }
        
        .wins-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }
        
        .win-card {
          background: linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.05));
          border: 1px solid rgba(0,255,136,0.3);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          text-align: center;
        }
        
        .win-address {
          display: block;
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          margin-bottom: var(--space-2);
        }
        
        .win-amount {
          display: block;
          font-size: var(--text-xl);
          font-weight: 700;
          color: #00FF88;
          margin-bottom: var(--space-2);
        }
        
        .win-meta {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }
        
        .leaderboard-table {
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        
        .table-header {
          display: grid;
          grid-template-columns: 60px 1fr 150px 100px;
          gap: var(--space-4);
          padding: var(--space-4);
          background: rgba(0,0,0,0.3);
          font-weight: 600;
          color: var(--text-tertiary);
          font-size: var(--text-sm);
        }
        
        .table-row {
          display: grid;
          grid-template-columns: 60px 1fr 150px 100px;
          gap: var(--space-4);
          padding: var(--space-4);
          border-bottom: 1px solid var(--border-subtle);
          align-items: center;
        }
        
        .table-row:last-child {
          border-bottom: none;
        }
        
        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-weight: 700;
          font-size: var(--text-sm);
        }
        
        .address {
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          color: var(--text-primary);
        }
        
        .amount {
          font-weight: 600;
          color: var(--color-gold);
        }
        
        .count {
          color: var(--text-secondary);
        }
        
        .leaderboard-note {
          text-align: center;
          margin-top: var(--space-8);
          padding: var(--space-4);
          background: rgba(255,215,0,0.1);
          border-radius: var(--radius-lg);
          color: var(--text-tertiary);
        }
        
        @media (max-width: 600px) {
          .table-header, .table-row {
            grid-template-columns: 50px 1fr 100px;
          }
          .table-header span:nth-child(4),
          .table-row .count {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
