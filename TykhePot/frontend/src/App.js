import React, { useState, Component, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

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

const NETWORK = process.env.REACT_APP_SOLANA_NETWORK || 'devnet';
const ENDPOINT = NETWORK === 'mainnet'
  ? 'https://api.mainnet-beta.solana.com'
  : 'https://api.devnet.solana.com';

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
  // ✅ 使用 useMemo 创建钱包适配器，避免重复创建
  const wallets = useMemo(() => [
    // ✅ 使用官方 Phantom 适配器，自动处理移动端（iOS/Android）
    new PhantomWalletAdapter(),
    
    // Solflare 适配器
    new SolflareWalletAdapter({
      network: NETWORK === 'mainnet' ? 'mainnet-beta' : 'devnet'
    }),
  ], []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ConnectionProvider endpoint={ENDPOINT}>
          {/* ✅ 移除 autoConnect，避免移动端自动连接问题 */}
          <WalletProvider wallets={wallets} autoConnect={false}>
            <WalletModalProvider>
              <AppProvider>
                <AppContentInner />
              </AppProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

// 内部组件，使用 Router
function AppContentInner() {
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

  return <AppContent />;
}

export default App;
