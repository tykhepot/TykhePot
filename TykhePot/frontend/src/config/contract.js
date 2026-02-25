// ─── Program Config ───────────────────────────────────────────────────────────
export const PROGRAM_ID  = "5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b";
export const TOKEN_MINT  = "FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY";
export const NETWORK     = "devnet";
export const RPC_ENDPOINT = "https://api.devnet.solana.com";

// ─── Pool Types ───────────────────────────────────────────────────────────────
export const POOL_TYPE = { MIN30: 0, HOURLY: 1, DAILY: 2 };

// ─── PDAs (derived deterministically, no deploy-time update needed) ──────────
// GlobalState:  seeds = [b"global_state"]
// PoolState:    seeds = [b"pool", &[pool_type]]  (pool_type = 0/1/2)
// AirdropState: seeds = [b"airdrop_state"]
// StakingState: seeds = [b"staking_state"]

// ─── Vault Token Accounts (created at initialize_pool / initialize time) ──────
// All pool vaults: authority = PoolState PDA
// airdrop_vault:   authority = GlobalState PDA  [b"global_state"]
// staking_vault:   authority = staking auth PDA [b"staking"]
// vesting_vault:   authority = vesting PDA      [b"vesting", beneficiary]

// Pool Vaults — fill in after deploy
export const POOL_30MIN_VAULT  = ""; // authority = PoolState[0] PDA
export const POOL_HOURLY_VAULT = ""; // authority = PoolState[1] PDA
export const POOL_DAILY_VAULT  = ""; // authority = PoolState[2] PDA

// Airdrop source vault (funds free bets; authority = GlobalState PDA)
export const AIRDROP_VAULT     = "";

// Platform fee destination (plain wallet token account, no PDA)
// Wallet: F4dQpEz69oQhhsYGiCASbPNAg3XaoGggbHAeuytqZtrm
export const PLATFORM_FEE_VAULT = "";

// Staking / vesting vaults (unchanged from old deploy)
export const STAKING_VAULT = "5CAwNZje1nyPRAKiLfPhsUAjNQu52Ymvzdo1iXBfatNt";
export const VESTING_VAULT = "939dBwYK6epmmUTAmYAco9cnCp3Vxa8MV27HBDmd3JYR";

// Platform fee wallet (controls PLATFORM_FEE_VAULT)
export const PLATFORM_FEE_WALLET = "F4dQpEz69oQhhsYGiCASbPNAg3XaoGggbHAeuytqZtrm";

// ─── Pool Params ──────────────────────────────────────────────────────────────
export const POOL_CONFIG = {
  [POOL_TYPE.MIN30]:  { label: "30 Min",  duration: 1800,  minDeposit: 500  },
  [POOL_TYPE.HOURLY]: { label: "1 Hour",  duration: 3600,  minDeposit: 200  },
  [POOL_TYPE.DAILY]:  { label: "1 Day",   duration: 86400, minDeposit: 100  },
};
export const MIN_PARTICIPANTS = 12;
export const FREE_BET_AMOUNT  = 100; // TPOT
export const TPOT_DECIMALS    = 9;
export const TPOT_UNIT        = 1_000_000_000n; // 1 TPOT in raw
