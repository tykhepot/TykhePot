import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const FAQ = () => {
  const { t, language } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: language === 'en' ? 'What is TykhePot?' : '什么是 TykhePot?',
      a: language === 'en' 
        ? 'TykhePot is a fair and transparent on-chain lottery protocol built on Solana. It uses verifiable randomness to ensure all draws are completely fair and transparent.'
        : 'TykhePot 是建立在 Solana 上的公平透明的链上彩票协议。使用可验证的随机数确保所有开奖完全公平透明。',
    },
    {
      q: language === 'en' ? 'How do I participate?' : '如何参与?',
      a: language === 'en'
        ? 'Connect your Solana wallet, ensure you have TPOT tokens, and deposit into the 30 Min Pool, Hourly Pool, or Daily Pool. Equal probability — each wallet gets one entry per deposit, regardless of amount.'
        : '连接您的 Solana 钱包，确保您有 TPOT 代币，然后存入30分钟池、小时池或天池即可参与。等概率设计——每个钱包每次存款获得一次中奖机会，与金额无关。',
    },
    {
      q: language === 'en' ? 'Is it safe?' : '安全吗?',
      a: language === 'en'
        ? 'The smart contract runs fully on-chain on Solana. All draws and fund movements are verifiable on the blockchain explorer. There are no admin keys — the protocol operates autonomously once deployed.'
        : '智能合约完全运行在 Solana 链上，所有开奖和资金流动均可在区块链浏览器上验证。无管理员密钥，协议部署后自主运行。',
    },
    {
      q: language === 'en' ? 'What are the prize tiers?' : '奖金等级是什么?',
      a: language === 'en'
        ? '11 fixed winners every draw: 🥇 1st×1 (30%) · 🥈 2nd×2 (10% each) · 🥉 3rd×3 (5% each) — all vested over 20 days. 🍀 Lucky×5 (2% each, instant). Universal prize: remaining 20% split equally among all non-winners (instant). 5% rolls over to the next round.'
        : '每期11个固定奖位：🥇 头奖×1（30%）、🥈 二等×2（各10%）、🥉 三等×3（各5%）——均20天线性归属；🍀 幸运×5（各2%，即时到账）；普惠奖：剩余20%平分给所有未中奖者（即时）；5%结转下期。',
    },
    {
      q: language === 'en' ? 'How is the referral reward calculated?' : '推广奖励如何计算?',
      a: language === 'en'
        ? 'Referrers earn 8% of the deposit amount when their invitee deposits in the Daily Pool. Rewards are paid from the referral pool after the round succeeds on-chain — not immediately at deposit time. Only Daily Pool deposits are eligible.'
        : '被推荐人在天池存款时，推荐人可获得存款额的 8% 作为奖励，从推广池中支付。奖励在该轮开奖成功后由链上自动发放（非存款时即时支付）。仅天池存款计入推广奖励。',
    },
  ];

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header-modern">
          <div className="page-badge">❓ FAQ</div>
          <h1 className="page-title-modern">{t('frequentlyAskedQuestions')}</h1>
          <p className="page-subtitle-modern">
            {language === 'en' 
              ? 'Find answers to common questions'
              : '常见问题解答'
            }
          </p>
        </div>

        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-card ${openIndex === index ? 'open' : ''}`}
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            >
              <div className="faq-question">
                <span className="faq-icon">Q</span>
                <span>{faq.q}</span>
                <span className="faq-arrow">{openIndex === index ? '−' : '+'}</span>
              </div>
              {openIndex === index && (
                <div className="faq-answer">{faq.a}</div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-cta">
          <p>
            {language === 'en' 
              ? 'Still have questions?' 
              : '还有问题?'
            }
          </p>
          <a href="https://t.me/tykhepot" className="btn btn-secondary">
            {language === 'en' ? 'Join Community' : '加入社区'}
          </a>
        </div>
      </div>

      <style>{`
        .faq-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-width: 800px;
          margin: 0 auto;
        }
        
        .faq-card {
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: all var(--transition-base);
        }
        
        .faq-card:hover {
          border-color: var(--border-default);
        }
        
        .faq-card.open {
          border-color: var(--color-gold);
        }
        
        .faq-question {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .faq-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--color-gold);
          color: var(--text-inverse);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .faq-arrow {
          margin-left: auto;
          font-size: var(--text-xl);
          color: var(--text-tertiary);
          transition: transform var(--transition-fast);
        }
        
        .faq-answer {
          padding: 0 var(--space-5) var(--space-4);
          padding-left: calc(28px + var(--space-5) + var(--space-3));
          color: var(--text-secondary);
          line-height: 1.7;
          animation: fadeIn 0.2s ease;
        }
        
        .faq-cta {
          text-align: center;
          margin-top: var(--space-12);
          padding: var(--space-8);
          background: var(--gradient-card);
          border-radius: var(--radius-xl);
        }
        
        .faq-cta p {
          color: var(--text-secondary);
          margin-bottom: var(--space-4);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FAQ;
