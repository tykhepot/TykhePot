import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

// Placeholder data — real data requires an on-chain indexer
const SAMPLE_PARTICIPATION = [
  { id: 1, type: 'hourly', amount: 200, time: '2026-02-19 14:30', tx: '5xK9...3mN2', result: 'pending' },
  { id: 2, type: 'daily',  amount: 500, time: '2026-02-18 23:55', tx: '7xL2...8nP4', result: 'universal', reward: 25 },
  { id: 3, type: 'hourly', amount: 200, time: '2026-02-18 13:00', tx: '3mN8...4jP7', result: 'win',       reward: 1200 },
];

const SAMPLE_REWARDS = [
  { id: 1, type: 'prize',    amount: 1200, pool: 'hourly', time: '2026-02-18 14:00', tx: 'ClaimTx...9kQ1' },
  { id: 2, type: 'universal', amount: 25,  pool: 'daily',  time: '2026-02-19 00:00', tx: 'ClaimTx...2hR5' },
  { id: 3, type: 'referral', amount: 40,   from: '7xK9...3mN2', time: '2026-02-17 10:20', tx: 'RefTx...5jM8' },
];

const SAMPLE_STAKING = [
  { id: 1, type: 'short', amount: 10000, startTime: '2026-02-01', endTime: '2026-03-03', status: 'active',   estimatedReward: 65 },
  { id: 2, type: 'long',  amount: 50000, startTime: '2026-01-15', endTime: '2026-07-14', status: 'active',   estimatedReward: 3945 },
];

