import React, { useState, Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './i18n/LanguageContext';
import Layout from './components/Layout';
import RiskDisclaimer from './components/RiskDisclaimer';
import InitPage from './pages/InitPage';
import Home from './pages/Home';
import HourlyPool from './pages/HourlyPool';
import DailyPool from './pages/DailyPool';
import Staking from './pages/Staking';
import Airdrop from './pages/Airdrop';
import Referral from './pages/Referral';
import UserHistory from './pages/UserHistory';
import Leaderboard from './pages/Leaderboard';
import FAQ from './pages/FAQ';
import ContractTest from './pages/ContractTest';
import Whitepaper from './pages/Whitepaper';

import '@solana/wallet-adapter-react-ui/styles.css';
import './styles.css';

// Error Boundary to catch rendering errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', color: 'red', background: '#000', minHeight: '100vh' }}>
          <h1>🚨 渲染错误</h1>
          <pre style={{ color: 'red', fontSize: '12px' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px' }}>
            重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load components to identify which one fails
const LazyHome = React.lazy(() => import('./pages/Home'));
const LazyHourlyPool = React.lazy(() => import('./pages/HourlyPool'));
const LazyDailyPool = React.lazy(() => import('./pages/DailyPool'));
const LazyStaking = React.lazy(() => import('./pages/Staking'));
const LazyAirdrop = React.lazy(() => import('./pages/Airdrop'));
const LazyReferral = React.lazy(() => import('./pages/Referral'));
const LazyUserHistory = React.lazy(() => import('./pages/UserHistory'));
const LazyLeaderboard = React.lazy(() => import('./pages/Leaderboard'));
const LazyFAQ = React.lazy(() => import('./pages/FAQ'));
const LazyContractTest = React.lazy(() => import('./pages/ContractTest'));

const NETWORK = process.env.REACT_APP_SOLANA_NETWORK || 'devnet';
const ENDPOINT = NETWORK === 'mainnet'
  ? 'https://api.mainnet-beta.solana.com'
  : 'https://api.devnet.solana.com';

// 自定义 Phantom 适配器 - 添加 Android 支持
class PhantomMobileWalletAdapter extends PhantomWalletAdapter {
  constructor() {
    super();
  }

  async connect() {
    // 检查是否为 Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Android 上直接使用 phantom:// URL scheme
      const url = encodeURIComponent(window.location.href);
      window.location.href = `phantom://connect?url=${url}`;
      return;
    }
    
    // iOS 或其他平台使用默认行为
    return super.connect();
  }
}

const wallets = [
  new PhantomMobileWalletAdapter(),
  new SolflareWalletAdapter({
    network: NETWORK === 'mainnet' ? 'mainnet-beta' : 'devnet'
  }),
];

// Loading fallback
const Loading = () => (
  <div style={{ padding: '50px', textAlign: 'center', color: '#FFD700' }}>
    <h2>加载中...</h2>
  </div>
);

// Page wrapper with error handling
const PageWrapper = ({ children }) => (
  <ErrorBoundary>
    <Layout>{children}</Layout>
  </ErrorBoundary>
);

function AppContent() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/init" element={<InitPage />} />
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/hourly" element={<PageWrapper><HourlyPool /></PageWrapper>} />
          <Route path="/daily" element={<PageWrapper><DailyPool /></PageWrapper>} />
          <Route path="/staking" element={<PageWrapper><Staking /></PageWrapper>} />
          <Route path="/airdrop" element={<PageWrapper><Airdrop /></PageWrapper>} />
          <Route path="/referral" element={<PageWrapper><Referral /></PageWrapper>} />
          <Route path="/history" element={<PageWrapper><UserHistory /></PageWrapper>} />
          <Route path="/leaderboard" element={<PageWrapper><Leaderboard /></PageWrapper>} />
          <Route path="/faq" element={<PageWrapper><FAQ /></PageWrapper>} />
          <Route path="/whitepaper" element={<PageWrapper><Whitepaper /></PageWrapper>} />
          <Route path="/test" element={<PageWrapper><ContractTest /></PageWrapper>} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

function App() {
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const handleAcceptRisk = () => {
    setRiskAccepted(true);
    setShowDisclaimer(false);
  };

  const handleDeclineRisk = () => {
    window.location.href = 'https://tykhepot.com';
  };

  if (showDisclaimer) {
    return (
      <ErrorBoundary>
        <LanguageProvider>
          <RiskDisclaimer
            onAccept={handleAcceptRisk}
            onDecline={handleDeclineRisk}
          />
        </LanguageProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ConnectionProvider endpoint={ENDPOINT}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <AppProvider>
                <AppContent />
              </AppProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
