import React, { useState } from 'react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: '基础',
      questions: [
        {
          q: '什么是 TykhePot？',
          a: 'TykhePot 是基于 Solana 区块链的公平透明娱乐协议。Tykhe（堤喀）是古希腊幸运女神，我们的协议通过链上可验证的随机数，让命运由代码裁决。我们提供双奖池抽奖、质押收益、空投等多种玩法。'
        },
        {
          q: '如何参与 TykhePot？',
          a: '1. 安装 Phantom 或 Solflare 钱包\n2. 获取 TPOT 代币\n3. 连接钱包到 TykhePot\n4. 选择小时池或天池参与\n5. 等待开奖，奖金自动到账'
        },
        {
          q: 'TPOT 是什么代币？',
          a: 'TPOT 是 TykhePot 的平台代币，总量 10 亿枚，9 位小数。它是 SPL 标准代币，可以在 Solana 生态中自由流通。TPOT 具有通缩特性（每笔交易 3% 销毁）。'
        },
      ]
    },
    {
      category: '游戏',
      questions: [
        {
          q: '小时池和天池有什么区别？',
          a: '小时池：每小时开奖一次，最低投入 200 TPOT，无推广奖励，适合快节奏游戏。\n\n天池：每天 0:00 开奖，最低投入 100 TPOT，有 8% 推广奖励，储备 1:1 配比，奖池更大。'
        },
        {
          q: '奖金是如何分配的？',
          a: '每 100 TPOT 投入：\n• 3% 销毁（通缩）\n• 2% 平台运营\n• 95% 进入奖池\n\n奖池分配：\n• 头奖 30%（1人）\n• 二等奖 20%（2人）\n• 三等奖 15%（3人）\n• 幸运奖 10%（5人）\n• 普惠奖 20%（所有未中大奖者）\n• 回流 5%（下期奖池）'
        },
        {
          q: '普惠奖是什么？',
          a: '普惠奖是分配给所有未中头/二/三/幸运奖的用户。按投入数量比例分配，即使没有中大奖也能获得奖励，保证参与就有回报。'
        },
        {
          q: '大奖如何释放？',
          a: '头奖、二等奖、三等奖、幸运奖都需 20 天线性释放，每天释放 5%。普惠奖和回流立即到账。这种设计保证了项目的可持续性。'
        },
      ]
    },
    {
      category: '质押',
      questions: [
        {
          q: '如何参与质押？',
          a: '我们提供两档质押：\n\n短期质押（30天）：年化 8%，适合短期理财\n长期质押（180天）：年化 48%，适合长期持有者\n\n到期后自动连本带息到账。提前赎回可返还本金，但无收益。'
        },
        {
          q: '质押收益如何计算？',
          a: '收益 = 本金 × 年化率 × 天数 / 365\n\n例如：质押 10,000 TPOT，180天，48% 年化\n收益 = 10,000 × 48% × 180 / 365 = 2,367 TPOT'
        },
      ]
    },
    {
      category: '空投',
      questions: [
        {
          q: '如何领取空投？',
          a: '每个地址可免费领取 1,000 TPOT 空投，先到先得，总量 2 亿 TPOT（20 万人）。\n\n注意：空投代币是锁定的，只能用于参与游戏。通过游戏获得的利润可以自由流通。'
        },
        {
          q: '空投代币如何使用？',
          a: '空投代币只能参与小时池或天池游戏，不能直接转账或交易。\n\n例如：您领 1,000 TPOT 空投，投入天池，中奖获得 500 TPOT 利润，这 500 TPOT 可以自由使用，但原本的 1,000 TPOT 继续锁定或消耗在游戏里。'
        },
      ]
    },
    {
      category: '推广',
      questions: [
        {
          q: '推广奖励是多少？',
          a: '推广奖励为 8%，仅天池投入触发。\n\n例如：您邀请的好友投入 1,000 TPOT 到天池，您立即获得 80 TPOT 奖励。推广奖励池耗尽后停止。'
        },
        {
          q: '如何获得推广链接？',
          a: '连接钱包后，在"推广"页面可以看到您的专属推广链接。分享给好友，他们通过链接参与天池游戏，您就能获得奖励。'
        },
      ]
    },
    {
      category: '安全',
      questions: [
        {
          q: 'TykhePot 安全吗？',
          a: '我们采取了多重安全措施：\n\n1. 智能合约开源，可供审查\n2. 使用 VRF 可验证随机数\n3. 计划通过第三方安全审计\n4. 设置 Bug Bounty 计划\n5. 多签管理重要权限\n\n但请注意，所有投资都有风险，请勿投入无法承受损失的资金。'
        },
        {
          q: '如何保护我的资产？',
          a: '1. 使用硬件钱包（Ledger/Trezor）\n2. 妥善保管助记词，不要截图或保存在网上\n3. 确认交易信息后再签名\n4. 不要点击可疑链接\n5. 开启钱包的所有安全功能'
        },
      ]
    },
    {
      category: '其他',
      questions: [
        {
          q: '哪些地区不能使用？',
          a: '受当地法律法规限制，以下地区用户不能使用 TykhePot：\n\n• 美国\n• 中国大陆\n• 朝鲜\n• 伊朗\n• 叙利亚\n• 其他受制裁地区\n\n请遵守当地法律法规。'
        },
        {
          q: '遇到问题如何联系？',
          a: '您可以通过以下方式联系我们：\n\n• Telegram: t.me/tykhepot\n• Discord: discord.gg/tykhepot\n• Twitter: @PotTykhe34951\n• Email: guo5feng5@gmail.com\n\n我们通常在 24 小时内回复。'
        },
      ]
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>❓ {t('frequentlyAskedQuestions')}</h1>
        <p style={styles.subtitle}>关于 TykhePot 的一切</p>
      </div>

      {faqs.map((category, catIndex) => (
        <div key={catIndex} style={styles.category}>
          <h2 style={styles.categoryTitle}>{category.category}</h2>
          {category.questions.map((item, index) => {
            const globalIndex = `${catIndex}-${index}`;
            const isOpen = openIndex === globalIndex;
            
            return (
              <div 
                key={globalIndex} 
                style={{
                  ...styles.questionContainer,
                  borderColor: isOpen ? '#FFD700' : 'rgba(255, 215, 0, 0.2)',
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                  style={styles.question}
                >
                  <span>{item.q}</span>
                  <span style={{...styles.arrow, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div style={styles.answer}>
                    {item.a.split('\n').map((line, i) => (
                      <p key={i} style={styles.answerLine}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div style={styles.moreHelp}>
        <h3>还有其他问题？</h3>
        <p>{t('joinCommunity')}</p>
        <div style={styles.socialLinks}>
          <a href="https://t.me/tykhepot" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
            💬 Telegram
          </a>
          <a href="https://discord.gg/tykhepot" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
            🎮 Discord
          </a>
          <a href="https://twitter.com/PotTykhe34951" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
            🐦 Twitter
          </a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 24px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
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
  category: {
    marginBottom: '32px',
  },
  categoryTitle: {
    fontSize: '24px',
    color: '#FFD700',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '2px solid rgba(255, 215, 0, 0.3)',
  },
  questionContainer: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    overflow: 'hidden',
  },
  question: {
    width: '100%',
    padding: '20px',
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '16px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrow: {
    color: '#FFD700',
    transition: 'transform 0.3s',
  },
  answer: {
    padding: '0 20px 20px',
    color: '#A0A0A0',
    lineHeight: 1.8,
  },
  answerLine: {
    margin: '8px 0',
  },
  moreHelp: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    marginTop: '40px',
  },
  socialLinks: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '16px',
    flexWrap: 'wrap',
  },
  socialLink: {
    padding: '12px 24px',
    background: 'rgba(255, 215, 0, 0.1)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '8px',
    color: '#FFD700',
    textDecoration: 'none',
    transition: 'all 0.3s',
  },
};

export default FAQ;
