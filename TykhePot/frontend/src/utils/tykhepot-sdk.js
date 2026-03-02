/**
 * TykhePot SDK v3 — No-admin, permissionless multi-winner architecture
 *
 * Pool types: 0 = 30min, 1 = hourly, 2 = daily
 * All draws are permissionless (anyone can trigger after round_end_time).
 * Winner selection via partial Fisher-Yates (11 distinct winners from N participants).
 * Top prizes (1st/2nd/3rd) vest over 20 days at 5%/day via claim_prize_vesting.
 * Lucky (×5) and Universal prizes paid immediately on draw.
 * Free bet: DAILY POOL ONLY. Reserve matching: DAILY POOL ONLY (1:1).
 * Referral: 8% from referral_vault, paid AFTER successful draw via claim_referral().
 *   - On deposit: referrer's token account pubkey is stored in UserDeposit.referrer.
 *   - On draw: cron calls claimReferral() for each deposit with a non-default referrer.
 *   - On refund: no referral paid (referrer field remains set but no DrawResult exists).
 */

import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  PROGRAM_ID,
  TOKEN_MINT,
  RPC_ENDPOINT,
  POOL_TYPE,
  POOL_30MIN_VAULT,
  POOL_HOURLY_VAULT,
  POOL_DAILY_VAULT,
  AIRDROP_VAULT,
  PLATFORM_FEE_VAULT,
  REFERRAL_VAULT,
  RESERVE_VAULT,
  PRIZE_ESCROW_VAULT,
  TPOT_DECIMALS,
} from "../config/contract";

