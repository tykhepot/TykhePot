import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';

const Whitepaper = () => {
  const { t, language } = useTranslation();

  const content = {
    en: {
      title: 'TykhePot Whitepaper',
      subtitle: 'Fair & Transparent On-Chain Lottery Protocol on Solana',
      version: 'v1.0 — February 2026',
      disclaimer: 'This whitepaper is for informational purposes only. Lottery participation involves financial risk. Only participate with funds you can afford to lose.',
      sections: [
        {
          title: '1. Executive Summary',
          content: `TykhePot is a fully on-chain, decentralized lottery protocol built on Solana using the Anchor framework. Named after Tykhe — the Greek goddess of fortune — TykhePot delivers verifiable, tamper-proof prize draws through cryptographic draw seeds derived from finalized Solana blockhashes.

The protocol operates three parallel prize pools with different cadences (every 30 minutes, every hour, and daily), enabling users to choose their preferred participation frequency and risk level. All deposits, prize distributions, fee burns, and referral payouts are executed transparently on-chain with no intermediaries.

Key design principles:
• Verifiability: every draw seed is emitted on-chain and anyone can independently verify winner selection
• Deflationary mechanics: 3% of every deposit is permanently burned, reducing total TPOT supply
• Community growth: an 8% referral reward system incentivizes organic user acquisition
• Prize vesting: large winnings (first-tier prizes) are released linearly over 20 days to protect winners and protocol stability`,
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
            { label: 'Airdrop Pool', value: '100,000,000 (10%)', desc: 'Free claim: 100 TPOT per wallet, one-time only' },
            { label: 'Staking Rewards', value: '350,000,000 (35%)', desc: 'Long-term staking incentives (8% APR / 48% APR)' },
            { label: 'Reserve Matching Pool', value: '200,000,000 (20%)', desc: '1:1 deposit matching for Daily Pool participants' },
            { label: 'Team Allocation', value: '100,000,000 (10%)', desc: 'Vested over 4 years, aligning long-term incentives' },
            { label: 'Referral Pool', value: '200,000,000 (20%)', desc: 'Referral rewards funded from this pool until exhausted' },
          ],
          content: `The distribution is engineered to bootstrap liquidity, reward early adopters, and ensure long-term protocol sustainability.

The Reserve Matching Pool provides 1:1 matching on Daily Pool deposits, effectively doubling the prize pool for participants while the reserve lasts — creating strong early-adoption incentives.

The Referral Pool directly funds the 8% referral reward on each referred Daily Pool deposit, enabling sustainable organic growth without diluting circulating supply.`,
        },
        {
          title: '3. Prize Pool Architecture',
          heading: '3.1 Pool Types',
          content: `TykhePot operates three independent prize pools simultaneously:`,
          items: [
            { label: 'Hourly Pool (HOUR)', value: 'Draws every ~60 minutes', desc: 'Min deposit: 200 TPOT · Min participants to draw: 3 · No free-bet · No referral bonus' },
            { label: '30-Minute Pool (MIN30)', value: 'Draws every ~30 minutes', desc: 'Min deposit: 500 TPOT · Min participants to draw: 3 · Highest frequency, smallest accumulation' },
            { label: 'Daily Pool (DAILY)', value: 'Draws at UTC 00:00', desc: 'Min deposit: 100 TPOT · Min participants to draw: 5 · Supports free-bet & 8% referral rewards' },
          ],
          content2: `Each pool accumulates deposits independently. The minimum participant thresholds (3 for HOUR/MIN30, 5 for DAILY) exist to ensure meaningful prize differentiation across winner tiers. If the threshold is not met at draw time, the draw is simply skipped — no funds are lost and the pool carries its balance into the next round.`,
          heading2: '3.2 Draw Eligibility Threshold',
          content3: `The participant thresholds serve multiple purposes:

1. **Statistical Fairness**: With very few participants, a single large depositor dominates the pool disproportionately, undermining the lottery's fairness.

2. **Prize Tier Viability**: The prize structure awards 6 distinct tiers (1st/2nd/3rd/Lucky/Universal/Rollover). A meaningful distribution requires at least 3–5 participants.

3. **Anti-Manipulation**: A minimum threshold prevents small colluding groups from trivially winning every round.

4. **Protocol Safety**: Low-participation draws are skipped rather than refunded — pool balances roll forward, keeping the prize pot growing for future rounds.`,
          heading3: '3.3 Maximum Deposit Limit',
          content4: `A hard cap of **1,000,000 TPOT per transaction** prevents whale concentration attacks and maintains meaningful prize odds for all participants. This limit is enforced in the smart contract and cannot be overridden.`,
        },
        {
          title: '4. Fee Structure & Prize Distribution',
          heading: '4.1 Fee Breakdown',
          content: `On every successful draw, the pool balance is allocated as follows:`,
          items: [
            { label: 'Burn', value: '3%', desc: 'Permanently destroyed — reduces total TPOT supply (deflationary pressure)' },
            { label: 'Platform Fee', value: '2%', desc: 'Transferred to protocol treasury for ongoing development' },
            { label: 'Prize Pool', value: '95%', desc: 'Distributed to winners according to the tier structure below' },
          ],
          content2: `The 3% burn is irreversible and cumulative — every draw permanently deflates the token supply, creating upward price pressure over time.`,
          heading2: '4.2 Winner Tier Distribution',
          items2: [
            { label: '1st Prize', value: '30% of 95%', desc: '1 winner — Grand Jackpot. Prize released via 20-day linear vesting.' },
            { label: '2nd Prize', value: '20% of 95%', desc: '2 winners — 10% each. Instant payout.' },
            { label: '3rd Prize', value: '15% of 95%', desc: '3 winners — 5% each. Instant payout.' },
            { label: 'Lucky Prize', value: '10% of 95%', desc: '5 winners — 2% each. Random selection. Instant payout.' },
            { label: 'Universal Prize', value: '20% of 95%', desc: 'All participants — equal share. Ensures no participant leaves empty-handed.' },
            { label: 'Roll Over', value: '5% of 95%', desc: 'Retained in pool — carries to next round, building progressive jackpots.' },
          ],
          content3: `Winners in tiers 2–5 and Universal receive their prizes immediately at draw time. The 1st-prize winner receives their payout through a **20-day linear vesting schedule** (5% per day) managed by a separate on-chain vesting vault, protecting both the winner and the protocol from sudden liquidity events.`,
        },
        {
          title: '5. Verifiable Randomness',
          heading: '5.1 Draw Seed Mechanism',
          content: `TykhePot does not rely on external oracle networks for randomness. Instead, it uses a **caller-provided draw seed** derived from a recently finalized Solana blockhash:

1. The draw initiator (admin or authorized caller) samples the hash of a finalized Solana block
2. This 32-byte seed is passed as a parameter to the \`draw_hourly\` / \`draw_daily\` instruction
3. The contract validates the seed is non-zero before executing the draw
4. The seed is emitted in the \`DrawCompleted\` on-chain event, making it permanently auditable

Winner selection is computed deterministically from this seed using a weighted random algorithm based on each participant's deposit proportion.`,
          heading2: '5.2 Why This Approach?',
          content2: `Finalized blockhashes on Solana are cryptographically secure and cannot be predicted in advance by any party. Since Solana achieves block finality in approximately 1–2 seconds, the draw seed is both recent and immutable by the time it is used.

Key properties:
• **Publicly verifiable**: anyone can reproduce the winner selection using the emitted seed and on-chain deposit data
• **Tamper-proof**: the seed is derived from network consensus, not from any single party
• **No oracle dependency**: eliminates the latency, cost, and availability risk of external VRF providers`,
          heading3: '5.3 Auditing a Draw',
          content4: `To verify any historical draw:
1. Fetch the \`DrawCompleted\` event for the round from on-chain logs
2. Retrieve the \`draw_seed\` field from the event
3. Replay the winner-selection algorithm (documented in the open-source contract) using the seed and the deposit snapshot
4. Compare computed winners against the emitted \`payouts\` array

The entire process is deterministic and requires no trust in the protocol team.`,
        },
        {
          title: '6. Prize Vesting System',
          heading: '6.1 20-Day Linear Vesting',
          content: `To mitigate the risk of large instant prize withdrawals destabilizing liquidity, TykhePot implements on-chain linear vesting for 1st-place winners:`,
          items: [
            { label: 'Vesting Duration', value: '20 days' },
            { label: 'Release Rate', value: '5% per day (500 basis points)' },
            { label: 'Cliff', value: 'None — vesting starts immediately after draw' },
            { label: 'Early Claim', value: 'Winners can claim any accrued amount at any time; unclaimed amounts roll forward' },
            { label: 'On-Chain Enforcement', value: 'Vesting vault is a separate PDA; winner signs their own claim transactions' },
          ],
          content: `Immediately after a draw, the admin calls \`init_vesting\` to lock the 1st-prize amount into a dedicated vesting vault PDA. The winner can then call \`claim_vested\` at any time to withdraw all accrued portions (computed as \`min(days_elapsed, 20) × 5%\`).

This design aligns winner and protocol interests: winners receive predictable, scheduled payouts while the protocol avoids sudden large outflows.`,
        },
        {
          title: '7. Referral System',
          heading: '7.1 Mechanism',
          content: `The referral system exclusively applies to Daily Pool deposits:`,
          items: [
            { label: 'Referrer Reward', value: '8% of referee\'s deposit', desc: 'Paid instantly from the Referral Pool upon draw success' },
            { label: 'Referee Bonus', value: '2% one-time bonus', desc: 'Applied on the referee\'s first qualifying deposit only (lifetime limit per wallet)' },
          ],
          content2: `Both rewards are funded from the dedicated **Referral Pool** (200,000,000 TPOT, 20% of total supply). When this pool is exhausted, referral rewards cease — referrers are notified via the protocol state flag.`,
          heading2: '7.2 Free Bet Compatibility',
          content3: `Daily Pool participants who use the **Free Bet** option (funded by the Airdrop claim) also generate referral rewards:
• Referrer earns 8 TPOT (8% of the 100 TPOT free bet)
• Referee receives 2 TPOT bonus (2%, one-time)

This ensures referral incentives remain strong even for users who have not yet purchased TPOT.`,
          heading3: '7.3 Single Referrer Rule',
          content4: `Each wallet address can only be bound to one referrer, enforced on-chain. Self-referral is explicitly prevented by the contract. Once bound, the referrer relationship is permanent and cannot be modified.`,
        },
        {
          title: '8. Airdrop & Free Bet',
          heading: '8.1 Airdrop Claim',
          content: `Any wallet can claim a one-time airdrop of **100 TPOT** by calling the \`claim_free_airdrop\` instruction. This mints tokens from the Airdrop Pool directly to the claimer's token account.

Key restrictions:
• One claim per wallet address (enforced by on-chain user state)
• Airdrop tokens are fully transferable SPL tokens
• Airdrop pool total: 100,000,000 TPOT (10% of supply)`,
          heading2: '8.2 Free Bet in Daily Pool',
          content2: `Airdrop tokens can be used in the Daily Pool via the \`deposit_daily_free\` instruction. The free bet:
• Uses 100 TPOT from the airdrop allocation
• Is eligible for 1:1 reserve matching from the Reserve Pool
• Can generate referral rewards for the user's referrer
• Counts toward the pool participant threshold

Free bets are treated identically to paid deposits for prize-drawing purposes — the smart contract makes no distinction.`,
        },
        {
          title: '9. Security & Protocol Safeguards',
          heading: '9.1 Emergency Pause',
          content: `The protocol includes an admin-controlled emergency pause mechanism. When active:
• New deposits are rejected across all pools
• Existing pool balances are preserved on-chain
• Draws can still be executed by the admin to settle active pools

The pause state is stored in the protocol's \`State\` account and is publicly readable. To prevent abuse of this mechanism, a **48-hour time lock (172,800 seconds)** is enforced between consecutive pause toggles. This prevents rapid pause/unpause cycling by any compromised admin key.`,
          heading2: '9.2 Deposit Constraints',
          items: [
            { label: 'Min deposit — Hourly', value: '200 TPOT' },
            { label: 'Min deposit — Min30', value: '500 TPOT' },
            { label: 'Min deposit — Daily', value: '100 TPOT' },
            { label: 'Max deposit (all pools)', value: '1,000,000 TPOT per transaction' },
          ],
          content2: `Both minimum and maximum limits are validated on-chain. Deposits outside these bounds are rejected with a descriptive error code.`,
          heading3: '9.3 PDA Architecture',
          content4: `All protocol vaults (pool vault, staking vault, vesting vaults) are **Program Derived Addresses (PDAs)** owned exclusively by the TykhePot program. No external key or multisig controls these accounts — only the program logic itself can authorize transfers, ensuring no custodial risk.

Vesting vault authority is a separate PDA (\`vesting_auth\`) that enables winners to self-sign claim transactions without admin involvement.`,
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
          content2: `The \`royalpot\` program is built with the **Anchor framework** (Rust), providing:
• Type-safe account validation via \`#[derive(Accounts)]\` macros
• Automatic discriminator-based instruction routing
• Comprehensive error enum with 18+ error codes (e.g., \`InsufficientBalance\`, \`AlreadyPaused\`, \`NothingToClaim\`)
• Upgradeable program authority for critical patches`,
          heading3: '10.3 Frontend',
          content4: `The React-based web interface provides:
• Multi-wallet support: Phantom, Solflare (via \`@solana/wallet-adapter-react\`)
• Real-time pool statistics with 30-second auto-refresh
• Multi-language support: English and Chinese
• Mobile-responsive design
• Direct Anchor program interaction via \`@coral-xyz/anchor\` SDK`,
        },
        {
          title: '11. Roadmap',
          items: [
            { label: 'Phase 1 — Complete', value: 'Devnet Deployment', desc: 'Core contract deployed on Solana devnet; all pool types operational; frontend live' },
            { label: 'Phase 2 — In Progress', value: 'Security Audit', desc: 'Third-party smart contract audit; public bug bounty program' },
            { label: 'Phase 3', value: 'Mainnet Launch', desc: 'Token generation event; public launch on Solana mainnet-beta' },
            { label: 'Phase 4', value: 'Liquidity Expansion', desc: 'DEX listings; cross-community partnerships; leaderboard rewards' },
            { label: 'Phase 5', value: 'Governance & Ecosystem', desc: 'Community governance for fee parameters; mobile app; additional pool variants' },
          ],
        },
        {
          title: '12. Risk Disclosure',
          content: `1. **Market Risk**: TPOT is a highly volatile digital asset. Its value may decrease significantly or go to zero.

2. **Regulatory Risk**: Lottery and gambling regulations vary by jurisdiction. Users are solely responsible for compliance with their local laws.

3. **Smart Contract Risk**: Despite rigorous development practices, on-chain programs may contain undiscovered vulnerabilities.

4. **Liquidity Risk**: Thin secondary market liquidity may make it difficult to buy or sell TPOT at desired prices.

5. **Participation Risk**: Lottery outcomes are probabilistic — there is no guarantee of winning. The majority of participants will not receive prizes in any given round.

6. **Operational Risk**: The protocol's draw mechanism depends on an authorized admin initiating draws on schedule. Delays or outages may affect draw timing.

Please carefully evaluate your financial situation and risk tolerance before participating. Never deposit funds you cannot afford to lose.`,
        }
      ]
    },
    zh: {
      title: 'TykhePot 白皮书',
      subtitle: 'Solana 链上公平透明彩票协议',
      version: 'v1.0 — 2026年2月',
      disclaimer: '本白皮书仅供参考。参与彩票涉及财务风险，请勿投入超出您承受能力的资金。',
      sections: [
        {
          title: '1. 执行摘要',
          content: `TykhePot 是基于 Solana 区块链、使用 Anchor 框架构建的全链上去中心化彩票协议。以希腊幸运女神堤喀（Tykhe）命名，TykhePot 通过从 Solana 已确认区块哈希派生的加密开奖种子，实现可验证、防篡改的公平开奖。

协议运营三个独立奖池（每30分钟、每小时、每日），用户可根据自身偏好选择参与频率和风险等级。所有存款、奖金分配、手续费销毁和推荐奖励均通过链上指令透明执行，无任何中介。

核心设计原则：
• 可验证性：每次开奖种子均上链记录，任何人均可独立验证获奖结果
• 通缩机制：每笔存款的3%永久销毁，持续减少TPOT流通总量
• 社区增长：8%推荐奖励体系激励有机用户增长
• 奖金归属：大额头奖通过20天线性归属释放，保护获奖者与协议稳定性`,
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
            { label: '空投池', value: '100,000,000 (10%)', desc: '免费领取：每个钱包100 TPOT，一次性' },
            { label: '质押奖励池', value: '350,000,000 (35%)', desc: '长期质押激励（8% APR / 48% APR）' },
            { label: '储备配捐池', value: '200,000,000 (20%)', desc: '天池参与者1:1存款配捐' },
            { label: '团队分配', value: '100,000,000 (10%)', desc: '4年归属，与长期激励对齐' },
            { label: '推广奖励池', value: '200,000,000 (20%)', desc: '推荐奖励来源，耗尽即止' },
          ],
          content: `分配方案旨在启动流动性、奖励早期参与者并确保协议长期可持续发展。

储备配捐池对天池存款提供1:1配捐，在储备充足期间有效翻倍参与者奖池规模，形成强烈的早期参与激励。

推广奖励池直接资助每笔被推荐天池存款的8%推荐奖励，实现可持续有机增长，无需稀释流通供应量。`,
        },
        {
          title: '3. 奖池架构',
          heading: '3.1 奖池类型',
          content: `TykhePot 同时运营三个独立奖池：`,
          items: [
            { label: '小时池（HOUR）', value: '约每60分钟开奖', desc: '最低投入：200 TPOT · 开奖最低人数：3人 · 不支持免费投注和推荐奖励' },
            { label: '30分池（MIN30）', value: '约每30分钟开奖', desc: '最低投入：500 TPOT · 开奖最低人数：3人 · 频率最高，奖池积累较小' },
            { label: '天池（DAILY）', value: 'UTC 00:00开奖', desc: '最低投入：100 TPOT · 开奖最低人数：5人 · 支持免费投注和8%推荐奖励' },
          ],
          content2: `每个奖池独立累积存款。最低参与人数阈值（HOUR/MIN30为3人，DAILY为5人）旨在确保跨奖项层级的有意义奖金差异。若开奖时未达阈值，本轮开奖跳过——资金不丢失，奖池余额滚入下一期。`,
          heading2: '3.2 开奖资格阈值',
          content3: `参与人数阈值的设立有多重目的：

1. **统计公平性**：参与者极少时，单个大额存款者的比重失衡，破坏彩票公平性。

2. **奖项层级可行性**：奖金结构设有6个层级（头奖/二等/三等/幸运/普惠/滚存）。有意义的分配至少需要3-5名参与者。

3. **防操纵**：最低阈值防止少数共谋参与者轻易控制每轮结果。

4. **协议安全**：低参与度轮次跳过而非退款——奖池余额滚入下一期，奖池持续累积。`,
          heading3: '3.3 最高存款限额',
          content4: `合约硬性规定每笔交易最高投入**1,000,000 TPOT**，防止巨鲸集中攻击，为所有参与者维护有意义的中奖概率。此限额在智能合约中强制执行，不可绕过。`,
        },
        {
          title: '4. 费用结构与奖金分配',
          heading: '4.1 费用明细',
          content: `每次成功开奖时，奖池余额按以下比例分配：`,
          items: [
            { label: '销毁', value: '3%', desc: '永久销毁 — 减少TPOT总供应量（通缩压力）' },
            { label: '平台费', value: '2%', desc: '转入协议国库用于持续开发' },
            { label: '奖池', value: '95%', desc: '按以下层级结构分配给获奖者' },
          ],
          content2: `3%销毁不可逆且累积——每次开奖永久通缩代币供应量，随时间推移产生上行价格压力。`,
          heading2: '4.2 获奖层级分配',
          items2: [
            { label: '头奖', value: '95%的30%', desc: '1人 — 超级大奖。奖金通过20天线性归属释放。' },
            { label: '二等奖', value: '95%的20%', desc: '2人 — 各10%。即时到账。' },
            { label: '三等奖', value: '95%的15%', desc: '3人 — 各5%。即时到账。' },
            { label: '幸运奖', value: '95%的10%', desc: '5人 — 各2%。随机抽选。即时到账。' },
            { label: '普惠奖', value: '95%的20%', desc: '所有参与者 — 等额分配。确保无人空手而归。' },
            { label: '滚存', value: '95%的5%', desc: '保留在奖池 — 滚入下一期，形成累积头奖。' },
          ],
          content3: `二等奖至普惠奖获奖者在开奖时立即收到奖金。头奖获奖者的奖金通过**20天线性归属计划**（每天5%）释放，由独立的链上归属金库PDA管理，保护获奖者和协议免受突发大额流动性冲击。`,
        },
        {
          title: '5. 可验证随机性',
          heading: '5.1 开奖种子机制',
          content: `TykhePot 不依赖任何外部预言机网络获取随机数。取而代之，使用**调用方提供的开奖种子**，派生自最近已确认的 Solana 区块哈希：

1. 开奖发起方（管理员或授权调用方）采样一个已确认 Solana 区块的哈希
2. 这32字节种子作为参数传入 \`draw_hourly\` / \`draw_daily\` 指令
3. 合约验证种子非零后执行开奖
4. 种子记录在 \`DrawCompleted\` 链上事件中，永久可审计

获奖者选取基于此种子，以每位参与者的存款比例为权重，通过确定性算法计算。`,
          heading2: '5.2 为何选择此方案？',
          content2: `Solana 已确认区块哈希具备加密安全性，任何参与方均无法提前预测。由于 Solana 区块终局性约需1-2秒，开奖种子在使用时既近期又不可篡改。

核心优势：
• **公开可验证**：任何人均可利用已发布的种子和链上存款数据复现获奖者选取过程
• **防篡改**：种子来自网络共识，而非任何单一方
• **无预言机依赖**：消除外部VRF服务提供商的延迟、成本和可用性风险`,
          heading3: '5.3 如何审计开奖',
          content4: `验证任意历史开奖：
1. 从链上日志获取该期的 \`DrawCompleted\` 事件
2. 提取事件中的 \`draw_seed\` 字段
3. 使用种子和存款快照重放获奖者选取算法（详见开源合约文档）
4. 将计算得出的获奖者与事件中的 \`payouts\` 数组对比

整个过程具有确定性，无需信任协议团队。`,
        },
        {
          title: '6. 奖金归属系统',
          heading: '6.1 20天线性归属',
          content: `为降低大额即时奖金提取对流动性的冲击风险，TykhePot 对头奖获奖者实施链上线性归属：`,
          items: [
            { label: '归属期限', value: '20天' },
            { label: '释放速率', value: '每天5%（500基点）' },
            { label: '锁仓期', value: '无 — 开奖后立即开始归属' },
            { label: '提前认领', value: '获奖者可随时认领已归属部分；未认领金额自动滚转' },
            { label: '链上执行', value: '归属金库为独立PDA；获奖者自主签署认领交易，无需管理员介入' },
          ],
          content: `开奖后，管理员调用 \`init_vesting\` 将头奖金额锁入专用归属金库PDA。获奖者随后可随时调用 \`claim_vested\` 提取已归属部分（计算方式：\`min(已过天数, 20) × 5%\`）。

此设计平衡了获奖者和协议双方利益：获奖者获得可预期的分期付款，协议避免突发大额资金流出。`,
        },
        {
          title: '7. 推荐系统',
          heading: '7.1 机制说明',
          content: `推荐系统仅适用于天池存款：`,
          items: [
            { label: '推荐人奖励', value: '被推荐人存款的8%', desc: '开奖成功后立即从推广奖励池支付' },
            { label: '被推荐人奖励', value: '一次性2%加成', desc: '仅首笔符合条件的存款适用（每钱包终身一次）' },
          ],
          content2: `两项奖励均从专用**推广奖励池**（200,000,000 TPOT，占总供应量20%）提取。池子耗尽后，推荐奖励停止——协议状态标志对外公示。`,
          heading2: '7.2 免费投注兼容性',
          content3: `使用**免费投注**选项（由空投领取资金支持）的天池参与者同样产生推荐奖励：
• 推荐人获得8 TPOT（100 TPOT免费投注的8%）
• 被推荐人获得2 TPOT加成（2%，一次性）

这确保即使尚未购买TPOT的用户，也能为推荐人带来有效激励。`,
          heading3: '7.3 单一推荐人规则',
          content4: `每个钱包地址只能绑定一个推荐人，在链上强制执行。合约明确禁止自我推荐。绑定关系一旦确立，永久有效，不可更改。`,
        },
        {
          title: '8. 空投与免费投注',
          heading: '8.1 空投领取',
          content: `任意钱包均可通过调用 \`claim_free_airdrop\` 指令一次性领取**100 TPOT**空投。代币从空投池直接铸造至领取方的代币账户。

关键限制：
• 每钱包地址仅限一次（由链上用户状态强制执行）
• 空投代币为完全可转让的SPL代币
• 空投池总量：100,000,000 TPOT（总供应量10%）`,
          heading2: '8.2 天池免费投注',
          content2: `空投代币可通过 \`deposit_daily_free\` 指令用于天池免费投注：
• 使用100 TPOT空投额度
• 可获得来自储备配捐池的1:1配捐
• 可为用户推荐人产生推荐奖励
• 计入奖池参与人数阈值

免费投注在开奖目的上与付费存款完全等同——智能合约不作任何区分。`,
        },
        {
          title: '9. 安全与协议保障',
          heading: '9.1 紧急暂停',
          content: `协议包含管理员控制的紧急暂停机制。激活时：
• 所有奖池的新存款被拒绝
• 现有奖池余额在链上完整保留
• 管理员仍可执行开奖以结算活跃奖池

暂停状态存储在协议的 \`State\` 账户中，公开可读。为防止机制被滥用，连续两次暂停切换之间强制执行**48小时时间锁（172,800秒）**，防止任何泄露的管理员密钥快速循环暂停/恢复。`,
          heading2: '9.2 存款限制',
          items: [
            { label: '最低存款 — 小时池', value: '200 TPOT' },
            { label: '最低存款 — 30分池', value: '500 TPOT' },
            { label: '最低存款 — 天池', value: '100 TPOT' },
            { label: '最高存款（所有奖池）', value: '每笔交易1,000,000 TPOT' },
          ],
          content2: `最低和最高限额均在链上验证。超出范围的存款将被拒绝并返回描述性错误代码。`,
          heading3: '9.3 PDA架构',
          content4: `所有协议金库（奖池金库、质押金库、归属金库）均为**程序派生地址（PDA）**，专属于TykhePot程序所有。没有任何外部密钥或多签可控制这些账户——仅程序逻辑本身可授权转账，确保无托管风险。

归属金库授权方为独立PDA（\`vesting_auth\`），使获奖者无需管理员介入即可自主签署认领交易。`,
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
          content2: `\`royalpot\` 程序使用 **Anchor 框架（Rust）** 构建，具备：
• 通过 \`#[derive(Accounts)]\` 宏实现类型安全账户验证
• 基于辨别符的自动指令路由
• 包含18+错误代码的完整错误枚举（如 \`InsufficientBalance\`、\`AlreadyPaused\`、\`NothingToClaim\`）
• 可升级程序授权，支持关键补丁`,
          heading3: '10.3 前端',
          content4: `基于React的网页界面提供：
• 多钱包支持：Phantom、Solflare（通过 \`@solana/wallet-adapter-react\`）
• 实时奖池统计，30秒自动刷新
• 多语言支持：英文和中文
• 移动端响应式设计
• 通过 \`@coral-xyz/anchor\` SDK 直接与 Anchor 程序交互`,
        },
        {
          title: '11. 路线图',
          items: [
            { label: '第一阶段 — 已完成', value: 'Devnet 部署', desc: '核心合约部署至 Solana devnet；所有奖池类型已上线；前端已运行' },
            { label: '第二阶段 — 进行中', value: '安全审计', desc: '第三方智能合约审计；公开漏洞赏金计划' },
            { label: '第三阶段', value: '主网上线', desc: '代币生成事件；Solana mainnet-beta 公开上线' },
            { label: '第四阶段', value: '流动性扩展', desc: 'DEX上市；跨社区合作；排行榜奖励' },
            { label: '第五阶段', value: '治理与生态', desc: '费用参数社区治理；移动端App；更多奖池变体' },
          ],
        },
        {
          title: '12. 风险披露',
          content: `1. **市场风险**：TPOT是高度波动的数字资产，其价值可能大幅下跌甚至归零。

2. **监管风险**：彩票和赌博法规因司法管辖区不同而异。用户对遵守当地法律法规负全责。

3. **智能合约风险**：尽管开发严谨，链上程序可能存在未发现的漏洞。

4. **流动性风险**：二级市场流动性不足可能导致按预期价格买卖TPOT困难。

5. **参与风险**：彩票结果具有概率性——不保证中奖。任何单期大多数参与者将无法获得奖励。

6. **运营风险**：协议开奖机制依赖授权管理员按时发起开奖。延迟或中断可能影响开奖时间。

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
