import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const Referral = () => {
  const { wallet } = useApp();
  const { language } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [discordMsg, setDiscordMsg] = useState(false);

  const pubkey = wallet?.publicKey?.toString() ?? null;
  const referralLink = pubkey
    ? `https://tykhepot.io/?ref=${pubkey}`
    : '';

  const handleCopy = () => {
    if (!pubkey) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    if (!pubkey) return;
    const link = encodeURIComponent(referralLink);
    const text = encodeURIComponent(language === 'en'
      ? 'Join TykhePot — fair on-chain lottery on Solana! Get 100 TPOT free airdrop and win big prizes!'
      : '加入 TykhePot — Solana 链上公平彩票！领取100 TPOT空投，赢取大奖！');
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${link}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${link}&text=${text}`, '_blank', 'noopener,noreferrer');
    } else {
      navigator.clipboard.writeText(referralLink);
      setDiscordMsg(true);
      setTimeout(() => setDiscordMsg(false), 2000);
    }
  };

  const rules = language === 'en' ? [
    'Only Daily Pool deposits trigger referral rewards (Hourly / 30 Min excluded)',
    'Single-level referral — 8% of the deposit amount paid from the referral pool to the referrer',
    'Rewards are paid after the round succeeds on-chain (via automated claim service, not at deposit time)',
    'Rewards stop when the referral pool is exhausted',
    'Each wallet can only bind one referrer (lifetime — locked at first deposit)',
  ] : [
    '仅天池存款触发推广奖励，小时池和30分钟池不计入',
    '单层推广 — 被推荐人存款额的 8% 从推广池支付给推荐人',
    '奖励在该轮开奖成功后由链上自动发放（cron 服务触发，非存款时即时支付）',
    '推广池耗尽后停止发放奖励',
    '每个钱包只能绑定一个推荐人（终身有效，首次存款时锁定）',
  ];

  const tips = [
    {
      icon: '🐦',
      title: language === 'en' ? 'Social Media' : '社交媒体',
      desc: language === 'en'
        ? 'Share on Twitter, Telegram, Discord'
        : '在 Twitter、Telegram、Discord 分享推广链接',
    },
    {
      icon: '📝',
      title: language === 'en' ? 'Content Creation' : '内容创作',
      desc: language === 'en'
        ? 'Write guides or create video tutorials about TykhePot'
        : '撰写 TykhePot 介绍文章或制作视频教程',
    },
    {
      icon: '👥',
      title: language === 'en' ? 'Community' : '社区运营',
      desc: language === 'en'
        ? 'Join or build crypto communities and share the project'
        : '建立或加入加密货币社区，分享项目信息',
    },
    {
      icon: '🎯',
      title: language === 'en' ? 'Targeted Outreach' : '精准推广',
      desc: language === 'en'
        ? 'Target users interested in DeFi and GameFi'
        : '针对对 DeFi 和 GameFi 感兴趣的用户群体',
    },
  ];

  return (
    <div className="page-container">
      <div className="container">

        {/* Header */}
        <div className="rf-header">
          <div className="page-badge">🤝 {language === 'en' ? 'Referral' : '推广'}</div>
          <h1 className="page-title-modern">
            {language === 'en' ? 'Referral Program' : '推广计划'}
          </h1>
          <p className="page-subtitle-modern">
            {language === 'en'
              ? 'Invite friends to the Daily Pool and earn 8% referral rewards'
              : '邀请好友参与天池，每笔存款获得 8% 推广奖励'}
          </p>
        </div>

        {/* Stats strip */}
        <div className="rf-stats-strip">
          <div className="rf-stat">
            <span className="rf-stat-label">{language === 'en' ? 'Reward Rate' : '奖励比例'}</span>
            <span className="rf-stat-value rf-gold">8%</span>
          </div>
          <div className="rf-stat">
            <span className="rf-stat-label">{language === 'en' ? 'Eligible Pool' : '适用奖池'}</span>
            <span className="rf-stat-value">🌙 {language === 'en' ? 'Daily Only' : '仅限天池'}</span>
          </div>
          <div className="rf-stat">
            <span className="rf-stat-label">{language === 'en' ? 'Paid From' : '奖励来源'}</span>
            <span className="rf-stat-value">{language === 'en' ? 'Referral Pool' : '推广池'}</span>
          </div>
          <div className="rf-stat">
            <span className="rf-stat-label">{language === 'en' ? 'My Earnings' : '我的收益'}</span>
            <span className="rf-stat-value rf-muted">{language === 'en' ? 'Indexer TBD' : '统计开发中'}</span>
          </div>
        </div>

        {/* Referral link card */}
        <div className="card card-glass rf-card">
          <h2 className="rf-card-title">🔗 {language === 'en' ? 'My Referral Link' : '我的推广链接'}</h2>
          {pubkey ? (
            <>
              <div className="rf-link-row">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="rf-link-input"
                />
                <button className="rf-copy-btn" onClick={handleCopy}>
                  {copied
                    ? (language === 'en' ? '✅ Copied!' : '✅ 已复制')
                    : (language === 'en' ? '📋 Copy' : '📋 复制')}
                </button>
              </div>
              <div className="rf-share-row">
                <span className="rf-share-label">
                  {language === 'en' ? 'Share to:' : '分享到:'}
                </span>
                <button className="rf-share-btn" onClick={() => handleShare('twitter')}>Twitter / X</button>
                <button className="rf-share-btn" onClick={() => handleShare('telegram')}>Telegram</button>
                <button className="rf-share-btn" onClick={() => handleShare('discord')}>
                  {discordMsg
                    ? (language === 'en' ? '✅ Copied!' : '✅ 已复制')
                    : 'Discord'}
                </button>
              </div>
            </>
          ) : (
            <div className="rf-no-wallet">
              <p>{language === 'en'
                ? 'Connect your wallet to get your referral link.'
                : '请先连接钱包以获取推广链接。'}
              </p>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="card card-glass rf-card">
          <h2 className="rf-card-title">🎁 {language === 'en' ? 'How It Works' : '推广机制'}</h2>
          <div className="rf-steps">
            {[
              {
                num: '1',
                title: language === 'en' ? 'Share Link' : '分享链接',
                desc: language === 'en' ? 'Share your unique referral link' : '将您的专属推广链接分享给好友',
              },
              {
                num: '2',
                title: language === 'en' ? 'Friend Deposits' : '好友入金',
                desc: language === 'en' ? 'Friend deposits in Daily Pool via your link' : '好友通过链接参与天池游戏',
              },
              {
                num: '3',
                title: language === 'en' ? 'Draw Succeeds' : '开奖成功',
                desc: language === 'en' ? 'Round completes with ≥12 participants' : '本轮达到12人以上成功开奖',
              },
              {
                num: '4',
                title: language === 'en' ? 'Earn 8%' : '获得 8%',
                desc: language === 'en' ? 'Referral pool pays 8% of deposit to you' : '推广池向您支付存款额的 8%',
              },
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div className="rf-step">
                  <div className="rf-step-num">{step.num}</div>
                  <div>
                    <div className="rf-step-title">{step.title}</div>
                    <div className="rf-step-desc">{step.desc}</div>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="rf-step-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>

          <div className="rf-rules">
            <h4 className="rf-rules-title">📋 {language === 'en' ? 'Rules' : '规则说明'}</h4>
            <ul className="rf-rules-list">
              {rules.map((r, i) => (
                <li key={i} className="rf-rule-item">✓ {r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Referral records — indexer pending */}
        <div className="card card-glass rf-card">
          <h2 className="rf-card-title">📊 {language === 'en' ? 'Referral Records' : '推广记录'}</h2>
          <div className="rf-empty">
            <div className="rf-empty-icon">📭</div>
            <p className="rf-empty-title">
              {language === 'en' ? 'On-chain records indexer coming soon' : '链上记录统计功能开发中'}
            </p>
            <p className="rf-empty-desc">
              {language === 'en'
                ? 'Referral reward history will be available after the indexer launches.'
                : '推广奖励历史将在索引服务上线后展示。'}
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="card card-glass rf-card">
          <h2 className="rf-card-title">💡 {language === 'en' ? 'Tips for Referrers' : '推广技巧'}</h2>
          <div className="rf-tips-grid">
            {tips.map((tip, i) => (
              <div key={i} className="rf-tip">
                <span className="rf-tip-icon">{tip.icon}</span>
                <div className="rf-tip-title">{tip.title}</div>
                <div className="rf-tip-desc">{tip.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .rf-header {
          text-align: center;
          padding: var(--space-12) 0 var(--space-6);
        }

        .rf-stats-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        @media (max-width: 640px) {
          .rf-stats-strip { grid-template-columns: 1fr 1fr; }
        }

        .rf-stat {
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .rf-stat-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .rf-stat-value {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
        }

        .rf-gold { color: var(--color-gold); }

        .rf-muted {
          font-size: var(--text-sm) !important;
          color: var(--text-tertiary) !important;
        }

        .rf-card {
          margin-bottom: var(--space-6);
        }

        .rf-card-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-5);
        }

        .rf-link-row {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .rf-link-input {
          flex: 1;
          min-width: 0;
          background: oklch(10% 0.02 280);
          border: 1px solid oklch(55% 0.15 45 / 0.3);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-sm);
          color: var(--color-gold);
          font-family: var(--font-mono);
          outline: none;
        }

        .rf-copy-btn {
          padding: var(--space-3) var(--space-5);
          background: linear-gradient(135deg, var(--color-gold), oklch(60% 0.2 45));
          border: none;
          border-radius: var(--radius-md);
          color: oklch(10% 0.02 45);
          font-weight: 700;
          font-size: var(--text-sm);
          cursor: pointer;
          white-space: nowrap;
          transition: opacity var(--transition-fast);
        }

        .rf-copy-btn:hover { opacity: 0.85; }

        .rf-share-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .rf-share-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .rf-share-btn {
          background: oklch(55% 0.15 45 / 0.1);
          border: 1px solid oklch(55% 0.15 45 / 0.3);
          border-radius: var(--radius-md);
          padding: var(--space-2) var(--space-4);
          color: var(--color-gold);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .rf-share-btn:hover { background: oklch(55% 0.15 45 / 0.25); }

        .rf-no-wallet {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-tertiary);
          font-size: var(--text-sm);
        }

        .rf-steps {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          flex-wrap: wrap;
          margin-bottom: var(--space-6);
          padding: var(--space-5);
          background: oklch(12% 0.02 280 / 0.5);
          border-radius: var(--radius-lg);
        }

        .rf-step {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          flex: 1;
          min-width: 130px;
        }

        .rf-step-num {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--color-gold), oklch(60% 0.2 45));
          color: oklch(10% 0.02 45);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--text-base);
          flex-shrink: 0;
        }

        .rf-step-title {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .rf-step-desc {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          line-height: 1.5;
        }

        .rf-step-arrow {
          font-size: var(--text-xl);
          color: var(--color-gold);
          font-weight: 700;
          align-self: center;
          flex-shrink: 0;
        }

        @media (max-width: 700px) {
          .rf-step-arrow { display: none; }
          .rf-steps { flex-direction: column; }
        }

        .rf-rules {
          background: oklch(12% 0.02 280 / 0.5);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .rf-rules-title {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-gold);
          margin-bottom: var(--space-3);
        }

        .rf-rules-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .rf-rule-item {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .rf-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-10);
          gap: var(--space-3);
          text-align: center;
        }

        .rf-empty-icon { font-size: 2.5rem; }

        .rf-empty-title {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-secondary);
          margin: 0;
        }

        .rf-empty-desc {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          margin: 0;
        }

        .rf-tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--space-4);
        }

        .rf-tip {
          background: oklch(12% 0.02 280 / 0.5);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          text-align: center;
        }

        .rf-tip-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: var(--space-3);
        }

        .rf-tip-title {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-gold);
          margin-bottom: var(--space-2);
        }

        .rf-tip-desc {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default Referral;
