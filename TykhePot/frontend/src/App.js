import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './i18n/LanguageContext';
import Layout from './components/Layout';
import RiskDisclaimer from './components/RiskDisclaimer';
import ContractInit from './components/ContractInit';
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

import '@solana/wallet-adapter-react-ui/styles.css';
import './styles.css';

const NETWORK = process.env.REACT_APP_SOLANA_NETWORK || 'devnet';
const ENDPOINT = NETWORK === 'mainnet'
  ? 'https://api.mainnet-beta.solana.com'
  : 'https://api.devnet.solana.com';

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

// 包装组件处理初始化
function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Init page without Layout */}
        <Route path="/init" element={<InitPage />} />
        
        {/* All other pages with Layout */}
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/hourly" element={<HourlyPool />} />
              <Route path="/daily" element={<DailyPool />} />
              <Route path="/staking" element={<Staking />} />
              <Route path="/airdrop" element={<Airdrop />} />
              <Route path="/referral" element={<Referral />} />
              <Route path="/history" element={<UserHistory />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/test" element={<ContractTest />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
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
      <RiskDisclaimer
        onAccept={handleAcceptRisk}
        onDecline={handleDeclineRisk}
      />
    );
  }

  return (
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
  );
}

export default App;
