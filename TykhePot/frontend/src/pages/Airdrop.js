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

    setIsClaiming(true);
    setError('');

    console.log("Starting claim airdrop...");

    // 添加超时处理
    const timeoutId = setTimeout(() => {
      setIsClaiming(false);
      console.log("Transaction timeout");
      alert(language === 'en' 
        ? 'Transaction timeout. Please try again.' 
        : '交易超时，请重试。');
    }, 60000);

    try {
      console.log("Calling sdk.claimAirdrop()...");
      const result = await sdk.claimAirdrop();
      clearTimeout(timeoutId);
      console.log("Claim result:", result);
      
      if (result && result.success) {
        setHasClaimed(true);
        setIsClaiming(false);
        alert(language === 'en' 
          ? '🎉 Registered! Now go to Daily Pool and use FREE BET to join the game!' 
          : '🎉 注册成功！现在去每日奖池使用"免费投注"参与游戏！');
      } else {
        setIsClaiming(false);
        setError(result?.error || (language === 'en' ? 'Failed to register' : '注册失败'));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setIsClaiming(false);
      console.error('Error claiming airdrop:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      // 检查各种可能的错误
      if (err.message && (
        err.message.includes('already in use') || 
        err.message.includes('account already exists')
      )) {
        // 账户已存在，说明已注册
        setHasClaimed(true);
        alert(language === 'en' 
          ? 'You are already registered! Go to Daily Pool for free bet.' 
          : '您已注册！请去每日奖池使用免费投注。');
      } else if (err.message && (
        err.message.includes('Missing signature') ||
        err.message.includes('signature verification')
      )) {
        // 账户不存在，需要先存款
        alert(language === 'en' 
          ? 'Please deposit first to create your account, then come back to claim airdrop!' 
          : '请先去存款创建账户，然后再回来领取空投！');
      } else {
        setError(err.message || (language === 'en' ? 'Failed to register' : '注册失败'));
      }
    }
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
          <li style={styles.ruleItem}>✅ Register once to get <strong>FREE BET</strong> (100 TPOT value)</li>
          <li style={styles.ruleItem}>✅ One-time registration only</li>
          <li style={styles.ruleItem}>✅ Go to <strong>Daily Pool</strong> and click "FREE BET" to play</li>
          <li style={styles.ruleItem}>❌ Each wallet can only use FREE BET once</li>
          <li style={styles.ruleItem}>💡 Win up to 30% of the pool in prizes!</li>
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
              <strong>✅ You are registered! Ready for FREE BET!</strong>
              <p style={{ color: '#10B981', marginTop: '8px' }}>🎰 Go to <strong>Daily Pool</strong> → Click "FREE BET" to play!</p>
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
