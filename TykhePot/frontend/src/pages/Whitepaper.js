import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';

const Whitepaper = () => {
  const { t, language } = useTranslation();

  const content = {
    en: {
      title: 'TykhePot Whitepaper',
      subtitle: 'Fair & Transparent On-Chain Lottery Protocol on Solana',
      version: 'v2.0 — February 2026',
      disclaimer: 'This whitepaper is for informational purposes only. Lottery participation involves financial risk. Only participate with funds you can afford to lose.',
      sections: [
        {
          title: '1. Executive Summary',
          content: `TykhePot is a fully on-chain, decentralized lottery protocol built on Solana using the Anchor framework. Named after Tykhe — the Greek goddess of fortune — TykhePot delivers verifiable, tamper-proof prize draws through cryptographic draw seeds derived from finalized Solana blockhashes.

The protocol operates three parallel prize pools with different cadences (every 30 minutes, every hour, and daily). All deposits, draws, and prize payouts are executed transparently on-chain with no admin or intermediaries.

Key design principles:
• No admin: the protocol has no privileged owner — draws are permissionless and can be triggered by anyone after the round ends
• Equal probability: every participant has an identical chance of winning, regardless of deposit amount
• Verifiability: draw seeds are emitted on-chain and anyone can independently verify winner selection
• Deflationary: 3% of every successful draw is permanently burned, reducing total TPOT supply
• Free bet: any wallet can claim 100 TPOT airdrop and use it as a free entry in any pool`,
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
            { label: 'Initial Liquidity', value: '50,000,000 (5%)', desc: 'DEX liquidity provision, managed externally by team' },
            { label: 'Airdrop Pool', value: '100,000,000 (10%)', desc: 'Free claim: 100 TPOT per wallet, one-time only. Also funds free-bet entries in any pool.' },
            { label: 'Staking Rewards', value: '350,000,000 (35%)', desc: 'Long-term staking incentives (Short-term 8% APR / Long-term 48% APR)' },
            { label: 'Reserve Matching Pool', value: '200,000,000 (20%)', desc: '1:1 deposit matching for Daily Pool participants while reserves last' },
            { label: 'Team Allocation', value: '100,000,000 (10%)', desc: 'Vested over 4 years, aligning long-term incentives' },
            { label: 'Referral Pool', value: '200,000,000 (20%)', desc: 'Referral rewards funded from this pool until exhausted' },
          ],
          content: `The distribution is engineered to bootstrap liquidity, reward early adopters, and ensure long-term protocol sustainability.

The Reserve Matching Pool provides 1:1 matching on Daily Pool deposits, effectively doubling the prize pool for participants while reserves last — creating strong early-adoption incentives.

The Referral Pool directly funds the 8% referral reward on each referred Daily Pool deposit, enabling sustainable organic growth. The Airdrop Pool also funds free-bet entries: when a user uses their airdrop in a pool, 100 TPOT is transferred from the airdrop vault to the pool vault, growing the prize.`,
        },
        {
          title: '3. Prize Pool Architecture',
          heading: '3.1 Pool Types',
          content: `TykhePot operates three independent prize pools simultaneously:`,
          items: [
            { label: '30-Minute Pool (MIN30)', value: 'Draws every 30 minutes', desc: 'Min deposit: 500 TPOT · Min participants: 12 · Highest frequency — ideal for active players' },
            { label: 'Hourly Pool (HOURLY)', value: 'Draws every 60 minutes', desc: 'Min deposit: 200 TPOT · Min participants: 12 · Balanced frequency and pool accumulation' },
            { label: 'Daily Pool (DAILY)', value: 'Draws every 24 hours', desc: 'Min deposit: 100 TPOT · Min participants: 12 · Supports free bet, 8% referral rewards & 1:1 reserve matching' },
          ],
          content2: `All three pools support free-bet entries and permissionless draw execution. The Daily Pool additionally supports an 8% referral reward system and 1:1 reserve matching from the Reserve Pool, maximizing prize accumulation for early participants.`,
          heading2: '3.2 Round Lifecycle',
          content3: `Each round follows a fixed schedule:

1. **Deposit Phase**: users deposit TPOT or use their free bet; each deposit earns exactly 1 ticket regardless of amount
2. **Lock Time**: deposits stop 5 minutes before round end to prevent last-second manipulation
3. **Draw Time**: any wallet can call \`execute_draw\` once the round end timestamp is reached
4. **Outcome A — Draw Succeeds** (≥12 participants): a winner is selected; 95% prize transferred instantly; 3% burned; 2% to platform fee vault
5. **Outcome B — Refund** (<12 participants): regular deposits are refunded in full; free bet entries are carried over to the next round (not lost)`,
          heading3: '3.3 Equal Probability Design',
          content4: `Unlike traditional weighted lotteries, TykhePot uses a flat-ticket model: every deposit (any amount above the minimum) earns exactly 1 ticket. The winner is selected as:

  winner = participants[ draw_seed % participant_count ]

This means a user who deposits the minimum has the same chance as one who deposits 100× more. The deposit amount determines your stake in the prize (you receive your proportional share of the pool if you win), but it does not inflate your probability of being selected winner.

This design promotes fairness and makes the protocol accessible to all users regardless of wallet size.`,
        },
        {
          title: '4. Fee Structure & Prize Distribution',
          heading: '4.1 Fee Breakdown',
          content: `On every successful draw, the pool balance is allocated as follows:`,
          items: [
            { label: 'Burn', value: '3%', desc: 'Permanently destroyed — reduces total TPOT supply (deflationary pressure). Only occurs on successful draws.' },
            { label: 'Platform Fee', value: '2%', desc: 'Transferred to protocol treasury for ongoing development and operations' },
            { label: 'Winner Prize', value: '95%', desc: 'Transferred immediately to the single winner\'s token account' },
          ],
          content2: `The 3% burn is irreversible and only occurs when a draw succeeds. Refunded rounds produce no burn, ensuring that inactive participants are not penalized.

There are no prize tiers, no vesting, and no rollover in the base prize — the winner takes 95% of the entire accumulated pool instantly. This simplicity maximizes the winner experience and minimizes smart contract complexity.`,
          heading2: '4.2 Refund Behavior',
          content3: `When a round ends with fewer than 12 participants:
• All regular deposits (TPOT paid by users) are refunded in full to each depositor's token account
• Free bet entries (funded by airdrop vault) are **carried over** to the next round — the free bet participant retains their slot without spending TPOT
• No fees are charged on refunded rounds`,
        },
        {
          title: '5. Verifiable Randomness',
          heading: '5.1 Draw Seed Mechanism',
          content: `TykhePot does not rely on external oracle networks for randomness. Instead, it uses a **caller-provided draw seed** derived from a recently finalized Solana blockhash:

1. Any wallet calls \`execute_draw\` after \`round_end_time\` has passed
2. The caller supplies a 32-byte seed derived from a recent finalized Solana block hash
3. The contract validates the seed is non-zero and the round time has elapsed
4. Winner index is computed as: \`draw_seed[0..8] (as u64) % total_participant_count\`
5. The seed and winner are emitted in the \`DrawExecuted\` on-chain event, permanently auditable

Winner selection is entirely deterministic from the seed — there are no hidden state variables.`,
          heading2: '5.2 Permissionless Draws',
          content2: `A key innovation of TykhePot v2 is that **anyone** can trigger a draw — there is no admin role. A cron service operated by the TykhePot team calls \`execute_draw\` automatically at each interval, but:

• If the team's cron is offline, any user can manually call the instruction
• The draw instruction is safe to call multiple times — once a round is drawn, subsequent calls are rejected
• The draw caller earns no special reward — this is a pure public service transaction

This eliminates single-point-of-failure operational risk. Even if the core team disappears, the protocol continues indefinitely as long as anyone calls the draw.`,
          heading3: '5.3 Auditing a Draw',
          content4: `To verify any historical draw:
1. Find the transaction that emitted a \`DrawExecuted\` event for the round
2. Extract the \`draw_seed\` field from the event data
3. Compute: \`winner_index = uint64(draw_seed[0:8], little-endian) % participant_count\`
4. Fetch the ordered list of participant PDAs for that round and select index \`winner_index\`
5. Verify the winner's wallet matches the event's \`winner\` field

The entire process is deterministic and requires no trust in the TykhePot team.`,
        },
        {
          title: '6. Airdrop & Free Bet',
          heading: '6.1 Airdrop Claim',
          content: `Any wallet can claim a one-time airdrop of **100 TPOT** by calling the \`claim_free_airdrop\` instruction. Tokens are transferred from the protocol's airdrop vault to the claimer's token account.

Key details:
• One claim per wallet address, enforced on-chain via an \`AirdropClaim\` PDA
• Tokens are real TPOT — fully transferable SPL tokens
• Airdrop pool total: 100,000,000 TPOT (10% of supply)
• After claiming, the user gains a one-time free bet right (stored in \`AirdropClaim.has_free_claim\`)`,
          heading2: '6.2 Free Bet Mechanics',
          content2: `After claiming the airdrop, the user can activate a free bet in any of the three pools by calling \`use_free_bet(pool_type)\`:

• 100 TPOT is transferred from the airdrop vault directly to the target pool vault
• A \`FreeDeposit\` PDA is created, giving the user 1 ticket in that pool's current round
• The free bet can only be used once per claim — but it is usable in ANY pool (not just daily)
• If the round is refunded, the free bet **carries over** to the next round automatically (is_active flag remains true)
• The free bet is consumed (cleared) when the pool successfully draws, regardless of whether the free bettor wins

This design means free bet participants experience zero loss on refunded rounds — they simply remain in the queue until a successful draw occurs.`,
        },
        {
          title: '7. Referral System',
          heading: '7.1 Mechanism',
          content: `The referral system applies to Daily Pool deposits (including free-bet entries):`,
          items: [
            { label: 'Referrer Reward', value: '8% of referee\'s deposit', desc: 'Paid from the Referral Pool upon each successful deposit' },
            { label: 'Referee Bonus', value: '2% one-time bonus', desc: 'Applied on the referee\'s first qualifying deposit only (lifetime limit per wallet)' },
          ],
          content2: `Both rewards are funded from the dedicated **Referral Pool** (200,000,000 TPOT, 20% of total supply). When this pool is exhausted, referral rewards cease — the protocol state flag is publicly readable.`,
          heading2: '7.2 Reserve Matching (Daily Pool)',
          content3: `The Daily Pool also supports **1:1 reserve matching** from the Reserve Matching Pool (200,000,000 TPOT, 20% of supply):
• For each TPOT deposited into the Daily Pool, an equal amount is contributed from the Reserve Pool
• This effectively doubles the prize pool size for Daily Pool participants while reserves last
• Reserve matching also applies to free-bet entries (100 TPOT free bet → 100 TPOT matching contribution)
• Once the Reserve Pool is exhausted, matching stops — the pool state flag signals this publicly

Together, referral rewards and reserve matching make the Daily Pool the highest-value pool for early adopters.`,
          heading3: '7.3 Single Referrer Rule',
          content4: `Each wallet address can only be bound to one referrer, enforced on-chain. Self-referral is explicitly prevented by the contract. Once bound, the referrer relationship is permanent and cannot be modified.`,
        },
        {
          title: '8. Staking',
          heading: '8.1 Overview',
          content: `TykhePot offers on-chain staking for TPOT holders who want passive yield without participating in lottery draws.`,
          items: [
            { label: 'Short-Term Staking', value: '30-day lock, 8% APR', desc: 'Lower commitment; rewards accumulate daily; withdrawable after 30 days' },
            { label: 'Long-Term Staking', value: '180-day lock, 48% APR', desc: 'Higher yield for committed holders; rewards accumulate daily; early exit not possible' },
          ],
          content2: `Staking rewards are funded from the dedicated **Staking Rewards Pool** (350,000,000 TPOT, 35% of supply). The contract tracks each user's stake index, amount, start time, and lock type independently via \`UserStake\` PDAs.

Staking provides a complementary earning path for risk-averse TPOT holders, while the lottery pools serve users who prefer higher-variance, higher-reward participation.`,
        },
        {
          title: '9. Security & Protocol Safeguards',
          heading: '9.1 No Admin Architecture',
          content: `TykhePot v2 is a fully permissionless protocol with no admin key:
• Draws can be triggered by any wallet — no single entity controls round settlement
• Deposits, free bets, airdrop claims, and staking are all self-serve on-chain instructions
• Platform fee vault is a regular token account owned by the platform wallet — no on-chain admin account

This design eliminates admin-key compromise risk and ensures the protocol can operate indefinitely without team involvement.`,
          heading2: '9.2 Deposit Constraints',
          items: [
            { label: 'Min deposit — 30min Pool', value: '500 TPOT' },
            { label: 'Min deposit — Hourly Pool', value: '200 TPOT' },
            { label: 'Min deposit — Daily Pool', value: '100 TPOT' },
            { label: 'Min participants for draw', value: '12 (all pools)' },
          ],
          content2: `Minimum deposit limits are enforced on-chain. Only one deposit per wallet per round is allowed — this prevents a single wallet from buying multiple tickets to inflate their probability.`,
          heading3: '9.3 PDA Architecture',
          content4: `All protocol vaults (pool vaults, airdrop vault, staking vault) are **Program Derived Addresses (PDAs)** owned exclusively by the TykhePot program. No external key controls these accounts — only the program logic can authorize token transfers.

Key PDAs:
• \`GlobalState\` [seeds: "global_state"] — protocol-wide config; owns the airdrop vault
• \`PoolState[n]\` [seeds: "pool", pool_type] — per-pool state; owns each pool vault
• \`UserDeposit\` [seeds: "deposit", pool_type, user, round] — per-user deposit record
• \`FreeDeposit\` [seeds: "free_deposit", pool_type, user] — free bet state per user per pool
• \`AirdropClaim\` [seeds: "airdrop_claim", user] — tracks whether airdrop was claimed`,
        },
        {
          title: '10. Technical Architecture',
          heading: '10.1 Blockchain',
          content: `Built on **Solana** for:
• High throughput: up to 65,000 TPS
• Low transaction cost: ~$0.0001 per transaction
• Sub-second finality: ~400ms slot time, ~1–2s finality

These properties make sub-minute prize draws economically viable — something impossible on higher-fee blockchains.`,
          heading2: '10.2 Smart Contract',
          content2: `The \`royalpot\` program is built with the **Anchor framework 0.30 (Rust)**, providing:
• Type-safe account validation via \`#[derive(Accounts)]\` macros
• Automatic discriminator-based instruction routing
• On-chain events (\`DrawExecuted\`, \`RoundRefunded\`) for transparent auditability
• No upgrade authority — contract is immutable once deployed to production

Key instructions: \`initialize\`, \`initialize_pool\`, \`deposit\`, \`use_free_bet\`, \`execute_draw\`, \`claim_free_airdrop\`, \`stake\`, \`unstake\``,
          heading3: '10.3 Frontend & Cron',
          content4: `The React-based web interface provides:
• Multi-wallet support: Phantom, Solflare (via \`@solana/wallet-adapter-react\`)
• Real-time pool statistics with 30-second auto-refresh
• Multi-language support: English and Chinese
• Draw history page: last 5 draws per pool with on-chain event data
• Direct Anchor program interaction via \`@coral-xyz/anchor\` SDK

An automated Node.js cron service calls \`execute_draw\` at the end of each round interval. This service is permissionless — if it goes offline, any user can trigger draws manually.`,
        },
        {
          title: '11. Roadmap',
          items: [
            { label: 'Phase 1 — Complete', value: 'Devnet Deployment', desc: 'No-admin contract deployed on Solana devnet; all pool types operational; frontend live' },
            { label: 'Phase 2 — In Progress', value: 'Security Audit', desc: 'Third-party smart contract audit; public bug bounty program; stress testing' },
            { label: 'Phase 3', value: 'Mainnet Launch', desc: 'Token generation event; public launch on Solana mainnet-beta; cron service live' },
            { label: 'Phase 4', value: 'Liquidity Expansion', desc: 'DEX listings; cross-community partnerships; leaderboard rewards; mobile app' },
            { label: 'Phase 5', value: 'Governance & Ecosystem', desc: 'Community governance for fee parameters; additional pool variants; multi-chain exploration' },
          ],
        },
        {
          title: '12. Risk Disclosure',
          content: `1. **Market Risk**: TPOT is a highly volatile digital asset. Its value may decrease significantly or go to zero.

2. **Regulatory Risk**: Lottery and gambling regulations vary by jurisdiction. Users are solely responsible for compliance with their local laws.

3. **Smart Contract Risk**: Despite rigorous development practices and third-party audits, on-chain programs may contain undiscovered vulnerabilities.

4. **Liquidity Risk**: Thin secondary market liquidity may make it difficult to buy or sell TPOT at desired prices.

5. **Participation Risk**: Lottery outcomes are probabilistic — there is no guarantee of winning. In any given round, 11 of 12 minimum participants will not win the prize.

6. **Round Refund Risk**: If fewer than 12 participants enter a round, deposits are refunded and no prize is awarded. Free bet entries are carried over but regular depositors must re-enter the next round manually.

Please carefully evaluate your financial situation and risk tolerance before participating. Never deposit funds you cannot afford to lose.`,
        }
      ]
    },
    zh: {
      title: 'TykhePot 白皮书',
      subtitle: 'Solana 链上公平透明彩票协议',
      version: 'v2.0 — 2026年2月',
      disclaimer: '本白皮书仅供参考。参与彩票涉及财务风险，请勿投入超出您承受能力的资金。',
      sections: [
        {
          title: '1. 执行摘要',
          content: `TykhePot 是基于 Solana 区块链、使用 Anchor 框架构建的全链上去中心化彩票协议。以希腊幸运女神堤喀（Tykhe）命名，TykhePot 通过从 Solana 已确认区块哈希派生的加密开奖种子，实现可验证、防篡改的公平开奖。

协议运营三个独立奖池（每30分钟、每小时、每日），所有存款、开奖和奖金支付均通过链上指令透明执行，无管理员，无任何中介。

核心设计原则：
• 无管理员：协议无任何特权所有者——开奖无需许可，任何人可在轮次结束后触发
• 等概率：无论存款金额多少，每位参与者的中奖概率完全相同
• 可验证性：开奖种子上链记录，任何人可独立验证获奖结果
• 通缩机制：每次成功开奖的3%永久销毁，持续减少TPOT流通总量
• 免费投注：任何钱包可领取100 TPOT空投，并在任意奖池中免费参与一次`,
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
            { label: '初始流动性', value: '50,000,000 (5%)', desc: 'DEX 流动性注入，由团队外部管理' },
            { label: '空投池', value: '100,000,000 (10%)', desc: '免费领取：每个钱包100 TPOT，一次性。同时为免费投注提供资金。' },
            { label: '质押奖励池', value: '350,000,000 (35%)', desc: '长期质押激励（短期8% APR / 长期48% APR）' },
            { label: '储备配捐池', value: '200,000,000 (20%)', desc: '天池参与者1:1存款配捐，储备充足期间有效' },
            { label: '团队分配', value: '100,000,000 (10%)', desc: '4年归属，与长期激励对齐' },
            { label: '推广奖励池', value: '200,000,000 (20%)', desc: '推荐奖励来源，耗尽即止' },
          ],
          content: `分配方案旨在启动流动性、奖励早期参与者并确保协议长期可持续发展。

储备配捐池对天池存款提供1:1配捐，在储备充足期间有效翻倍参与者奖池规模，形成强烈的早期参与激励。推广奖励池为每笔被推荐天池存款提供8%推荐奖励。空投池同时用于免费投注：用户在奖池中使用免费投注时，100 TPOT从空投金库转入奖池金库，增加奖池规模。`,
        },
        {
          title: '3. 奖池架构',
          heading: '3.1 奖池类型',
          content: `TykhePot 同时运营三个独立奖池：`,
          items: [
            { label: '30分池（MIN30）', value: '每30分钟开奖', desc: '最低投入：500 TPOT · 最低参与人数：12人 · 频率最高，适合活跃玩家' },
            { label: '小时池（HOURLY）', value: '每60分钟开奖', desc: '最低投入：200 TPOT · 最低参与人数：12人 · 频率与积累均衡' },
            { label: '天池（DAILY）', value: '每24小时开奖', desc: '最低投入：100 TPOT · 最低参与人数：12人 · 支持免费投注、8%推荐奖励及1:1储备配捐' },
          ],
          content2: `三个奖池均支持免费投注和无许可开奖执行。天池额外支持8%推荐奖励和1:1储备配捐，最大化早期参与者的奖池规模。每个奖池独立累积存款。`,
          heading2: '3.2 轮次生命周期',
          content3: `每个轮次遵循固定时间表：

1. **存款阶段**：用户存入TPOT或使用免费投注；无论金额多少，每笔存款获得恰好1张票
2. **锁定时间**：轮次结束前5分钟停止存款，防止最后时刻操纵
3. **开奖时间**：轮次结束时间戳到达后，任何钱包可调用 \`execute_draw\`
4. **结果A — 开奖成功**（≥12人参与）：随机选出1名获奖者；95%奖金即时转出；3%永久销毁；2%转入平台费金库
5. **结果B — 退款**（<12人参与）：普通存款全额退款；免费投注自动结转至下一轮（不丢失）`,
          heading3: '3.3 等概率设计',
          content4: `与传统加权彩票不同，TykhePot 采用平票模型：每笔存款（超过最低金额）恰好获得1张票，获奖者选取方式为：

  winner = participants[ draw_seed % participant_count ]

这意味着存入最低金额的用户与存入100倍金额的用户中奖概率完全相同。存款金额决定您赢得的奖金总额（即整个奖池），但不增加您被选为获奖者的概率。

此设计促进公平，使协议对所有用户开放，无论钱包大小。`,
        },
        {
          title: '4. 费用结构与奖金分配',
          heading: '4.1 费用明细',
          content: `每次成功开奖时，奖池余额按以下比例分配：`,
          items: [
            { label: '销毁', value: '3%', desc: '永久销毁 — 减少TPOT总供应量（通缩压力）。仅在成功开奖时发生。' },
            { label: '平台费', value: '2%', desc: '转入协议国库用于持续开发和运营' },
            { label: '获奖者奖金', value: '95%', desc: '即时转入唯一获奖者的代币账户' },
          ],
          content2: `3%销毁不可逆，且仅在开奖成功时发生。退款轮次不产生销毁，确保未能达到人数门槛的参与者不受额外惩罚。

无奖项层级、无归属锁仓、无滚存机制——获奖者即时获得整个奖池的95%。这种简洁性最大化了获奖体验，并将智能合约复杂度降至最低。`,
          heading2: '4.2 退款机制',
          content3: `当轮次结束时参与人数不足12人：
• 所有普通存款（用户支付的TPOT）全额退回各存款人的代币账户
• 免费投注（由空投金库资助）**自动结转**至下一轮——免费投注参与者无需重新操作即保留席位
• 退款轮次不收取任何费用`,
        },
        {
          title: '5. 可验证随机性',
          heading: '5.1 开奖种子机制',
          content: `TykhePot 不依赖任何外部预言机网络获取随机数。取而代之，使用**调用方提供的开奖种子**，派生自最近已确认的 Solana 区块哈希：

1. 任意钱包在 \`round_end_time\` 到达后调用 \`execute_draw\`
2. 调用方提供32字节种子，派生自最近已确认的 Solana 区块哈希
3. 合约验证种子非零且轮次时间已到
4. 获奖者索引计算方式：\`draw_seed[0..8]（u64） % total_participant_count\`
5. 种子和获奖者记录在 \`DrawExecuted\` 链上事件中，永久可审计

获奖者选取完全由种子确定——不存在隐藏状态变量。`,
          heading2: '5.2 无许可开奖',
          content2: `TykhePot v2 的关键创新在于**任何人**均可触发开奖——不存在管理员角色。TykhePot 团队运营自动化cron服务，在每个轮次间隔结束时自动调用 \`execute_draw\`，但：

• 若团队cron服务离线，任何用户均可手动调用该指令
• 开奖指令可安全多次调用——轮次一旦开奖，后续调用将被拒绝
• 开奖调用者无任何特殊奖励——这是纯公共服务交易

这消除了单点故障的运营风险。即使核心团队消失，只要有人调用开奖，协议将无限期持续运行。`,
          heading3: '5.3 如何审计开奖',
          content4: `验证任意历史开奖：
1. 找到该轮次发出 \`DrawExecuted\` 事件的交易
2. 从事件数据中提取 \`draw_seed\` 字段
3. 计算：\`winner_index = uint64(draw_seed[0:8], 小端序) % participant_count\`
4. 获取该轮次按顺序排列的参与者PDA列表，选取索引 \`winner_index\`
5. 验证获奖者钱包与事件的 \`winner\` 字段匹配

整个过程具有确定性，无需信任TykhePot团队。`,
        },
        {
          title: '6. 空投与免费投注',
          heading: '6.1 空投领取',
          content: `任意钱包均可通过调用 \`claim_free_airdrop\` 指令一次性领取**100 TPOT**空投。代币从协议空投金库转入领取方的代币账户。

关键说明：
• 每钱包地址仅限一次，通过链上 \`AirdropClaim\` PDA强制执行
• 代币为真实TPOT——完全可转让的SPL代币
• 空投池总量：100,000,000 TPOT（总供应量10%）
• 领取后，用户获得一次免费投注权（存储在 \`AirdropClaim.has_free_claim\` 中）`,
          heading2: '6.2 免费投注机制',
          content2: `领取空投后，用户可通过调用 \`use_free_bet(pool_type)\` 在任意三个奖池中激活免费投注：

• 100 TPOT从空投金库直接转入目标奖池金库
• 创建 \`FreeDeposit\` PDA，为用户在该奖池当前轮次分配1张票
• 每次领取只能使用一次免费投注——但可用于**任意奖池**（不限于天池）
• 若轮次退款，免费投注**自动结转**至下一轮（is_active标志保持为true）
• 成功开奖后，无论免费投注者是否获奖，免费投注均被消耗（清除）

此设计意味着免费投注参与者在退款轮次中零损失——他们只需继续等待队列，直至成功开奖。`,
        },
        {
          title: '7. 推荐系统与储备配捐',
          heading: '7.1 推荐机制',
          content: `推荐系统适用于天池存款（包括免费投注）：`,
          items: [
            { label: '推荐人奖励', value: '被推荐人存款的8%', desc: '每笔成功存款后立即从推广奖励池支付' },
            { label: '被推荐人奖励', value: '一次性2%加成', desc: '仅首笔符合条件的存款适用（每钱包终身一次）' },
          ],
          content2: `两项奖励均从专用**推广奖励池**（200,000,000 TPOT，占总供应量20%）提取。池子耗尽后，推荐奖励停止——协议状态标志公开可读。`,
          heading2: '7.2 天池储备配捐',
          content3: `天池支持**1:1储备配捐**，来自储备配捐池（200,000,000 TPOT，占总供应量20%）：
• 每向天池存入1 TPOT，储备池同等贡献1 TPOT，有效翻倍参与者奖池
• 储备配捐同样适用于免费投注（100 TPOT免费投注 → 100 TPOT配捐贡献）
• 储备池耗尽后，配捐停止——奖池状态标志公开提示
• 推荐奖励和储备配捐共同使天池成为早期参与者价值最高的奖池`,
          heading3: '7.3 单一推荐人规则',
          content4: `每个钱包地址只能绑定一个推荐人，在链上强制执行。合约明确禁止自我推荐。绑定关系一旦确立，永久有效，不可更改。`,
        },
        {
          title: '8. 质押',
          heading: '8.1 概览',
          content: `TykhePot 为希望获得被动收益而不参与彩票抽奖的TPOT持有者提供链上质押功能。`,
          items: [
            { label: '短期质押', value: '30天锁仓，8% APR', desc: '承诺期较短；奖励每日累积；30天后可提取' },
            { label: '长期质押', value: '180天锁仓，48% APR', desc: '为坚定持有者提供更高收益；奖励每日累积；不支持提前退出' },
          ],
          content2: `质押奖励来自专用**质押奖励池**（350,000,000 TPOT，占总供应量35%）。合约通过 \`UserStake\` PDA独立追踪每位用户的质押索引、金额、开始时间和锁仓类型。

质押为风险厌恶型TPOT持有者提供了互补的盈利途径，而彩票奖池则为偏好高波动、高奖励参与的用户服务。`,
        },
        {
          title: '9. 安全与协议保障',
          heading: '9.1 无管理员架构',
          content: `TykhePot v2 是完全无许可的协议，无任何管理员密钥：
• 开奖可由任意钱包触发——无单一实体控制轮次结算
• 存款、免费投注、空投领取和质押均为链上自助指令
• 平台费金库是普通代币账户（由平台钱包所有）——无链上管理员账户

此设计消除了管理员密钥泄露风险，确保协议无需团队参与即可无限期运行。`,
          heading2: '9.2 存款限制',
          items: [
            { label: '最低存款 — 30分池', value: '500 TPOT' },
            { label: '最低存款 — 小时池', value: '200 TPOT' },
            { label: '最低存款 — 天池', value: '100 TPOT' },
            { label: '最低开奖参与人数', value: '12人（所有奖池）' },
          ],
          content2: `最低存款限额在链上强制执行。每个钱包每轮次仅允许一笔存款——防止单个钱包购买多张票来虚增中奖概率。`,
          heading3: '9.3 PDA架构',
          content4: `所有协议金库（奖池金库、空投金库、质押金库）均为**程序派生地址（PDA）**，专属于TykhePot程序所有。没有任何外部密钥可控制这些账户——仅程序逻辑本身可授权代币转账。

关键PDA：
• \`GlobalState\` [种子："global_state"] — 协议全局配置；拥有空投金库
• \`PoolState[n]\` [种子："pool", pool_type] — 每奖池状态；拥有各奖池金库
• \`UserDeposit\` [种子："deposit", pool_type, user, round] — 每用户存款记录
• \`FreeDeposit\` [种子："free_deposit", pool_type, user] — 每用户每奖池免费投注状态
• \`AirdropClaim\` [种子："airdrop_claim", user] — 追踪是否已领取空投`,
        },
        {
          title: '10. 技术架构',
          heading: '10.1 区块链基础设施',
          content: `基于 **Solana** 构建，原因如下：
• 高吞吐量：最高65,000 TPS
• 极低交易成本：每笔交易约$0.0001
• 亚秒级终局性：约400ms出块时间，1-2秒终局性

这些特性使亚分钟级开奖在经济上可行——在高手续费区块链上这根本无法实现。`,
          heading2: '10.2 智能合约',
          content2: `\`royalpot\` 程序使用 **Anchor 框架0.30（Rust）** 构建，具备：
• 通过 \`#[derive(Accounts)]\` 宏实现类型安全账户验证
• 基于辨别符的自动指令路由
• 链上事件（\`DrawExecuted\`、\`RoundRefunded\`）确保透明可审计性
• 部署至生产环境后无升级权限——合约不可变

关键指令：\`initialize\`、\`initialize_pool\`、\`deposit\`、\`use_free_bet\`、\`execute_draw\`、\`claim_free_airdrop\`、\`stake\`、\`unstake\``,
          heading3: '10.3 前端与Cron服务',
          content4: `基于React的网页界面提供：
• 多钱包支持：Phantom、Solflare（通过 \`@solana/wallet-adapter-react\`）
• 实时奖池统计，30秒自动刷新
• 多语言支持：英文和中文
• 开奖记录页面：每个奖池最近5期开奖数据，来源于链上事件
• 通过 \`@coral-xyz/anchor\` SDK 直接与 Anchor 程序交互

自动化Node.js cron服务在每个轮次间隔结束时调用 \`execute_draw\`。该服务无需许可——如果离线，任何用户均可手动触发开奖。`,
        },
        {
          title: '11. 路线图',
          items: [
            { label: '第一阶段 — 已完成', value: 'Devnet 部署', desc: '无管理员合约部署至 Solana devnet；所有奖池类型已上线；前端已运行' },
            { label: '第二阶段 — 进行中', value: '安全审计', desc: '第三方智能合约审计；公开漏洞赏金计划；压力测试' },
            { label: '第三阶段', value: '主网上线', desc: '代币生成事件；Solana mainnet-beta 公开上线；cron服务上线' },
            { label: '第四阶段', value: '流动性扩展', desc: 'DEX上市；跨社区合作；排行榜奖励；移动端App' },
            { label: '第五阶段', value: '治理与生态', desc: '费用参数社区治理；更多奖池变体；多链探索' },
          ],
        },
        {
          title: '12. 风险披露',
          content: `1. **市场风险**：TPOT是高度波动的数字资产，其价值可能大幅下跌甚至归零。

2. **监管风险**：彩票和赌博法规因司法管辖区不同而异。用户对遵守当地法律法规负全责。

3. **智能合约风险**：尽管经过严格开发和第三方审计，链上程序可能仍存在未发现的漏洞。

4. **流动性风险**：二级市场流动性不足可能导致按预期价格买卖TPOT困难。

5. **参与风险**：彩票结果具有概率性——不保证中奖。任何单期最低12名参与者中，11人将无法获得奖励。

6. **退款风险**：若某轮次参与人数不足12人，存款将被退还，不发放奖励。免费投注自动结转，但普通存款者需手动重新参与下一轮。

参与前请仔细评估您的财务状况和风险承受能力。切勿投入您无法承受损失的资金。`,
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
                    {item.value && <span style={styles.tableValue}>{item.value}</span>}
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
                    {item.value && <span style={styles.tableValue}>{item.value}</span>}
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
                    {item.value && <span style={styles.tableValue}>{item.value}</span>}
                    {item.desc && <span style={styles.tableDesc}>{item.desc}</span>}
                  </div>
                ))}
              </div>
            )}

            {section.content4 && (
              <p style={styles.paragraph}>{section.content4}</p>
            )}
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <p>© 2026 TykhePot Protocol. All rights reserved.</p>
        <p style={styles.footerNote}>{language === 'en' ? 'Built on Solana · Open Source · Verifiable' : '构建于 Solana · 开源 · 可验证'}</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '2rem 1.25rem',
    color: '#E0E0E0',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    padding: '2rem',
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 215, 0, 0.3)',
  },
  backLink: {
    display: 'inline-block',
    color: '#FFD700',
    textDecoration: 'none',
    marginBottom: '1.25rem',
    fontSize: '0.9rem',
    opacity: 0.8,
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#A0A0A0',
    marginBottom: '0.25rem',
  },
  version: {
    fontSize: '0.8rem',
    color: '#666',
    marginBottom: '1rem',
  },
  disclaimer: {
    fontSize: '0.78rem',
    color: '#FF6B6B',
    fontStyle: 'italic',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 107, 107, 0.08)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 107, 107, 0.2)',
    margin: '0',
  },
  toc: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid rgba(255, 215, 0, 0.15)',
  },
  tocTitle: {
    fontSize: '0.95rem',
    color: '#FFD700',
    marginBottom: '0.75rem',
    fontWeight: '600',
  },
  tocList: {
    margin: 0,
    paddingLeft: '1.25rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '0.25rem 1.5rem',
  },
  tocItem: {
    lineHeight: 1.6,
  },
  tocLink: {
    color: '#A0A0A0',
    textDecoration: 'none',
    fontSize: '0.85rem',
    transition: 'color 0.15s',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  section: {
    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid rgba(255, 215, 0, 0.15)',
    scrollMarginTop: '80px',
  },
  sectionTitle: {
    fontSize: '1.15rem',
    color: '#FFD700',
    marginBottom: '1rem',
    paddingBottom: '0.6rem',
    borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
    fontWeight: '700',
  },
  heading: {
    fontSize: '0.95rem',
    color: '#FFFFFF',
    marginTop: '1.25rem',
    marginBottom: '0.5rem',
    fontWeight: '600',
  },
  paragraph: {
    color: '#D0D0D0',
    lineHeight: 1.75,
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
    whiteSpace: 'pre-wrap',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '0.75rem',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.6rem 0.75rem',
    borderRadius: '6px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderLeft: '2px solid rgba(255, 215, 0, 0.3)',
  },
  tableLabel: {
    color: '#FFD700',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '0.15rem',
  },
  tableValue: {
    color: '#FFFFFF',
    fontSize: '0.85rem',
    fontWeight: '500',
    marginBottom: '0.1rem',
  },
  tableDesc: {
    color: '#909090',
    fontSize: '0.8rem',
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#555',
    fontSize: '0.8rem',
    lineHeight: 1.8,
  },
  footerNote: {
    color: '#444',
    fontSize: '0.75rem',
  },
};

export default Whitepaper;
