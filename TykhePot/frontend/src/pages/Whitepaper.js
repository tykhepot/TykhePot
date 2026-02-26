import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';

const Whitepaper = () => {
  const { t, language } = useTranslation();

  const content = {
    en: {
      title: 'TykhePot Whitepaper',
      subtitle: 'Fair & Transparent On-Chain Lottery Protocol on Solana',
      version: 'v3.0 — February 2026',
      disclaimer: 'This whitepaper is for informational purposes only. Lottery participation involves financial risk. Only participate with funds you can afford to lose.',
      sections: [
        {
          title: '1. Executive Summary',
          content: `TykhePot is a fully on-chain, decentralized lottery protocol built on Solana using the Anchor framework. Named after Tykhe — the Greek goddess of fortune — TykhePot delivers verifiable, tamper-proof prize draws through cryptographic draw seeds derived from finalized Solana blockhashes.

The protocol operates three parallel prize pools with different cadences (every 30 minutes, every hour, and daily at midnight UTC). All deposits close 5 minutes before each draw. Draws are triggered automatically by the protocol at the scheduled time — no human intervention is required.

Key design principles:
• No admin: fully decentralized — draws are executed automatically by protocol rules
• No empty prizes: every participant wins something — a universal prize is distributed to all non-prize-winners
• Equal probability: every deposit earns exactly one ticket regardless of amount
• Verifiability: draw seeds are emitted on-chain and anyone can independently verify results
• Deflationary: 3% of every successful draw is permanently burned
• Free bet: claim a one-time airdrop entry, which must be used in the Daily Pool`,
        },
        {
          title: '2. Tokenomics & Initial Distribution',
          heading: '2.1 Token Overview',
          items: [
            { label: 'Token Name', value: 'TPOT' },
            { label: 'Total Supply', value: '1,000,000,000 TPOT' },
            { label: 'Token Standard', value: 'SPL Token (Solana Program Library)' },
            { label: 'Decimals', value: '9' },
          ],
          heading2: '2.2 Initial Distribution',
          items2: [
            { label: 'Initial Liquidity', value: '50,000,000 (5%)', desc: 'Injected into decentralized exchanges (DEX) to provide on-chain trading liquidity for TPOT.' },
            { label: 'Airdrop Pool', value: '100,000,000 (10%)', desc: 'Funds the one-time free airdrop entry per wallet. When a user activates their free bet in the Daily Pool, 100 TPOT is transferred from this vault to the pool. Used until depleted.' },
            { label: 'Staking Rewards Pool', value: '350,000,000 (35%)', desc: 'Pays staking rewards to TPOT holders (Short-term 8% APR / Long-term 48% APR). Used until depleted.' },
            { label: 'Reserve Matching Pool', value: '200,000,000 (20%)', desc: 'Provides 1:1 deposit matching exclusively for Daily Pool participants while reserves last. 30-Minute and Hourly pools do not receive matching. Used until depleted.' },
            { label: 'Team Allocation', value: '100,000,000 (10%)', desc: 'For marketing, community maintenance and operations. Linear release over 4 years: Year 1 → 5%, Year 2 → 15%, Year 3 → 30%, Year 4 → 50%.' },
            { label: 'Referral Rewards Pool', value: '200,000,000 (20%)', desc: 'Funds referral rewards (8% to referrer + 2% one-time to new referee). Used until depleted.' },
          ],
        },
        {
          title: '3. Prize Pool Architecture',
          heading: '3.1 Pool Types',
          content: 'TykhePot operates three independent prize pools simultaneously:',
          items: [
            { label: '30-Minute Pool (MIN30)', value: 'Draws at :00 and :30 every hour', desc: 'Min deposit: 500 TPOT · Min participants: 12 · Deposits close 5 minutes before each draw · No reserve matching' },
            { label: 'Hourly Pool (HOURLY)', value: 'Draws at :00 every hour', desc: 'Min deposit: 200 TPOT · Min participants: 12 · Deposits close 5 minutes before each draw · No reserve matching' },
            { label: 'Daily Pool (DAILY)', value: 'Draws at 00:00 UTC every day', desc: 'Min deposit: 100 TPOT · Min participants: 12 · Deposits close at 23:55 UTC · Supports free bet entry, 8% referral rewards & 1:1 reserve matching' },
          ],
          heading2: '3.2 Round Lifecycle',
          content2: `Each round follows a fixed schedule:

1. Deposit Phase: users deposit TPOT or activate free bet (Daily Pool only); each deposit earns 1 ticket
2. Lock Time: deposits stop exactly 5 minutes before draw time
3. Draw Time: the protocol automatically triggers the draw at the scheduled time
4. Outcome A — Draw Succeeds (≥12 participants): winners selected; prizes distributed instantly or via vesting
5. Outcome B — Refund (<12 participants): regular deposits refunded in full; free-bet entries carry over to next round`,
          heading3: '3.3 Equal Probability',
          content3: `Every deposit — regardless of amount — earns exactly 1 ticket. Winner selection uses:

  winner_index = pick(draw_seed, participant_count)

A 100 TPOT deposit has the same selection probability as a 1,000,000 TPOT deposit. The deposit amount only affects your share of the prize pool if you win, not your chance of being selected.`,
        },
        {
          title: '4. Fee Structure & Prize Distribution',
          heading: '4.1 Fee Breakdown — Successful Draw',
          content: 'On every successful draw (≥12 participants), the total pool is allocated as follows:',
          items: [
            { label: 'Burn', value: '3%', desc: 'Permanently destroyed — reduces TPOT total supply. Deflationary mechanism.' },
            { label: 'Platform Fee', value: '2%', desc: 'Transferred to protocol treasury for operations and development.' },
            { label: 'Prize Pool', value: '95%', desc: 'Distributed among all participants as described below.' },
          ],
          heading2: '4.2 Prize Pool Allocation (within the 95%)',
          content2: 'The 95% prize pool is split as follows:',
          items2: [
            { label: '1st Prize', value: '30% — 1 winner', desc: 'The largest single prize. Paid via 20-day linear vesting (5% per day).' },
            { label: '2nd Prize', value: '20% — 2 winners (10% each)', desc: 'Two second-place winners. Each receives 5% per day over 20 days.' },
            { label: '3rd Prize', value: '15% — 3 winners (5% each)', desc: 'Three third-place winners. Each receives 5% per day over 20 days.' },
            { label: 'Lucky Prize', value: '10% — 5 winners (2% each)', desc: 'Five randomly selected lucky winners. Paid immediately to wallet.' },
            { label: 'Universal Prize', value: '20% — all remaining participants', desc: 'Split equally among every participant who did not win a prize above. Paid immediately. TykhePot has NO empty prizes — everyone wins something.' },
            { label: 'Rollover', value: '5% — stays in vault', desc: 'Carried over to the next round\'s prize pool, growing the jackpot.' },
          ],
          heading3: '4.3 Prize Vesting (1st, 2nd, 3rd Prizes)',
          content3: `Top prizes are not paid all at once. Instead they are distributed over 20 days:

• Day 0 (draw day): 5% of prize becomes available
• Each subsequent day: an additional 5% unlocks
• After 20 days: 100% of prize has been distributed

The distribution is fully on-chain and managed by the protocol. Winners do not need to manually claim — the protocol cron service calls the vesting instruction each day automatically. Lucky prizes and Universal prizes are paid immediately on draw day.

Example: A winner receives a 1st prize of 10,000 TPOT.
  → Day 0: 500 TPOT sent · Day 1: 500 TPOT · … · Day 19: 500 TPOT = 10,000 TPOT total`,
        },
        {
          title: '5. Refund Behavior',
          content: `When a round ends with fewer than 12 participants, the draw is cancelled:

• All regular deposits are refunded in full to each participant's token account
• Free-bet entries (funded from airdrop vault) are carried over to the next round — the free bet participant retains their slot without re-registering
• No fees are charged on refunded rounds
• The protocol immediately opens the next round with the same pool configuration

Free-bet carry-over means participants with a free bet always remain in the queue until a draw succeeds. Their 100 TPOT stays in the pool vault and counts toward the next round's prize pool.`,
        },
        {
          title: '6. Airdrop & Free Bet (Daily Pool Only)',
          heading: '6.1 How to Claim',
          content: `Any wallet can claim a one-time free bet by clicking "Claim Airdrop" on the Airdrop page. This records their address on-chain via an AirdropClaim PDA, confirming participation intent.

Important: the airdrop does not arrive directly in your wallet. Instead, it grants you one free entry into the Daily Pool.

After claiming, a "Use Free Bet" button appears on the Daily Pool page. Clicking it:
• Transfers 100 TPOT from the airdrop vault directly to the Daily Pool vault on your behalf
• Records your free-bet entry on-chain (FreeDeposit PDA)
• Marks your claim as used — preventing duplicate entries

Since TykhePot has no empty prizes, your free bet will always result in a prize. The exact prize depends on the draw result. Prizes are sent automatically to your wallet.`,
          heading2: '6.2 Free Bet Rules',
          items: [
            { label: 'One per wallet', value: 'Enforced on-chain', desc: 'Each wallet address can only claim and use the free bet once.' },
            { label: 'Daily Pool only', value: 'Mandatory', desc: 'Free bets must be used in the Daily Pool — they cannot be used in 30-minute or Hourly pools.' },
            { label: 'Carry-over', value: 'Automatic', desc: 'If the round is refunded, your free bet automatically carries over to the next round. No action required.' },
            { label: 'Referral eligible', value: 'Yes', desc: 'If your free bet is associated with a referrer, the referral rewards apply as normal.' },
          ],
        },
        {
          title: '7. Referral System',
          heading: '7.1 Referral Rewards',
          content: 'The referral system applies to all pool deposits (including free-bet entries):',
          items: [
            { label: 'Referrer Reward', value: '8% of referee\'s deposit', desc: 'Paid immediately from the Referral Pool to the referrer\'s wallet each time a referred user deposits.' },
            { label: 'Referee Bonus', value: '2% one-time bonus', desc: 'The new user (referee) receives a 2% bonus on their first deposit only. This is a lifetime one-time benefit per wallet address.' },
          ],
          content2: 'Both rewards are paid from the Referral Rewards Pool (200,000,000 TPOT). Once the pool is depleted, referral rewards stop — this is publicly visible in the pool\'s on-chain state.',
          heading2: '7.2 Reserve Matching (Daily Pool Only)',
          content3: `The Daily Pool benefits from 1:1 reserve matching funded by the Reserve Matching Pool (200,000,000 TPOT, 20% of supply):

• For every TPOT deposited into the Daily Pool, the protocol contributes an equal amount from the Reserve Pool
• Example: deposit 100 TPOT → 200 TPOT enters the prize pool (your 100 + 100 matched)
• The 30-Minute Pool and Hourly Pool do NOT receive reserve matching
• Free-bet entries (100 TPOT) also receive matching when reserves are available
• Once the Reserve Pool is depleted, matching stops. The protocol state is publicly readable.

Reserve matching combined with referral rewards makes the Daily Pool the highest expected-value pool, especially for early participants.`,
        },
        {
          title: '8. Verifiable Randomness',
          heading: '8.1 Draw Seed Mechanism',
          content: `TykhePot does not rely on external oracle networks. The draw seed is derived from a recently finalized Solana blockhash:

1. At draw time, the protocol (or any caller) provides a 32-byte seed derived from a finalized block hash
2. Winner indices are selected using a partial Fisher-Yates shuffle seeded from draw_seed[0..8]
3. The seed and all winner addresses are emitted in the DrawExecuted on-chain event
4. Anyone can independently verify: re-run the shuffle algorithm with the seed to confirm winner selection`,
          heading2: '8.2 Automatic Protocol Draws',
          content2: `Draws are automatically triggered by the protocol cron service at scheduled times:
• Daily Pool: 00:00 UTC every day
• Hourly Pool: :00 of every hour (00:00, 01:00, 02:00 … 23:00)
• 30-Minute Pool: :00 and :30 of every hour

The cron service is permissionless — if it goes offline, any wallet can trigger the draw manually. The smart contract enforces that draws cannot be called before the scheduled time.`,
          heading3: '8.3 Auditing a Draw',
          content3: `To verify any historical draw:
1. Find the transaction emitting a DrawExecuted event for the round
2. Extract draw_seed, participant_count, and top_winners fields
3. Re-run: partial Fisher-Yates(draw_seed[0..8] as u64, participant_count, 11)
4. Compare result indices to the ordered participant list for that round
5. Confirm the first index = 1st prize winner, etc.

This process requires no trust in TykhePot. All data is permanently on-chain.`,
        },
        {
          title: '9. Staking',
          heading: '9.1 Overview',
          content: 'TykhePot offers on-chain staking for TPOT holders who prefer predictable yield over lottery variance.',
          items: [
            { label: 'Short-Term Staking', value: '30-day lock, 8% APR', desc: 'Lower commitment; rewards calculated daily; principal + rewards returned after 30 days.' },
            { label: 'Long-Term Staking', value: '180-day lock, 48% APR', desc: 'Higher yield for long-term holders; early exit forfeits rewards (principal is returned).' },
          ],
          content2: 'Staking rewards are funded from the Staking Rewards Pool (350,000,000 TPOT). Each stake is tracked independently via a UserStake PDA.',
        },
        {
          title: '10. Security & Protocol Safeguards',
          heading: '10.1 No Admin Architecture',
          content: `TykhePot v3 is fully permissionless with no admin key:
• Draws are executed by protocol rules — no human can delay or block settlement
• All vaults are Program Derived Addresses (PDAs) owned solely by the smart contract
• No upgrade authority after mainnet deployment — the contract is immutable
• Reserve matching, referral rewards, and vesting are all enforced by on-chain logic`,
          heading2: '10.2 Deposit Constraints',
          items: [
            { label: 'Min deposit — 30-Minute Pool', value: '500 TPOT' },
            { label: 'Min deposit — Hourly Pool', value: '200 TPOT' },
            { label: 'Min deposit — Daily Pool', value: '100 TPOT' },
            { label: 'Min participants to draw', value: '12 (all pools)' },
            { label: 'Deposit cutoff', value: '5 minutes before draw time' },
            { label: 'Max deposits per wallet per round', value: '1 (prevents probability inflation)' },
          ],
          heading3: '10.3 Key PDAs',
          content3: `• GlobalState [seeds: "global_state"] — protocol config; controls airdrop, referral, reserve, prize escrow vaults
• PoolState[n] [seeds: "pool", pool_type] — per-pool state; controls each pool vault
• UserDeposit [seeds: "deposit", pool_type, user, round] — one deposit per user per round
• FreeDeposit [seeds: "free_deposit", pool_type, user] — free bet state
• AirdropClaim [seeds: "airdrop_claim", user] — one-time free bet eligibility
• DrawResult [seeds: "draw_result", pool_type, round] — top prize vesting records`,
        },
        {
          title: '11. Roadmap',
          items: [
            { label: 'Phase 1 — Complete', value: 'Devnet Deployment', desc: 'No-admin contract deployed; all pool types operational; multi-winner prize system live' },
            { label: 'Phase 2 — In Progress', value: 'Security Audit', desc: 'Third-party smart contract audit; public bug bounty; stress testing with high participant counts' },
            { label: 'Phase 3', value: 'Mainnet Launch', desc: 'Token generation event; public launch on Solana mainnet-beta; automated cron service live' },
            { label: 'Phase 4', value: 'Liquidity & Growth', desc: 'DEX listings; cross-community partnerships; leaderboard rewards; mobile app' },
            { label: 'Phase 5', value: 'Ecosystem', desc: 'Community governance for parameters; additional pool variants; multi-chain exploration' },
          ],
        },
        {
          title: '12. Risk Disclosure',
          content: `1. Market Risk: TPOT is a highly volatile digital asset. Its value may decrease significantly or go to zero.

2. Regulatory Risk: Lottery and gambling regulations vary by jurisdiction. Users are solely responsible for compliance with local laws.

3. Smart Contract Risk: Despite rigorous development and audits, on-chain programs may contain undiscovered vulnerabilities.

4. Liquidity Risk: Thin secondary market liquidity may make it difficult to buy or sell TPOT at desired prices.

5. Participation Risk: Although TykhePot guarantees everyone wins something (via the Universal Prize), the prize amount may be small for large pools. Lottery outcomes are probabilistic.

6. Refund Risk: If fewer than 12 participants enter a round, no draw occurs. Regular depositors are refunded, free-bet entries carry over. No penalty applies.

Please carefully evaluate your financial situation and risk tolerance before participating.`,
        }
      ]
    },
    zh: {
      title: 'TykhePot 白皮书',
      subtitle: 'Solana 链上公平透明彩票协议',
      version: 'v3.0 — 2026年2月',
      disclaimer: '本白皮书仅供参考。参与彩票涉及财务风险，请勿投入超出您承受能力的资金。',
      sections: [
        {
          title: '1. 执行摘要',
          content: `TykhePot 是基于 Solana 区块链、使用 Anchor 框架构建的全链上去中心化彩票协议。以希腊幸运女神堤喀（Tykhe）命名，TykhePot 通过从 Solana 已确认区块哈希派生的加密开奖种子，实现可验证、防篡改的公平开奖。

协议同时运营三个独立奖池（每30分钟、每小时整点、每日0点），所有存款在每次开奖前5分钟截止。开奖由协议在预定时间自动触发，无需任何人工干预。

核心设计原则：
• 无管理员：完全去中心化，开奖由协议规则自动执行
• 无空奖：每位参与者都能中奖——普惠奖分配给所有未中其他奖项的参与者
• 等概率：无论存款金额多少，每笔存款获得恰好1张票
• 可验证：开奖种子上链记录，任何人可独立验证结果
• 通缩机制：每次成功开奖销毁3% TPOT
• 免费投注：领取一次性空投资格，必须且只能用于天池参与`,
        },
        {
          title: '2. 代币经济学与初始分配',
          heading: '2.1 代币概览',
          items: [
            { label: '代币名称', value: 'TPOT' },
            { label: '总供应量', value: '1,000,000,000 TPOT' },
            { label: '代币标准', value: 'SPL Token（Solana 程序库）' },
            { label: '精度', value: '9位小数' },
          ],
          heading2: '2.2 初始分配',
          items2: [
            { label: '初始流动性', value: '50,000,000 (5%)', desc: '注入去中心化交易所（DEX），为TPOT提供链上交易流动性。' },
            { label: '空投池', value: '100,000,000 (10%)', desc: '为每个钱包的一次性免费投注提供资金。用户激活免费投注时，100 TPOT从此金库转入天池。用完为止。' },
            { label: '质押奖励池', value: '350,000,000 (35%)', desc: '向TPOT持有者支付质押奖励（短期8% APR / 长期48% APR）。用完为止。' },
            { label: '储备配捐池', value: '200,000,000 (20%)', desc: '专门用于天池的1:1存款配捐，储备充足期间有效。30分钟池和小时池不支持配捐。用完为止。' },
            { label: '团队分配', value: '100,000,000 (10%)', desc: '用于市场推广和社区维护等。4年线性释放：第一年5%、第二年15%、第三年30%、第四年50%。' },
            { label: '推广奖励池', value: '200,000,000 (20%)', desc: '为推广奖励（推荐人8%+被推荐人2%一次性）提供资金。用完为止。' },
          ],
        },
        {
          title: '3. 奖池架构',
          heading: '3.1 奖池类型',
          content: 'TykhePot 同时运营三个独立奖池：',
          items: [
            { label: '30分钟池（MIN30）', value: '每小时整点和半点自动开奖', desc: '最低投入：500 TPOT · 最低参与人数：12人 · 开奖前5分钟停止存款 · 不支持储备配捐' },
            { label: '小时池（HOURLY）', value: '每天各整点自动开奖', desc: '最低投入：200 TPOT · 最低参与人数：12人 · 开奖前5分钟停止存款 · 不支持储备配捐' },
            { label: '天池（DAILY）', value: '每天0点（UTC）自动开奖', desc: '最低投入：100 TPOT · 最低参与人数：12人 · 23:55 UTC截止存款 · 支持免费投注、推荐奖励和1:1储备配捐' },
          ],
          heading2: '3.2 轮次生命周期',
          content2: `每个轮次遵循固定时间表：

1. 存款阶段：用户存入TPOT或激活免费投注（仅限天池），每笔存款获得1张票
2. 锁定时间：开奖前整整5分钟停止所有新存款
3. 开奖时间：协议在预定时间自动触发开奖
4. 结果A — 开奖成功（≥12人参与）：选出获奖者，奖金当场发放或按归属计划分发
5. 结果B — 退款（<12人参与）：普通存款全额退款；免费投注自动结转下一轮`,
          heading3: '3.3 等概率设计',
          content3: `每笔存款（无论金额）恰好获得1张票。获奖者选取方式：

  winner_index = pick(draw_seed, participant_count)

投入100 TPOT与投入1,000,000 TPOT的中奖概率完全相同。存款金额影响的是您获得的奖金总额，而非被选中的概率。`,
        },
        {
          title: '4. 费用结构与奖金分配',
          heading: '4.1 费用明细（成功开奖）',
          content: '每次成功开奖（≥12人参与）时，总奖池按以下比例分配：',
          items: [
            { label: '销毁', value: '3%', desc: '永久销毁，减少TPOT总供应量，持续通缩。' },
            { label: '平台费', value: '2%', desc: '转入协议国库用于运营和开发。' },
            { label: '奖金池', value: '95%', desc: '在所有参与者中按以下规则分配。' },
          ],
          heading2: '4.2 奖金分配（95%奖金池内部）',
          content2: '95%奖金池按以下比例分配：',
          items2: [
            { label: '头奖', value: '30% — 1名获奖者', desc: '最大单笔奖金。通过20天线性归属发放（每天5%）。' },
            { label: '二等奖', value: '20% — 2名获奖者（各10%）', desc: '两位二等奖得主，各自每天收到5%，共20天。' },
            { label: '三等奖', value: '15% — 3名获奖者（各5%）', desc: '三位三等奖得主，各自每天收到5%，共20天。' },
            { label: '幸运奖', value: '10% — 5名获奖者（各2%）', desc: '5位随机幸运获奖者。奖金开奖当天立即发送到钱包。' },
            { label: '普惠奖', value: '20% — 所有未中其他奖的参与者平分', desc: 'TykhePot 没有空奖——每位参与者都能获奖。普惠奖开奖当天立即发送。' },
            { label: '回流', value: '5% — 留存在奖池中', desc: '结转至下一期奖池，增加下期奖金规模。' },
          ],
          heading3: '4.3 奖金归属（头奖/二等奖/三等奖）',
          content3: `头奖、二等奖、三等奖的奖金不是一次性到账，而是按20天线性归属计划发放：

• 开奖当天（第0天）：5%奖金可领取
• 此后每天：额外解锁5%
• 第20天：奖金100%全部发放完毕

发放过程完全由链上协议自动执行，无需获奖者手动操作。协议定时服务每天自动调用归属指令，将当日解锁金额发送至获奖者钱包。幸运奖和普惠奖在开奖当天立即全额发送。

示例：头奖金额为10,000 TPOT
  → 第0天：500 TPOT · 第1天：500 TPOT · … · 第19天：500 TPOT = 共10,000 TPOT`,
        },
        {
          title: '5. 退款机制',
          content: `当轮次结束时参与人数不足12人，开奖取消：

• 所有普通存款（用户支付的TPOT）全额退回各自的代币账户
• 免费投注（由空投金库资助）自动结转至下一轮——参与者无需重新操作，继续保留席位
• 退款轮次不收取任何费用
• 协议立即开启下一轮，配置与前一轮相同

免费投注结转意味着持有免费投注的用户始终留在队列中，直至成功开奖。他们的100 TPOT继续留在奖池金库中，计入下一轮奖金总额。`,
        },
        {
          title: '6. 空投与免费投注（仅限天池）',
          heading: '6.1 如何领取',
          content: `任意钱包可通过点击空投页面的"领取空投"按钮，免费获得一次天池参与资格。此操作将该地址记录在链上（AirdropClaim PDA），证明其参与意向。

重要：空投代币不会直接进入您的钱包。它赋予您一次天池免费参与权。

领取后，天池页面将出现"使用免费投注"按钮。点击后：
• 协议代您将100 TPOT从空投金库转入天池金库
• 链上记录您的免费投注参与（FreeDeposit PDA）
• 标记您的资格为已使用，防止重复参与

由于TykhePot没有空奖，您的免费投注最终一定会获得奖金。具体金额取决于开奖结果，奖金将自动发送到您的钱包。`,
          heading2: '6.2 免费投注规则',
          items: [
            { label: '每钱包仅限一次', value: '链上强制执行', desc: '每个钱包地址只能领取并使用一次免费投注。' },
            { label: '仅限天池', value: '强制规定', desc: '免费投注必须且只能用于天池，不能用于30分钟池或小时池。' },
            { label: '自动结转', value: '无需操作', desc: '若当轮退款，您的免费投注自动结转至下一轮，无需任何操作。' },
            { label: '推荐奖励适用', value: '是', desc: '若您的免费投注关联了推荐人，推荐奖励规则同样适用。' },
          ],
        },
        {
          title: '7. 推荐系统与储备配捐',
          heading: '7.1 推荐奖励',
          content: '推荐系统适用于所有奖池的存款（包括免费投注）：',
          items: [
            { label: '推荐人奖励', value: '被推荐人存款金额的8%', desc: '每笔成功存款后立即从推广奖励池转至推荐人钱包。' },
            { label: '被推荐人奖励', value: '一次性2%加成', desc: '新用户（被推荐人）在其首笔存款时获得2%额外奖励。每个钱包地址终身只享受一次此福利。' },
          ],
          content2: '两项奖励均来自推广奖励池（200,000,000 TPOT）。池子耗尽后推荐奖励停止，这一状态可通过链上数据公开查询。',
          heading2: '7.2 储备配捐（仅限天池）',
          content3: `天池享有1:1储备配捐，资金来自储备配捐池（200,000,000 TPOT，总供应量的20%）：

• 每向天池存入1 TPOT，协议从储备池额外贡献1 TPOT进入奖池
• 例：存入100 TPOT → 200 TPOT进入奖池（您的100 + 配捐100）
• 30分钟池和小时池不享有配捐
• 免费投注（100 TPOT）在储备充足时同样享受配捐
• 储备池耗尽后配捐停止，可通过链上状态查看

储备配捐结合推荐奖励，使天池成为早期参与者预期收益最高的奖池。`,
        },
        {
          title: '8. 可验证随机性',
          heading: '8.1 开奖种子机制',
          content: `TykhePot 不依赖任何外部预言机。开奖种子派生自最近已确认的 Solana 区块哈希：

1. 开奖时，协议（或任意调用者）提供32字节种子，来自已确认区块哈希
2. 使用 Fisher-Yates 部分洗牌算法，以 draw_seed[0..8] 作为随机数种子，选出11位获奖者
3. 种子及所有获奖者地址记录在链上 DrawExecuted 事件中，永久可审计
4. 任何人可独立验证：用相同种子重新运行洗牌算法，确认获奖结果`,
          heading2: '8.2 协议自动开奖',
          content2: `开奖由协议定时服务在预定时间自动触发：
• 天池：每天0点（UTC）
• 小时池：每天各整点（0点、1点……23点）
• 30分钟池：每小时整点和半点

定时服务是无许可的——如果离线，任意钱包均可手动触发。智能合约确保在预定时间前无法调用开奖。`,
          heading3: '8.3 如何审计开奖',
          content3: `验证任意历史开奖：
1. 找到该轮次发出 DrawExecuted 事件的交易
2. 提取 draw_seed、participant_count 和 top_winners 字段
3. 重新运行：partial Fisher-Yates(draw_seed[0..8] 作为 u64, participant_count, 11)
4. 将结果索引与该轮次有序参与者列表对应
5. 确认索引0对应头奖得主，以此类推

整个过程无需信任TykhePot团队，所有数据永久记录在链上。`,
        },
        {
          title: '9. 质押',
          heading: '9.1 概览',
          content: 'TykhePot 为偏好稳定收益而非彩票波动的TPOT持有者提供链上质押功能。',
          items: [
            { label: '短期质押', value: '30天锁仓，8% APR', desc: '承诺期较短；奖励每日累积；30天后返还本金+奖励。' },
            { label: '长期质押', value: '180天锁仓，48% APR', desc: '为长期持有者提供更高收益；提前赎回将放弃奖励（本金可退还）。' },
          ],
          content2: '质押奖励来自质押奖励池（350,000,000 TPOT）。每笔质押通过 UserStake PDA 独立追踪。',
        },
        {
          title: '10. 安全与协议保障',
          heading: '10.1 无管理员架构',
          content: `TykhePot v3 完全无许可，无任何管理员密钥：
• 开奖由协议规则执行，无人可延迟或阻止结算
• 所有金库均为程序派生地址（PDA），完全由智能合约控制
• 主网部署后无升级权限，合约不可变
• 储备配捐、推荐奖励和奖金归属全部由链上逻辑强制执行`,
          heading2: '10.2 存款限制',
          items: [
            { label: '最低存款 — 30分钟池', value: '500 TPOT' },
            { label: '最低存款 — 小时池', value: '200 TPOT' },
            { label: '最低存款 — 天池', value: '100 TPOT' },
            { label: '最低开奖参与人数', value: '12人（所有奖池）' },
            { label: '存款截止时间', value: '开奖前5分钟' },
            { label: '每钱包每轮最多存款次数', value: '1次（防止虚增中奖概率）' },
          ],
          heading3: '10.3 关键PDA',
          content3: `• GlobalState [种子："global_state"] — 协议配置；控制空投/推荐/储备/奖金托管金库
• PoolState[n] [种子："pool", pool_type] — 每奖池状态；控制各奖池金库
• UserDeposit [种子："deposit", pool_type, user, round] — 每用户每轮存款记录
• FreeDeposit [种子："free_deposit", pool_type, user] — 免费投注状态
• AirdropClaim [种子："airdrop_claim", user] — 一次性免费投注资格
• DrawResult [种子："draw_result", pool_type, round] — 头/二/三奖归属记录`,
        },
        {
          title: '11. 路线图',
          items: [
            { label: '第一阶段 — 已完成', value: 'Devnet 部署', desc: '无管理员合约部署至 Solana devnet；多获奖者奖金系统已上线' },
            { label: '第二阶段 — 进行中', value: '安全审计', desc: '第三方智能合约审计；公开漏洞赏金计划；高参与人数压力测试' },
            { label: '第三阶段', value: '主网上线', desc: '代币生成事件；Solana mainnet-beta 公开上线；自动化定时服务上线' },
            { label: '第四阶段', value: '流动性与增长', desc: 'DEX上市；跨社区合作；排行榜奖励；移动端App' },
            { label: '第五阶段', value: '生态发展', desc: '参数社区治理；更多奖池变体；多链探索' },
          ],
        },
        {
          title: '12. 风险披露',
          content: `1. 市场风险：TPOT是高度波动的数字资产，其价值可能大幅下跌甚至归零。

2. 监管风险：彩票和博彩法规因司法管辖区不同而异。用户对遵守当地法律法规负全责。

3. 智能合约风险：尽管经过严格开发和第三方审计，链上程序可能仍存在未发现的漏洞。

4. 流动性风险：二级市场流动性不足可能导致按预期价格买卖TPOT困难。

5. 参与风险：虽然TykhePot通过普惠奖保证人人中奖，但在参与人数较多时，普惠奖单个金额可能较小。彩票结果具有概率性。

6. 退款风险：若某轮次参与人数不足12人，开奖取消。普通存款将被退还，免费投注自动结转，不受任何惩罚。

参与前请仔细评估您的财务状况和风险承受能力。`,
        }
      ]
    }
  };

  const c = content[language] || content.en;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/" style={styles.backLink}>← {language === 'en' ? 'Back to Home' : '返回主页'}</Link>
        <h1 style={styles.title}>{c.title}</h1>
        <p style={styles.subtitle}>{c.subtitle}</p>
        <p style={styles.version}>{c.version}</p>
        <p style={styles.disclaimer}>{c.disclaimer}</p>
      </div>

      <div style={styles.toc}>
        <h3 style={styles.tocTitle}>{language === 'en' ? 'Table of Contents' : '目录'}</h3>
        <ol style={styles.tocList}>
          {c.sections.map((section, index) => (
            <li key={index} style={styles.tocItem}>
              <a href={`#section-${index}`} style={styles.tocLink}>{section.title}</a>
            </li>
          ))}
        </ol>
      </div>

      <div style={styles.content}>
        {c.sections.map((section, index) => (
          <div key={index} id={`section-${index}`} style={styles.section}>
            <h2 style={styles.sectionTitle}>{section.title}</h2>

            {section.heading && <h3 style={styles.heading}>{section.heading}</h3>}
            {section.content && <p style={styles.paragraph}>{section.content}</p>}
            {section.items && (
              <div style={styles.table}>
                {section.items.map((item, i) => (
                  <div key={i} style={styles.tableRow}>
                    <span style={styles.tableLabel}>{item.label}</span>
                    {item.value && <span style={styles.tableValue}>{item.value}</span>}
                    {item.desc && <span style={styles.tableDesc}>{item.desc}</span>}
                  </div>
                ))}
              </div>
            )}

            {section.heading2 && <h3 style={styles.heading}>{section.heading2}</h3>}
            {section.content2 && <p style={styles.paragraph}>{section.content2}</p>}
            {section.items2 && (
              <div style={styles.table}>
                {section.items2.map((item, i) => (
                  <div key={i} style={styles.tableRow}>
                    <span style={styles.tableLabel}>{item.label}</span>
                    {item.value && <span style={styles.tableValue}>{item.value}</span>}
                    {item.desc && <span style={styles.tableDesc}>{item.desc}</span>}
                  </div>
                ))}
              </div>
            )}

            {section.heading3 && <h3 style={styles.heading}>{section.heading3}</h3>}
            {section.content3 && <p style={styles.paragraph}>{section.content3}</p>}
            {section.items3 && (
              <div style={styles.table}>
                {section.items3.map((item, i) => (
                  <div key={i} style={styles.tableRow}>
                    <span style={styles.tableLabel}>{item.label}</span>
                    {item.value && <span style={styles.tableValue}>{item.value}</span>}
                    {item.desc && <span style={styles.tableDesc}>{item.desc}</span>}
                  </div>
                ))}
              </div>
            )}

            {section.content4 && <p style={styles.paragraph}>{section.content4}</p>}
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <p>© 2026 TykhePot Protocol. All rights reserved.</p>
        <p style={styles.footerNote}>{language === 'en' ? 'Built on Solana · Fully Decentralized · Verifiable' : '构建于 Solana · 完全去中心化 · 可验证'}</p>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '860px', margin: '0 auto', padding: '2rem 1.25rem', color: '#E0E0E0' },
  header: {
    textAlign: 'center', marginBottom: '2rem', padding: '2rem',
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px', border: '1px solid rgba(255, 215, 0, 0.3)',
  },
  backLink: { display: 'inline-block', color: '#FFD700', textDecoration: 'none', marginBottom: '1.25rem', fontSize: '0.9rem', opacity: 0.8 },
  title: {
    fontSize: '2rem', fontWeight: '700',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem',
  },
  subtitle: { fontSize: '1rem', color: '#A0A0A0', marginBottom: '0.25rem' },
  version: { fontSize: '0.8rem', color: '#666', marginBottom: '1rem' },
  disclaimer: {
    fontSize: '0.78rem', color: '#FF6B6B', fontStyle: 'italic',
    padding: '0.75rem 1rem', background: 'rgba(255, 107, 107, 0.08)',
    borderRadius: '8px', border: '1px solid rgba(255, 107, 107, 0.2)', margin: '0',
  },
  toc: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
    border: '1px solid rgba(255, 215, 0, 0.15)',
  },
  tocTitle: { fontSize: '0.95rem', color: '#FFD700', marginBottom: '0.75rem', fontWeight: '600' },
  tocList: { margin: 0, paddingLeft: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.25rem 1.5rem' },
  tocItem: { lineHeight: 1.6 },
  tocLink: { color: '#A0A0A0', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.15s' },
  content: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  section: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '12px', padding: '1.5rem',
    border: '1px solid rgba(255, 215, 0, 0.15)', scrollMarginTop: '80px',
  },
  sectionTitle: { fontSize: '1.15rem', color: '#FFD700', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255, 215, 0, 0.2)', fontWeight: '700' },
  heading: { fontSize: '0.95rem', color: '#FFFFFF', marginTop: '1.25rem', marginBottom: '0.5rem', fontWeight: '600' },
  paragraph: { color: '#D0D0D0', lineHeight: 1.75, fontSize: '0.875rem', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' },
  table: { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' },
  tableRow: { display: 'flex', flexDirection: 'column', padding: '0.6rem 0.75rem', borderRadius: '6px', background: 'rgba(0, 0, 0, 0.2)', borderLeft: '2px solid rgba(255, 215, 0, 0.3)' },
  tableLabel: { color: '#FFD700', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.15rem' },
  tableValue: { color: '#FFFFFF', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.1rem' },
  tableDesc: { color: '#909090', fontSize: '0.8rem' },
  footer: { textAlign: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', color: '#555', fontSize: '0.8rem', lineHeight: 1.8 },
  footerNote: { color: '#444', fontSize: '0.75rem' },
};

export default Whitepaper;