const UserHistory = () => {
  const { wallet } = useApp();
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState('participation');

  const getResultBadge = (result) => {
    const map = {
      pending:   { text: language === 'en' ? 'Pending' : '等待开奖', cls: 'uh-badge-pending' },
      win:       { text: language === 'en' ? '🎉 Won'  : '🎉 中奖',  cls: 'uh-badge-win' },
      universal: { text: language === 'en' ? '🌟 Universal' : '🌟 普惠奖', cls: 'uh-badge-universal' },
      lose:      { text: language === 'en' ? 'No prize' : '未中奖',  cls: 'uh-badge-lose' },
    };
    const b = map[result] || map.lose;
    return <span className={`uh-badge ${b.cls}`}>{b.text}</span>;
  };

  const poolLabel = (type) => {
    if (type === 'hourly') return language === 'en' ? '⏰ Hourly' : '⏰ 小时池';
    if (type === 'daily')  return language === 'en' ? '🌙 Daily'  : '🌙 天池';
    return language === 'en' ? '⏱️ 30 Min' : '⏱️ 30分钟池';
  };

  const tabs = [
    { key: 'participation', label: language === 'en' ? '🎮 Participation' : '🎮 参与记录' },
    { key: 'rewards',       label: language === 'en' ? '💰 Rewards'       : '💰 收益记录' },
    { key: 'staking',       label: language === 'en' ? '📊 Staking'       : '📊 质押记录' },
  ];

  if (!wallet?.publicKey) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="uh-header">
            <div className="page-badge">📜 {language === 'en' ? 'History' : '历史记录'}</div>
            <h1 className="page-title-modern">
              {language === 'en' ? 'My History' : '我的记录'}
            </h1>
          </div>
          <div className="card card-glass uh-no-wallet">
            <p>{language === 'en' ? 'Connect your wallet to view your history.' : '请先连接钱包以查看您的历史记录。'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">

        {/* Header */}
        <div className="uh-header">
          <div className="page-badge">📜 {language === 'en' ? 'History' : '历史记录'}</div>
          <h1 className="page-title-modern">
            {language === 'en' ? 'My History' : '我的记录'}
          </h1>
          <p className="page-subtitle-modern">
            {language === 'en'
              ? 'Participation, rewards, and staking records'
              : '参与记录、收益记录与质押记录'}
          </p>
        </div>

        {/* Stats strip */}
        <div className="uh-stats-strip">
          {[
            { label: language === 'en' ? 'Total Entries'    : '总参与次数', value: '23' },
            { label: language === 'en' ? 'Total Won'        : '累计中奖',   value: '1,245 TPOT' },
            { label: language === 'en' ? 'Referral Earned'  : '推广奖励',   value: '120 TPOT' },
            { label: language === 'en' ? 'Staked'           : '质押中',     value: '60,000 TPOT' },
          ].map((s, i) => (
            <div key={i} className="uh-stat">
              <span className="uh-stat-label">{s.label}</span>
              <span className="uh-stat-value">{s.value}</span>
            </div>
          ))}
        </div>

        <p className="uh-placeholder-note">
          ℹ️ {language === 'en'
            ? 'Sample data shown — real history requires an on-chain indexer (coming soon).'
            : '当前显示示例数据，真实历史记录需要链上索引服务（即将上线）。'}
        </p>

        {/* Tabs */}
        <div className="uh-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`uh-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card card-glass uh-content">

          {activeTab === 'participation' && (
            <>
              <h3 className="uh-section-title">
                {language === 'en' ? 'Participation Records' : '参与记录'}
              </h3>
              {SAMPLE_PARTICIPATION.map(item => (
                <div key={item.id} className="uh-item">
                  <div className="uh-item-top">
                    <span className="uh-item-type">{poolLabel(item.type)}</span>
                    <span className="uh-item-time">{item.time}</span>
                  </div>
                  <div className="uh-item-details">
                    <span className="uh-item-amount">
                      {language === 'en' ? 'Deposit:' : '投入:'} {item.amount} TPOT
                    </span>
                    {getResultBadge(item.result)}
                    {item.reward && (
                      <span className="uh-reward">+{item.reward} TPOT</span>
                    )}
                  </div>
                  <a
                    className="uh-tx-link"
                    href={`https://solscan.io/tx/${item.tx}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {language === 'en' ? 'View Tx →' : '查看交易 →'}
                  </a>
                </div>
              ))}
            </>
          )}

          {activeTab === 'rewards' && (
            <>
              <h3 className="uh-section-title">
                {language === 'en' ? 'Reward Records' : '收益记录'}
              </h3>
              {SAMPLE_REWARDS.map(item => (
                <div key={item.id} className="uh-item">
                  <div className="uh-item-top">
                    <span className="uh-item-type">
                      {item.type === 'prize'     ? (language === 'en' ? '🏆 Prize'       : '🏆 奖金')
                       : item.type === 'universal' ? (language === 'en' ? '🌟 Universal'   : '🌟 普惠奖')
                       :                            (language === 'en' ? '🤝 Referral'    : '🤝 推广奖励')}
                    </span>
                    <span className="uh-item-time">{item.time}</span>
                  </div>
                  <div className="uh-item-details">
                    <span className="uh-reward-amount">+{item.amount} TPOT</span>
                    {item.pool && (
                      <span className="uh-item-meta">
                        {language === 'en' ? 'From:' : '来自:'} {poolLabel(item.pool)}
                      </span>
                    )}
                    {item.from && (
                      <span className="uh-item-meta">
                        {language === 'en' ? 'Referee:' : '来自:'} {item.from}
                      </span>
                    )}
                  </div>
                  <a
                    className="uh-tx-link"
                    href={`https://solscan.io/tx/${item.tx}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {language === 'en' ? 'View Tx →' : '查看交易 →'}
                  </a>
                </div>
              ))}
            </>
          )}

          {activeTab === 'staking' && (
            <>
              <h3 className="uh-section-title">
                {language === 'en' ? 'Staking Records' : '质押记录'}
              </h3>
              <p className="uh-staking-note">
                {language === 'en'
                  ? 'For live staking data and actions, visit the Staking page.'
                  : '实时质押数据和操作请前往质押页面。'}
              </p>
              {SAMPLE_STAKING.map(item => (
                <div key={item.id} className="uh-item">
                  <div className="uh-item-top">
                    <span className="uh-item-type">
                      {item.type === 'short'
                        ? (language === 'en' ? '⚡ Short Term (30d)' : '⚡ 短期质押 (30天)')
                        : (language === 'en' ? '💎 Long Term (180d)' : '💎 长期质押 (180天)')}
                    </span>
                    <span className={`uh-status-badge ${item.status === 'active' ? 'active' : ''}`}>
                      {item.status === 'active'
                        ? (language === 'en' ? 'Active' : '进行中')
                        : (language === 'en' ? 'Ended'  : '已结束')}
                    </span>
                  </div>
                  <div className="uh-staking-details">
                    <div className="uh-detail-row">
                      <span>{language === 'en' ? 'Staked:' : '质押额:'} {item.amount.toLocaleString()} TPOT</span>
                      <span>{language === 'en' ? 'Est. Reward:' : '预计收益:'} +{item.estimatedReward} TPOT</span>
                    </div>
                    <div className="uh-detail-row">
                      <span>{language === 'en' ? 'Start:' : '开始:'} {item.startTime}</span>
                      <span>{language === 'en' ? 'End:' : '到期:'} {item.endTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </div>

      <style>{`
        .uh-header {
          text-align: center;
          padding: var(--space-12) 0 var(--space-6);
        }

        .uh-no-wallet {
          text-align: center;
          padding: var(--space-16);
          color: var(--text-tertiary);
        }

        .uh-stats-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        @media (max-width: 640px) {
          .uh-stats-strip { grid-template-columns: 1fr 1fr; }
        }

        .uh-stat {
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .uh-stat-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .uh-stat-value {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--color-gold);
        }

        .uh-placeholder-note {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-align: center;
          margin-bottom: var(--space-5);
          background: oklch(55% 0.2 270 / 0.08);
          border: 1px solid oklch(55% 0.2 270 / 0.2);
          border-radius: var(--radius-md);
          padding: var(--space-2) var(--space-4);
        }

        .uh-tabs {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: var(--space-4);
          flex-wrap: wrap;
        }

        .uh-tab {
          padding: var(--space-2) var(--space-5);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .uh-tab:hover {
          color: var(--text-primary);
          border-color: var(--border-default);
        }

        .uh-tab.active {
          background: oklch(55% 0.2 270 / 0.15);
          border-color: var(--color-gold);
          color: var(--color-gold);
        }

        .uh-content {
          min-height: 300px;
        }

        .uh-section-title {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--color-gold);
          margin-bottom: var(--space-5);
        }

        .uh-staking-note {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          margin-bottom: var(--space-4);
        }

        .uh-item {
          padding: var(--space-4);
          background: oklch(12% 0.02 280 / 0.5);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-3);
        }

        .uh-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .uh-item-type {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
        }

        .uh-item-time {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        .uh-item-details {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: var(--space-2);
        }

        .uh-item-amount {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .uh-item-meta {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .uh-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 600;
        }

        .uh-badge-pending   { background: oklch(65% 0.15 60 / 0.2); color: oklch(75% 0.15 60); }
        .uh-badge-win       { background: oklch(55% 0.2 140 / 0.2); color: #4ade80; }
        .uh-badge-universal { background: oklch(55% 0.2 240 / 0.2); color: #60a5fa; }
        .uh-badge-lose      { background: oklch(30% 0.02 280 / 0.5); color: var(--text-tertiary); }

        .uh-reward {
          font-size: var(--text-sm);
          font-weight: 700;
          color: #4ade80;
        }

        .uh-reward-amount {
          font-size: var(--text-base);
          font-weight: 700;
          color: #4ade80;
        }

        .uh-tx-link {
          font-size: var(--text-xs);
          color: #60a5fa;
          text-decoration: none;
        }

        .uh-tx-link:hover { text-decoration: underline; }

        .uh-status-badge {
          font-size: var(--text-xs);
          padding: 2px 10px;
          border-radius: var(--radius-full);
          background: oklch(30% 0.02 280 / 0.5);
          color: var(--text-tertiary);
        }

        .uh-status-badge.active {
          background: oklch(55% 0.2 140 / 0.15);
          color: #4ade80;
        }

        .uh-staking-details {
          margin-top: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .uh-detail-row {
          display: flex;
          justify-content: space-between;
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default UserHistory;