// ─── IDL ─────────────────────────────────────────────────────────────────────
const IDL = {
  version: "0.2.0",
  name: "royalpot",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "payer",        isMut: true,  isSigner: true  },
        { name: "globalState",  isMut: true,  isSigner: false },
        { name: "tokenMint",    isMut: false, isSigner: false },
        { name: "airdropVault", isMut: false, isSigner: false },
        { name: "systemProgram",isMut: false, isSigner: false },
      ],
      args: [
        { name: "platformFeeVault", type: "publicKey" },
        { name: "referralVault",    type: "publicKey" },
        { name: "reserveVault",     type: "publicKey" },
        { name: "prizeEscrowVault", type: "publicKey" },
        { name: "timelockDuration", type: { option: "i64" } },
      ],
    },
    {
      name: "initializePool",
      accounts: [
        { name: "payer",      isMut: true,  isSigner: true  },
        { name: "poolState",  isMut: true,  isSigner: false },
        { name: "poolVault",  isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "poolType",          type: "u8"  },
        { name: "initialStartTime",  type: "i64" },
      ],
    },
    {
      name: "deposit",
      accounts: [
        { name: "user",              isMut: true,  isSigner: true  },
        { name: "poolState",         isMut: true,  isSigner: false },
        { name: "userDeposit",       isMut: true,  isSigner: false },
        { name: "userTokenAccount",  isMut: true,  isSigner: false },
        { name: "poolVault",         isMut: true,  isSigner: false },
        { name: "globalState",       isMut: false, isSigner: false },
        { name: "reserveVault",      isMut: true,  isSigner: false },
        { name: "tokenProgram",      isMut: false, isSigner: false },
        { name: "systemProgram",     isMut: false, isSigner: false },
      ],
      // remaining_accounts[0] (optional, read-only): referrer's token account pubkey.
      // Stored in UserDeposit.referrer for deferred 8% payout via claimReferral().
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "useFreeBet",
      accounts: [
        { name: "user",          isMut: true,  isSigner: true  },
        { name: "globalState",   isMut: false, isSigner: false },
        { name: "poolState",     isMut: true,  isSigner: false },
        { name: "airdropClaim",  isMut: true,  isSigner: false },
        { name: "freeDeposit",   isMut: true,  isSigner: false },
        { name: "airdropVault",  isMut: true,  isSigner: false },
        { name: "poolVault",     isMut: true,  isSigner: false },
        { name: "tokenProgram",  isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "poolType", type: "u8" }],
    },
    {
      name: "executeDraw",
      accounts: [
        { name: "caller",            isMut: true,  isSigner: true  },
        { name: "poolState",         isMut: true,  isSigner: false },
        { name: "poolVault",         isMut: true,  isSigner: false },
        { name: "tokenMint",         isMut: true,  isSigner: false },
        { name: "platformVault",     isMut: true,  isSigner: false },
        { name: "prizeEscrowVault",  isMut: true,  isSigner: false },
        { name: "globalState",       isMut: false, isSigner: false },
        { name: "drawResult",        isMut: true,  isSigner: false },
        { name: "tokenProgram",      isMut: false, isSigner: false },
        { name: "systemProgram",     isMut: false, isSigner: false },
      ],
      // remaining_accounts: (user_deposit_pda, user_token_account) × regular_count
      //                   + (free_deposit_pda, user_token_account)  × free_count
      args: [{ name: "drawSeed", type: { array: ["u8", 32] } }],
    },
    {
      name: "executeRefund",
      accounts: [
        { name: "caller",       isMut: false, isSigner: true  },
        { name: "poolState",    isMut: true,  isSigner: false },
        { name: "poolVault",    isMut: true,  isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      // remaining_accounts: (user_deposit_pda, user_token_account) × regular_count
      args: [],
    },
    {
      name: "claimPrizeVesting",
      accounts: [
        { name: "caller",              isMut: false, isSigner: true  },
        { name: "drawResult",          isMut: true,  isSigner: false },
        { name: "globalState",         isMut: false, isSigner: false },
        { name: "prizeEscrowVault",    isMut: true,  isSigner: false },
        { name: "winnerTokenAccount",  isMut: true,  isSigner: false },
        { name: "tokenProgram",        isMut: false, isSigner: false },
      ],
      args: [{ name: "winnerIndex", type: "u8" }],
    },
    {
      name: "claimFreeAirdrop",
      accounts: [
        { name: "user",          isMut: true,  isSigner: true  },
        { name: "airdropClaim",  isMut: true,  isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      // Permissionless — cron calls this after successful draw for each deposit with a referrer.
      // Pays 8% of deposit.amount from referral_vault to the stored referrer token account.
      // Clears deposit.referrer to prevent double-claim.
      name: "claimReferral",
      accounts: [
        { name: "caller",                isMut: false, isSigner: true  },
        { name: "drawResult",            isMut: false, isSigner: false },
        { name: "userDeposit",           isMut: true,  isSigner: false },
        { name: "globalState",           isMut: false, isSigner: false },
        { name: "referralVault",         isMut: true,  isSigner: false },
        { name: "referrerTokenAccount",  isMut: true,  isSigner: false },
        { name: "tokenProgram",          isMut: false, isSigner: false },
      ],
      args: [
        { name: "poolType",    type: "u8"  },
        { name: "roundNumber", type: "u64" },
      ],
    },
    // ── Staking ──────────────────────────────────────────────────────────────
    {
      name: "initializeStaking",
      accounts: [
        { name: "payer",        isMut: true,  isSigner: true  },
        { name: "stakingState", isMut: true,  isSigner: false },
        { name: "tokenMint",    isMut: false, isSigner: false },
        { name: "systemProgram",isMut: false, isSigner: false },
      ],
      args: [
        { name: "shortTermPool", type: "u64" },
        { name: "longTermPool",  type: "u64" },
      ],
    },
    // ── VRF Randomness ──────────────────────────────────────────────────────
    {
      name: "initializeVrf",
      accounts: [
        { name: "authority", isMut: true,  isSigner: true  },
        { name: "vrfState",  isMut: true,  isSigner: false },
        { name: "vrf",       isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "requestVrf",
      accounts: [
        { name: "caller",     isMut: true,  isSigner: true  },
        { name: "vrfState",   isMut: true,  isSigner: false },
        { name: "poolState",  isMut: false, isSigner: false },
        { name: "vrf",        isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "poolType", type: "u8" }],
    },
    {
      name: "executeDrawVrf",
      accounts: [
        { name: "caller",            isMut: true,  isSigner: true  },
        { name: "vrfState",          isMut: true,  isSigner: false },
        { name: "poolState",         isMut: true,  isSigner: false },
        { name: "poolVault",         isMut: true,  isSigner: false },
        { name: "tokenMint",         isMut: true,  isSigner: false },
        { name: "platformVault",     isMut: true,  isSigner: false },
        { name: "prizeEscrowVault",  isMut: true,  isSigner: false },
        { name: "globalState",       isMut: false, isSigner: false },
        { name: "drawResult",        isMut: true,  isSigner: false },
        { name: "vrf",               isMut: false, isSigner: false },
        { name: "tokenProgram",      isMut: false, isSigner: false },
        { name: "systemProgram",     isMut: false, isSigner: false },
      ],
      args: [],
    },
    // ── Timelock Admin ───────────────────────────────────────────────────────
    {
      name: "schedulePause",
      accounts: [
        { name: "authority",   isMut: false, isSigner: true  },
        { name: "globalState", isMut: true,  isSigner: false },
      ],
      args: [],
    },
    {
      name: "executePause",
      accounts: [
        { name: "authority",   isMut: false, isSigner: true  },
        { name: "globalState", isMut: true,  isSigner: false },
      ],
      args: [],
    },
    {
      name: "scheduleUnpause",
      accounts: [
        { name: "authority",   isMut: false, isSigner: true  },
        { name: "globalState", isMut: true,  isSigner: false },
      ],
      args: [],
    },
    {
      name: "executeUnpause",
      accounts: [
        { name: "authority",   isMut: false, isSigner: true  },
        { name: "globalState", isMut: true,  isSigner: false },
      ],
      args: [],
    },
    {
      name: "cancelTimelock",
      accounts: [
        { name: "authority",   isMut: false, isSigner: true  },
        { name: "globalState", isMut: true,  isSigner: false },
      ],
      args: [],
    },
    {
      name: "closeGlobalState",
      accounts: [
        { name: "authority",   isMut: false, isSigner: true  },
        { name: "globalState", isMut: true,  isSigner: false },
        { name: "recipient",   isMut: true,  isSigner: false },
      ],
      args: [],
    },
    {
      name: "closePoolState",
      accounts: [
        { name: "authority",   isMut: false, isSigner: true  },
        { name: "globalState", isMut: false, isSigner: false },
        { name: "poolState",   isMut: true,  isSigner: false },
        { name: "recipient",   isMut: true,  isSigner: false },
      ],
      args: [{ name: "poolType", type: "u8" }],
    },
    // ── Staking (continued) ──────────────────────────────────────────────────
    {
      name: "stake",
      accounts: [
        { name: "user",          isMut: true,  isSigner: true  },
        { name: "stakingState",  isMut: true,  isSigner: false },
        { name: "userStake",     isMut: true,  isSigner: false },
        { name: "userToken",     isMut: true,  isSigner: false },
        { name: "stakingVault",  isMut: true,  isSigner: false },
        { name: "tokenProgram",  isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "stakeIndex", type: "u64" },
        { name: "amount",     type: "u64" },
        { name: "stakeType",  type: { defined: "StakeType" } },
      ],
    },
    {
      name: "releaseStake",
      accounts: [
        { name: "user",             isMut: true,  isSigner: true  },
        { name: "stakingState",     isMut: true,  isSigner: false },
        { name: "userStake",        isMut: true,  isSigner: false },
        { name: "userToken",        isMut: true,  isSigner: false },
        { name: "stakingVault",     isMut: true,  isSigner: false },
        { name: "stakingAuthority", isMut: false, isSigner: false },
        { name: "tokenProgram",     isMut: false, isSigner: false },
      ],
      args: [{ name: "stakeIndex", type: "u64" }],
    },
    {
      name: "earlyWithdraw",
      accounts: [
        { name: "user",             isMut: true,  isSigner: true  },
        { name: "stakingState",     isMut: true,  isSigner: false },
        { name: "userStake",        isMut: true,  isSigner: false },
        { name: "userToken",        isMut: true,  isSigner: false },
        { name: "stakingVault",     isMut: true,  isSigner: false },
        { name: "stakingAuthority", isMut: false, isSigner: false },
        { name: "tokenProgram",     isMut: false, isSigner: false },
      ],
      args: [{ name: "stakeIndex", type: "u64" }],
    },
    // ── Profit Airdrop ────────────────────────────────────────────────────────
    {
      name: "initializeAirdrop",
      accounts: [
        { name: "payer",        isMut: true,  isSigner: true  },
        { name: "airdropState", isMut: true,  isSigner: false },
        { name: "tokenMint",    isMut: false, isSigner: false },
        { name: "systemProgram",isMut: false, isSigner: false },
      ],
      args: [{ name: "totalAirdrop", type: "u64" }],
    },
    {
      name: "recordProfit",
      accounts: [
        { name: "payer",        isMut: true,  isSigner: true  },
        { name: "user",         isMut: false, isSigner: false },
        { name: "airdropState", isMut: true,  isSigner: false },
        { name: "userAirdrop",  isMut: true,  isSigner: false },
        { name: "systemProgram",isMut: false, isSigner: false },
      ],
      args: [{ name: "profitAmount", type: "u64" }],
    },
    {
      name: "claimProfitAirdrop",
      accounts: [
        { name: "user",             isMut: true,  isSigner: true  },
        { name: "airdropState",     isMut: true,  isSigner: false },
        { name: "userAirdrop",      isMut: true,  isSigner: false },
        { name: "userToken",        isMut: true,  isSigner: false },
        { name: "airdropVault",     isMut: true,  isSigner: false },
        { name: "airdropAuthority", isMut: false, isSigner: false },
        { name: "tokenProgram",     isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "GlobalState",
      type: {
        kind: "struct",
        fields: [
          { name: "tokenMint",        type: "publicKey" },
          { name: "platformFeeVault", type: "publicKey" },
          { name: "airdropVault",     type: "publicKey" },
          { name: "referralVault",    type: "publicKey" },
          { name: "reserveVault",     type: "publicKey" },
          { name: "prizeEscrowVault", type: "publicKey" },
          { name: "authority",        type: "publicKey" },
          { name: "isPaused",         type: "bool"      },
          { name: "timelockDuration", type: "i64"       },
          { name: "pendingOperation", type: "u8"        },
          { name: "timelockRelease",  type: "i64"       },
          { name: "bump",             type: "u8"        },
        ],
      },
    },
    {
      name: "PoolState",
      type: {
        kind: "struct",
        fields: [
          { name: "poolType",       type: "u8"  },
          { name: "roundNumber",    type: "u64" },
          { name: "roundStartTime", type: "i64" },
          { name: "roundEndTime",   type: "i64" },
          { name: "totalDeposited", type: "u64" },
          { name: "freeBetTotal",   type: "u64" },
          { name: "regularCount",   type: "u32" },
          { name: "freeCount",      type: "u32" },
          { name: "vault",          type: "publicKey" },
          { name: "rollover",       type: "u64" },
          { name: "bump",           type: "u8"  },
        ],
      },
    },
    {
      name: "UserDeposit",
      type: {
        kind: "struct",
        fields: [
          { name: "user",        type: "publicKey" },
          { name: "poolType",    type: "u8"        },
          { name: "roundNumber", type: "u64"       },
          { name: "amount",      type: "u64"       },
          // Pubkey::default() = no referrer. Cleared after claimReferral() pays out.
          { name: "referrer",    type: "publicKey" },
          { name: "bump",        type: "u8"        },
        ],
      },
    },
    {
      name: "FreeDeposit",
      type: {
        kind: "struct",
        fields: [
          { name: "user",     type: "publicKey" },
          { name: "poolType", type: "u8"        },
          { name: "isActive", type: "bool"      },
          { name: "amount",   type: "u64"       },
          // Always Pubkey::default() — free bets carry no referral obligation.
          { name: "referrer", type: "publicKey" },
          { name: "bump",     type: "u8"        },
        ],
      },
    },
    {
      name: "AirdropClaim",
      type: {
        kind: "struct",
        fields: [
          { name: "user",             type: "publicKey" },
          { name: "freeBetAvailable", type: "bool"      },
          { name: "bump",             type: "u8"        },
        ],
      },
    },
    {
      // Created during execute_draw. Tracks top-prize vesting for one round.
      // top_winners[0]    = 1st prize (30%)
      // top_winners[1..2] = 2nd prize (10% each)
      // top_winners[3..5] = 3rd prize (5% each)
      name: "DrawResult",
      type: {
        kind: "struct",
        fields: [
          { name: "poolType",      type: "u8"  },
          { name: "roundNumber",   type: "u64" },
          { name: "topWinners",    type: { array: ["publicKey", 6] } },
          { name: "topAmounts",    type: { array: ["u64", 6] } },
          { name: "topClaimed",    type: { array: ["u64", 6] } },
          { name: "drawTimestamp", type: "i64" },
          { name: "bump",         type: "u8"  },
        ],
      },
    },
    {
      name: "StakingState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority",          type: "publicKey" },
          { name: "tokenMint",          type: "publicKey" },
          { name: "shortTermPool",      type: "u64" },
          { name: "longTermPool",       type: "u64" },
          { name: "totalStakedShort",   type: "u64" },
          { name: "totalStakedLong",    type: "u64" },
          { name: "shortTermReleased",  type: "u64" },
          { name: "longTermReleased",   type: "u64" },
          { name: "bump",               type: "u8"  },
        ],
      },
    },
    {
      name: "UserStake",
      type: {
        kind: "struct",
        fields: [
          { name: "owner",      type: "publicKey" },
          { name: "amount",     type: "u64" },
          { name: "reward",     type: "u64" },
          { name: "startTime",  type: "i64" },
          { name: "endTime",    type: "i64" },
          { name: "stakeType",  type: { defined: "StakeType" } },
          { name: "claimed",    type: "bool" },
          { name: "stakeIndex", type: "u64" },
        ],
      },
    },
  ],
  types: [
    {
      name: "StakeType",
      type: {
        kind: "enum",
        variants: [
          { name: "ShortTerm" },
          { name: "LongTerm"  },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "BettingClosed"            },
    { code: 6001, name: "BelowMinimum"             },
    { code: 6002, name: "AlreadyDeposited"         },
    { code: 6003, name: "TooEarlyForDraw"          },
    { code: 6004, name: "ParticipantCountMismatch" },
    { code: 6005, name: "InvalidParticipant"       },
    { code: 6006, name: "NoFreeBetAvailable"       },
    { code: 6007, name: "FreeBetAlreadyActive"     },
    { code: 6008, name: "MathOverflow"             },
    { code: 6009, name: "InvalidPoolType"          },
    { code: 6010, name: "WrongRoundNumber"         },
    { code: 6011, name: "VaultMismatch"            },
    { code: 6012, name: "PlatformVaultMismatch"    },
    { code: 6013, name: "AirdropVaultMismatch"     },
    { code: 6014, name: "MintMismatch"             },
    { code: 6015, name: "ShouldUseDraw"            },
    { code: 6016, name: "ShouldUseRefund"          },
    { code: 6017, name: "FreeBetDailyOnly"         },
    { code: 6018, name: "PrizeEscrowMismatch"      },
    { code: 6019, name: "ReferralVaultMismatch"    },
    { code: 6020, name: "ReserveVaultMismatch"     },
    { code: 6021, name: "AlreadyFullyClaimed"      },
    { code: 6022, name: "InvalidWinnerIndex"       },
    { code: 6023, name: "WinnerTokenMismatch"      },
    { code: 6024, name: "NoReferral"               },
    { code: 6025, name: "ReferrerMismatch"         },
    { code: 6026, name: "ProtocolPaused"           },
    { code: 6027, name: "Unauthorized"             },
    { code: 6028, name: "TimelockNotExpired"       },
    { code: 6029, name: "NoPendingOperation"       },
    { code: 6030, name: "OperationMismatch"        },
    { code: 6031, name: "TimelockAlreadyPending"   },
  ],
  events: [
    {
      // Multi-winner draw event
      name: "DrawExecuted",
      fields: [
        { name: "poolType",            type: "u8",                    index: false },
        { name: "roundNumber",         type: "u64",                   index: false },
        { name: "totalPool",           type: "u64",                   index: false },
        { name: "participantCount",    type: "u32",                   index: false },
        { name: "topWinners",          type: { array: ["publicKey", 6] }, index: false },
        { name: "topAmounts",          type: { array: ["u64", 6] },   index: false },
        { name: "luckyWinners",        type: { array: ["publicKey", 5] }, index: false },
        { name: "luckyAmountEach",     type: "u64",                   index: false },
        { name: "universalCount",      type: "u32",                   index: false },
        { name: "universalAmountEach", type: "u64",                   index: false },
        { name: "burnAmount",          type: "u64",                   index: false },
        { name: "platformAmount",      type: "u64",                   index: false },
        { name: "rolloverAmount",      type: "u64",                   index: false },
        { name: "drawSeed",            type: { array: ["u8", 32] },   index: false },
        { name: "timestamp",           type: "i64",                   index: false },
      ],
    },
    {
      name: "RoundRefunded",
      fields: [
        { name: "poolType",        type: "u8",  index: false },
        { name: "roundNumber",     type: "u64", index: false },
        { name: "regularRefunded", type: "u32", index: false },
        { name: "freeCarriedOver", type: "u32", index: false },
        { name: "totalRefunded",   type: "u64", index: false },
        { name: "timestamp",       type: "i64", index: false },
      ],
    },
    {
      name: "Deposited",
      fields: [
        { name: "poolType",    type: "u8",        index: false },
        { name: "roundNumber", type: "u64",        index: false },
        { name: "user",        type: "publicKey",  index: false },
        { name: "amount",      type: "u64",        index: false },
        { name: "matched",     type: "u64",        index: false }, // reserve match (0 if non-daily)
        { name: "timestamp",   type: "i64",        index: false },
      ],
    },
    {
      name: "FreeBetActivated",
      fields: [
        { name: "poolType",  type: "u8",       index: false },
        { name: "user",      type: "publicKey", index: false },
        { name: "timestamp", type: "i64",       index: false },
      ],
    },
    {
      name: "PrizeVestingClaimed",
      fields: [
        { name: "poolType",     type: "u8",       index: false },
        { name: "roundNumber",  type: "u64",       index: false },
        { name: "winnerIndex",  type: "u8",        index: false },
        { name: "winner",       type: "publicKey", index: false },
        { name: "claimedAmount",type: "u64",       index: false },
        { name: "totalClaimed", type: "u64",       index: false },
        { name: "totalPrize",   type: "u64",       index: false },
        { name: "timestamp",    type: "i64",       index: false },
      ],
    },
  ],
};

// ─── PDA helpers ──────────────────────────────────────────────────────────────
const PROGRAM = new PublicKey("9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ");

export function getGlobalStatePda() {
  return PublicKey.findProgramAddressSync([Buffer.from("global_state")], PROGRAM);
}

export function getPoolStatePda(poolType) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), Buffer.from([poolType])],
    PROGRAM
  );
}

export function getUserDepositPda(poolType, userPubkey, roundNumber) {
  const rnBuf = Buffer.alloc(8);
  rnBuf.writeBigUInt64LE(BigInt(roundNumber));
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("deposit"),
      Buffer.from([poolType]),
      userPubkey.toBuffer(),
      rnBuf,
    ],
    PROGRAM
  );
}

