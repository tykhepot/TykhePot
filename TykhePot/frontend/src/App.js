import React, { useState, Component, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './i18n/LanguageContext';
import Layout from './components/Layout';
import WalletConnectButton from './components/WalletConnectButton';
import RiskDisclaimer from './components/RiskDisclaimer';
import InitPage from './pages/InitPage';
import Home from './pages/Home';
import HourlyPool from './pages/HourlyPool';
import Min30Pool from './pages/Min30Pool';
import DailyPool from './pages/DailyPool';
import Staking from './pages/Staking';
import Airdrop from './pages/Airdrop';
import Referral from './pages/Referral';
import UserHistory from './pages/UserHistory';
import Leaderboard from './pages/Leaderboard';
import FAQ from './pages/FAQ';
import ContractTest from './pages/ContractTest';
import Whitepaper from './pages/Whitepaper';
import DrawHistory from './pages/DrawHistory';

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

// 检测是否为移动设备
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 检测是否为 iOS
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

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
  // 检测移动设备
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // 使用 useMemo 创建钱包适配器
  const wallets = useMemo(() => {
    console.log("Creating wallet adapters...");
    
    // 创建适配器
    const phantomAdapter = new PhantomWalletAdapter();
    const solflareAdapter = new SolflareWalletAdapter({
      network: NETWORK === 'mainnet' ? 'mainnet-beta' : 'devnet'
    });
    
    console.log("Phantom adapter:", phantomAdapter.name);
    console.log("Solflare adapter:", solflareAdapter.name);
    
    const walletList = [solflareAdapter, phantomAdapter];
    
    console.log("Wallets:", walletList);
    return walletList;
  }, []);

  // 移动端连接处理 - 在页面加载时检测并提示
  useEffect(() => {
    if (isMobile) {
      console.log('Mobile device detected, using Deep Link for wallet connection');
    }
  }, [isMobile]);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ConnectionProvider endpoint={ENDPOINT}>
          {/* 不使用 autoConnect，让用户手动点击连接 */}
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
          <Route path="/min30" element={<PageWrapper><Min30Pool /></PageWrapper>} />
          <Route path="/daily" element={<PageWrapper><DailyPool /></PageWrapper>} />
          <Route path="/staking" element={<PageWrapper><Staking /></PageWrapper>} />
          <Route path="/airdrop" element={<PageWrapper><Airdrop /></PageWrapper>} />
          <Route path="/referral" element={<PageWrapper><Referral /></PageWrapper>} />
          <Route path="/history" element={<PageWrapper><UserHistory /></PageWrapper>} />
          <Route path="/leaderboard" element={<PageWrapper><Leaderboard /></PageWrapper>} />
          <Route path="/faq" element={<PageWrapper><FAQ /></PageWrapper>} />
          <Route path="/whitepaper" element={<PageWrapper><Whitepaper /></PageWrapper>} />
          <Route path="/draws" element={<PageWrapper><DrawHistory /></PageWrapper>} />
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
