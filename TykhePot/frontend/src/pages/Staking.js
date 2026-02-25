import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const Staking = () => {
  const { wallet, userTokenBalance, sdk } = useApp();
  const { t, language } = useTranslation();
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState('short');
  const [isStaking, setIsStaking] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [error, setError] = useState('');

  const calculateReward = (amount, days, apr) => {
    return (amount * apr * days) / 36500;
  };

  const handleStake = async () => {
    if (!wallet.publicKey || !sdk) { alert(t('walletNotConnected')); return; }
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      setError(language === 'en' ? 'Please enter a valid amount' : '请输入有效数量');
      return;
    }
    if (userTokenBalance < amount) {
      setError(language === 'en' ? `Insufficient balance (${userTokenBalance.toFixed(2)} TPOT available)` : `余额不足（可用 ${userTokenBalance.toFixed(2)} TPOT）`);
      return;
    }
    setIsStaking(true);
    setError('');
    try {
      const stakeIndex = Math.floor(Date.now() / 1000);
      const isLongTerm = selectedOption === 'long';
      const result = await sdk.stake(stakeIndex, amount, isLongTerm);
      if (result.success) {
        setLastTx(result.tx);
        setStakeAmount('');
        alert(language === 'en' ? `✅ Staked successfully! Tx: ${result.tx.slice(0,8)}...` : `✅ 质押成功！Tx: ${result.tx.slice(0,8)}...`);
      } else {
        setError(result.error || (language === 'en' ? 'Staking failed' : '质押失败'));
      }
    } catch (err) {
      setError(err.message || (language === 'en' ? 'Error' : '错误'));
    } finally {
      setIsStaking(false);
    }
  };

  const stakingOptions = [
    {
      id: 'short',
      name: language === 'en' ? 'Short Term' : '短期质押',
      days: 30,
      apr: 8,
      icon: '⚡',
      color: '#4488FF',
    },
    {
      id: 'long',
      name: language === 'en' ? 'Long Term' : '长期质押',
      days: 180,
      apr: 48,
      icon: '💎',
      color: '#FFD700',
    },
  ];

  const selectedStaking = stakingOptions.find(opt => opt.id === selectedOption);
  const estimatedReward = stakeAmount 
    ? calculateReward(parseFloat(stakeAmount), selectedStaking.days, selectedStaking.apr).toFixed(2)
    : '0';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💰 {t('staking')}</h1>
        <p style={styles.subtitle}>{language === 'en' ? 'Stake TPOT for stable returns, auto-released at maturity' : '锁定 TPOT，获得稳定收益，到期自动释放'}</p>
      </div>

      {/* 质押选项 */}
      <div style={styles.optionsGrid}>
        {stakingOptions.map(option => (
          <div
            key={option.id}
            onClick={() => setSelectedOption(option.id)}
            style={{
              ...styles.optionCard,
              borderColor: selectedOption === option.id ? option.color : 'rgba(255, 215, 0, 0.2)',
              background: selectedOption === option.id 
                ? `linear-gradient(135deg, ${option.color}20, transparent)` 
                : 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
            }}
          >
            <div style={styles.optionHeader}>
              <span style={{...styles.optionIcon, color: option.color}}>{option.icon}</span>
              <span style={styles.optionName}>{option.name}</span>
            </div>
            <div style={styles.optionDetails}>
              <div style={styles.optionRow}>
                <span style={styles.optionLabel}>{language === 'en' ? 'Lock Period' : '锁定期'}</span>
                <span style={styles.optionValue}>{option.days} {language === 'en' ? 'days' : '天'}</span>
              </div>
              <div style={styles.optionRow}>
                <span style={styles.optionLabel}>{t('apr')}</span>
                <span style={{...styles.optionValue, color: option.color, fontSize: '28px'}}>
                  {option.apr}%
                </span>
              </div>
            </div>
            {option.id === 'long' && (
              <span style={styles.recommendedBadge}>🔥 {language === 'en' ? 'Recommended' : '推荐'}</span>
            )}
          </div>
        ))}
      </div>

      {/* 质押表单 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          {selectedStaking.icon} {selectedStaking.name} - {language === 'en' ? 'Deposit TPOT' : '存入 TPOT'}
        </h2>

        <div style={styles.stakeForm}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('staking')} {language === 'en' ? 'Amount' : '数量'}</label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder={language === 'en' ? 'Enter TPOT amount' : '输入 TPOT 数量'}
              style={styles.input}
            />
            <span style={styles.balanceHint}>{language === 'en' ? `Available: ${userTokenBalance?.toLocaleString() ?? 0} TPOT` : `可用余额: ${userTokenBalance?.toLocaleString() ?? 0} TPOT`}</span>
          </div>

          <div style={styles.estimatedSection}>
            <h3 style={styles.estimatedTitle}>{language === 'en' ? 'Estimated Returns' : '预计收益'}</h3>
            <div style={styles.estimatedGrid}>
              <div style={styles.estimatedItem}>
                <span style={styles.estimatedLabel}>{language === 'en' ? 'Lock Period' : '锁定期'}</span>
                <span style={styles.estimatedValue}>{selectedStaking.days} {language === 'en' ? 'days' : '天'}</span>
              </div>
              <div style={styles.estimatedItem}>
                <span style={styles.estimatedLabel}>{t('apr')}</span>
                <span style={styles.estimatedValue}>{selectedStaking.apr}%</span>
              </div>
              <div style={styles.estimatedItem}>
                <span style={styles.estimatedLabel}>{language === 'en' ? 'Est. Reward' : '预计收益'}</span>
                <span style={{...styles.estimatedValue, color: '#FFD700'}}>
                  +{estimatedReward} TPOT
                </span>
              </div>
              <div style={styles.estimatedItem}>
                <span style={styles.estimatedLabel}>{language === 'en' ? 'Total at Maturity' : '到期总额'}</span>
                <span style={{...styles.estimatedValue, color: '#00FF88'}}>
                  {(parseFloat(stakeAmount || 0) + parseFloat(estimatedReward)).toFixed(2)} TPOT
                </span>
              </div>
            </div>
          </div>

          <div style={styles.noticeBox}>
            <p style={styles.noticeTitle}>📋 {language === 'en' ? 'Early Withdrawal' : '提前赎回说明'}</p>
            <p style={styles.noticeText}>
              {language === 'en' 
                ? <>You can withdraw early with full principal returned, but <span style={{color: '#FF4444'}}>rewards will be zero</span>. Hold to maturity for full returns.</>
                : <>如需提前赎回，可全额取回本金，但 <span style={{color: '#FF4444'}}>收益将归零</span>。建议持有到期，享受完整收益。</>
              }
            </p>
          </div>

          {error && (
            <div style={{ color: '#ff4444', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '8px', padding: '12px', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleStake}
            disabled={isStaking || !stakeAmount}
            style={{
              ...styles.stakeButton,
              background: `linear-gradient(135deg, ${selectedStaking.color} 0%, ${selectedStaking.color}88 100%)`,
              opacity: isStaking || !stakeAmount ? 0.6 : 1,
            }}
          >
            {isStaking 
              ? (language === 'en' ? 'Processing...' : '处理中...') 
              : `💰 ${language === 'en' ? 'Confirm' : '确认'} ${selectedStaking.name}`}
          </button>
        </div>
      </div>

      {/* 我的质押 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📊 {language === 'en' ? 'My Stakes' : '我的质押'}</h2>
        <div style={styles.myStakes}>
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📭</span>
            <p style={styles.emptyText}>{language === 'en' ? 'No active stakes' : '暂无进行中的质押'}</p>
            <p style={styles.emptySubtext}>{language === 'en' ? 'Select a staking option above to start earning' : '选择上方质押方案开始赚取收益'}</p>
          </div>
        </div>
      </div>

      {/* 质押说明 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>❓ {language === 'en' ? 'Staking FAQ' : '质押常见问题'}</h2>
        <div style={styles.faqList}>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>{language === 'en' ? 'Q: Can I withdraw during staking?' : 'Q: 质押期间可以取回吗？'}</h4>
            <p style={styles.faqAnswer}>{language === 'en' ? 'A: Early withdrawal returns principal only, rewards are forfeited. Principal + rewards auto-transfer at maturity.' : 'A: 可以提前赎回，但仅返还本金，收益归零。到期后系统自动将本金+收益转入您的钱包。'}</p>
          </div>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>{language === 'en' ? 'Q: How is reward calculated?' : 'Q: 收益如何计算？'}</h4>
            <p style={styles.faqAnswer}>{language === 'en' ? 'A: Reward = Principal × APR × Days / 365. 30-day stake: 8% APR, 180-day stake: 48% APR.' : 'A: 收益 = 本金 × 年化率 × 锁定期(天) / 365。30天质押8%年化，180天质押48%年化。'}</p>
          </div>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>{language === 'en' ? 'Q: Is there a staking limit?' : 'Q: 质押数量有限制吗？'}</h4>
            <p style={styles.faqAnswer}>{language === 'en' ? 'A: Each tier has a total pool cap, first-come-first-served. Current available amount shown on page.' : 'A: 每档质押有总池上限，先到先得。当前页面显示实时可质押额度。'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
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
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  optionCard: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    padding: '24px',
    border: '2px solid rgba(255, 215, 0, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  optionIcon: {
    fontSize: '32px',
  },
  optionName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  optionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  optionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  optionValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recommendedBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#000000',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  card: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '20px',
    color: '#FFD700',
    marginBottom: '20px',
  },
  stakeForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  input: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '8px',
    padding: '14px 16px',
    fontSize: '18px',
    color: '#FFFFFF',
    outline: 'none',
  },
  balanceHint: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'right',
  },
  estimatedSection: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: '20px',
  },
  estimatedTitle: {
    fontSize: '16px',
    color: '#FFFFFF',
    marginBottom: '16px',
  },
  estimatedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  estimatedItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  estimatedLabel: {
    fontSize: '12px',
    color: '#A0A0A0',
  },
  estimatedValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noticeBox: {
    background: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '16px',
  },
  noticeTitle: {
    fontSize: '14px',
    color: '#FF4444',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  noticeText: {
    fontSize: '14px',
    color: '#A0A0A0',
    lineHeight: 1.6,
    margin: 0,
  },
  stakeButton: {
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
  myStakes: {
    minHeight: '150px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#666',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  faqItem: {
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
  },
  faqQuestion: {
    fontSize: '14px',
    color: '#FFD700',
    marginBottom: '8px',
  },
  faqAnswer: {
    fontSize: '14px',
    color: '#A0A0A0',
    lineHeight: 1.6,
    margin: 0,
  },
};

export default Staking;
