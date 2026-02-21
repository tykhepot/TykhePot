import React from 'react';
import { useContractInit } from '../hooks/useContractInit';
import { useApp } from '../context/AppContext';

const ContractInit = () => {
  const { wallet } = useApp();
  const { isInitialized, isLoading, error, initialize } = useContractInit(
    wallet,
    wallet?.connection
  );

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Checking contract status...</div>
      </div>
    );
  }

  if (isInitialized) {
    return null; // 已初始化，不显示
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🚀 Initialize Contract</h2>
        <p style={styles.text}>
          The TykhePot contract needs to be initialized before use.
        </p>
        <p style={styles.text}>
          This is a one-time setup that creates the protocol state account.
        </p>
        
        {error && (
          <div style={styles.error}>
            Error: {error}
          </div>
        )}

        <button 
          onClick={initialize}
          disabled={isLoading}
          style={styles.button}
        >
          {isLoading ? 'Initializing...' : 'Initialize Contract'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.8rem',
    marginBottom: '20px',
    color: '#ffd700',
  },
  text: {
    color: '#a0a0a0',
    marginBottom: '15px',
    lineHeight: '1.6',
  },
  error: {
    background: 'rgba(255, 68, 68, 0.2)',
    color: '#ff4444',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  button: {
    background: 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '15px 40px',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'opacity 0.3s',
  },
};

export default ContractInit;
EOF
