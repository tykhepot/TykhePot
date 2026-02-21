import React from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// 演示模式包装器 - 无需真实钱包连接
export const DemoProvider = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network })
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// 演示模式横幅
export const DemoBanner = () => (
  <div style={{
    background: 'linear-gradient(90deg, #ff6b6b, #feca57)',
    color: 'white',
    textAlign: 'center',
    padding: '12px',
    fontWeight: 'bold',
    fontSize: '14px',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999
  }}>
    🎮 演示模式 - 使用模拟数据展示功能 | Demo Mode - Simulated Data
  </div>
);

export default DemoProvider;
