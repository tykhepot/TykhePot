import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const Home = () => {
  const { stats, isLoading } = useApp();
  const { t, language } = useTranslation();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-glow"></div>
          <div className="hero-grid"></div>
        </div>
        
        <div className="hero-content container">
          <div className="hero-badge animate-fade-in">
            <span className="badge badge-gold">✨ {language === 'en' ? 'Fair & Transparent' : '公平透明'}</span>
          </div>
          
          <h1 className="hero-title animate-slide-up delay-1">
            <span className="title-line">{t('heroTitle')}</span>
          </h1>
          
          <p className="hero-subtitle animate-slide-up delay-2">
            {t('heroSubtitle')}
          </p>
          
          <p className="hero-description animate-slide-up delay-3">
            {t('heroDescription')}
          </p>
          
          <div className="hero-actions animate-slide-up delay-4">
            <Link to="/daily" className="btn btn-primary btn-lg btn-glow">
              {t('joinNow')}
            </Link>
            <a 
              href="https://tykhepot.io/whitepaper" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-ghost btn-lg"
            >
              {t('whitepaper')}
            </a>
          </div>

          {/* Stats */}
          <div className="hero-stats animate-slide-up delay-5">
            <div className="stat-item">
              <span className="stat-value">
                {isLoading ? '...' : `${(stats.totalPool / 1e9).toFixed(2)}M`}
              </span>
              <span className="stat-label">{t('totalPool')}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">
                {isLoading ? '...' : `${(stats.totalBurned / 1e9).toFixed(2)}M`}
              </span>
              <span className="stat-label">{t('totalBurned')}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value stat-live">
                <span className="live-dot"></span>
                {stats.onlinePlayers || '--'}
              </span>
              <span className="stat-label">{t('onlinePlayers')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pools Section */}
      <section className="pools-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('choosePool')}</h2>
            <p className="section-subtitle">
              {language === 'en' 
                ? 'Choose your luck pool and win big!'
                : '选择你的幸运奖池，大奖等你来拿！'
              }
            </p>
          </div>
          
          <div className="pools-grid">
            {/* Hourly Pool */}
            <div className="pool-card pool-hourly">
              <div className="pool-header">
                <span className="pool-icon">⏰</span>
                <h3>{t('hourlyTitle')}</h3>
              </div>
              <p className="pool-desc">{t('hourlyDesc')}</p>
              
              <div className="pool-stats">
                <div className="pool-stat">
                  <span className="pool-stat-value">
                    {isLoading ? '...' : `${(stats.hourlyPool / 1e6).toFixed(1)}M`}
                  </span>
                  <span className="pool-stat-label">{t('currentPool')}</span>
                </div>
                <div className="pool-stat">
                  <span className="pool-stat-value">
                    {stats.hourlyParticipants || '--'}
                  </span>
                  <span className="pool-stat-label">{t('participants')}</span>
                </div>
              </div>
              
              <div className="pool-info">
                <div className="pool-info-item">
                  <span className="pool-info-label">{t('minDeposit')}</span>
                  <span className="pool-info-value">200 TPOT</span>
                </div>
                <div className="pool-info-item">
                  <span className="pool-info-label">{t('nextDraw')}</span>
                  <span className="pool-info-value">{stats.hourlyNextDraw || '--'}</span>
                </div>
              </div>
              
              <Link to="/hourly" className="btn btn-primary" style={{ width: '100%' }}>
                {t('joinNowBtn')}
              </Link>
            </div>

            {/* Daily Pool */}
            <div className="pool-card pool-daily">
              <div className="pool-badge-featured">
                <span>🔥 {language === 'en' ? 'Most Popular' : '最热门'}</span>
              </div>
              
              <div className="pool-header">
                <span className="pool-icon">🌙</span>
                <h3>{t('dailyTitle')}</h3>
              </div>
              <p className="pool-desc">{t('dailyDesc')}</p>
              
              <div className="pool-stats">
                <div className="pool-stat">
                  <span className="pool-stat-value">
                    {isLoading ? '...' : `${(stats.dailyPool / 1e6).toFixed(1)}M`}
                  </span>
                  <span className="pool-stat-label">{t('currentPool')}</span>
                </div>
                <div className="pool-stat">
                  <span className="pool-stat-value">
                    {stats.dailyParticipants || '--'}
                  </span>
                  <span className="pool-stat-label">{t('participants')}</span>
                </div>
              </div>
              
              <div className="pool-info">
                <div className="pool-info-item">
                  <span className="pool-info-label">{t('minDeposit')}</span>
                  <span className="pool-info-value">100 TPOT</span>
                </div>
                <div className="pool-info-item">
                  <span className="pool-info-label">{t('nextDraw')}</span>
                  <span className="pool-info-value">{stats.dailyNextDraw || '--'}</span>
                </div>
                <div className="pool-info-item highlight">
                  <span className="pool-info-label">🎁 Referral</span>
                  <span className="pool-info-value">+8%</span>
                </div>
              </div>
              
              <Link to="/daily" className="btn btn-primary btn-lg btn-glow" style={{ width: '100%' }}>
                {t('joinNowBtn')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('featuresTitle')}</h2>
            <p className="section-subtitle">
              {language === 'en' 
                ? 'Why choose TykhePot?'
                : '为什么选择 TykhePot？'
              }
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔮</div>
              <h3>{t('fairTitle')}</h3>
              <p>{t('fairDesc')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔥</div>
              <h3>{t('burnTitle')}</h3>
              <p>{t('burnDesc')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>{t('prizeTitle')}</h3>
              <p>{t('prizeDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        /* Hero Section */
        .hero-section {
          position: relative;
          padding: var(--space-20) 0;
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .hero-glow {
          position: absolute;
          top: -50%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, oklch(45% 0.15 280 / 0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(oklch(100% 0 0 / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, oklch(100% 0 0 / 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        }

        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .hero-badge {
          margin-bottom: var(--space-6);
        }

        .hero-title {
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: var(--space-6);
        }

        .title-line {
          display: block;
          background: linear-gradient(135deg, #FFD700 0%, #FFE55C 50%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: var(--text-xl);
          color: var(--color-gold);
          font-weight: 600;
          margin-bottom: var(--space-4);
        }

        .hero-description {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto var(--space-8);
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: var(--space-12);
        }

        .btn-glow {
          position: relative;
        }

        .btn-glow::after {
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

        .btn-glow:hover::after {
          opacity: 0.5;
        }

        /* Hero Stats */
        .hero-stats {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--space-8);
          flex-wrap: wrap;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--color-gold);
          margin-bottom: var(--space-1);
        }

        .stat-live {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: var(--color-success);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: var(--border-default);
        }

        /* Pools Section */
        .pools-section {
          padding: var(--space-16) 0;
          background: oklch(10% 0.01 280);
        }

        .section-header {
          text-align: center;
          margin-bottom: var(--space-12);
        }

        .section-title {
          font-size: var(--text-4xl);
          font-weight: 700;
          margin-bottom: var(--space-3);
        }

        .section-subtitle {
          font-size: var(--text-lg);
          color: var(--text-secondary);
        }

        .pools-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-6);
          max-width: 1000px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .pools-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Pool Cards */
        .pool-card {
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          transition: all var(--transition-base);
          position: relative;
          overflow: hidden;
        }

        .pool-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--color-purple), var(--color-gold));
          opacity: 0;
          transition: opacity var(--transition-base);
        }

        .pool-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-default);
          box-shadow: 0 20px 40px oklch(0% 0 280 / 0.3);
        }

        .pool-card:hover::before {
          opacity: 1;
        }

        .pool-daily {
          border-color: var(--color-gold / 0.3);
        }

        .pool-badge-featured {
          position: absolute;
          top: var(--space-4);
          right: var(--space-4);
          background: linear-gradient(135deg, #FFD700, #FF6B6B);
          color: #000;
          font-size: var(--text-xs);
          font-weight: 700;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-full);
        }

        .pool-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .pool-icon {
          font-size: 2rem;
        }

        .pool-header h3 {
          font-size: var(--text-xl);
          font-weight: 600;
        }

        .pool-desc {
          color: var(--text-secondary);
          margin-bottom: var(--space-4);
        }

        .pool-stats {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
          padding: var(--space-4);
          background: oklch(15% 0.02 280);
          border-radius: var(--radius-md);
        }

        .pool-stat {
          flex: 1;
          text-align: center;
        }

        .pool-stat-value {
          display: block;
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--color-gold);
        }

        .pool-stat-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .pool-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
        }

        .pool-info-item {
          display: flex;
          justify-content: space-between;
          font-size: var(--text-sm);
        }

        .pool-info-label {
          color: var(--text-tertiary);
        }

        .pool-info-value {
          color: var(--text-primary);
          font-weight: 500;
        }

        .pool-info-item.highlight .pool-info-value {
          color: var(--color-gold);
        }

        /* Features Section */
        .features-section {
          padding: var(--space-16) 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-6);
        }

        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }

        .feature-card {
          text-align: center;
          padding: var(--space-8);
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          transition: all var(--transition-base);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-default);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: var(--space-4);
        }

        .feature-card h3 {
          font-size: var(--text-xl);
          font-weight: 600;
          margin-bottom: var(--space-2);
        }

        .feature-card p {
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }
      `}</style>
    </div>
  );
};

export default Home;
