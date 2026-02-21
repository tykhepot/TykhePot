import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const Airdrop = () => {
  const { wallet } = useApp();
  const [isClaiming, setIsClaiming] = useState(false);

  // 模拟数据
  const airdropData = {
    totalAirdrop: '200,000,000',
    claimedAmount: '45,230,000',
    remainingAmount: '154,770,000',
    participantCount: '12,345',
    claimedCount: '3,456',
  };

  const userData = {
    hasParticipated: true,
    totalProfit: 5000,
    eligibleAirdrop: 50000,
    hasClaimed: false,
    profitNeeded: 0,
    canClaim: true,
  };

  const handleClaim = async () => {
    if (!wallet.publicKey) {
      alert('请先连接钱包');
      return;
    }
    setIsClaiming(true);
    // TODO: 调用合约
    setTimeout(() => {
      setIsClaiming(false);
      alert('领取成功！');
    }, 2000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎁 空投领取</h1>
        <p style={styles.subtitle}>参与游戏获利后即可领取空投，最高 10,000 TPOT</p>
      </div>

      {/* 全局统计 */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>总空投池</span>
          <span style={styles.statValue}>{airdropData.totalAirdrop} TPOT</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>已领取</span>
          <span style={styles.statValue}>{airdropData.claimedAmount} TPOT</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>剩余</span>
          <span style={styles.statValue}>{airdropData.remainingAmount} TPOT</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>领取人数</span>
          <span style={styles.statValue}>{airdropData.claimedCount} / {airdropData.participantCount}</span>
        </div>
      </div>

      {/* 我的空投状态 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📋 我的空投状态</h2>
        
        {!userData.hasParticipated ? (
          <div style={styles.notParticipated}>
            <span style={styles.notParticipatedIcon}>🎮</span>
            <h3 style={styles.notParticipatedTitle}>尚未参与游戏</h3>
            <p style={styles.notParticipatedText}>
              您需要先参与小时池或天池游戏并获利，才能领取空投。
            </p>
            <div style={styles.actionButtons}>
              <a href="/hourly" style={styles.actionButton}>参与小时池</a>
              <a href="/daily" style={styles.actionButton}>参与天池</a>
            </div>
          </div>
        ) : (
          <div style={styles.participatedSection}>
            <div style={styles.statusGrid}>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>参与状态</span>
                <span style={styles.statusValueGood}>✅ 已参与</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>累计获利</span>
                <span style={styles.statusValue}>{userData.totalProfit.toLocaleString()} TPOT</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>可领空投</span>
                <span style={styles.statusValueHighlight}>{userData.eligibleAirdrop.toLocaleString()} TPOT</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusLabel}>领取状态</span>
                <span style={userData.hasClaimed ? styles.statusValueBad : styles.statusValueGood}>
                  {userData.hasClaimed ? '✅ 已领取' : '⏳ 未领取'}
                </span>
              </div>
            </div>

            {userData.canClaim && !userData.hasClaimed && (
              <div style={styles.claimSection}>
                <div style={styles.claimBox}>
                  <span style={styles.claimLabel}>可领取空投</span>
                  <span style={styles.claimAmount}>{userData.eligibleAirdrop.toLocaleString()} TPOT</span>
                  <span style={styles.claimFormula}>
                    基于获利 {userData.totalProfit.toLocaleString()} TPOT × 10倍
                  </span>
                </div>
                <button 
                  onClick={handleClaim}
                  disabled={isClaiming}
                  style={styles.claimButton}
                >
                  {isClaiming ? '领取中...' : '🎁 立即领取空投'}
                </button>
              </div>
            )}

            {userData.hasClaimed && (
              <div style={styles.claimedBox}>
                <span style={styles.claimedIcon}>✅</span>
                <span style={styles.claimedText}>您已领取空投</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 规则说明 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📖 空投规则</h2>
        <div style={styles.rulesList}>
          <div style={styles.ruleItem}>
            <span style={styles.ruleNumber}>1</span>
            <div style={styles.ruleContent}>
              <h4 style={styles.ruleTitle}>参与游戏</h4>
              <p style={styles.ruleText}>参与小时池或天池游戏，投入 TPOT 参与抽奖。</p>
            </div>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleNumber}>2</span>
            <div style={styles.ruleContent}>
              <h4 style={styles.ruleTitle}>获得利润</h4>
              <p style={styles.ruleText}>中奖后获得奖金，或通过普惠奖、质押等方式获利。</p>
            </div>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleNumber}>3</span>
            <div style={styles.ruleContent}>
              <h4 style={styles.ruleTitle}>计算额度</h4>
              <p style={styles.ruleText}>可领取空投 = 累计获利 × 10，最高 10,000 TPOT。</p>
            </div>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleNumber}>4</span>
            <div style={styles.ruleContent}>
              <h4 style={styles.ruleTitle}>领取空投</h4>
              <p style={styles.ruleText}>累计获利 ≥ 1,000 TPOT 后即可领取，每人限领一次。</p>
            </div>
          </div>
        </div>
      </div>

      {/* 计算公式 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🧮 计算公式</h2>
        <div style={styles.formulaBox}>
          <div style={styles.formulaVisual}>
            <div style={styles.formulaItem}>
              <span style={styles.formulaLabel}>累计获利</span>
              <span style={styles.formulaValue}>× 10</span>
            </div>
            <span style={styles.formulaArrow}>=</span>
            <div style={styles.formulaItemResult}>
              <span style={styles.formulaLabel}>可领空投</span>
              <span style={styles.formulaValueHighlight}>最高 10,000 TPOT</span>
            </div>
          </div>
          <div style={styles.formulaConstraints}>
            <div style={styles.constraint}>
              <span style={styles.constraintIcon}>✓</span>
              <span>最低获利要求: 1,000 TPOT</span>
            </div>
            <div style={styles.constraint}>
              <span style={styles.constraintIcon}>✓</span>
              <span>单人最高额度: 10,000 TPOT</span>
            </div>
            <div style={styles.constraint}>
              <span style={styles.constraintIcon}>✓</span>
              <span>每人限领: 1 次</span>
            </div>
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

export default Airdrop;
