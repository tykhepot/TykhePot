import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

const RiskDisclaimer = ({ onAccept, onDecline }) => {
  const { t, language } = useTranslation();
  const [accepted, setAccepted] = useState(false);
  const [readMore, setReadMore] = useState(false);

  // 检查本地存储是否已接受
  useEffect(() => {
    const hasAccepted = localStorage.getItem('tykhepot_risk_accepted');
    if (hasAccepted === 'true') {
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    localStorage.setItem('tykhepot_risk_accepted', 'true');
    localStorage.setItem('tykhepot_risk_accepted_time', new Date().toISOString());
    onAccept();
  };

  const content = {
    en: {
      title: '⚠️ Risk Warning',
      warning: 'Using TykhePot involves high risk. You may lose all your funds.',
      risksTitle: 'Main Risks Include:',
      risks: [
        'Extreme cryptocurrency price volatility',
        'Smart contract vulnerabilities possible',
        'Game results are completely random, no guaranteed returns',
        'Project may cease operations',
        'Regulatory policies may change suddenly'
      ],
      readMore: 'Read More',
      showLess: 'Show Less',
      checkbox: 'I have read and understand all risks, and voluntarily assume possible losses',
      accept: 'I understand, continue',
      decline: 'I disagree, exit',
      moreTitle: 'Important Notice:',
      more: [
        'TykhePot is for entertainment only, not investment advice',
        'Do not invest funds you cannot afford to lose',
        'Please comply with local laws and regulations',
        'Users under 18 are prohibited',
        'Users from USA, China mainland and other restricted areas are prohibited'
      ],
      legal: 'For full terms, see User Agreement, Privacy Policy and Risk Disclosure'
    },
    zh: {
      title: '⚠️ 风险提示',
      warning: '使用 TykhePot 涉及高风险，您可能损失全部投入资金。',
      risksTitle: '主要风险包括：',
      risks: [
        '加密货币价格极端波动',
        '智能合约可能存在漏洞',
        '游戏结果完全随机，无保证收益',
        '项目可能停止运营',
        '监管政策可能突然变化'
      ],
      readMore: '阅读更多',
      showLess: '收起',
      checkbox: '我已阅读并理解所有风险，自愿承担可能的损失',
      accept: '我已了解风险，继续使用',
      decline: '我不同意，退出',
      moreTitle: '重要声明：',
      more: [
        'TykhePot 仅供娱乐，不构成投资建议',
        '请勿投入无法承受损失的资金',
        '请遵守当地法律法规',
        '18岁以下禁止参与',
        '美国、中国大陆等地区用户禁止使用'
      ],
      legal: '完整条款请参阅用户协议、隐私政策和风险披露'
    }
  };

  const c = content[language] || content.en;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{c.title}</h2>
        
        <div style={styles.content}>
          <p style={styles.warning}>
            <strong>{c.warning}</strong>
          </p>
          
          <div style={styles.risks}>
            <h3>{c.risksTitle}</h3>
            <ul>
              {c.risks.map((risk, index) => (
                <li key={index}>{risk}</li>
              ))}
            </ul>
          </div>

          {readMore && (
            <div style={styles.moreContent}>
              <h3>{c.moreTitle}</h3>
              <ul>
                {c.more.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p style={styles.legal}>{c.legal}</p>
            </div>
          )}

          <button 
            onClick={() => setReadMore(!readMore)}
            style={styles.readMoreBtn}
          >
            {readMore ? c.showLess : c.readMore}
          </button>

          <div style={styles.checkbox}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>{c.checkbox}</span>
            </label>
          </div>
        </div>

        <div style={styles.buttons}>
          <button
            onClick={handleAccept}
            disabled={!accepted}
            style={{
              ...styles.acceptBtn,
              opacity: accepted ? 1 : 0.5,
            }}
          >
            {c.accept}
          </button>
          <button onClick={onDecline} style={styles.declineBtn}>
            {c.decline}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '1.5rem',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '2px solid #ff4444',
  },
  title: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: '1.5rem',
    fontSize: '1.25rem',
  },
  content: {
    color: '#fff',
    lineHeight: 1.6,
  },
  warning: {
    background: 'rgba(255, 68, 68, 0.2)',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #ff4444',
    marginBottom: '1.25rem',
    fontSize: '0.9rem',
  },
  risks: {
    marginBottom: '1.25rem',
  },
  moreContent: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  legal: {
    fontSize: '0.8rem',
    color: '#aaa',
    marginTop: '0.75rem',
  },
  readMoreBtn: {
    background: 'transparent',
    border: '1px solid #666',
    color: '#aaa',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1.25rem',
    fontSize: '0.85rem',
    width: '100%',
  },
  checkbox: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    lineHeight: 1.4,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  acceptBtn: {
    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
    color: '#000',
    border: 'none',
    padding: '1rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
  },
  declineBtn: {
    background: 'transparent',
    color: '#aaa',
    border: '1px solid #666',
    padding: '0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    width: '100%',
  },
};

export default RiskDisclaimer;