export function getFreeDepositPda(poolType, userPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("free_deposit"), Buffer.from([poolType]), userPubkey.toBuffer()],
    PROGRAM
  );
}

export function getAirdropClaimPda(userPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("airdrop_claim"), userPubkey.toBuffer()],
    PROGRAM
  );
}

export function getDrawResultPda(poolType, roundNumber) {
  const rnBuf = Buffer.alloc(8);
  rnBuf.writeBigUInt64LE(BigInt(roundNumber));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("draw_result"), Buffer.from([poolType]), rnBuf],
    PROGRAM
  );
}

export function getVrfStatePda() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vrf_state")],
    PROGRAM
  );
}

function vaultForPool(poolType) {
  if (poolType === POOL_TYPE.MIN30)  return POOL_30MIN_VAULT;
  if (poolType === POOL_TYPE.HOURLY) return POOL_HOURLY_VAULT;
  if (poolType === POOL_TYPE.DAILY)  return POOL_DAILY_VAULT;
  throw new Error(`Unknown pool type: ${poolType}`);
}

// Convert raw u64 lamports to TPOT float
function toTpot(raw) {
  return Number(raw) / 10 ** TPOT_DECIMALS;
}

// Convert TPOT float to BN lamports
function toBN(tpot) {
  return new BN(Math.floor(tpot * 10 ** TPOT_DECIMALS));
}

