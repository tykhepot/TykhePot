import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useTranslation } from '../i18n/LanguageContext';

const Layout = ({ children }) => {
  const { publicKey } = useWallet();
  const location = useLocation();
  const { t, language, toggleLanguage } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

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
        <div style={styles.headerContainer}>
          <Link to="/" style={styles.logo} onClick={() => setMenuOpen(false)}>
            <span style={styles.logoIcon}>👑</span>
            <span style={styles.logoText}>TykhePot</span>
          </Link>

          {/* Desktop Navigation */}
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

          {/* Desktop Wallet Section */}
          <div style={styles.walletSection}>
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
            <div style={styles.walletButton}>
              <WalletMultiButton style={styles.walletBtn} />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            style={styles.menuButton}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span style={menuOpen ? styles.menuIconClose : styles.menuIcon}>
              {menuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div style={styles.mobileNav}>
            <nav style={styles.mobileNavContent}>
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    ...styles.mobileNavLink,
                    ...(location.pathname === item.path ? styles.mobileNavLinkActive : {}),
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div style={styles.mobileWalletSection}>
              <button 
                onClick={() => { toggleLanguage(); setMenuOpen(false); }}
                style={styles.mobileLangButton}
              >
                {language === 'en' ? '🇺🇸 English' : '🇨🇳 中文'}
              </button>
              <div style={styles.mobileWalletBtn}>
                <WalletMultiButton style={styles.walletBtn} />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={styles.main}>{children}</main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
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
    padding: '0.75rem 1rem',
    maxWidth: '1400px',
    margin: '0 auto',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#FFD700',
  },
  logoIcon: {
    fontSize: '1.5rem',
  },
  logoText: {
    background: 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #00d4ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  nav: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  navLink: {
    textDecoration: 'none',
    color: '#a0a0a0',
    fontSize: '0.85rem',
    transition: 'all 0.3s',
    padding: '0.4rem 0.6rem',
    borderRadius: '8px',
  },
  navLinkActive: {
    color: '#00d4ff',
    background: 'rgba(0, 212, 255, 0.1)',
  },
  walletSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  langButton: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'all 0.3s',
  },
  walletInfo: {
    color: '#00d4ff',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    display: 'none',
  },
  walletButton: {
    display: 'flex',
  },
  walletBtn: {
    background: 'linear-gradient(135deg, #512da8 0%, #00d4ff 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.4rem 0.8rem',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '1.25rem',
    cursor: 'pointer',
  },
  menuIcon: {
    display: 'block',
  },
  menuIconClose: {
    display: 'block',
    fontSize: '1.25rem',
  },
  mobileNav: {
    background: 'rgba(26, 26, 46, 0.98)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    padding: '1rem',
    animation: 'slideDown 0.3s ease',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 999,
  },
  mobileNavContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  mobileNavLink: {
    textDecoration: 'none',
    color: '#FFFFFF',
    fontSize: '1rem',
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.3s',
    display: 'block',
    background: 'transparent',
  },
  mobileNavLinkActive: {
    color: '#00d4ff',
    background: 'rgba(0, 212, 255, 0.1)',
  },
  mobileWalletSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  mobileLangButton: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  mobileWalletBtn: {
    width: '100%',
  },
  main: {
    flex: 1,
    padding: '1rem',
  },
  footer: {
    background: '#0a0a14',
    padding: '2rem 0 1rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    marginTop: 'auto',
  },
  footerContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  footerSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  footerTitle: {
    color: '#fff',
    marginBottom: '0.75rem',
    fontSize: '1rem',
  },
  footerText: {
    color: '#888',
    fontSize: '0.85rem',
    lineHeight: '1.6',
  },
  footerLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  footerLink: {
    color: '#888',
    textDecoration: 'none',
    fontSize: '0.85rem',
    transition: 'color 0.3s',
  },
  footerBottom: {
    marginTop: '1.5rem',
    padding: '1rem',
    textAlign: 'center',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  footerDisclaimer: {
    color: '#666',
    fontSize: '0.75rem',
    marginBottom: '0.5rem',
  },
  copyright: {
    color: '#555',
    fontSize: '0.75rem',
  },
};

// Add responsive styles via JavaScript for the menu button
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @media (max-width: 768px) {
      header nav { display: none !important; }
      header .wallet-section { display: none !important; }
      header .menu-button { display: block !important; }
    }
    
    @media (min-width: 769px) {
      .mobile-nav { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}

export default Layout;
