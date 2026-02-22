import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const Referral = () => {
  const { wallet } = useApp();
  const [copied, setCopied] = useState(false);

  // 模拟数据
  const referralData = {
    referralCode: wallet.publicKey ? wallet.publicKey.toString().slice(0, 8) : 'CONNECT',
    referralLink: wallet.publicKey 
      ? `https://tykhepot.io/?ref=${wallet.publicKey.toString()}` 
      : '请先连接钱包',
    totalReferrals: 12,
    totalRewards: 125000,
    referralList: [
      { address: '7xK9...3mN2', amount: 8000, time: '2小时前' },
      { address: '9pL4...8kQ1', amount: 5000, time: '5小时前' },
      { address: '2mN8...4jP7', amount: 12000, time: '1天前' },
    ],
  };

// Modern UI enhancements applied via global styles.css


  const handleCopy = () => {
    if (wallet.publicKey) {
      navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

// Modern UI enhancements applied via global styles.css


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🤝 {t('referralTitle')}</h1>
        <p style={styles.subtitle}>邀请好友参与天池，获得 8% 奖励</p>
      </div>

      {/* 推广统计 */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>邀请人数</span>
          <span style={styles.statValue}>{referralData.totalReferrals} 人</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>累计奖励</span>
          <span style={styles.statValue}>{(referralData.totalRewards / 1000).toFixed(0)}K TPOT</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>奖励比例</span>
          <span style={styles.statValue}>8%</span>
        </div>
      </div>

      {/* 推广链接 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🔗 {t('myReferralLink')}</h2>
        <div style={styles.referralBox}>
          <div style={styles.linkDisplay}>
            <input 
              type="text" 
              value={referralData.referralLink}
              readOnly
              style={styles.linkInput}
            />
            <button 
              onClick={handleCopy}
              style={{
                ...styles.copyButton,
                background: copied 
                  ? 'linear-gradient(135deg, #00FF88, #00CC6A)' 
                  : 'linear-gradient(135deg, #FFD700, #FFA500)',
              }}
            >
              {copied ? '✅ 已复制' : '📋 复制链接'}
            </button>
          </div>
          
          <div style={styles.shareButtons}>
            <span style={styles.shareLabel}>分享到:</span>
            <button style={styles.shareButton}>Twitter/X</button>
            <button style={styles.shareButton}>Telegram</button>
            <button style={styles.shareButton}>Discord</button>
          </div>
        </div>
      </div>

      {/* 推广说明 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🎁 {t('referralMechanism')}</h2>
        <div style={styles.rewardSteps}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <div style={styles.stepContent}>
              <h4 style={styles.stepTitle}>分享链接</h4>
              <p style={styles.stepText}>将您的专属推广链接分享给好友</p>
            </div>
          </div>
          <div style={styles.stepArrow}>→</div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <div style={styles.stepContent}>
              <h4 style={styles.stepTitle}>好友参与</h4>
              <p style={styles.stepText}>好友通过链接参与天池游戏</p>
            </div>
          </div>
          <div style={styles.stepArrow}>→</div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <div style={styles.stepContent}>
              <h4 style={styles.stepTitle}>获得奖励</h4>
              <p style={styles.stepText}>您获得好友投入金额的 8%</p>
            </div>
          </div>
        </div>

        <div style={styles.rulesBox}>
          <h4 style={styles.rulesTitle}>📋 规则说明</h4>
          <ul style={styles.rulesList}>
            <li style={styles.ruleItem}>✓ 仅天池投入触发推广奖励，小时池不参与</li>
            <li style={styles.ruleItem}>✓ 单层推广，直推奖励 8%</li>
            <li style={styles.ruleItem}>✓ 奖励从推广池支出，池子耗尽后停止</li>
            <li style={styles.ruleItem}>✓ 奖励即时到账，无需等待</li>
            <li style={styles.ruleItem}>✓ 每个用户只能绑定一个邀请人</li>
          </ul>
        </div>
      </div>

      {/* 推广记录 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📊 {t('referralRecords')}</h2>
        {referralData.referralList.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>用户地址</th>
                  <th style={styles.th}>奖励金额</th>
                  <th style={styles.th}>时间</th>
                </tr>
              </thead>
              <tbody>
                {referralData.referralList.map((item, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.td}>{item.address}</td>
                    <td style={{...styles.td, color: '#FFD700'}}>+{item.amount.toLocaleString()} TPOT</td>
                    <td style={{...styles.td, color: '#A0A0A0'}}>{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📭</span>
            <p style={styles.emptyText}>暂无推广记录</p>
            <p style={styles.emptySubtext}>分享您的推广链接开始赚取奖励</p>
          </div>
        )}
      </div>

      {/* 推广技巧 */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>💡 {t('referralTips')}</h2>
        <div style={styles.tipsGrid}>
          <div style={styles.tipCard}>
            <span style={styles.tipIcon}>🐦</span>
            <h4 style={styles.tipTitle}>社交媒体</h4>
            <p style={styles.tipText}>在 Twitter、Telegram、Discord 分享您的推广链接</p>
          </div>
          <div style={styles.tipCard}>
            <span style={styles.tipIcon}>📝</span>
            <h4 style={styles.tipTitle}>内容创作</h4>
            <p style={styles.tipText}>撰写 TykhePot 介绍文章或制作视频教程</p>
          </div>
          <div style={styles.tipCard}>
            <span style={styles.tipIcon}>👥</span>
            <h4 style={styles.tipTitle}>社区运营</h4>
            <p style={styles.tipText}>建立或加入加密货币社区，分享项目信息</p>
          </div>
          <div style={styles.tipCard}>
            <span style={styles.tipIcon}>🎯</span>
            <h4 style={styles.tipTitle}>精准推广</h4>
            <p style={styles.tipText}>针对对 DeFi 和 GameFi 感兴趣的用户群体</p>
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
    fontSize: '24px',
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
  referralBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  linkDisplay: {
    display: 'flex',
    gap: '12px',
  },
  linkInput: {
    flex: 1,
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#FFFFFF',
    outline: 'none',
  },
  copyButton: {
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  shareButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  shareLabel: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  shareButton: {
    background: 'rgba(255, 215, 0, 0.1)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '6px',
    padding: '8px 16px',
    color: '#FFD700',
    cursor: 'pointer',
    fontSize: '14px',
  },
  rewardSteps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '24px',
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#000000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  stepTitle: {
    fontSize: '16px',
    color: '#FFFFFF',
    margin: 0,
  },
  stepText: {
    fontSize: '12px',
    color: '#A0A0A0',
    margin: 0,
  },
  stepArrow: {
    fontSize: '24px',
    color: '#FFD700',
    fontWeight: 'bold',
  },
  rulesBox: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    padding: '16px',
  },
  rulesTitle: {
    fontSize: '16px',
    color: '#FFD700',
    marginBottom: '12px',
  },
  rulesList: {
    margin: 0,
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  ruleItem: {
    fontSize: '14px',
    color: '#A0A0A0',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: 'rgba(0, 0, 0, 0.3)',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontSize: '14px',
    color: '#FFD700',
    fontWeight: 'bold',
  },
  tableRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#FFFFFF',
  },
  emptyState: {
    textAlign: 'center',
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
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  tipCard: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
  },
  tipIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  tipTitle: {
    fontSize: '16px',
    color: '#FFD700',
    marginBottom: '8px',
  },
  tipText: {
    fontSize: '14px',
    color: '#A0A0A0',
    lineHeight: 1.5,
    margin: 0,
  },
};

// Modern UI enhancements applied via global styles.css


export default Referral;
// Modern styles
