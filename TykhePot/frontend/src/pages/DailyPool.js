import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const DailyPool = () => {
  const { stats, wallet, sdk, refreshStats, userTokenBalance } = useApp();
  const { t, language } = useTranslation();
  const [depositAmount, setDepositAmount] = useState('100');
  const [referrer, setReferrer] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // 'pending' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // 验证邀请人地址
  const isValidReferrer = (address) => {
    if (!address) return true;
    try {
      // 简单的 Solana 地址验证
      return address.length >= 32 && address.length <= 44;
    } catch {
      return false;
    }
  };

// Modern UI enhancements applied via global styles.css


  const handleDeposit = useCallback(async () => {
    // 验证钱包连接
    if (!wallet.publicKey) {
      alert(t('walletNotConnected'));
      return;
    }

    // 验证合约未暂停
    if (stats.isPaused) {
      alert(t('contractPaused'));
      return;
    }

    // 验证输入金额
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      alert(t('minDeposit100'));
      return;
    }

    // 验证余额
    if (userTokenBalance < amount) {
      alert(language === 'en' 
        ? `Insufficient balance. You have ${userTokenBalance.toFixed(2)} TPOT` 
        : t('insufficientBalance') + '. You have ' + userTokenBalance.toFixed(2) + ' TPOT');
      return;
    }

    // 验证邀请人地址
    if (referrer && !isValidReferrer(referrer)) {
      alert(t('invalidReferrer'));
      return;
    }

    // 检查是否是自己
    if (referrer === wallet.publicKey.toString()) {
      alert(t('cannotUseOwnAddress'));
      return;
    }

    setIsDepositing(true);
    setTxStatus('pending');
    setErrorMessage('');

    try {
      const result = await sdk.depositDaily(amount, referrer || null);
      
      if (result.success) {
        setTxStatus('success');
        alert(language === 'en' 
          ? `Success! Transaction: ${result.tx.slice(0, 8)}...` 
          : t('depositSuccess') + '! Tx: ' + result.tx.slice(0, 8) + '...');
        
        // 刷新数据
        await refreshStats();
        
        // 清空输入
        setDepositAmount('100');
        setReferrer('');
      } else {
        setTxStatus('error');
        setErrorMessage(result.error);
        alert(language === 'en' ? `Failed: ${result.error}` : `失败: ${result.error}`);
      }
    } catch (error) {
      setTxStatus('error');
      setErrorMessage(error.message);
      alert(language === 'en' ? `Error: ${error.message}` : `错误: ${error.message}`);
    } finally {
      setIsDepositing(false);
    }
  }, [wallet.publicKey, stats.isPaused, depositAmount, userTokenBalance, referrer, sdk, refreshStats, language]);

  const formatTime = (timestamp) => {
    const diff = Math.max(0, timestamp - Date.now());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

// Modern UI enhancements applied via global styles.css


  // 获取按钮状态
  const getButtonText = () => {
    if (isDepositing) {
      if (txStatus === 'pending') return language === 'en' ? 'Confirming...' : '确认中...';
      return language === 'en' ? 'Processing...' : '处理中...';
    }
    if (stats.isPaused) return t('contractPaused');
    return language === 'en' ? '🎰 Join Daily Pool' : '🎰 参与天池';
  };

// Modern UI enhancements applied via global styles.css


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🌙 {t('dailyPool')}</h1>
        <p style={styles.subtitle}>
          {language === 'en' 
            ? 'Daily grand prize with referral rewards and 1:1 reserve matching' 
            : '每日大奖，推广有奖励，储备1:1配比'}
        </p>
      </div>

      {/* 合约状态警告 */}
      {stats.isPaused && (
        <div style={styles.warningBanner}>
          ⚠️ {language === 'en' ? 'Contract is paused. Deposits are temporarily disabled.' : '合约已暂停，暂时无法参与'}
        </div>
      )}

      {/* 用户余额显示 */}
      <div style={styles.balanceCard}>
        <span style={styles.balanceLabel}>
          {language === 'en' ? 'Your TPOT Balance' : '您的 TPOT 余额'}
        </span>
        <span style={styles.balanceValue}>
          {userTokenBalance.toFixed(2)} TPOT
        </span>
      </div>

      {/* 特色标签 */}
      <div style={styles.features}>
        <span style={styles.featureTag}>🎁 {language === 'en' ? 'Referral 8%' : '推广奖励 8%'}</span>
        <span style={styles.featureTag}>⚡ {language === 'en' ? '1:1 Reserve' : '储备1:1配比'}</span>
        <span style={styles.featureTag}>💎 {language === 'en' ? 'Daily 00:00 Draw' : '每日0点开奖'}</span>
      </div>

      <div style={styles.grid}>
        {/* 奖池信息 */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>{language === 'en' ? 'Pool Info' : '奖池信息'}</h2>
          <div style={styles.poolDisplay}>
            <span style={styles.poolLabel}>{t('currentPool')}</span>
            <span style={styles.poolValue}>
              🪙 {(stats.dailyPool / 1e9).toFixed(2)} TPOT
            </span>
          </div>
          <div style={styles.countdownBox}>
            <span style={styles.countdownLabel}>
              {language === 'en' ? 'Next Draw' : '距离开奖'}
            </span>
            <span style={styles.countdownValue}>
              {formatTime(stats.dailyNextDraw)}
            </span>
          </div>
          <div style={styles.infoList}>
            <div style={styles.infoItem}>
              <span>{language === 'en' ? 'Participants' : '参与人数'}</span>
              <span style={styles.infoValue}>{stats.dailyParticipants} {language === 'en' ? '' : '人'}</span>
            </div>
            <div style={styles.infoItem}>
              <span>{language === 'en' ? 'Min Deposit' : '最低投入'}</span>
              <span style={styles.infoValue}>100 TPOT</span>
            </div>
            <div style={styles.infoItem}>
              <span>{language === 'en' ? 'Draw Time' : '开奖时间'}</span>
              <span style={styles.infoValue}>00:00 UTC</span>
            </div>
            <div style={styles.infoItem}>
              <span>{language === 'en' ? 'Lock Period' : '锁仓期'}</span>
              <span style={styles.infoValue}>{language === 'en' ? '5 min before draw' : '开奖前5分钟'}</span>
            </div>
          </div>
        </div>

        {/* 参与区域 */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            {language === 'en' ? 'Join Now' : '立即参与'}
          </h2>
          <div style={styles.depositSection}>
            <label style={styles.label}>
              {language === 'en' ? 'Amount (TPOT)' : '投入数量 (TPOT)'}
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              min="100"
              disabled={isDepositing}
              style={styles.input}
              placeholder={language === 'en' ? 'Min 100 TPOT' : '最低 100 TPOT'}
            />
            <div style={styles.quickButtons}>
              <button onClick={() => setDepositAmount('100')} disabled={isDepositing} style={styles.quickBtn}>100</button>
              <button onClick={() => setDepositAmount('500')} disabled={isDepositing} style={styles.quickBtn}>500</button>
              <button onClick={() => setDepositAmount('1000')} disabled={isDepositing} style={styles.quickBtn}>1000</button>
              <button onClick={() => setDepositAmount('10000')} disabled={isDepositing} style={styles.quickBtn}>10000</button>
            </div>

            <label style={styles.label}>
              {language === 'en' ? 'Referrer (Optional)' : '邀请人地址 (可选)'}
            </label>
            <input
              type="text"
              value={referrer}
              onChange={(e) => setReferrer(e.target.value)}
              disabled={isDepositing}
              style={styles.input}
              placeholder={language === 'en' ? 'Enter referrer wallet address' : '输入邀请人钱包地址'}
            />
            <p style={styles.referralNote}>
              🎁 {language === 'en' ? 'Referrer gets 8% reward' : '使用邀请码，邀请人可获得 8% 奖励'}
            </p>

            {/* 错误提示 */}
            {errorMessage && (
              <div style={styles.errorMessage}>
                ❌ {errorMessage}
              </div>
            )}

            <button 
              onClick={handleDeposit}
              disabled={isDepositing || stats.isPaused}
              style={{
                ...styles.depositButton,
                opacity: isDepositing || stats.isPaused ? 0.6 : 1,
                cursor: isDepositing || stats.isPaused ? 'not-allowed' : 'pointer',
              }}
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </div>

      {/* 储备配比说明 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>⚡ {language === 'en' ? 'Reserve Matching' : '储备配比机制'}</h2>
        <div style={styles.reserveInfo}>
          <div style={styles.reserveVisual}>
            <div style={styles.reserveBox}>
              <span style={styles.reserveLabel}>{language === 'en' ? 'Your Deposit' : '您的投入'}</span>
              <span style={styles.reserveArrow}>→</span>
              <span style={styles.reserveValue}>100 TPOT</span>
            </div>
            <span style={styles.plus}>+</span>
            <div style={styles.reserveBox}>
              <span style={styles.reserveLabel}>{language === 'en' ? 'Reserve Match' : '储备配比'}</span>
              <span style={styles.reserveArrow}>→</span>
              <span style={styles.reserveValue}>100 TPOT</span>
            </div>
            <span style={styles.equals}>=</span>
            <div style={styles.reserveBoxTotal}>
              <span style={styles.reserveLabel}>{language === 'en' ? 'Total in Pool' : '实际入池'}</span>
              <span style={styles.reserveValueTotal}>200 TPOT</span>
            </div>
          </div>
          <p style={styles.reserveDesc}>
            {language === 'en' 
              ? 'Every deposit gets 1:1 matched from reserve pool, doubling your winning chance!' 
              : '您的每笔投入都将获得储备池 1:1 配比，翻倍您的中奖机会！'}
            <br />
            <span style={styles.reserveNote}>
              {language === 'en' 
                ? 'Matching stops when reserve is depleted. First come first served.' 
                : '储备耗尽后停止配比，先到先得。'}
            </span>
          </p>
        </div>
      </div>

      {/* 奖金分配 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>💰 {language === 'en' ? 'Prize Distribution' : '奖金分配'}</h2>
        <div style={styles.prizeDistribution}>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🥇 {language === 'en' ? 'First Prize' : '头奖'}</span>
            <span style={styles.prizePercent}>30%</span>
            <span style={styles.prizeDetail}>{language === 'en' ? '1 winner / 20 days vesting' : '1人 / 20天释放'}</span>
          </div>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🥈 {language === 'en' ? 'Second Prize' : '二等奖'}</span>
            <span style={styles.prizePercent}>20%</span>
            <span style={styles.prizeDetail}>{language === 'en' ? '2 winners / 20 days' : '2人 / 20天释放'}</span>
          </div>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🥉 {language === 'en' ? 'Third Prize' : '三等奖'}</span>
            <span style={styles.prizePercent}>15%</span>
            <span style={styles.prizeDetail}>{language === 'en' ? '3 winners / 20 days' : '3人 / 20天释放'}</span>
          </div>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🎁 {language === 'en' ? 'Lucky Prize' : '幸运奖'}</span>
            <span style={styles.prizePercent}>10%</span>
            <span style={styles.prizeDetail}>{language === 'en' ? '5 winners / 20 days' : '5人 / 20天释放'}</span>
          </div>
          <div style={styles.prizeRowHighlight}>
            <span style={styles.prizeName}>🌟 {language === 'en' ? 'Universal Prize' : '普惠奖'}</span>
            <span style={styles.prizePercent}>20%</span>
            <span style={styles.prizeDetail}>{language === 'en' ? 'All non-winners / Instant' : '所有未中大奖者 / 立即到账'}</span>
          </div>
          <div style={styles.prizeRow}>
            <span style={styles.prizeName}>🔄 {language === 'en' ? 'Rollover' : '回流'}</span>
            <span style={styles.prizePercent}>5%</span>
            <span style={styles.prizeDetail}>{language === 'en' ? 'To next round' : '滚入下期奖池'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modern UI enhancements applied via global styles.css


const styles = {
  container: {
    padding: '40px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '36px',
    color: '#FFD700',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#A0A0A0',
  },
  warningBanner: {
    background: 'rgba(255, 0, 0, 0.2)',
    border: '1px solid rgba(255, 0, 0, 0.5)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  balanceCard: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '12px',
    padding: '16px 24px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid rgba(255, 215, 0, 0.3)',
  },
  balanceLabel: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  balanceValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  features: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  featureTag: {
    background: 'rgba(255, 215, 0, 0.15)',
    color: '#FFD700',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    border: '1px solid rgba(255, 215, 0, 0.3)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  card: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  cardTitle: {
    fontSize: '20px',
    color: '#FFD700',
    marginBottom: '20px',
  },
  poolDisplay: {
    textAlign: 'center',
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  poolLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#A0A0A0',
    marginBottom: '8px',
  },
  poolValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  countdownBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 215, 0, 0.1)',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  countdownLabel: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  countdownValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'monospace',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#A0A0A0',
  },
  infoValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  depositSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  input: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '16px',
    color: '#FFFFFF',
    outline: 'none',
  },
  quickButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  quickBtn: {
    background: 'rgba(255, 215, 0, 0.1)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '6px',
    padding: '8px 16px',
    color: '#FFD700',
    cursor: 'pointer',
    fontSize: '14px',
  },
  referralNote: {
    fontSize: '12px',
    color: '#FFD700',
    margin: 0,
  },
  errorMessage: {
    background: 'rgba(255, 0, 0, 0.2)',
    border: '1px solid rgba(255, 0, 0, 0.5)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#FF6B6B',
    fontSize: '14px',
  },
  depositButton: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  reserveInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  reserveVisual: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  reserveBox: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '16px 24px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  reserveBoxTotal: {
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2))',
    padding: '16px 24px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid rgba(255, 215, 0, 0.5)',
  },
  reserveLabel: {
    fontSize: '12px',
    color: '#A0A0A0',
  },
  reserveValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reserveValueTotal: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  reserveArrow: {
    fontSize: '20px',
    color: '#A0A0A0',
  },
  plus: {
    fontSize: '24px',
    color: '#FFD700',
    fontWeight: 'bold',
  },
  equals: {
    fontSize: '24px',
    color: '#FFD700',
    fontWeight: 'bold',
  },
  reserveDesc: {
    textAlign: 'center',
    color: '#A0A0A0',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  reserveNote: {
    color: '#FFD700',
  },
  prizeDistribution: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  prizeRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
  },
  prizeRowHighlight: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    background: 'rgba(255, 215, 0, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 215, 0, 0.3)',
  },
  prizeName: {
    flex: 1,
    fontSize: '16px',
    color: '#FFFFFF',
  },
  prizePercent: {
    width: '60px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  prizeDetail: {
    flex: 1,
    fontSize: '14px',
    color: '#A0A0A0',
    textAlign: 'right',
  },
};

// Modern UI enhancements applied via global styles.css


export default DailyPool;
// Modern styles
