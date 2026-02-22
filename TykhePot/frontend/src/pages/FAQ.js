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
        ? 'Connect your Solana wallet, ensure you have TPOT tokens, and deposit into either the Hourly Pool or Daily Pool to participate.'
        : '连接您的 Solana 钱包，确保您有 TPOT 代币，然后存入小时池或天池即可参与。',
    },
    {
      q: language === 'en' ? 'Is it safe?' : '安全吗?',
      a: language === 'en'
        ? 'Yes! The contract has passed security audits, includes emergency pause functionality, anti-whale measures, and anti-flash loan protections.'
        : '是的！合约已通过安全审计，包含紧急暂停功能、防鲸鱼措施和防闪电贷保护。',
    },
    {
      q: language === 'en' ? 'What are the prize tiers?' : '奖金等级是什么?',
      a: language === 'en'
        ? '1st Prize (30%), 2nd Prize (20%), 3rd Prize (15%), Lucky Prize (10%), Universal Prize (20%), and 5% rolls over to next round.'
        : '头奖(30%)、二等奖(20%)、三等奖(15%)、幸运奖(10%)、普惠奖(20%)，5%回流到下期。',
    },
    {
      q: language === 'en' ? 'How is the referral reward calculated?' : '推广奖励如何计算?',
      a: language === 'en'
        ? 'Referrers earn 8% of the deposit amount when their invitees participate in the Daily Pool. This is paid from the referral reward pool.'
        : '邀请人可获得被邀请人天池投入的 8% 作为奖励，从推广奖励池中支付。',
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
