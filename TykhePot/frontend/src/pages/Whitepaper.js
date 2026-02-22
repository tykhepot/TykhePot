import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';

const Whitepaper = () => {
  const { t, language } = useTranslation();

  const content = {
    en: {
      title: 'TykhePot Whitepaper',
      subtitle: 'Fair & Transparent On-Chain Entertainment Protocol',
      sections: [
        {
          title: '1. Introduction',
          content: 'TykhePot is a decentralized lottery protocol built on Solana, offering fair and transparent entertainment through on-chain randomness. Named after Tykhe, the Greek goddess of fortune, we bring the excitement of lottery gaming to the blockchain era.'
        },
        {
          title: '2. Tokenomics',
          items: [
            { label: 'Token Name', value: 'TPOT' },
            { label: 'Total Supply', value: '1,000,000,000 TPOT' },
            { label: 'Initial Liquidity', value: '50,000,000 TPOT (5%)' },
            { label: 'Airdrop', value: '100,000,000 TPOT (10%)' },
            { label: 'Staking Rewards', value: '350,000,000 TPOT (35%)' },
            { label: 'Team', value: '200,000,000 TPOT (20%) - 4 year vesting' },
            { label: 'Marketing', value: '100,000,000 TPOT (10%)' },
            { label: 'Treasury', value: '200,000,000 TPOT (20%)' }
          ]
        },
        {
          title: '3. Pool Structure',
          items: [
            { label: 'Hourly Pool', value: 'Draws every hour, min deposit 200 TPOT' },
            { label: 'Daily Pool', value: 'Draws at midnight UTC, min deposit 100 TPOT' }
          ]
        },
        {
          title: '4. Prize Distribution',
          items: [
            { label: '1st Prize', value: '30% - 1 winner / 20 day vesting' },
            { label: '2nd Prize', value: '20% - 2 winners / 20 day vesting' },
            { label: '3rd Prize', value: '15% - 3 winners / 20 day vesting' },
            { label: 'Lucky Prize', value: '10% - 5 winners / 20 day vesting' },
            { label: 'Universal Prize', value: '20% - All non-winners / Instant' },
            { label: 'Roll Over', value: '5% - Next pool' }
          ]
        },
        {
          title: '5. Fee Structure',
          items: [
            { label: 'Platform Fee', value: '2% of all deposits' },
            { label: 'Burn', value: '3% of all deposits (permanent)' },
            { label: 'Prize Pool', value: '95% of all deposits' }
          ]
        },
        {
          title: '6. Staking Rewards',
          items: [
            { label: '30 Day Staking', value: '8% APY' },
            { label: '180 Day Staking', value: '48% APY' }
          ]
        },
        {
          title: '7. Referral Program',
          content: 'Referrers receive 5% of their referee\'s deposits as rewards. This encourages community growth and rewards active participants.'
        },
        {
          title: '8. Security Features',
          items: [
            { label: 'Emergency Pause', value: 'Admin can pause in emergencies' },
            { label: 'Max Deposit', value: '1,000,000 TPOT per transaction' },
            { label: 'Time Tolerance', value: '60 second window for fair execution' },
            { label: 'On-Chain Verification', value: 'All results verifiable on-chain' }
          ]
        },
        {
          title: '9. Roadmap',
          items: [
            { label: 'Phase 1', value: 'Launch on Solana Devnet' },
            { label: 'Phase 2', value: 'Security audit & Mainnet launch' },
            { label: 'Phase 3', value: 'Staking & Airdrop' },
            { label: 'Phase 4', value: 'Cross-chain expansion' }
          ]
        }
      ]
    },
    zh: {
      title: 'TykhePot 白皮书',
      subtitle: '公平透明的链上娱乐协议',
      sections: [
        {
          title: '1. 项目简介',
          content: 'TykhePot 是建立在 Solana 上的去中心化彩票协议，通过链上随机数提供公平透明娱乐服务。以希腊幸运女神堤喀命名，我们将彩票游戏的乐趣带入区块链时代。'
        },
        {
          title: '2. 代币经济学',
          items: [
            { label: '代币名称', value: 'TPOT' },
            { label: '总供应量', value: '1,000,000,000 TPOT' },
            { label: '初始流动性', value: '50,000,000 TPOT (5%)' },
            { label: '空投', value: '100,000,000 TPOT (10%)' },
            { label: '质押奖励', value: '350,000,000 TPOT (35%)' },
            { label: '团队', value: '200,000,000 TPOT (20%) - 4年锁仓' },
            { label: '市场营销', value: '100,000,000 TPOT (10%)' },
            { label: '金库', value: '200,000,000 TPOT (20%)' }
          ]
        },
        {
          title: '3. 奖池结构',
          items: [
            { label: '小时池', value: '每小时开奖，最低投入 200 TPOT' },
            { label: '天池', value: 'UTC 午夜开奖，最低投入 100 TPOT' }
          ]
        },
        {
          title: '4. 奖金分配',
          items: [
            { label: '头奖', value: '30% - 1人 / 20天释放' },
            { label: '二等奖', value: '20% - 2人 / 20天释放' },
            { label: '三等奖', value: '15% - 3人 / 20天释放' },
            { label: '幸运奖', value: '10% - 5人 / 20天释放' },
            { label: '普惠奖', value: '20% - 所有未中奖者 / 即时到账' },
            { label: '回流', value: '5% - 滚入下期奖池' }
          ]
        },
        {
          title: '5. 费用结构',
          items: [
            { label: '平台费', value: '所有投入的 2%' },
            { label: '销毁', value: '所有投入的 3%（永久）' },
            { label: '奖池', value: '所有投入的 95%' }
          ]
        },
        {
          title: '6. 质押奖励',
          items: [
            { label: '30天质押', value: '年化 8%' },
            { label: '180天质押', value: '年化 48%' }
          ]
        },
        {
          title: '7. 推荐计划',
          content: '推荐人获得被推荐人投入的 5% 作为奖励。这鼓励社区增长并奖励活跃参与者。'
        },
        {
          title: '8. 安全功能',
          items: [
            { label: '紧急暂停', value: '管理员可紧急暂停' },
            { label: '最大投入', value: '每笔交易最多 1,000,000 TPOT' },
            { label: '时间容差', value: '60秒窗口确保公平执行' },
            { label: '链上验证', value: '所有结果可在链上验证' }
          ]
        },
        {
          title: '9. 路线图',
          items: [
            { label: '第一阶段', value: 'Solana Devnet 上线' },
            { label: '第二阶段', value: '安全审计 & Mainnet 上线' },
            { label: '第三阶段', value: '质押 & 空投' },
            { label: '第四阶段', value: '跨链扩展' }
          ]
        }
      ]
    }
  };

// Modern UI enhancements applied via global styles.css


  const c = content[language] || content.en;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/" style={styles.backLink}>← {language === 'en' ? 'Back' : '返回'}</Link>
        <h1 style={styles.title}>{c.title}</h1>
        <p style={styles.subtitle}>{c.subtitle}</p>
      </div>

      <div style={styles.content}>
        {c.sections.map((section, index) => (
          <div key={index} style={styles.section}>
            <h2 style={styles.sectionTitle}>{section.title}</h2>
            
            {section.content && (
              <p style={styles.paragraph}>{section.content}</p>
            )}
            
            {section.items && (
              <div style={styles.table}>
                {section.items.map((item, i) => (
                  <div key={i} style={styles.tableRow}>
                    <span style={styles.tableLabel}>{item.label}</span>
                    <span style={styles.tableValue}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <p>© 2026 TykhePot. All rights reserved.</p>
      </div>
    </div>
  );
};

// Modern UI enhancements applied via global styles.css


const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  backLink: {
    display: 'inline-block',
    color: '#FFD700',
    textDecoration: 'none',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  title: {
    fontSize: '1.75rem',
    color: '#FFD700',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#A0A0A0',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  section: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    color: '#FFD700',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  paragraph: {
    color: '#E0E0E0',
    lineHeight: 1.7,
    fontSize: '0.9rem',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  tableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  tableLabel: {
    color: '#A0A0A0',
    fontSize: '0.85rem',
  },
  tableValue: {
    color: '#FFFFFF',
    fontSize: '0.85rem',
    fontWeight: 500,
    textAlign: 'right',
    maxWidth: '60%',
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#666',
    fontSize: '0.8rem',
  },
};

// Modern UI enhancements applied via global styles.css


export default Whitepaper;

// Modern CSS Override
const style = document.createElement('style');
style.textContent = `
  .whitepaper-page { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
  .whitepaper-header { text-align: center; margin-bottom: 48px; padding-bottom: 32px; border-bottom: 1px solid var(--border-subtle); }
  .whitepaper-title { font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, #FFD700, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 16px; }
  .whitepaper-section { background: var(--gradient-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 32px; margin-bottom: 24px; }
  .whitepaper-section h2 { color: var(--color-gold); font-size: 1.5rem; margin-bottom: 16px; }
  .whitepaper-section h3 { color: var(--text-primary); font-size: 1.125rem; margin: 24px 0 12px; }
  .whitepaper-section p { color: var(--text-secondary); line-height: 1.7; margin-bottom: 12px; }
  .whitepaper-section ul { color: var(--text-secondary); padding-left: 24px; }
  .whitepaper-section li { margin-bottom: 8px; }
  .token-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .token-table th, .token-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-subtle); }
  .token-table th { color: var(--color-gold); font-weight: 600; }
  .token-table td { color: var(--text-secondary); }
`;
if (document.head) document.head.appendChild(style);