// ─── Draw seed from finalized blockhash ──────────────────────────────────────
export function getRefereeBonusClaimPda(userPubkey) {
  const [refereeBonusClaim] = PublicKey.findProgramAddressSync(
    [Buffer.from("referee_claim"), userPubkey.toBuffer()],
    PROGRAM
  );
  return [refereeBonusClaim];
}

export async function generateDrawSeed(connection) {
  const slot  = await connection.getSlot("finalized");
  const block = await connection.getBlock(slot, { maxSupportedTransactionVersion: 0 });
  const hash  = block?.blockhash ?? "11111111111111111111111111111111";
  // Base58 decode → 32 bytes seed
  const { default: bs58 } = await import("bs58");
  const decoded = bs58.decode(hash);
  const seed = new Uint8Array(32);
  seed.set(decoded.slice(0, 32));
  return Array.from(seed);
}

// ─── SDK class ────────────────────────────────────────────────────────────────
export default class TykhePotSDK {
  constructor(connection, wallet, vrfAccount = null) {
    this.connection = connection;
    this.wallet     = wallet;
    this.vrfAccount = vrfAccount;

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: "confirmed", preflightCommitment: "confirmed" }
    );
    this.program = new anchor.Program(IDL, PROGRAM, provider);
    this.provider = provider;
  }

  setVrfAccount(vrfAccount) {
    this.vrfAccount = new PublicKey(vrfAccount);
  }

  // ── Transaction helper ──────────────────────────────────────────────────────
  // Dual signing strategy to handle two different wallet ecosystems:
  //
  // 1. WalletConnect wallets: Use adapter.signAndSendTransaction() which maps to
  //    the `solana_signAndSendTransaction` WalletConnect RPC method. The mobile
  //    wallet signs AND broadcasts atomically, returning only the signature hash.
  //    This sidesteps the "Missing signature" issue caused by WalletConnect's
  //    signTransaction returning unsigned bytes on some mobile wallets.
  //
  // 2. Phantom / Solflare / browser wallets: Use VersionedTransaction (v0) via
  //    wallet.sendTransaction(). Phantom's bridge calls tx.serialize() on legacy
  //    transactions BEFORE signing (throwing "Missing signature"), but
  //    VersionedTransaction.serialize() fills absent slots with zero bytes so the
  //    unsigned tx reaches the extension cleanly and is signed there.

  async _sendTx(methodCall, additionalSigners = []) {
    let blockhash, lastValidBlockHeight;
    const MAX_RETRIES = 3;

    // Retry blockhash fetch with exponential backoff
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await this.connection.getLatestBlockhash("confirmed");
        blockhash = result.blockhash;
        lastValidBlockHeight = result.lastValidBlockHeight;
        break;
      } catch (err) {
        console.warn(`Blockhash fetch attempt ${attempt + 1}/${MAX_RETRIES} failed:`, err?.message);
        if (attempt === MAX_RETRIES - 1) {
          throw new Error(`Failed to get blockhash after ${MAX_RETRIES} attempts. Please try again or check your network connection.`);
        }
        // Wait before retry (exponential backoff: 1s, 2s, 4s)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    // Build Anchor's legacy tx to get the compiled instruction(s).
    const legacyTx = await methodCall.transaction();

    // ── Path 1: WalletConnect ────────────────────────────────────────────────
    // WalletConnectWalletAdapter exposes signAndSendTransaction() but
    // Phantom/Solflare adapters do not — use this as a reliable detector.
    const adapter = this.wallet.wallet?.adapter;
    if (typeof adapter?.signAndSendTransaction === "function") {
      // Prepare the legacy tx (feePayer + blockhash required for serialization).
      legacyTx.recentBlockhash = blockhash;
      legacyTx.feePayer        = this.wallet.publicKey;
      if (additionalSigners.length > 0) legacyTx.partialSign(...additionalSigners);

      // Attempt A: solana_signAndSendTransaction (atomic — mobile wallet signs
      // AND broadcasts, returns only the signature hash).
      let wcSig;
      try {
        const signTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Wallet signing timeout')), 30000)
        );
        wcSig = await Promise.race([
          adapter.signAndSendTransaction(legacyTx),
          signTimeout
        ]);
      } catch (e) {
        console.warn("WC signAndSendTransaction:", e?.message);
      }

      if (wcSig !== undefined) {
        // Tx already broadcast by mobile wallet. Use string-form confirm to
        // avoid blockhash-expiry issues from the mobile signing delay.
        const confirmTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)
        );
        await Promise.race([
          this.connection.confirmTransaction(wcSig, "confirmed"),
          confirmTimeout
        ]);
        return wcSig;
      }

      // Attempt B: Legacy signTransaction + client-side broadcast.
      // CRITICAL: we MUST return here and never reach the VersionedTransaction
      // path below — mobile wallets drop the WC session with error 1001 when
      // they receive a v0 (VersionedTransaction) payload they don't support.
      const signTimeout2 = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Wallet signing timeout')), 30000)
      );
      const wcLegacySig = await Promise.race([
        this.wallet.sendTransaction(legacyTx, this.connection),
        signTimeout2
      ]);
      const confirmTimeout2 = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)
      );
      await Promise.race([
        this.connection.confirmTransaction(wcLegacySig, "confirmed"),
        confirmTimeout2
      ]);
      return wcLegacySig;
    }

    // ── Path 2: Phantom / browser wallets (VersionedTransaction) ─────────────
    const message = new TransactionMessage({
      payerKey:        this.wallet.publicKey,
      recentBlockhash: blockhash,
      instructions:    legacyTx.instructions,
    }).compileToV0Message();

    const vtx = new VersionedTransaction(message);

    if (additionalSigners.length > 0) {
      vtx.sign(additionalSigners);
    }

    // Add timeout for wallet signing (30 seconds)
    const signTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Wallet signing timeout')), 30000)
    );

    const sig = await Promise.race([
      this.wallet.sendTransaction(vtx, this.connection),
      signTimeout
    ]);

    // Add timeout for transaction confirmation (60 seconds)
    const confirmTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)
    );

    await Promise.race([
      this.connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      ),
      confirmTimeout
    ]);
    return sig;
  }

  // ── Read helpers ────────────────────────────────────────────────────────────

  async getGlobalState() {
    const [pda] = getGlobalStatePda();
    try {
      return await this.program.account.globalState.fetch(pda);
    } catch {
      return null;
    }
  }

  async getPoolState(poolType) {
    const [pda] = getPoolStatePda(poolType);
    try {
      return await this.program.account.poolState.fetch(pda);
    } catch {
      return null;
    }
  }

  async getUserDeposit(poolType, userPubkey, roundNumber) {
    const [pda] = getUserDepositPda(poolType, userPubkey, roundNumber);
    try {
      return await this.program.account.userDeposit.fetch(pda);
    } catch {
      return null;
    }
  }

  async getFreeDeposit(poolType, userPubkey) {
    const [pda] = getFreeDepositPda(poolType, userPubkey);
    try {
      return await this.program.account.freeDeposit.fetch(pda);
    } catch {
      return null;
    }
  }

  async getAirdropClaim(userPubkey) {
    const [pda] = getAirdropClaimPda(userPubkey);
    try {
      return await this.program.account.airdropClaim.fetch(pda);
    } catch {
      return null;
    }
  }

  async getDrawResult(poolType, roundNumber) {
    const [pda] = getDrawResultPda(poolType, roundNumber);
    try {
      return await this.program.account.drawResult.fetch(pda);
    } catch {
      return null;
    }
  }

  // ── Pool statistics (used by AppContext) ────────────────────────────────────

  async getAllPoolStats() {
    const [s0, s1, s2] = await Promise.all([
      this.getPoolState(POOL_TYPE.MIN30),
      this.getPoolState(POOL_TYPE.HOURLY),
      this.getPoolState(POOL_TYPE.DAILY),
    ]);

    const fmt = (s) =>
      s
        ? {
            roundNumber:      s.roundNumber.toNumber(),
            roundEndTime:     s.roundEndTime.toNumber() * 1000, // ms for JS Date
            totalDeposited:   toTpot(s.totalDeposited.toNumber()),
            freeBetTotal:     toTpot(s.freeBetTotal.toNumber()),
            rollover:         toTpot(s.rollover.toNumber()),
            totalPool:        toTpot(
                                s.totalDeposited.toNumber() +
                                s.freeBetTotal.toNumber() +
                                s.rollover.toNumber()
                              ),
            regularCount:     s.regularCount,
            freeCount:        s.freeCount,
            participantCount: s.regularCount + s.freeCount,
          }
        : null;

    return {
      [POOL_TYPE.MIN30]:  fmt(s0),
      [POOL_TYPE.HOURLY]: fmt(s1),
      [POOL_TYPE.DAILY]:  fmt(s2),
    };
  }

  // ── User status ─────────────────────────────────────────────────────────────

  async getUserStatus(userPubkey) {
    if (!userPubkey) return null;

    const [pools, claim] = await Promise.all([
      this.getAllPoolStats(),
      this.getAirdropClaim(userPubkey),
    ]);

    const poolStatus = {};
    for (const pt of [POOL_TYPE.MIN30, POOL_TYPE.HOURLY, POOL_TYPE.DAILY]) {
      const pool = pools[pt];
      if (!pool) { poolStatus[pt] = null; continue; }

      const [dep, freeDep] = await Promise.all([
        this.getUserDeposit(pt, userPubkey, pool.roundNumber),
        this.getFreeDeposit(pt, userPubkey),
      ]);

      poolStatus[pt] = {
        hasDeposited:   !!dep,
        depositAmount:  dep ? toTpot(dep.amount.toNumber()) : 0,
        freeBetActive:  freeDep?.isActive ?? false,
      };
    }

    return {
      pools: poolStatus,
      hasFreeClaim:       claim?.freeBetAvailable ?? false,
      hasClaimedAirdrop:  !!claim,
    };
  }

  // ── Write: deposit ───────────────────────────────────────────────────────────
  //
  // referrerTokenAccount (optional PublicKey): when provided, stored in
  // UserDeposit.referrer. The 8% referral is paid AFTER a successful draw
  // via claimReferral() — NOT at deposit time.

  async deposit(poolType, amountTpot, referrerTokenAccount = null) {
    const user = this.wallet.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const pool = await this.getPoolState(poolType);
    if (!pool) throw new Error("Pool not initialized");

    const [poolStatePda]   = getPoolStatePda(poolType);
    const [globalState]    = getGlobalStatePda();
    const [userDepositPda] = getUserDepositPda(poolType, user, pool.roundNumber.toNumber());
    const userTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(TOKEN_MINT), user
    );
    const poolVaultPubkey = new PublicKey(vaultForPool(poolType));
    const amountBN = toBN(amountTpot);

    // Optional: referrer's token account pubkey is stored on-chain for deferred payout
    const remainingAccounts = referrerTokenAccount
      ? [{ pubkey: referrerTokenAccount, isWritable: false, isSigner: false }]
      : [];

    const sig = await this._sendTx(
      this.program.methods
        .deposit(amountBN)
        .accounts({
          user,
          poolState:        poolStatePda,
          userDeposit:      userDepositPda,
          userTokenAccount,
          poolVault:        poolVaultPubkey,
          globalState,
          reserveVault:     new PublicKey(RESERVE_VAULT),
          tokenProgram:     TOKEN_PROGRAM_ID,
          systemProgram:    SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
    );

    return { success: true, tx: sig };
  }

  // ── Write: claimFreeAirdrop ─────────────────────────────────────────────────

  async claimFreeAirdrop() {
    const user = this.wallet.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const [airdropClaim] = getAirdropClaimPda(user);

    const sig = await this._sendTx(
      this.program.methods
        .claimFreeAirdrop()
        .accounts({
          user,
          airdropClaim,
          systemProgram: SystemProgram.programId,
        })
    );

    return { success: true, tx: sig };
  }

  // ── Write: useFreeBet (DAILY POOL ONLY) ─────────────────────────────────────

  async useFreeBet() {
    const user = this.wallet.publicKey;
    if (!user) throw new Error("Wallet not connected");

    // Free bet enforced to daily pool on-chain
    const poolType = POOL_TYPE.DAILY;

    const [globalState]   = getGlobalStatePda();
    const [poolStatePda]  = getPoolStatePda(poolType);
    const [airdropClaim]  = getAirdropClaimPda(user);
    const [freeDeposit]   = getFreeDepositPda(poolType, user);
    const poolVaultPubkey = new PublicKey(vaultForPool(poolType));

    const sig = await this._sendTx(
      this.program.methods
        .useFreeBet(poolType)
        .accounts({
          user,
          globalState,
          poolState:    poolStatePda,
          airdropClaim,
          freeDeposit,
          airdropVault: new PublicKey(AIRDROP_VAULT),
          poolVault:    poolVaultPubkey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
    );

    return { success: true, tx: sig };
  }

  // ── Write: executeDraw (permissionless crank, ≥12 participants) ──────────────

  async executeDraw(poolType) {
    const caller = this.wallet.publicKey;
    if (!caller) throw new Error("Wallet not connected");

    const pool = await this.getPoolState(poolType);
    if (!pool) throw new Error("Pool not initialized");

    const now = Math.floor(Date.now() / 1000);
    if (now < pool.roundEndTime.toNumber()) {
      throw new Error(`Draw time not reached. Wait ${pool.roundEndTime.toNumber() - now}s`);
    }

    const roundNumber = pool.roundNumber.toNumber();

    const [poolStatePda]  = getPoolStatePda(poolType);
    const [globalState]   = getGlobalStatePda();
    const [drawResult]    = getDrawResultPda(poolType, roundNumber);
    const poolVaultPubkey = new PublicKey(vaultForPool(poolType));

    // Build remaining_accounts from on-chain program accounts
    const remainingAccounts = await this._buildParticipantAccounts(
      poolType,
      roundNumber,
      pool.regularCount,
      pool.freeCount
    );

    const drawSeed = await generateDrawSeed(this.connection);

    const sig = await this._sendTx(
      this.program.methods
        .executeDraw(drawSeed)
        .accounts({
          caller,
          poolState:        poolStatePda,
          poolVault:        poolVaultPubkey,
          tokenMint:        new PublicKey(TOKEN_MINT),
          platformVault:    new PublicKey(PLATFORM_FEE_VAULT),
          prizeEscrowVault: new PublicKey(PRIZE_ESCROW_VAULT),
          globalState,
          drawResult,
          tokenProgram:     TOKEN_PROGRAM_ID,
          systemProgram:    SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
    );

    return { success: true, tx: sig };
  }

  // ── Write: executeDrawVrf (VRF-based draw) ─────────────────────────────────

  async executeDrawVrf(poolType) {
    const caller = this.wallet.publicKey;
    if (!caller) throw new Error("Wallet not connected");

    const pool = await this.getPoolState(poolType);
    if (!pool) throw new Error("Pool not initialized");

    const now = Math.floor(Date.now() / 1000);
    if (now < pool.roundEndTime.toNumber()) {
      throw new Error(`Draw time not reached. Wait ${pool.roundEndTime.toNumber() - now}s`);
    }

    const roundNumber = pool.roundNumber.toNumber();

    const [poolStatePda]  = getPoolStatePda(poolType);
    const [globalState]   = getGlobalStatePda();
    const [drawResult]    = getDrawResultPda(poolType, roundNumber);
    const [vrfState]      = PublicKey.findProgramAddressSync(
      [Buffer.from("vrf_state")], PROGRAM
    );
    const poolVaultPubkey = new PublicKey(vaultForPool(poolType));

    const remainingAccounts = await this._buildParticipantAccounts(
      poolType,
      roundNumber,
      pool.regularCount,
      pool.freeCount
    );

    const sig = await this._sendTx(
      this.program.methods
        .executeDrawVrf()
        .accounts({
          caller,
          vrfState,
          poolState:        poolStatePda,
          poolVault:        poolVaultPubkey,
          tokenMint:        new PublicKey(TOKEN_MINT),
          platformVault:    new PublicKey(PLATFORM_FEE_VAULT),
          prizeEscrowVault: new PublicKey(PRIZE_ESCROW_VAULT),
          globalState,
          drawResult,
          vrf:               this.vrfAccount, // 需要在初始化时设置
          tokenProgram:     TOKEN_PROGRAM_ID,
          systemProgram:    SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
    );

    return { success: true, tx: sig };
  }

  // ── Write: executeRefund (permissionless crank, <12 participants) ─────────────

  async executeRefund(poolType) {
    const caller = this.wallet.publicKey;
    if (!caller) throw new Error("Wallet not connected");

    const pool = await this.getPoolState(poolType);
    if (!pool) throw new Error("Pool not initialized");

    const now = Math.floor(Date.now() / 1000);
    if (now < pool.roundEndTime.toNumber()) {
      throw new Error(`Refund time not reached. Wait ${pool.roundEndTime.toNumber() - now}s`);
    }

    const [poolStatePda]  = getPoolStatePda(poolType);
    const poolVaultPubkey = new PublicKey(vaultForPool(poolType));

    // Refund only needs regular depositors (free bets carry over automatically)
    const remainingAccounts = await this._buildParticipantAccounts(
      poolType,
      pool.roundNumber.toNumber(),
      pool.regularCount,
      0 // no free accounts needed for refund
    );

    const sig = await this._sendTx(
      this.program.methods
        .executeRefund()
        .accounts({
          caller,
          poolState:    poolStatePda,
          poolVault:    poolVaultPubkey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
    );

    return { success: true, tx: sig };
  }

  // ── Write: claimPrizeVesting (permissionless — call daily for each top winner) ─

  async claimPrizeVesting(poolType, roundNumber, winnerIndex, winnerTokenAccountPubkey) {
    const caller = this.wallet.publicKey;
    if (!caller) throw new Error("Wallet not connected");

    const [drawResult]  = getDrawResultPda(poolType, roundNumber);
    const [globalState] = getGlobalStatePda();

    const sig = await this._sendTx(
      this.program.methods
        .claimPrizeVesting(winnerIndex)
        .accounts({
          caller,
          drawResult,
          globalState,
          prizeEscrowVault: new PublicKey(PRIZE_ESCROW_VAULT),
          winnerTokenAccount: winnerTokenAccountPubkey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
    );

    return { success: true, tx: sig };
  }

  // ── Write: claimReferral (permissionless — call after executeDraw for each referral) ─
  //
  // poolType      — pool type of the round
  // roundNumber   — round that was successfully drawn
  // userDepositPubkey — the UserDeposit PDA address for the participant
  // referrerTokenAccountPubkey — must match the pubkey stored in UserDeposit.referrer

  async claimReferral(poolType, roundNumber, userDepositPubkey, referrerTokenAccountPubkey) {
    const caller = this.wallet.publicKey;
    if (!caller) throw new Error("Wallet not connected");

    const [drawResult]  = getDrawResultPda(poolType, roundNumber);
    const [globalState] = getGlobalStatePda();

    const sig = await this._sendTx(
      this.program.methods
        .claimReferral(poolType, new BN(roundNumber))
        .accounts({
          caller,
          drawResult,
          userDeposit:          userDepositPubkey,
          globalState,
          referralVault:        new PublicKey(REFERRAL_VAULT),
          referrerTokenAccount: referrerTokenAccountPubkey,
          tokenProgram:         TOKEN_PROGRAM_ID,
        })
    );

    return { success: true, tx: sig };
  }

  // ── Build remaining_accounts for executeDraw / executeRefund ─────────────────

  async _buildParticipantAccounts(poolType, roundNumber, regularCount, freeCount) {
    const remaining = [];

    if (regularCount > 0) {
      // Fetch all UserDeposit PDAs for this pool+round
      // UserDeposit layout: disc(8)+user(32)+pool_type(1)+round(8)+amount(8)+referrer(32)+bump(1)+pad(6) = 96
      const accounts = await this.connection.getProgramAccounts(PROGRAM, {
        commitment: "confirmed",
        filters: [
          { dataSize: 8 + 32 + 1 + 8 + 8 + 32 + 1 + 6 }, // 96 bytes
          // pool_type at offset 40 (8 disc + 32 user)
          { memcmp: { offset: 40, bytes: Buffer.from([poolType]).toString("base64") } },
        ],
      });

      const rnBuf = Buffer.alloc(8);
      rnBuf.writeBigUInt64LE(BigInt(roundNumber));

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        // round_number at offset 41 (8 disc + 32 user + 1 pool_type)
        const roundInAccount = data.readBigUInt64LE(41);
        if (roundInAccount !== BigInt(roundNumber)) continue;

        // user pubkey at offset 8
        const userKey = new PublicKey(data.slice(8, 40));
        const userTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(TOKEN_MINT), userKey
        );

        remaining.push({ pubkey, isWritable: false, isSigner: false });
        remaining.push({ pubkey: userTokenAccount, isWritable: true, isSigner: false });
      }
    }

    if (freeCount > 0) {
      // Fetch all active FreeDeposit PDAs for this pool
      // FreeDeposit layout: disc(8)+user(32)+pool_type(1)+is_active(1)+amount(8)+referrer(32)+bump(1)+pad(7) = 90
      const accounts = await this.connection.getProgramAccounts(PROGRAM, {
        commitment: "confirmed",
        filters: [
          { dataSize: 8 + 32 + 1 + 1 + 8 + 32 + 1 + 7 }, // 90 bytes
          { memcmp: { offset: 40, bytes: Buffer.from([poolType]).toString("base64") } },
          // is_active at offset 41 = 0x01
          { memcmp: { offset: 41, bytes: Buffer.from([1]).toString("base64") } },
        ],
      });

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        const userKey = new PublicKey(data.slice(8, 40));
        const userTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(TOKEN_MINT), userKey
        );

        remaining.push({ pubkey, isWritable: true, isSigner: false }); // writable to set is_active=false
        remaining.push({ pubkey: userTokenAccount, isWritable: true, isSigner: false });
      }
    }

    return remaining;
  }

  // ── Staking ─────────────────────────────────────────────────────────────────

  async stake(stakeIndex, amountTpot, isLongTerm) {
    const user = this.wallet.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const [stakingState] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking_state")], PROGRAM
    );
    const [userStake] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_stake"),
        user.toBuffer(),
        (() => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(stakeIndex)); return b; })(),
      ],
      PROGRAM
    );
    const userToken = await getAssociatedTokenAddress(new PublicKey(TOKEN_MINT), user);
    const { STAKING_VAULT } = await import("../config/contract");

    const sig = await this._sendTx(
      this.program.methods
        .stake(
          new BN(stakeIndex),
          toBN(amountTpot),
          isLongTerm ? { longTerm: {} } : { shortTerm: {} }
        )
        .accounts({
          user,
          stakingState,
          userStake,
          userToken,
          stakingVault:  new PublicKey(STAKING_VAULT),
          tokenProgram:  TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
    );

    return { success: true, tx: sig };
  }

  async releaseStake(stakeIndex) {
    return this._stakeAction("releaseStake", stakeIndex);
  }

  async earlyWithdraw(stakeIndex) {
    return this._stakeAction("earlyWithdraw", stakeIndex);
  }

  async _stakeAction(method, stakeIndex) {
    const user = this.wallet.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const [stakingState] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking_state")], PROGRAM
    );
    const [userStake] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_stake"),
        user.toBuffer(),
        (() => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(stakeIndex)); return b; })(),
      ],
      PROGRAM
    );
    const [stakingAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking")], PROGRAM
    );
    const userToken = await getAssociatedTokenAddress(new PublicKey(TOKEN_MINT), user);
    const { STAKING_VAULT } = await import("../config/contract");

    const sig = await this._sendTx(
      this.program.methods[method](new BN(stakeIndex))
        .accounts({
          user,
          stakingState,
          userStake,
          userToken,
          stakingVault:     new PublicKey(STAKING_VAULT),
          stakingAuthority,
          tokenProgram:     TOKEN_PROGRAM_ID,
        })
    );

    return { success: true, tx: sig };
  }

  // Returns all UserStake accounts belonging to the connected wallet.
  // Each item: { stakeIndex, amount, reward, startTime, endTime, stakeType, claimed, pubkey }
  async getUserStakes(userPubkey) {
    const user = userPubkey ?? this.wallet?.publicKey;
    if (!user) return [];
    try {
      const accounts = await this.program.account.userStake.all([
        {
          memcmp: {
            offset: 8,   // skip 8-byte Anchor discriminator, owner Pubkey is first field
            bytes: user.toBase58(),
          },
        },
      ]);
      return accounts
        .filter(a => !a.account.claimed)
        .map(a => ({
          pubkey:     a.publicKey,
          stakeIndex: a.account.stakeIndex.toNumber(),
          amount:     a.account.amount.toNumber() / 1e6,
          reward:     a.account.reward.toNumber() / 1e6,
          startTime:  a.account.startTime.toNumber(),
          endTime:    a.account.endTime.toNumber(),
          stakeType:  a.account.stakeType.longTerm !== undefined ? 'long' : 'short',
          claimed:    a.account.claimed,
        }))
        .sort((a, b) => a.startTime - b.startTime);
    } catch {
      return [];
    }
  }

  // Returns global StakingState (remaining pool capacity etc.)
  async getStakingState() {
    try {
      const [stakingState] = PublicKey.findProgramAddressSync(
        [Buffer.from("staking_state")], PROGRAM
      );
      const s = await this.program.account.stakingState.fetch(stakingState);
      return {
        shortTermPool:    s.shortTermPool.toNumber() / 1e6,
        longTermPool:     s.longTermPool.toNumber() / 1e6,
        totalStakedShort: s.totalStakedShort.toNumber() / 1e6,
        totalStakedLong:  s.totalStakedLong.toNumber() / 1e6,
      };
    } catch {
      return null;
    }
  }

  // ── Claim profit airdrop ────────────────────────────────────────────────────

  async claimProfitAirdrop() {
    const user = this.wallet.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const [airdropState] = PublicKey.findProgramAddressSync(
      [Buffer.from("airdrop_state")], PROGRAM
    );
    const [userAirdrop] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_airdrop"), user.toBuffer()], PROGRAM
    );
    const [airdropAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("airdrop")], PROGRAM
    );
    const userToken = await getAssociatedTokenAddress(new PublicKey(TOKEN_MINT), user);
    const { AIRDROP_VAULT: PROFIT_VAULT } = await import("../config/contract");

    const sig = await this._sendTx(
      this.program.methods
        .claimProfitAirdrop()
        .accounts({
          user,
          airdropState,
          userAirdrop,
          userToken,
          airdropVault:     new PublicKey(PROFIT_VAULT),
          airdropAuthority,
          tokenProgram:     TOKEN_PROGRAM_ID,
        })
    );

    return { success: true, tx: sig };
  }

  /// Claim 2% referee bonus for a user's first deposit.
  ///
  /// Permissionless — user can call this anytime after their first deposit with a referrer.
  /// Awards a 2% bonus based on first deposit amount.
  async claimRefereeBonus(userTokenAccountPubkey) {
    const user = this.wallet.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const [refereeBonusClaim] = PublicKey.findProgramAddressSync(
      [Buffer.from("referee_claim"), user.toBuffer()],
      PROGRAM
    );
    const [globalState] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")],
      PROGRAM
    );
    const [referralVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("referral_vault")],
      PROGRAM
    );
    const { REFERRAL_VAULT } = await import("../config/contract");

    const userToken = await getAssociatedTokenAddress(new PublicKey(TOKEN_MINT), user);

    const sig = await this._sendTx(
      this.program.methods
        .claimRefereeBonus()
        .accounts({
          user,
          refereeBonusClaim,
          globalState,
          referralVault,
          userToken,
          tokenProgram:     TOKEN_PROGRAM_ID,
        })
    );

    return { success: true, tx: sig };
  }
}
