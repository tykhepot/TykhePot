import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletConnectButton from './WalletConnectButton';
import { useTranslation } from '../i18n/LanguageContext';

// 短地址显示
const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

const Layout = ({ children }) => {
  const { publicKey, connected, connecting } = useWallet();
  const location = useLocation();
  const { t, language, toggleLanguage } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: t('home'), icon: '🏠' },
    { path: '/hourly', label: t('hourlyPool'), icon: '⏰' },
    { path: '/min30', label: t('min30Pool'), icon: '⏱️' },
    { path: '/daily', label: t('dailyPool'), icon: '🌙' },
    { path: '/staking', label: t('staking'), icon: '💎' },
    { path: '/airdrop', label: t('airdrop'), icon: '🎁' },
    { path: '/draws', label: t('drawHistory'), icon: '📋' },
    { path: '/leaderboard', label: t('leaderboard'), icon: '🏆' },
    { path: '/faq', label: t('faq'), icon: '❓' },
  ];

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          {/* Logo */}
          <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
            <span className="logo-icon">👑</span>
            <span className="logo-text">TykhePot</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-desktop hide-mobile">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="header-actions">
            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage}
              className="btn btn-ghost btn-sm lang-btn"
              title={t('language')}
            >
              {language === 'en' ? '🇺🇸 EN' : '🇨🇳 中文'}
            </button>
            
            {/* Wallet Button - Show on all devices */}
            <div className="wallet-btn-wrapper">
              {/* 已连接: 显示地址 */}
              {connected && publicKey ? (
                <div className="wallet-connected" onClick={() => window.location.reload()}>
                  <div className="wallet-status-dot"></div>
                  <span className="wallet-address">{shortenAddress(publicKey.toString())}</span>
                </div>
              ) : (
                /* 未连接: 显示连接按钮 */
                <WalletConnectButton className="wallet-connect-btn" />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="btn btn-ghost mobile-menu-btn hide-desktop"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span style={{ fontSize: '1.5rem' }}>
                {menuOpen ? '✕' : '☰'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="nav-mobile">
            <nav className="nav-mobile-content">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link-mobile ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="nav-mobile-footer">
              <button 
                onClick={() => { toggleLanguage(); setMenuOpen(false); }}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {language === 'en' ? '🇺🇸 English' : '🇨🇳 中文'}
              </button>
              {/* Mobile Wallet - Improved */}
              <div className="wallet-mobile">
                {connected && publicKey ? (
                  <div className="wallet-connected-mobile">
                    <div className="wallet-status-dot"></div>
                    <span>{shortenAddress(publicKey.toString())}</span>
                  </div>
                ) : (
                  /* 未连接: 显示连接按钮 */
                  <WalletConnectButton className="wallet-connect-btn-mobile" />
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer>
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <span style={{ fontSize: '1.5rem' }}>👑</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', background: 'linear-gradient(135deg, #FFD700, #FF6B6B, #00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TykhePot
              </span>
            </div>
            <p className="footer-tagline">
              {language === 'en' 
                ? 'The On-Chain Lottery of Lady Fortune'
                : '幸运女神的链上奖池'
              }
            </p>
            <p className="footer-desc">
              {language === 'en' 
                ? 'Fair & Transparent Entertainment on Solana'
                : '基于 Solana 的公平透明娱乐协议'
              }
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-section">
              <h4>{language === 'en' ? 'Quick Links' : '快速链接'}</h4>
              <Link to="/">{t('home')}</Link>
              <Link to="/daily">{language === 'en' ? 'Join Lottery' : '参与抽奖'}</Link>
              <Link to="/staking">{t('staking')}</Link>
              <Link to="/leaderboard">{t('leaderboard')}</Link>
              <Link to="/faq">{language === 'en' ? 'Help' : '帮助中心'}</Link>
            </div>

            <div className="footer-section">
              <h4>{language === 'en' ? 'Community' : '社区'}</h4>
              <a href="https://twitter.com/tykhepot" target="_blank" rel="noopener noreferrer">Twitter/X</a>
              <a href="https://t.me/tykhepot" target="_blank" rel="noopener noreferrer">Telegram</a>
              <a href="https://discord.gg/tykhepot" target="_blank" rel="noopener noreferrer">Discord</a>
            </div>

            <div className="footer-section">
              <h4>{language === 'en' ? 'Resources' : '资源'}</h4>
              <a href="https://tykhepot.io/whitepaper" target="_blank" rel="noopener noreferrer">{t('whitepaper')}</a>
              <a href="https://solscan.io" target="_blank" rel="noopener noreferrer">Solscan</a>
              <a href="https://github.com/tykhepot" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-disclaimer">
            ⚠️ {language === 'en' 
              ? 'Entertainment purposes only. Not investment advice. You may lose all your funds.'
              : '仅供娱乐，不构成投资建议。您可能损失全部资金。'}
          </p>
          <p className="footer-copyright">
            © 2026 TykhePot. All rights reserved.
          </p>
        </div>
      </footer>

      <style>{`
        /* Header Styles */
        .header {
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          background: oklch(15% 0.02 280 / 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--space-3) var(--space-4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
        }

        /* Logo */
        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          text-decoration: none;
          font-weight: 700;
          font-size: 1.25rem;
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .logo-text {
          background: linear-gradient(135deg, #FFD700, #FF6B6B, #00D4FF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Desktop Navigation */
        .nav-desktop {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        /* Header Actions */
        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .lang-btn {
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-xs);
        }

        .btn-wallet {
          background: linear-gradient(135deg, #6B21A8, #8B5CF6) !important;
          border: none !important;
          border-radius: var(--radius-md) !important;
          padding: var(--space-2) var(--space-4) !important;
          font-weight: 600 !important;
          font-size: var(--text-sm) !important;
          cursor: pointer !important;
          transition: all var(--transition-base) !important;
        }

        .btn-wallet:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 20px oklch(55% 0.2 270 / 0.4);
        }

        .mobile-menu-btn {
          padding: var(--space-2);
          font-size: 1.25rem;
        }

        /* Mobile Navigation */
        .nav-mobile {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: oklch(15% 0.02 280 / 0.98);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
          padding: var(--space-4);
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nav-mobile-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          margin-bottom: var(--space-4);
        }

        .nav-link-mobile {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .nav-link-mobile:hover,
        .nav-link-mobile.active {
          background: oklch(25% 0.04 280);
          color: var(--color-gold);
        }

        .nav-mobile-footer {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          padding-top: var(--space-4);
          border-top: 1px solid var(--border-subtle);
        }

        /* Main Content */
        .main-content {
          min-height: calc(100vh - 200px);
          position: relative;
          z-index: 1;
        }

        /* Footer Styles */
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--space-4);
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: var(--space-12);
        }

        @media (max-width: 768px) {
          .footer-container {
            grid-template-columns: 1fr;
            gap: var(--space-8);
          }
        }

        .footer-brand {
          max-width: 300px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .footer-tagline {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--color-gold);
          margin-bottom: var(--space-2);
        }

        .footer-desc {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-8);
        }

        @media (max-width: 600px) {
          .footer-links {
            grid-template-columns: 1fr 1fr;
          }
        }

        .footer-section h4 {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .footer-section a {
          display: block;
          font-size: var(--text-sm);
          color: var(--text-secondary);
          text-decoration: none;
          padding: var(--space-1) 0;
          transition: color var(--transition-fast);
        }

        .footer-section a:hover {
          color: var(--color-gold);
        }

        .footer-bottom {
          max-width: 1200px;
          margin: var(--space-8) auto 0;
          padding: var(--space-4);
          text-align: center;
          border-top: 1px solid var(--border-subtle);
        }

        .footer-disclaimer {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          margin-bottom: var(--space-2);
        }

        .footer-copyright {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          opacity: 0.7;
        }

        /* Responsive */
        @media (min-width: 769px) {
          .hide-mobile { display: flex !important; }
          .hide-desktop { display: none !important; }
        }

        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .hide-desktop { display: flex !important; }
          .nav-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
