import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletConnectButton = ({ className = '' }) => {
  const { connect, connected, connecting, wallet } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = async (walletName) => {
    try {
      console.log(`[WalletConnect] Attempting to connect to ${walletName}`);
      await connect();
    } catch (err) {
      console.error('[WalletConnect] Connection error:', err);
      alert(`Failed to connect wallet: ${err.message}`);
    }
    setShowDropdown(false);
  };

  return (
    <div className={`wallet-connect-container ${className}`}>
      <button
        className="btn-wallet"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={connecting}
      >
        {connecting ? (
          <span>⏳ Connecting...</span>
        ) : connected ? (
          <span>Connected ✅</span>
        ) : (
          <span>🔗 Connect Wallet</span>
        )}
      </button>

      {showDropdown && (
        <div className="wallet-dropdown">
          <h3>Select Wallet</h3>
          <div className="wallet-list">
            <button
              className="wallet-option"
              onClick={() => handleConnect('Phantom')}
            >
              <span className="wallet-icon">👻</span>
              <div className="wallet-info">
                <strong>Phantom</strong>
                <small>Recommended</small>
              </div>
            </button>
            <button
              className="wallet-option"
              onClick={() => handleConnect('Solflare')}
            >
              <span className="wallet-icon">☀️</span>
              <div className="wallet-info">
                <strong>Solflare</strong>
              </div>
            </button>
          </div>
          <div className="wallet-help">
            <p>
              <strong>Don't have a wallet?</strong>
            </p>
            <p>
              <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer">
                Install Phantom
              </a>
              {' or '}
              <a href="https://solflare.com/" target="_blank" rel="noopener noreferrer">
                Install Solflare
              </a>
            </p>
          </div>
        </div>
      )}

      <style>{`
        .wallet-connect-container {
          position: relative;
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
          color: white !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-wallet:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
        }

        .btn-wallet:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .wallet-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: oklch(15% 0.02 280 / 0.98);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          min-width: 300px;
          z-index: 1000;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .wallet-dropdown h3 {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .wallet-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .wallet-option {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: oklch(25% 0.04 280);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .wallet-option:hover {
          background: oklch(30% 0.06 280);
          border-color: var(--color-gold);
        }

        .wallet-icon {
          font-size: 1.5rem;
        }

        .wallet-info {
          flex: 1;
          text-align: left;
        }

        .wallet-info strong {
          display: block;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .wallet-info small {
          font-size: var(--text-xs);
          color: var(--color-gold);
        }

        .wallet-help {
          margin-top: var(--space-3);
          padding-top: var(--space-3);
          border-top: 1px solid var(--border-subtle);
        }

        .wallet-help p {
          margin: var(--space-1) 0;
          font-size: var(--text-xs);
          color: var(--text-secondary);
        }

        .wallet-help strong {
          color: var(--text-primary);
        }

        .wallet-help a {
          color: var(--color-gold);
          text-decoration: none;
        }

        .wallet-help a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default WalletConnectButton;
