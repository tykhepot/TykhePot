import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import PoolCard from '../components/PoolCard';

const Home = () => {
  const { stats, isLoading } = useApp();
  const { t } = useTranslation();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" style={styles.hero}>
        <div className="container" style={styles.heroContainer}>
          <h1 style={styles.title}>
            👑 <span className="gradient-text">{t('heroTitle')}</span>
          </h1>
          <p style={styles.subtitle}>
            {t('heroSubtitle')}
          </p>
          <p style={styles.description}>
            {t('heroDescription')}
          </p>
          
          <div style={styles.ctaButtons}>
            <Link to="/daily" className="btn btn-primary btn-large">
              {t('joinNow')}
            </Link>
            <a 
              href="https://tykhepot.io/whitepaper" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              {t('whitepaper')}
            </a>
          </div>

          {/* 实时统计 */}
          <div style={styles.quickStats}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {isLoading ? '...' : `${(stats.totalPool / 1e9).toFixed(2)}M`}
              </span>
              <span style={styles.statLabel}>{t('totalPool')}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {isLoading ? '...' : `${(stats.totalBurned / 1e9).toFixed(2)}M`}
              </span>
              <span style={styles.statLabel}>{t('totalBurned')}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {isLoading ? '...' : stats.onlinePlayers}
              </span>
              <span style={styles.statLabel}>{t('onlinePlayers')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 双奖池展示 */}
      <section className="pools-section" style={styles.poolsSection}>
        <div className="container">
          <h2 style={styles.sectionTitle}>{t('choosePool')}</h2>
          <div className="grid-2">
            <PoolCard
              type="hourly"
              title={t('hourlyTitle')}
              description={t('hourlyDesc')}
              minDeposit={200}
              currentPool={stats.hourlyPool}
              nextDraw={stats.hourlyNextDraw}
              participants={stats.hourlyParticipants}
            />
            <PoolCard
              type="daily"
              title={t('dailyTitle')}
              description={t('dailyDesc')}
              minDeposit={100}
              currentPool={stats.dailyPool}
              nextDraw={stats.dailyNextDraw}
              participants={stats.dailyParticipants}
            />
          </div>
        </div>
      </section>

      {/* 特色功能 */}
      <section className="features-section" style={styles.featuresSection}>
        <div className="container">
          <h2 style={styles.sectionTitle}>{t('featuresTitle')}</h2>
          <div className="grid-3">
            <div style={styles.featureCard}>
              <h3>{t('fairTitle')}</h3>
              <p>{t('fairDesc')}</p>
            </div>
            <div style={styles.featureCard}>
              <h3>{t('burnTitle')}</h3>
              <p>{t('burnDesc')}</p>
            </div>
            <div style={styles.featureCard}>
              <h3>{t('prizeTitle')}</h3>
              <p>{t('prizeDesc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  hero: {
    padding: '80px 0',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  heroContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '3.5rem',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.5rem',
    color: '#a0a0a0',
    marginBottom: '1rem',
  },
  description: {
    fontSize: '1.1rem',
    color: '#888',
    marginBottom: '2rem',
    lineHeight: '1.6',
  },
  ctaButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '3rem',
  },
  quickStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '3rem',
    marginTop: '2rem',
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  statLabel: {
    display: 'block',
    color: '#888',
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  poolsSection: {
    padding: '60px 0',
    background: '#0f0f1e',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: '2rem',
    marginBottom: '2rem',
  },
  featuresSection: {
    padding: '60px 0',
    background: '#1a1a2e',
  },
  featureCard: {
    padding: '2rem',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    textAlign: 'center',
  },
};

export default Home;
