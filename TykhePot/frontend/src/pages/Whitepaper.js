import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';

const Whitepaper = () => {
  const { t, language } = useTranslation();

  const content = {
    en: {
      title: 'TykhePot Whitepaper',
      subtitle: 'Fair & Transparent On-Chain Entertainment Protocol',
      disclaimer: 'This whitepaper is for informational purposes only. Cryptocurrency investments carry significant risk.',
      sections: [
        {
          title: '1. Executive Summary',
          content: `TykhePot is a decentralized lottery protocol built on Solana, offering fair and transparent entertainment through on-chain randomness. Named after Tykhe, the Greek goddess of fortune, we bring the excitement of lottery gaming to the blockchain era.

Our mission is to create a trustless, verifiable, and community-driven lottery system where every participant can verify the fairness of each draw. By leveraging Solana's high throughput and low fees, TykhePot provides an accessible and enjoyable gaming experience for users worldwide.`,
        },
        {
          title: '2. Tokenomics & Initial Distribution',
          heading: '2.1 Token Overview',
          items: [
            { label: 'Token Name', value: 'TPOT' },
            { label: 'Total Supply', value: '1,000,000,000 TPOT' },
            { label: 'Token Standard', value: 'SPL Token (Solana)' },
          ],
          heading: '2.2 Initial Distribution',
          items2: [
            { label: 'Initial Liquidity', value: '50,000,000 (5%)', desc: 'DEX liquidity provision, managed externally' },
            { label: 'Airdrop Pool', value: '100,000,000 (10%)', desc: '100 TPOT per wallet, one-time registration' },
            { label: 'Staking Rewards', value: '350,000,000 (35%)', desc: 'Long-term staking incentives' },
            { label: 'Pre-match Pool', value: '200,000,000 (20%)', desc: '1:1 matching for early participants' },
            { label: 'Team Allocation', value: '100,000,000 (10%)', desc: '4-year linear vesting' },
            { label: 'Referral Pool', value: '200,000,000 (20%)', desc: 'Referral rewards, exhausted when depleted' },
          ],
          content: `The initial distribution is designed to incentivize early participation, reward community growth, and ensure long-term sustainability of the protocol.

The Pre-match Pool provides 1:1 matching for user deposits, effectively doubling the prize pool for early participants. This creates strong incentive for early adoption while the pool is still full.

The Referral Pool ensures sustainable growth by rewarding users who bring new participants to the platform. Both referrers and referees receive benefits, aligning individual incentives with platform growth.`,
        },
        {
          title: '3. Pool Structure & Game Rules',
          heading: '3.1 Pool Types',
          content: `TykhePot operates two parallel lottery pools to accommodate different user preferences and risk tolerances:`,
          items: [
            { label: 'Hourly Pool', value: '', desc: 'Draws every hour. Minimum deposit: 200 TPOT. Minimum 10 players required to draw.' },
            { label: 'Daily Pool', value: '', desc: 'Draws at UTC midnight. Minimum deposit: 100 TPOT. Minimum 10 players required to draw.' },
          ],
          content2: `The dual-pool structure allows users to choose their preferred frequency and risk level. Hourly pools offer quicker results but smaller prizes, while daily pools offer larger accumulated prizes.`,
          heading: '3.2 Why 10 Players Minimum?',
          content3: `The 10-player threshold serves critical purposes:

1. **Statistical Significance**: With fewer than 10 participants, lottery odds become extremely skewed. A single large depositor could dominate the pool, defeating the purpose of a fair lottery.

2. **Prize Distribution**: The prize structure (30%/20%/15%/10%/20% across different winner tiers) requires sufficient participants to create meaningful prize differentiation.

3. **Anti-Manipulation**: A minimum threshold prevents small groups from easily manipulating outcomes through coordinated deposits.

4. **Pool Viability**: With too few players, the prize pool becomes insufficient to attract future participants, creating a death spiral.`,
          heading: '3.3 Deposit Flow',
          items3: [
            { label: 'Step 1', value: 'User deposits TPOT', desc: '100% of deposit enters the pool' },
            { label: 'Step 2', value: '3% recorded as pending burn', desc: 'Will be destroyed upon successful draw' },
            { label: 'Step 3', value: '97% enters prize pool', desc: 'Plus any 1:1 matching from Pre-match Pool' },
            { label: 'Step 4', value: 'Referral rewards recorded', desc: '8% to referrer, 2% to referee (pending until draw)' },
          ],
        },
        {
          title: '4. Prize Distribution Mechanism',
          heading: '4.1 Distribution Formula',
          content: `When a draw succeeds (≥10 players), the total prize pool is distributed as follows:`,
          items: [
            { label: 'Platform Fee', value: '2%', desc: 'Protocol sustainability' },
            { label: 'Burn', value: '3%', desc: 'Permanent token destruction' },
            { label: 'Prize Pool', value: '95%', desc: 'Distributed to winners' },
          ],
          content2: `The 3% burn creates deflationary pressure, potentially increasing token value for all holders. The 2% platform fee ensures long-term protocol sustainability.`,
          heading: '4.2 Winner Tiers',
          items2: [
            { label: '1st Prize', value: '30%', desc: '1 winner - The Grand Jackpot' },
            { label: '2nd Prize', value: '20%', desc: '2 winners - Second tier rewards' },
            { label: '3rd Prize', value: '15%', desc: '3 winners - Third tier rewards' },
            { label: 'Lucky Prize', value: '10%', desc: '5 winners - Random lucky participants' },
            { label: 'Universal Prize', value: '20%', desc: 'All participants - Everyone wins something' },
            { label: 'Roll Over', value: '5%', desc: 'Carries to next round - Jackpot grows' },
          ],
          heading: '4.3 Why This Distribution?',
          content3: `The prize structure is carefully designed:

1. **Jackpot Excitement (30%)**: The large first prize creates life-changing winning opportunities, generating excitement and media attention.

2. **Multiple Winner Tiers (20%+15%+10%)**: Multiple prize tiers ensure many players win something, maintaining engagement even if they don't hit the jackpot.

3. **Universal Prize (20%)**: Every participant receives something, ensuring no one leaves empty-handed. This "thank you for playing" creates positive user sentiment.

4. **Roll Over (5%)**: The carryover creates progressive jackpots that grow over time, increasing excitement and attracting more participants.`,
          heading: '4.4 Failed Draw ( <10 Players)',
          content4: `When fewer than 10 players participate:

1. **Deposits Return**: All deposits return to the reserve pool
2. **Referral Rewards**: Unclaimed referral rewards return to the referral pool
3. **No Burn**: The pending 3% burn is cancelled
4. **Next Round**: Pool starts fresh with remaining funds

This mechanism protects users when participation is low while ensuring the protocol remains sustainable.`,
        },
        {
          title: '5. Referral System',
          heading: '5.1 How It Works',
          content: `The referral system incentivizes community growth by rewarding both parties:`,
          items: [
            { label: 'Referrer Reward', value: '8%', desc: 'Of referee\'s deposit, paid from referral pool upon successful draw' },
            { label: 'Referee Bonus', value: '2% (one-time)', desc: 'On first deposit only, lifetime limit per wallet' },
          ],
          heading: '5.2 Why Pending Until Draw?',
          content2: `Referral rewards are held pending and only distributed when a draw succeeds:

1. **Protection Against Failed Draws**: If a draw fails (<10 players), deposits return to users. By the same logic, referral rewards should not be paid.

2. **Pool Integrity**: Referral rewards come from the referral pool (20% of total supply). Holding them pending ensures they're only used when the pool actually pays out.

3. **Fairness**: Both the referrer's reward and referee's bonus depend on the pool succeeding. If users get their deposits back, referral rewards should too.

4. **Economic Security**: This mechanism prevents draining the referral pool on failed rounds, ensuring long-term sustainability.`,
          heading: '5.3 Free Bet Referral',
          content3: `Even free bet participants can earn referral rewards:
- Free bet (100 TPOT) generates 8 TPOT for the referrer
- Free bet users receive 2% bonus (2 TPOT) on their first free bet
- This ensures strong referral incentives regardless of deposit amount`,
        },
        {
          title: '6. Airdrop & Free Bet System',
          heading: '6.1 Registration-Based Airdrop',
          content: `Instead of directly distributing tokens, TykhePot uses a registration-based system:`,
          items: [
            { label: 'Step 1', value: 'User registers wallet', desc: 'Click "Register" to record wallet on-chain' },
            { label: 'Step 2', value: 'Receive qualification', desc: 'Wallet marked as eligible for free bet' },
            { label: 'Step 3', value: 'Use Free Bet', desc: 'In Daily Pool, check "Free Bet" to play with 100 TPOT' },
          ],
          heading: '6.2 Why This Design?',
          content2: `The registration-based approach has several advantages:

1. **No Token Transfer**: Users don't receive transferable tokens, eliminating dump pressure on the token price.

2. **Engagement First**: Users must engage with the platform before receiving value, building habit and understanding of the protocol.

3. **1:1 Matching**: Free bets receive 1:1 matching from the Pre-match Pool, meaning 100 TPOT deposit = 200 TPOT in the pool.

4. **Referral Compatible**: Even free bet users can earn referral rewards for their referrers, maintaining growth incentives.`,
          heading: '6.3 One-Time Limit',
          content3: `Each wallet can:
- Register once (one-time eligibility)
- Use free bet once (cannot be reused)
- Receive 2% referee bonus once (lifetime)

This prevents abuse while giving every legitimate user a chance to experience the platform.`,
        },
        {
          title: '7. Security & Safety Features',
          heading: '7.1 Protocol Safeguards',
          items: [
            { label: 'Emergency Pause', value: 'Admin can pause deposits during emergencies' },
            { label: 'Maximum Deposit', value: '1,000,000 TPOT per transaction' },
            { label: 'Minimum Deposit', value: '200 TPOT (Hourly) / 100 TPOT (Daily)' },
            { label: 'Time Lock', value: '60-second window between operations' },
            { label: 'On-Chain Verification', value: 'All results verifiable on Solana blockchain' },
          ],
          heading: '7.2 Random Number Generation',
          content2: `TykhePot uses multiple sources for random number generation:

1. **Primary**: Switchboard VRF (Verifiable Random Function) - Provides cryptographically secure randomness
2. **Fallback**: Timestamp-based seed - Uses block timestamp combined with ticket numbers

The VRF integration ensures provably fair draws that can be verified by anyone.`,
          heading: '7.3 Team Token Vesting',
          content3: `Team allocations are locked for 4 years with linear vesting:
- Tokens remain locked until unlock date
- Gradual release over 48 months
- Aligns team incentives with long-term project success

This prevents team members from dumping tokens early, protecting community interests.`,
        },
        {
          title: '8. Technical Architecture',
          heading: '8.1 Blockchain',
          content: `Built on Solana for:
- High throughput (65,000 TPS)
- Low transaction costs (~$0.001 per transaction)
- Fast finality (<1 second)

This ensures smooth user experience even during high traffic periods.`,
          heading: '8.2 Smart Contract',
          content2: `The TykhePot contract features:
- Anchor framework for secure development
- Comprehensive error handling
- Upgradeable fee structures
- Multi-signature support for admin functions`,
          heading: '8.3 Frontend',
          content3: `The web interface provides:
- Multiple wallet support (Phantom, Solflare)
- Real-time pool statistics
- Multi-language support (English, Chinese)
- Responsive mobile design`,
        },
        {
          title: '9. Roadmap',
          items: [
            { label: 'Phase 1', value: 'Devnet Launch', desc: 'Contract deployment and testing on Solana devnet' },
            { label: 'Phase 2', value: 'Testnet & Audit', desc: 'Security audit and bug bounty program' },
            { label: 'Phase 3', value: 'Mainnet Launch', desc: 'Public launch with token distribution' },
            { label: 'Phase 4', value: 'VRF Integration', desc: 'Switchboard VRF integration for provably fair draws' },
            { label: 'Phase 5', value: 'Ecosystem Growth', desc: 'Staking, governance, and cross-chain expansion' },
          ],
        },
        {
          title: '10. Risk Disclosure',
          content: `1. **Market Risk**: Cryptocurrency prices are highly volatile. TPOT may lose significant value.

2. **Regulatory Risk**: Cryptocurrency regulations vary by jurisdiction and may change unexpectedly.

3. **Technical Risk**: Smart contracts may contain vulnerabilities despite audits.

4. **Liquidity Risk**: Low trading volume may make it difficult to buy or sell TPOT.

5. **Gambling Risk**: Lottery participation involves financial risk. Only play with what you can afford to lose.

6. **Platform Risk**: Despite security measures, no platform is completely immune to attacks.

Please carefully consider your financial situation and risk tolerance before participating.`,
        }
      ]
    },
    zh: {
      title: 'TykhePot 白皮书',
      subtitle: '公平透明的链上娱乐协议',
      disclaimer: '本白皮书仅供信息参考。加密货币投资存在重大风险。',
      sections: [
        {
          title: '1. 执行摘要',
          content: `TykhePot 是建立在 Solana 网络上的去中心化彩票协议，通过链上随机数实现公平透明的娱乐体验。以希腊幸运女神堤喀(Tykhe)命名，我们将彩票游戏的乐趣带入区块链时代。

我们的使命是创建一个无需信任、可验证、由社区驱动的彩票系统，每位参与者都可以验证每次开奖的公平性。借助 Solana 的高吞吐量和低手续费，TykhePot 为全球用户提供便捷愉快的游戏体验。`,
        },
        {
          title: '2. 代币经济学与初始分配',
          heading: '2.1 代币概览',
          items: [
            { label: '代币名称', value: 'TPOT' },
            { label: '总供应量', value: '1,000,000,000 TPOT' },
            { label: '代币标准', value: 'SPL Token (Solana)' },
          ],
          heading: '2.2 初始分配',
          items2: [
            { label: '初始流动性', value: '50,000,000 (5%)', desc: 'DEX流动性，合约外管理' },
            { label: '空投池', value: '100,000,000 (10%)', desc: '每个钱包100 TPOT，一次性注册' },
            { label: '质押奖励池', value: '350,000,000 (35%)', desc: '长期质押激励' },
            { label: '前期奖池配额', value: '200,000,000 (20%)', desc: '1:1配捐给早期参与者' },
            { label: '团队分配', value: '100,000,000 (10%)', desc: '4年线性解锁' },
            { label: '推广奖励池', value: '200,000,000 (20%)', desc: '推荐奖励，耗完即止' },
          ],
          content: `初始分配旨在激励早期参与、奖励社区增长并确保协议的长期可持续性。

前期奖池配额为用户存款提供1:1配捐，有效为早期参与者翻倍奖池金额。这在奖池充足时创造了强烈的早期采用动力。

推广奖励池通过奖励带来新参与者的用户来确保可持续增长。推荐人和被推荐人都能获得收益，使个人激励与平台增长保持一致。`,
        },
        {
          title: '3. 奖池结构与游戏规则',
          heading: '3.1 奖池类型',
          content: `TykhePot 运营两个平行彩票池以满足不同用户的偏好和风险承受能力:`,
          items: [
            { label: '小时池', value: '', desc: '每小时开奖。最低投入：200 TPOT。最少10人参与开奖。' },
            { label: '天池', value: '', desc: 'UTC午夜开奖。最低投入：100 TPOT。最少10人参与开奖。' },
          ],
          content2: `双奖池结构允许用户选择偏好的频率和风险等级。小时池提供更快的结果但奖金较小，而天池提供更大累积奖金。`,
          heading: '3.2 为什么设定10人门槛？',
          content3: `10人门槛具有关键作用:

1. **统计显著性**: 参与者少于10人时，中奖概率会极度偏斜。单个大额存款者可能会主导奖池，违背公平彩票的初衷。

2. **奖金分配**: 奖金结构（30%/20%/15%/10%/20%分布在不同获奖层级）需要足够多的参与者才能产生有意义的奖金差异。

3. **防操纵**: 最低门槛防止小团体通过协调存款轻易操纵结果。

4. **奖池可行性**: 参与者太少会导致奖池不足以吸引未来参与者，形成死亡螺旋。`,
          heading: '3.3 存款流程',
          items3: [
            { label: '步骤1', value: '用户存入TPOT', desc: '100%存款进入奖池' },
            { label: '步骤2', value: '3%记录为待销毁', desc: '开奖成功后将被销毁' },
            { label: '步骤3', value: '97%进入奖池', desc: '加上前期奖池配额的1:1配捐' },
            { label: '步骤4', value: '记录推荐奖励', desc: '推荐人8%，被推荐人2%（pending，开奖后发放）' },
          ],
        },
        {
          title: '4. 奖金分配机制',
          heading: '4.1 分配公式',
          content: `当开奖成功（≥10人）时，总奖池分配如下:`,
          items: [
            { label: '平台费', value: '2%', desc: '协议可持续性' },
            { label: '销毁', value: '3%', desc: '永久代币销毁' },
            { label: '奖池', value: '95%', desc: '分配给中奖者' },
          ],
          content2: `3%销毁创造通缩压力，可能提升所有持币者的代币价值。2%平台费确保协议长期可持续。`,
          heading: '4.2 获奖层级',
          items2: [
            { label: '头奖', value: '30%', desc: '1人 - 超级大奖' },
            { label: '二等奖', value: '20%', desc: '2人 - 二级奖励' },
            { label: '三等奖', value: '15%', desc: '3人 - 三级奖励' },
            { label: '幸运奖', value: '10%', desc: '5人 - 随机幸运参与者' },
            { label: '普惠奖', value: '20%', desc: '所有参与者 - 人人有奖' },
            { label: '滚存', value: '5%', desc: '转入下一期 - 奖池累积' },
          ],
          heading: '4.3 为何如此设计？',
          content3: `奖金结构经过精心设计:

1. **大奖惊喜(30%)**: 丰厚的头奖创造改变人生的中奖机会，产生兴奋感和媒体关注。

2. **多层级获奖(20%+15%+10%)**: 多个奖项层级确保许多玩家都能有所斩获，即使未中头奖也能保持参与度。

3. **普惠奖(20%)**: 每位参与者都能获得奖励，确保无人空手而归。这种"感谢参与"创造积极的用户情绪。

4. **滚存(5%)**: 累计创造持续增长的头奖，增加吸引力并吸引更多参与者。`,
          heading: '4.4 开奖失败（<10人）',
          content4: `当参与者少于10人时:

1. **存款返还**: 所有存款返回储备池
2. **推荐奖励**: 未发放的推荐奖励返回推荐池
3. **不销毁**: 待销毁的3%取消
4. **下一期**: 奖池从剩余资金重新开始

此机制在参与度低时保护用户，同时确保协议保持可持续性。`,
        },
        {
          title: '5. 推荐系统',
          heading: '5.1 工作原理',
          content: `推荐系统通过奖励双方来激励社区增长:`,
          items: [
            { label: '推荐人奖励', value: '8%', desc: '被推荐人存款的8%，开奖成功后从推荐池发放' },
            { label: '被推荐人奖励', value: '2%（一次性）', desc: '首次存款时，终身每人一次' },
          ],
          heading: '5.2 为何pending直到开奖？',
          content2: `推荐奖励暂时持有，仅在开奖成功时发放:

1. **保护开奖失败**: 如果开奖失败（<10人），存款返还给用户。同理，推荐奖励也不应发放。

2. **奖池完整性**: 推荐奖励来自推荐池（总供应量的20%）。持有pending确保仅在奖池实际派发时才被使用。

3. **公平性**: 推荐人的奖励和被推荐人的奖金都取决于奖池是否成功。如果用户获得存款退回，推荐奖励也应退回。

4. **经济安全**: 此机制防止在失败轮次耗尽推荐池，确保长期可持续性。`,
          heading: '5.3 免费投注推荐',
          content3: `即使免费投注参与者也能获得推荐奖励:
- 免费投注（100 TPOT）为推荐人产生 8 TPOT
- 免费投注用户在首次免费投注时获得 2% 奖金（2 TPOT）
- 这确保无论存款金额如何，都有强劲的推荐激励`,
        },
        {
          title: '6. 空投与免费投注系统',
          heading: '6.1 注册制空投',
          content: `TykhePot 采用基于注册的系统，而非直接分发代币:`,
          items: [
            { label: '步骤1', value: '用户注册钱包', desc: '点击"注册"将钱包记录到链上' },
            { label: '步骤2', value: '获得资格', desc: '钱包标记为符合免费投注条件' },
            { label: '步骤3', value: '使用免费投注', desc: '在天池勾选"免费投注"用100 TPOT参与' },
          ],
          heading: '6.2 为何如此设计？',
          content2: `基于注册的方式有几个优势:

1. **无代币转移**: 用户不获得可转移代币，消除了代币价格的下行压力。

2. **先参与后获益**: 用户需在获得价值前与平台互动，培养使用习惯并了解协议。

3. **1:1配捐**: 免费投注从前期奖池配额获得1:1配捐，意味着100 TPOT存款 = 奖池200 TPOT。

4. **兼容推荐**: 即使免费投注用户也能为推荐人获得推荐奖励，保持增长激励。`,
          heading: '6.3 一次性限制',
          content3: `每个钱包可以:
- 注册一次（一次性资格）
- 使用免费投注一次（不可重复）
- 获得被推荐人奖励一次（终身）

这防止滥用，同时让每个合法用户都有机会体验平台。`,
        },
        {
          title: '7. 安全与保护功能',
          heading: '7.1 协议保障',
          items: [
            { label: '紧急暂停', value: '管理员可在紧急情况下暂停存款' },
            { label: '最大存款', value: '每笔交易1,000,000 TPOT' },
            { label: '最低存款', value: '200 TPOT（小时池）/ 100 TPOT（天池）' },
            { label: '时间锁', value: '操作间隔60秒窗口' },
            { label: '链上验证', value: '所有结果可在Solana区块链上验证' },
          ],
          heading: '7.2 随机数生成',
          content2: `TykhePot 使用多个随机数来源:

1. **首选**: Switchboard VRF（可验证随机函数）- 提供加密安全的随机性
2. **备选**: 基于时间戳的种子 - 使用区块时间戳结合票号

VRF集成确保可证明公平的开奖，任何人都可以验证。`,
          heading: '7.3 团队代币解锁',
          content3: `团队分配锁定4年，线性解锁:
- 代币保持锁定直到解锁日期
- 48个月内逐步释放
- 使团队激励与长期项目成功保持一致

这防止团队成员提前抛售代币，保护社区利益。`,
        },
        {
          title: '8. 技术架构',
          heading: '8.1 区块链',
          content: `建立在Solana网络上，因为:
- 高吞吐量（65,000 TPS）
- 低交易成本（每笔交易约$0.001）
- 快速最终确定性（<1秒）

这确保即使在高峰期也能提供流畅的用户体验。`,
          heading: '8.2 智能合约',
          content2: `TykhePot合约特点:
- Anchor框架确保安全开发
- 全面的错误处理
- 可升级的费用结构
- 多签支持管理功能`,
          heading: '8.3 前端',
          content3: `网页界面提供:
- 多钱包支持（Phantom, Solflare）
- 实时奖池统计
- 多语言支持（英文、中文）
- 响应式移动端设计`,
        },
        {
          title: '9. 路线图',
          items: [
            { label: '第一阶段', value: 'Devnet上线', desc: '合约部署与Solana devnet测试' },
            { label: '第二阶段', value: '测试网与审计', desc: '安全审计和漏洞赏金计划' },
            { label: '第三阶段', value: '主网上线', desc: '公开上线与代币分发' },
            { label: '第四阶段', value: 'VRF集成', desc: 'Switchboard VRF集成，实现可证明公平开奖' },
            { label: '第五阶段', value: '生态增长', desc: '质押、治理与跨链扩展' },
          ],
        },
        {
          title: '10. 风险披露',
          content: `1. **市场风险**: 加密货币价格高度波动。TPOT可能大幅贬值。

2. **监管风险**: 各国对加密货币的监管不同，可能随时变化。

3. **技术风险**: 尽管经过审计，智能合约可能存在漏洞。

4. **流动性风险**: 低交易量可能导致买卖TPOT困难。

5. **赌博风险**: 彩票参与涉及财务风险。仅用可承受损失的资金参与。

6. **平台风险**: 尽管有安全措施，没有任何平台能完全免疫攻击。

参与前请仔细考虑您的财务状况和风险承受能力。`,
        }
      ]
    }
  };

  const c = content[language] || content.en;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/" style={styles.backLink}>← {language === 'en' ? 'Back' : '返回'}</Link>
        <h1 style={styles.title}>{c.title}</h1>
        <p style={styles.subtitle}>{c.subtitle}</p>
        <p style={styles.disclaimer}>{c.disclaimer}</p>
      </div>

      <div style={styles.content}>
        {c.sections.map((section, index) => (
          <div key={index} style={styles.section}>
            <h2 style={styles.sectionTitle}>{section.title}</h2>
            
            {section.heading && (
              <h3 style={styles.heading}>{section.heading}</h3>
            )}
            
            {section.content && (
              <p style={styles.paragraph}>{section.content}</p>
            )}
            
            {section.items && (
              <div style={styles.table}>
                {section.items.map((item, i) => (
                  <div key={i} style={styles.tableRow}>
                    <span style={styles.tableLabel}>{item.label}</span>
                    <span style={styles.tableValue}>{item.value}</span>
                    {item.desc && <span style={styles.tableDesc}>{item.desc}</span>}
                  </div>
                ))}
              </div>
            )}

            {section.heading2 && (
              <h3 style={styles.heading}>{section.heading2}</h3>
            )}
            
            {section.content2 && (
              <p style={styles.paragraph}>{section.content2}</p>
            )}

            {section.items2 && (
              <div style={styles.table}>
                {section.items2.map((item, i) => (
                  <div key={i} style={styles.tableRow}>
                    <span style={styles.tableLabel}>{item.label}</span>
                    <span style={styles.tableValue}>{item.value}</span>
                    {item.desc && <span style={styles.tableDesc}>{item.desc}</span>}
                  </div>
                ))}
              </div>
            )}

            {section.heading3 && (
              <h3 style={styles.heading}>{section.heading3}</h3>
            )}
            
            {section.content3 && (
              <p style={styles.paragraph}>{section.content3}</p>
            )}

            {section.items3 && (
              <div style={styles.table}>
                {section.items3.map((item, i) => (
                  <div key={i} style={styles.tableRow}>
                    <span style={styles.tableLabel}>{item.label}</span>
                    <span style={styles.tableValue}>{item.value}</span>
                    {item.desc && <span style={styles.tableDesc}>{item.desc}</span>}
                  </div>
                ))}
              </div>
            )}

            {section.heading4 && (
              <h3 style={styles.heading}>{section.heading4}</h3>
            )}
            
            {section.content4 && (
              <p style={styles.paragraph}>{section.content4}</p>
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
  disclaimer: {
    fontSize: '0.75rem',
    color: '#FF6B6B',
    marginTop: '0.5rem',
    fontStyle: 'italic',
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
  heading: {
    fontSize: '1rem',
    color: '#FFFFFF',
    marginTop: '1rem',
    marginBottom: '0.5rem',
  },
  paragraph: {
    color: '#E0E0E0',
    lineHeight: 1.7,
    fontSize: '0.9rem',
    marginBottom: '0.75rem',
    whiteSpace: 'pre-wrap',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.75rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  tableLabel: {
    color: '#FFD700',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  tableValue: {
    color: '#FFFFFF',
    fontSize: '0.85rem',
    fontWeight: 500,
    marginTop: '0.25rem',
  },
  tableDesc: {
    color: '#A0A0A0',
    fontSize: '0.8rem',
    marginTop: '0.25rem',
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

export default Whitepaper;
