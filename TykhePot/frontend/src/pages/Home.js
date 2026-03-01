import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import { POOL_TYPE } from '../config/contract';

// Format TPOT amounts already in human-readable units (e.g. 1234.5 → "1.2K")
const fmtPool = (n) => {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
};

// Remaining time to timestamp (ms); re-renders via outer tick state
const formatTime = (timestamp) => {
  if (!timestamp) return '--:--:--';
  const diff = Math.max(0, timestamp - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

const Home = () => {
  const { stats, isLoading } = useApp();
  const { t, language } = useTranslation();

  // Force a re-render every second so countdowns stay live
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const pools = stats.pools || {};

  const poolCards = [
    {
      id: 'min30',
      route: '/min30',
      badge: language === 'en' ? 'Fast' : '快节奏',
      badgeClass: 'hm-badge-fast',
      title: t('min30Title'),
      desc: t('min30Desc') || (language === 'en' ? 'Draws every 30 minutes' : '每30分钟开奖'),
      pool: stats.min30Pool,
      participants: stats.min30Participants,
      nextDraw: stats.min30NextDraw,
      rollover: pools[POOL_TYPE.MIN30]?.rollover,
      minDeposit: '500 TPOT',
      extras: [],
    },
    {
      id: 'hourly',
      route: '/hourly',
      badge: language === 'en' ? 'Balanced' : '均衡',
      badgeClass: 'hm-badge-balanced',
      title: t('hourlyTitle'),
      desc: t('hourlyDesc') || (language === 'en' ? 'Draws every hour' : '每小时开奖'),
      pool: stats.hourlyPool,
      participants: stats.hourlyParticipants,
      nextDraw: stats.hourlyNextDraw,
      rollover: pools[POOL_TYPE.HOURLY]?.rollover,
      minDeposit: '200 TPOT',
      extras: [],
    },
    {
      id: 'daily',
      route: '/daily',
      badge: language === 'en' ? 'Most Popular' : '最热门',
      badgeClass: 'hm-badge-popular',
      title: t('dailyTitle'),
      desc: t('dailyDesc') || (language === 'en' ? 'Daily draw at 00:00 UTC' : '每日0点开奖'),
      pool: stats.dailyPool,
      participants: stats.dailyParticipants,
      nextDraw: stats.dailyNextDraw,
      rollover: pools[POOL_TYPE.DAILY]?.rollover,
      minDeposit: '100 TPOT',
      extras: [
        { icon: '🔀', label: language === 'en' ? 'Reserve 1:1 Match' : '储备1:1配捐' },
        { icon: '👥', label: language === 'en' ? '+8% referral reward' : '推荐奖励 +8%' },
        { icon: '🎁', label: language === 'en' ? 'Free bet eligible' : '支持免费投注' },
      ],
    },
  ];

  const features = [
    { icon: '🔮', title: t('fairTitle'),    desc: t('fairDesc')    },
    { icon: '🔥', title: t('burnTitle'),    desc: t('burnDesc')    },
    { icon: '💰', title: t('prizeTitle'),   desc: t('prizeDesc')   },
    { icon: '🎁', title: t('airdropTitle'), desc: t('airdropDesc') },
  ];

  return (
    <div className="home-page">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hm-hero">
        <div className="hm-hero-bg">
          <div className="hm-glow" />
          <div className="hm-grid" />
        </div>

        <div className="hm-hero-inner container">
          <div className="animate-fade-in">
            <span className="badge badge-gold">✨ {language === 'en' ? 'Fair & Transparent' : '公平透明'}</span>
          </div>

          <h1 className="hm-title animate-slide-up delay-1">
            <span className="hm-title-gradient">{t('heroTitle')}</span>
          </h1>

          <p className="hm-subtitle animate-slide-up delay-2">{t('heroSubtitle')}</p>
          <p className="hm-desc animate-slide-up delay-3">{t('heroDescription')}</p>

          <div className="hm-actions animate-slide-up delay-4">
            <Link to="/daily" className="btn btn-primary btn-lg hm-btn-glow">
              {t('joinNow')}
            </Link>
            <Link to="/whitepaper" className="btn btn-ghost btn-lg">
              {t('whitepaper')}
            </Link>
          </div>

          {/* Hero stats */}
          <div className="hm-hero-stats animate-slide-up delay-5">
            <div className="hm-stat">
              <span className="hm-stat-value">
                {isLoading ? '…' : fmtPool(stats.totalPool)}
              </span>
              <span className="hm-stat-label">{t('totalPool')} (TPOT)</span>
            </div>
            <div className="hm-stat-divider" />
            <div className="hm-stat">
              <span className="hm-stat-value">11</span>
              <span className="hm-stat-label">{language === 'en' ? 'Winners / Draw' : '每期获奖人数'}</span>
            </div>
            <div className="hm-stat-divider" />
            <div className="hm-stat">
              <span className="hm-stat-value hm-stat-live">
                <span className="hm-live-dot" />
                {isLoading ? '…' : (stats.onlinePlayers || 0)}
              </span>
              <span className="hm-stat-label">{t('onlinePlayers')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pool cards ───────────────────────────────────────────────── */}
      <section className="hm-pools-section">
        <div className="container">
          <div className="hm-section-header">
            <h2 className="section-title">{t('choosePool')}</h2>
            <p className="section-subtitle">
              {language === 'en' ? 'Choose your luck pool — everyone wins something!' : '选择奖池参与，每位参与者都能获奖！'}
            </p>
          </div>

          <div className="hm-pools-grid">
            {poolCards.map(p => (
              <div key={p.id} className={`hm-pool-card hm-pool-${p.id}`}>
                {p.badge && (
                  <span className={`hm-pool-badge ${p.badgeClass}`}>{p.badge}</span>
                )}

                <div className="hm-pool-header">
                  <h3>{p.title}</h3>
                </div>
                <p className="hm-pool-desc">{p.desc}</p>

                {/* Live stats */}
                <div className="hm-pool-stats">
                  <div className="hm-pool-stat">
                    <span className="hm-pool-stat-value">
                      {isLoading ? '…' : fmtPool(p.pool)}
                    </span>
                    <span className="hm-pool-stat-label">{t('currentPool')}</span>
                  </div>
                  <div className="hm-pool-stat">
                    <span className="hm-pool-stat-value">
                      {isLoading ? '…' : (p.participants ?? '--')}
                    </span>
                    <span className="hm-pool-stat-label">{t('participants')}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="hm-pool-info">
                  <div className="hm-pool-row">
                    <span>{t('minDeposit')}</span>
                    <span>{p.minDeposit}</span>
                  </div>
                  <div className="hm-pool-row">
                    <span>{t('drawRule')}</span>
                    <span>&lt;12: refund</span>
                  </div>
                  {p.rollover > 0 && (
                    <div className="hm-pool-row hm-pool-row-rollover">
                      <span>🔄 {language === 'en' ? 'Rollover' : '结转'}</span>
                      <span>{fmtPool(p.rollover)} TPOT</span>
                    </div>
                  )}
                  <div className="hm-pool-row hm-pool-row-countdown">
                    <span>{t('nextDraw')}</span>
                    <span className="hm-countdown">{formatTime(p.nextDraw)}</span>
                  </div>
                </div>

                {/* Daily-only extras */}
                {p.extras.length > 0 && (
                  <div className="hm-pool-extras">
                    {p.extras.map((e, i) => (
                      <span key={i} className="hm-extra-chip">{e.icon} {e.label}</span>
                    ))}
                  </div>
                )}

                <Link to={p.route} className={`btn btn-primary${p.id === 'daily' ? ' hm-btn-glow' : ''}`} style={{ width: '100%', marginTop: 'var(--space-4)' }}>
                  {t('joinNowBtn')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="hm-features-section">
        <div className="container">
          <div className="hm-section-header">
            <h2 className="section-title">{t('featuresTitle')}</h2>
            <p className="section-subtitle">
              {language === 'en' ? 'Why choose TykhePot?' : '为什么选择 TykhePot？'}
            </p>
          </div>

          <div className="hm-features-grid">
            {features.map((f, i) => (
              <div key={i} className="hm-feature-card">
                <div className="hm-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        /* ── Hero ──────────────────────────────────────────────────── */
        .hm-hero {
          position: relative;
          padding: var(--space-20) 0;
          overflow: hidden;
        }
        .hm-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .hm-glow {
          position: absolute;
          top: -50%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, oklch(45% 0.15 280 / 0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .hm-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(oklch(100% 0 0 / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, oklch(100% 0 0 / 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        }
        .hm-hero-inner {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }
        .hm-title {
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin: var(--space-6) 0;
        }
        .hm-title-gradient {
          display: block;
          background: linear-gradient(135deg, #FFD700 0%, #FFE55C 50%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hm-subtitle {
          font-size: var(--text-xl);
          color: var(--color-gold);
          font-weight: 600;
          margin-bottom: var(--space-3);
        }
        .hm-desc {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto var(--space-8);
          line-height: 1.7;
        }
        .hm-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: var(--space-12);
        }
        .hm-btn-glow {
          position: relative;
        }
        .hm-btn-glow::after {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #FFD700, #8B5CF6);
          border-radius: inherit;
          z-index: -1;
          opacity: 0;
          filter: blur(10px);
          transition: opacity var(--transition-base);
        }
        .hm-btn-glow:hover::after { opacity: 0.5; }

        /* Hero stats */
        .hm-hero-stats {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--space-8);
          flex-wrap: wrap;
        }
        .hm-stat { text-align: center; }
        .hm-stat-value {
          display: block;
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--color-gold);
          margin-bottom: var(--space-1);
        }
        .hm-stat-live {
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
        }
        .hm-live-dot {
          width: 8px;
          height: 8px;
          background: var(--color-success);
          border-radius: 50%;
          animation: hm-pulse 2s ease-in-out infinite;
        }
        @keyframes hm-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.2); }
        }
        .hm-stat-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .hm-stat-divider {
          width: 1px;
          height: 40px;
          background: var(--border-default);
        }

        /* ── Pools section ─────────────────────────────────────────── */
        .hm-pools-section {
          padding: var(--space-16) 0;
          background: oklch(10% 0.01 280);
        }
        .hm-section-header {
          text-align: center;
          margin-bottom: var(--space-10);
        }
        .hm-pools-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-5);
          max-width: 1080px;
          margin: 0 auto;
        }
        @media (max-width: 900px) {
          .hm-pools-grid { grid-template-columns: 1fr 1fr; }
          .hm-pool-daily { grid-column: 1 / -1; }
        }
        @media (max-width: 560px) {
          .hm-pools-grid { grid-template-columns: 1fr; }
          .hm-pool-daily { grid-column: auto; }
        }

        /* Pool card */
        .hm-pool-card {
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          position: relative;
          overflow: hidden;
          transition: transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base);
        }
        .hm-pool-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--color-purple), var(--color-gold));
          opacity: 0;
          transition: opacity var(--transition-base);
        }
        .hm-pool-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-default);
          box-shadow: 0 20px 40px oklch(0% 0 280 / 0.3);
        }
        .hm-pool-card:hover::before { opacity: 1; }
        .hm-pool-daily {
          border-color: oklch(55% 0.15 45 / 0.3);
        }

        /* Pool badge */
        .hm-pool-badge {
          position: absolute;
          top: var(--space-3);
          right: var(--space-3);
          font-size: var(--text-xs);
          font-weight: 700;
          padding: 2px var(--space-2);
          border-radius: var(--radius-full);
        }
        .hm-badge-fast     { background: oklch(45% 0.15 240); color: #fff; }
        .hm-badge-balanced { background: oklch(45% 0.12 180); color: #fff; }
        .hm-badge-popular  { background: linear-gradient(135deg, #FFD700, #FF6B6B); color: #000; }

        .hm-pool-header { margin-bottom: var(--space-2); }
        .hm-pool-header h3 { font-size: var(--text-xl); font-weight: 600; }
        .hm-pool-desc {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          margin-bottom: var(--space-4);
        }

        /* Pool live stats */
        .hm-pool-stats {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
          padding: var(--space-3);
          background: oklch(15% 0.02 280);
          border-radius: var(--radius-md);
        }
        .hm-pool-stat { flex: 1; text-align: center; }
        .hm-pool-stat-value {
          display: block;
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--color-gold);
        }
        .hm-pool-stat-label { font-size: var(--text-xs); color: var(--text-tertiary); }

        /* Pool info rows */
        .hm-pool-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
          font-size: var(--text-sm);
        }
        .hm-pool-row {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary);
        }
        .hm-pool-row > span:last-child { color: var(--text-primary); font-weight: 500; }
        .hm-pool-row-rollover > span:last-child { color: #a78bfa; }
        .hm-countdown {
          font-family: monospace;
          color: var(--color-gold) !important;
          font-weight: 700;
        }

        /* Daily-only extra chips */
        .hm-pool-extras {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
          margin-top: var(--space-3);
        }
        .hm-extra-chip {
          font-size: var(--text-xs);
          background: oklch(55% 0.15 45 / 0.12);
          border: 1px solid oklch(55% 0.15 45 / 0.3);
          color: var(--color-gold);
          padding: 2px var(--space-2);
          border-radius: var(--radius-sm);
          white-space: nowrap;
        }

        /* ── Features section ──────────────────────────────────────── */
        .hm-features-section {
          padding: var(--space-16) 0;
        }
        .hm-features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-5);
        }
        @media (max-width: 900px) {
          .hm-features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .hm-features-grid { grid-template-columns: 1fr; }
        }
        .hm-feature-card {
          text-align: center;
          padding: var(--space-8) var(--space-5);
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          transition: transform var(--transition-base), border-color var(--transition-base);
        }
        .hm-feature-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-default);
        }
        .hm-feature-icon { font-size: 2.5rem; margin-bottom: var(--space-4); }
        .hm-feature-card h3 { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2); }
        .hm-feature-card p  { color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.6; }
      `}</style>
    </div>
  );
};

export default Home;
