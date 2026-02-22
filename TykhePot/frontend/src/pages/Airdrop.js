import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const Airdrop = () => {
  const { wallet } = useApp();
  const { t } = useTranslation();
  const [isClaiming, setIsClaiming] = useState(false);

  // 模拟数据
  const airdropData = {
    totalAirdrop: '200,000,000',
    claimedAmount: '45,230,000',
    remainingAmount: '154,770,000',
    participantCount: '12,345',
    claimedCount: '3,456',
  };

// Modern UI enhancements applied via global styles.css


  const userData = {
    hasParticipated: true,
    totalProfit: 5000,
    eligibleAirdrop: 50000,
    hasClaimed: false,
    profitNeeded: 0,
    canClaim: true,
  };

// Modern UI enhancements applied via global styles.css


  const handleClaim = async () => {
    if (!wallet.publicKey) {
      alert(t('walletNotConnected'));
      return;
    }
    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      alert(t('claimSuccess') || 'Claim successful!');
    }, 2000);
  };

// Modern UI enhancements applied via global styles.css


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎁 {t('airdropClaim')}</h1>
        <p style={styles.subtitle}>{t('airdropSubtitle')}</p>
      </div>

      {/* 全局统计 */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>{t('totalAirdropPool')}</span>
          <span style={styles.statValue}>{airdropData.totalAirdrop} TPOT</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Claimed</span>
          <span style={styles.statValue}>{airdropData.claimedAmount} TPOT</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Remaining</span>
          <span style={styles.statValue}>{airdropData.remainingAmount} TPOT</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Claimed / Total</span>
          <span style={styles.statValue}>{airdropData.claimedCount} / {airdropData.participantCount}</span>
        </div>
      </div>

      {/* 我的空投状态 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📋 {t('myAirdropStatus')}</h2>
        
        {!userData.hasParticipated ? (
          <div style={styles.notParticipated}>
            <span style={styles.notParticipatedIcon}>🎮</span>
            <h3 style={styles.notParticipatedTitle}>Not Participated Yet</h3>
            <p style={styles.notParticipatedText}>
              {t('needParticipate')}
            </p>
            <div style={styles.actionButtons}>
              <a href="/hourly" style={styles.actionButton}>{t('participateHourly')}</a>
              <a href="/daily" style={styles.actionButton}>{t('participateDaily')}</a>
            </div>
          </div>
        ) : (
          <div style={styles.participatedSection}>
            <div style={styles.statusGrid}>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>Status</span>
                <span style={styles.statusValueGood}>✅ Participated</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>Total Profit</span>
                <span style={styles.statusValue}>{userData.totalProfit.toLocaleString()} TPOT</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>{t('airdropAvailable')}</span>
                <span style={styles.statusValueHighlight}>{userData.eligibleAirdrop.toLocaleString()} TPOT</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>Claim Status</span>
                <span style={userData.hasClaimed ? styles.statusValueBad : styles.statusValueGood}>
                  {userData.hasClaimed ? '✅ Claimed' : '⏳ Not Claimed'}
                </span>
              </div>
            </div>

            {userData.canClaim && !userData.hasClaimed && (
              <div style={styles.claimSection}>
                <div style={styles.claimBox}>
                  <span style={styles.claimLabel}>{t('claimableAirdrop')}</span>
                  <span style={styles.claimAmount}>{userData.eligibleAirdrop.toLocaleString()} TPOT</span>
                  <span style={styles.claimFormula}>
                    Based on profit {userData.totalProfit.toLocaleString()} TPOT × 10
                  </span>
                </div>
                <button 
                  onClick={handleClaim}
                  disabled={isClaiming}
                  style={styles.claimButton}
                >
                  {isClaiming ? t('claiming') : '🎁 ' + t('claimAirdrop')}
                </button>
              </div>
            )}

            {userData.hasClaimed && (
              <div style={styles.claimedBox}>
                <span style={styles.claimedIcon}>✅</span>
                <span style={styles.claimedText}>{t('claimed')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 规则说明 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📖 {t('airdropRules')}</h2>
        <div style={styles.rulesList}>
          <div style={styles.ruleItem}>
            <span style={styles.ruleNumber}>1</span>
            <div style={styles.ruleContent}>
              <h4 style={styles.ruleTitle}>Participate</h4>
              <p style={styles.ruleText}>{t('rule1')}</p>
            </div>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleNumber}>2</span>
            <div style={styles.ruleContent}>
              <h4 style={styles.ruleTitle}>Earn Profit</h4>
              <p style={styles.ruleText}>{t('rule2')}</p>
            </div>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleNumber}>3</span>
            <div style={styles.ruleContent}>
              <h4 style={styles.ruleTitle}>Calculate</h4>
              <p style={styles.ruleText}>{t('rule3')}</p>
            </div>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleNumber}>4</span>
            <div style={styles.ruleContent}>
              <h4 style={styles.ruleTitle}>{t('claimAirdrop')}</h4>
              <p style={styles.ruleText}>Claim when profit ≥ 1,000 TPOT. One claim per person.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 计算公式 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🧮 {t('formula')}</h2>
        <div style={styles.formulaBox}>
          <div style={styles.formulaVisual}>
            <div style={styles.formulaItem}>
              <span style={styles.formulaLabel}>Total Profit</span>
              <span style={styles.formulaValue}>× 10</span>
            </div>
            <span style={styles.formulaArrow}>=</span>
            <div style={styles.formulaItemResult}>
              <span style={styles.formulaLabel}>{t('claimableAirdrop')}</span>
              <span style={styles.formulaValueHighlight}>Max 10,000 TPOT</span>
            </div>
          </div>
          <div style={styles.formulaConstraints}>
            <div style={styles.constraint}>
              <span style={styles.constraintIcon}>✓</span>
              <span>{t('minProfitRequirement')}</span>
            </div>
            <div style={styles.constraint}>
              <span style={styles.constraintIcon}>✓</span>
              <span>Max per person: 10,000 TPOT</span>
            </div>
            <div style={styles.constraint}>
              <span style={styles.constraintIcon}>✓</span>
              <span>One claim per person</span>
            </div>
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FFD700',
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
  notParticipated: {
    textAlign: 'center',
    padding: '40px',
  },
  notParticipatedIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  notParticipatedTitle: {
    fontSize: '24px',
    color: '#FFFFFF',
    marginBottom: '12px',
  },
  notParticipatedText: {
    fontSize: '16px',
    color: '#A0A0A0',
    marginBottom: '24px',
  },
  actionButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  actionButton: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#000000',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  participatedSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statusItem: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statusLabel: {
    fontSize: '12px',
    color: '#A0A0A0',
  },
  statusValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusValueGood: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#00FF88',
  },
  statusValueBad: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FF4444',
  },
  statusValueHighlight: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  claimSection: {
    background: 'rgba(255, 215, 0, 0.1)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
  },
  claimBox: {
    marginBottom: '20px',
  },
  claimLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#A0A0A0',
    marginBottom: '8px',
  },
  claimAmount: {
    display: 'block',
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: '8px',
  },
  claimFormula: {
    display: 'block',
    fontSize: '14px',
    color: '#A0A0A0',
  },
  claimButton: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '16px 48px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  claimedBox: {
    background: 'rgba(0, 255, 136, 0.1)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
  },
  claimedIcon: {
    fontSize: '48px',
    marginRight: '12px',
  },
  claimedText: {
    fontSize: '20px',
    color: '#00FF88',
    fontWeight: 'bold',
  },
  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  ruleItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
  },
  ruleNumber: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#000000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: '16px',
    color: '#FFFFFF',
    marginBottom: '4px',
  },
  ruleText: {
    fontSize: '14px',
    color: '#A0A0A0',
    margin: 0,
  },
  formulaBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formulaVisual: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },
  formulaItem: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '20px 32px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  formulaItemResult: {
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2))',
    padding: '20px 32px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid rgba(255, 215, 0, 0.5)',
  },
  formulaLabel: {
    fontSize: '12px',
    color: '#A0A0A0',
  },
  formulaValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  formulaValueHighlight: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  formulaArrow: {
    fontSize: '32px',
    color: '#FFD700',
    fontWeight: 'bold',
  },
  formulaConstraints: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    flexWrap: 'wrap',
  },
  constraint: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#A0A0A0',
    fontSize: '14px',
  },
  constraintIcon: {
    color: '#00FF88',
  },
};

// Modern UI enhancements applied via global styles.css


export default Airdrop;

// Modern CSS Override
const style = document.createElement('style');
style.textContent = `
  .airdrop-page { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
  .airdrop-header { text-align: center; margin-bottom: 40px; }
  .airdrop-title { font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, #FFD700, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .airdrop-subtitle { color: var(--text-secondary); margin-top: 12px; }
  .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
  .stat-card { background: var(--gradient-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 24px; text-align: center; }
  .stat-label { font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 8px; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--color-gold); }
  .user-card { background: var(--gradient-card); border: 1px solid var(--color-gold); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px; }
  .claim-btn { background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; border: none; padding: 16px 48px; border-radius: 12px; font-size: 1.125rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
  .claim-btn:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(255,215,0,0.4); }
  .formula-box { background: var(--surface-overlay); border-radius: 16px; padding: 24px; display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap; }
  .rules-list { background: var(--gradient-card); border-radius: 16px; padding: 24px; }
  @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
`;
if (document.head) document.head.appendChild(style);
