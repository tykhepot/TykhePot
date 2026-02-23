import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const Airdrop = () => {
  const { wallet, sdk } = useApp();
  const { t } = useTranslation();
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [error, setError] = useState('');

  // 模拟数据 - 实际应该从合约读取
  const airdropData = {
    totalAirdrop: '100,000,000', // 1亿TPOT空投池
    airdropAmount: '100', // 每人100 TPOT
  };

  useEffect(() => {
    // 检查用户是否已领取 - 需要从合约读取
    if (wallet.publicKey && sdk) {
      checkClaimStatus();
    }
  }, [wallet.publicKey, sdk]);

  const checkClaimStatus = async () => {
    try {
      // TODO: 从合约读取用户是否已领取
      // const status = await sdk.getUserAirdropStatus(wallet.publicKey);
      // setHasClaimed(status.claimed);
    } catch (err) {
      console.error('Error checking airdrop status:', err);
    }
  };

  const handleClaim = async () => {
    if (!wallet.publicKey) {
      alert(t('walletNotConnected'));
      return;
    }
    
    if (hasClaimed) {
      alert('You have already claimed your airdrop!');
      return;
    }

    setIsClaiming(true);
    setError('');

    try {
      const result = await sdk.claimAirdrop();
      
      if (result.success) {
        setHasClaimed(true);
        alert(language === 'en' 
          ? '🎉 Successfully claimed 100 TPOT! Use it in Daily Pool.' 
          : '🎉 成功领取100 TPOT！请去每日奖池使用。');
      } else {
        setError(result.error || (language === 'en' ? 'Failed to claim' : '领取失败'));
      }
    } catch (err) {
      console.error('Error claiming airdrop:', err);
      setError(err.message || (language === 'en' ? 'Failed to claim airdrop' : '领取空投失败'));
    }
    setIsClaiming(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎁 {t('airdropClaim')}</h1>
        <p style={styles.subtitle}>{t('airdropSubtitle')}</p>
      </div>

      {/* 空投说明 */}
      <div style={styles.heroCard}>
        <div style={styles.heroIcon}>💰</div>
        <div style={styles.heroAmount}>100 TPOT</div>
        <div style={styles.heroLabel}>FREE for everyone!</div>
        <div style={styles.heroNote}>One-time claim per wallet</div>
      </div>

      {/* 规则说明 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📜 {t('airdropRules')}</h2>
        <ul style={styles.rulesList}>
          <li style={styles.ruleItem}>✅ Every wallet can claim <strong>100 TPOT</strong> for FREE</li>
          <li style={styles.ruleItem}>✅ One-time claim only - cannot claim twice</li>
          <li style={styles.ruleItem}>✅ Tokens are LOCKED - can only be used in <strong>Daily Pool</strong></li>
          <li style={styles.ruleItem}>❌ Cannot be used in Hourly Pool</li>
          <li style={styles.ruleItem}>💡 After claiming, go to Daily Pool to use your airdrop tokens</li>
        </ul>
      </div>

      {/* 领取按钮 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🎰 {t('myAirdropStatus')}</h2>
        
        {!wallet.publicKey ? (
          <div style={styles.connectPrompt}>
            <span style={styles.connectIcon}>🔗</span>
            <p>Connect your wallet to claim</p>
          </div>
        ) : hasClaimed ? (
          <div style={styles.claimedBox}>
            <span style={styles.claimedIcon}>✅</span>
            <div style={styles.claimedText}>
              <strong>You have claimed your 100 TPOT!</strong>
              <p style={{ color: '#FF6B6B' }}>⚠️ Go to <strong>Daily Pool</strong> to use these tokens!</p>
            </div>
          </div>
        ) : (
          <div style={styles.claimSection}>
            <div style={styles.claimAmount}>
              <span style={styles.claimLabel}>Available:</span>
              <span style={styles.claimValue}>100 TPOT</span>
            </div>
            
            {error && <div style={styles.error}>{error}</div>}
            
            <button 
              style={styles.claimButton}
              onClick={handleClaim}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <>⏳ {t('claiming')}</>
              ) : (
                <>🎁 {t('claimAirdrop')}</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 提示 */}
      <div style={styles.tips}>
        <p>💡 Tips: Use your airdrop tokens to:</p>
        <ul>
          <li>Join Hourly Pool (min 200 TPOT)</li>
          <li>Join Daily Pool (min 100 TPOT) + earn 8% referral</li>
          <li>Stake for additional rewards</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '10px',
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#888',
  },
  heroCard: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    marginBottom: '20px',
    border: '2px solid #FFD700',
    boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
  },
  heroIcon: {
    fontSize: '4rem',
    marginBottom: '10px',
  },
  heroAmount: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: '10px',
  },
  heroLabel: {
    fontSize: '1.5rem',
    color: '#fff',
    marginBottom: '5px',
  },
  heroNote: {
    fontSize: '1rem',
    color: '#888',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: '1.3rem',
    marginBottom: '16px',
    color: '#fff',
  },
  rulesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  ruleItem: {
    padding: '12px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ccc',
    fontSize: '1rem',
  },
  connectPrompt: {
    textAlign: 'center',
    padding: '30px',
    color: '#888',
  },
  connectIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: '10px',
  },
  claimedBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    background: 'rgba(76, 175, 80, 0.2)',
    borderRadius: '12px',
    border: '1px solid #4CAF50',
  },
  claimedIcon: {
    fontSize: '2rem',
  },
  claimedText: {
    color: '#4CAF50',
  },
  claimSection: {
    textAlign: 'center',
  },
  claimAmount: {
    marginBottom: '20px',
  },
  claimLabel: {
    color: '#888',
    marginRight: '10px',
  },
  claimValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  claimButton: {
    width: '100%',
    padding: '16px 32px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  error: {
    color: '#ff4444',
    marginBottom: '15px',
    padding: '10px',
    background: 'rgba(255, 68, 68, 0.1)',
    borderRadius: '8px',
  },
  tips: {
    marginTop: '30px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    color: '#888',
    fontSize: '0.9rem',
  },
};

export default Airdrop;
