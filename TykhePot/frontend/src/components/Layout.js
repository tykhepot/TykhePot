import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useTranslation } from '../i18n/LanguageContext';

const Layout = ({ children }) => {
  const { publicKey } = useWallet();
  const location = useLocation();
  const { t, language, toggleLanguage } = useTranslation();

  const navItems = [
    { path: '/', label: '🏠 ' + t('home') },
    { path: '/hourly', label: '⏰ ' + t('hourlyPool') },
    { path: '/daily', label: '🌙 ' + t('dailyPool') },
    { path: '/staking', label: '💰 ' + t('staking') },
    { path: '/airdrop', label: '🎁 ' + t('airdrop') },
    { path: '/leaderboard', label: '🏆 ' + t('leaderboard') },
    { path: '/faq', label: '❓ ' + t('faq') },
  ];

  return (
    <div className="layout" style={styles.layout}>
      {/* Header */}
      <header style={styles.header}>
        <div className="container" style={styles.headerContainer}>
          <Link to="/" style={styles.logo}>
            👑 <span style={styles.logoText}>TykhePot</span>
          </Link>

          <nav style={styles.nav}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navLink,
                  ...(location.pathname === item.path ? styles.navLinkActive : {}),
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={styles.walletSection}>
            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              style={styles.langButton}
              title={t('language')}
            >
              {language === 'en' ? '🇺🇸 EN' : '🇨🇳 中文'}
            </button>
            
            {publicKey && (
              <span style={styles.walletInfo}>
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </span>
            )}
            <WalletMultiButton style={styles.walletButton} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>{children}</main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div className="container" style={styles.footerContainer}>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>👑 TykhePot</h4>
            <p style={styles.footerText}>
              {language === 'en' 
                ? <>Fair & Transparent On-Chain Entertainment<br />The Lottery of Lady Fortune</>
                : <>基于 Solana 的公平透明链上娱乐协议<br />幸运女神的奖池，命运由链上裁决</>
              }
            </p>
          </div>

          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>{language === 'en' ? 'Quick Links' : '快速链接'}</h4>
            <div style={styles.footerLinks}>
              <Link to="/" style={styles.footerLink}>{t('home')}</Link>
              <Link to="/daily" style={styles.footerLink}>{language === 'en' ? 'Join Lottery' : '参与抽奖'}</Link>
              <Link to="/staking" style={styles.footerLink}>{language === 'en' ? 'Staking' : '质押收益'}</Link>
              <Link to="/leaderboard" style={styles.footerLink}>{t('leaderboard')}</Link>
              <Link to="/faq" style={styles.footerLink}>{language === 'en' ? 'Help' : '帮助中心'}</Link>
              <a href="https://tykhepot.io/whitepaper" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>{t('whitepaper')}</a>
            </div>
          </div>

          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>{language === 'en' ? 'Community' : '社区'}</h4>
            <div style={styles.footerLinks}>
              <a href="https://twitter.com/tykhepot" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Twitter/X</a>
              <a href="https://t.me/tykhepot" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Telegram</a>
              <a href="https://discord.gg/tykhepot" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Discord</a>
            </div>
          </div>

          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>{language === 'en' ? 'Contracts' : '合约'}</h4>
            <div style={styles.footerLinks}>
              <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Solscan</a>
              <a href="https://github.com/tykhepot" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>GitHub</a>
            </div>
          </div>
        </div>

        <div style={styles.footerBottom}>
          <p style={styles.footerDisclaimer}>
            ⚠️ {language === 'en' 
              ? 'Entertainment purposes only. Not investment advice. You may lose all your funds.'
              : '仅供娱乐，不构成投资建议。您可能损失全部资金。'}
          </p>
          <p style={styles.copyright}>© 2026 TykhePot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  layout: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'rgba(26, 26, 46, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoText: {
    background: 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #00d4ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  nav: {
    display: 'flex',
    gap: '1.5rem',
  },
  navLink: {
    textDecoration: 'none',
    color: '#a0a0a0',
    fontSize: '0.95rem',
    transition: 'color 0.3s',
    padding: '0.5rem 0',
  },
  navLinkActive: {
    color: '#00d4ff',
    borderBottom: '2px solid #00d4ff',
  },
  walletSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  langButton: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.3s',
  },
  walletInfo: {
    color: '#00d4ff',
    fontSize: '0.9rem',
    fontFamily: 'monospace',
  },
  walletButton: {
    background: 'linear-gradient(135deg, #512da8 0%, #00d4ff 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
  },
  footer: {
    background: '#0a0a14',
    padding: '3rem 0 1rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  footerContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
  },
  footerSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  footerTitle: {
    color: '#fff',
    marginBottom: '1rem',
    fontSize: '1.1rem',
  },
  footerText: {
    color: '#888',
    fontSize: '0.9rem',
    lineHeight: '1.6',
  },
  footerLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  footerLink: {
    color: '#888',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'color 0.3s',
  },
  footerBottom: {
    marginTop: '2rem',
    padding: '1rem 2rem',
    textAlign: 'center',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  footerDisclaimer: {
    color: '#666',
    fontSize: '0.8rem',
    marginBottom: '0.5rem',
  },
  copyright: {
    color: '#555',
    fontSize: '0.8rem',
  },
};

export default Layout;
