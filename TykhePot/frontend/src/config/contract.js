// ─── 合约基础配置 ─────────────────────────────────────────────────────────────
export const PROGRAM_ID = "5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b";
export const TOKEN_MINT = "FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY";
export const NETWORK = "devnet";
export const RPC_ENDPOINT = "https://api.devnet.solana.com";

// ─── PDA（程序自动推导，部署后保持固定）────────────────────────────────────────
// state PDA: seeds = ["state"]
export const STATE_PDA = "61d5xwLqPCAKS3FoEW3crpKnCAx3S5V8jM35NPrjEFbP";

// ─── Vault Token Accounts（部署时创建，需手动填写地址）────────────────────────
// 所有 vault 必须以 state PDA 为 authority（draw 指令使用 PDA 签名转账）
// staking_vault 以 staking authority PDA [b"staking"] 为 authority

// 销毁账户（TPOT token account，持有并销毁 burn 份额）
export const BURN_VAULT = "";

// 平台收益账户（TPOT token account）
export const PLATFORM_VAULT = "";

// 小时池奖金账户（authority = state PDA）
export const HOURLY_POOL_VAULT = "";

// 日池奖金账户（authority = state PDA）
export const DAILY_POOL_VAULT = "";

// 推荐奖励池账户（authority = state PDA）
export const REFERRAL_VAULT = "";

// 免费空投账户，100 TPOT/人（authority = airdrop PDA [b"airdrop"]）
export const AIRDROP_VAULT = "";

// 质押金库账户（authority = staking PDA [b"staking"]）
export const STAKING_VAULT = "";

// 归属奖金金库（authority = vesting_auth PDA [b"vesting_auth"]）
// 用于 init_vesting 锁定奖金，由 claim_vested 按天解锁
export const VESTING_VAULT = "";
