import React, { useState, useEffect } from 'react';

const RiskDisclaimer = ({ onAccept, onDecline }) => {
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

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>⚠️ 风险提示</h2>
        
        <div style={styles.content}>
          <p style={styles.warning}>
            <strong>使用 TykhePot 涉及高风险，您可能损失全部投入资金。</strong>
          </p>
          
          <div style={styles.risks}>
            <h3>主要风险包括：</h3>
            <ul>
              <li>加密货币价格极端波动</li>
              <li>智能合约可能存在漏洞</li>
              <li>游戏结果完全随机，无保证收益</li>
              <li>项目可能停止运营</li>
              <li>监管政策可能突然变化</li>
            </ul>
          </div>

          {readMore && (
            <div style={styles.moreContent}>
              <h3>重要声明：</h3>
              <ul>
                <li>TykhePot 仅供娱乐，不构成投资建议</li>
                <li>请勿投入无法承受损失的资金</li>
                <li>请遵守当地法律法规</li>
                <li>18岁以下禁止参与</li>
                <li>美国、中国大陆等地区用户禁止使用</li>
              </ul>
              <p style={styles.legal}>
                完整条款请参阅 <a href="/terms" target="_blank">用户协议</a>、
                <a href="/privacy" target="_blank">隐私政策</a> 和 
                <a href="/risk" target="_blank">风险披露</a>
              </p>
            </div>
          )}

          <button 
            onClick={() => setReadMore(!readMore)}
            style={styles.readMoreBtn}
          >
            {readMore ? '收起' : '阅读更多'}
          </button>

          <div style={styles.checkbox}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                我已阅读并理解所有风险，自愿承担可能的损失
              </span>
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
            我已了解风险，继续使用
          </button>
          <button onClick={onDecline} style={styles.declineBtn}>
            我不同意，退出
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
  },
  modal: {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '2px solid #ff4444',
  },
  title: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '24px',
  },
  content: {
    color: '#fff',
    lineHeight: 1.6,
  },
  warning: {
    background: 'rgba(255, 68, 68, 0.2)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #ff4444',
    marginBottom: '20px',
  },
  risks: {
    marginBottom: '20px',
  },
  moreContent: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  legal: {
    fontSize: '14px',
    color: '#aaa',
  },
  readMoreBtn: {
    background: 'transparent',
    border: '1px solid #666',
    color: '#aaa',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  checkbox: {
    marginBottom: '24px',
  },
  label: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  acceptBtn: {
    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
    color: '#000',
    border: 'none',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  declineBtn: {
    background: 'transparent',
    color: '#aaa',
    border: '1px solid #666',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default RiskDisclaimer;
