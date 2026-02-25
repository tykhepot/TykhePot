/**
 * TykhePot SDK v2 — No-admin, permissionless architecture
 *
 * Pool types: 0 = 30min, 1 = hourly, 2 = daily
 * All draws are permissionless (anyone can trigger after round_end_time).
 * Winner selected by equal probability: seed % participant_count.
 */

import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
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
  TPOT_DECIMALS,
} from "../config/contract";

// ─── IDL ─────────────────────────────────────────────────────────────────────
const IDL = {
  version: "0.1.0",
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
      args: [{ name: "platformFeeVault", type: "publicKey" }],
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
        { name: "tokenProgram",      isMut: false, isSigner: false },
        { name: "systemProgram",     isMut: false, isSigner: false },
      ],
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
        { name: "caller",         isMut: true,  isSigner: true  },
        { name: "poolState",      isMut: true,  isSigner: false },
        { name: "poolVault",      isMut: true,  isSigner: false },
        { name: "tokenMint",      isMut: true,  isSigner: false },
        { name: "platformVault",  isMut: true,  isSigner: false },
        { name: "globalState",    isMut: false, isSigner: false },
        { name: "tokenProgram",   isMut: false, isSigner: false },
      ],
      args: [{ name: "drawSeed", type: { array: ["u8", 32] } }],
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
          { name: "tokenMint",       type: "publicKey" },
          { name: "platformFeeVault",type: "publicKey" },
          { name: "airdropVault",    type: "publicKey" },
          { name: "bump",            type: "u8"        },
        ],
      },
    },
    {
      name: "PoolState",
      type: {
        kind: "struct",
        fields: [
          { name: "poolType",      type: "u8"  },
          { name: "roundNumber",   type: "u64" },
          { name: "roundStartTime",type: "i64" },
          { name: "roundEndTime",  type: "i64" },
          { name: "totalDeposited",type: "u64" },
          { name: "freeBetTotal",  type: "u64" },
          { name: "regularCount",  type: "u32" },
          { name: "freeCount",     type: "u32" },
          { name: "vault",         type: "publicKey" },
          { name: "bump",          type: "u8"  },
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
          { name: "bump",     type: "u8"        },
        ],
      },
    },
    {
      name: "AirdropClaim",
      type: {
        kind: "struct",
        fields: [
          { name: "user",              type: "publicKey" },
          { name: "freeBetAvailable",  type: "bool"      },
          { name: "bump",              type: "u8"        },
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
  ],
  events: [
    {
      name: "DrawExecuted",
      fields: [
        { name: "poolType",        type: "u8",          index: false },
        { name: "roundNumber",     type: "u64",         index: false },
        { name: "winner",          type: "publicKey",   index: false },
        { name: "prizeAmount",     type: "u64",         index: false },
        { name: "burnAmount",      type: "u64",         index: false },
        { name: "platformAmount",  type: "u64",         index: false },
        { name: "totalPool",       type: "u64",         index: false },
        { name: "participantCount",type: "u32",         index: false },
        { name: "drawSeed",        type: { array: ["u8", 32] }, index: false },
        { name: "timestamp",       type: "i64",         index: false },
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
  ],
};

// ─── PDA helpers ──────────────────────────────────────────────────────────────
const PROGRAM = new PublicKey(PROGRAM_ID);

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
  constructor(connection, wallet) {
    this.connection = connection;
    this.wallet     = wallet;

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: "confirmed", preflightCommitment: "confirmed" }
    );
    this.program = new anchor.Program(IDL, PROGRAM, provider);
    this.provider = provider;
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
            roundNumber:    s.roundNumber.toNumber(),
            roundEndTime:   s.roundEndTime.toNumber() * 1000, // ms for JS Date
            totalDeposited: toTpot(s.totalDeposited.toNumber()),
            freeBetTotal:   toTpot(s.freeBetTotal.toNumber()),
            totalPool:      toTpot(s.totalDeposited.toNumber() + s.freeBetTotal.toNumber()),
            regularCount:   s.regularCount,
            freeCount:      s.freeCount,
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

  async deposit(poolType, amountTpot) {
    const user = this.wallet.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const pool = await this.getPoolState(poolType);
    if (!pool) throw new Error("Pool not initialized");

    const [poolStatePda]  = getPoolStatePda(poolType);
    const [userDepositPda] = getUserDepositPda(poolType, user, pool.roundNumber.toNumber());
    const userTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(TOKEN_MINT), user
    );
    const poolVaultPubkey = new PublicKey(vaultForPool(poolType));
    const amountBN = toBN(amountTpot);

    const tx = await this.program.methods
      .deposit(amountBN)
      .accounts({
        user,
        poolState:        poolStatePda,
        userDeposit:      userDepositPda,
        userTokenAccount,
        poolVault:        poolVaultPubkey,
        tokenProgram:     TOKEN_PROGRAM_ID,
        systemProgram:    SystemProgram.programId,
      })
      .rpc();

    return { success: true, tx };
  }

  // ── Write: claimFreeAirdrop ─────────────────────────────────────────────────

  async claimFreeAirdrop() {
    const user = this.wallet.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const [airdropClaim] = getAirdropClaimPda(user);

    const tx = await this.program.methods
      .claimFreeAirdrop()
      .accounts({
        user,
        airdropClaim,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { success: true, tx };
  }

  // ── Write: useFreeBet ───────────────────────────────────────────────────────

  async useFreeBet(poolType) {
    const user = this.wallet.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const [globalState]   = getGlobalStatePda();
    const [poolStatePda]  = getPoolStatePda(poolType);
    const [airdropClaim]  = getAirdropClaimPda(user);
    const [freeDeposit]   = getFreeDepositPda(poolType, user);
    const poolVaultPubkey = new PublicKey(vaultForPool(poolType));

    const tx = await this.program.methods
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
      .rpc();

    return { success: true, tx };
  }

  // ── Write: executeDraw (permissionless crank) ────────────────────────────────

  async executeDraw(poolType) {
    const caller = this.wallet.publicKey;
    if (!caller) throw new Error("Wallet not connected");

    const pool = await this.getPoolState(poolType);
    if (!pool) throw new Error("Pool not initialized");

    const now = Math.floor(Date.now() / 1000);
    if (now < pool.roundEndTime.toNumber()) {
      throw new Error(`Draw time not reached. Wait ${pool.roundEndTime.toNumber() - now}s`);
    }

    const [poolStatePda] = getPoolStatePda(poolType);
    const [globalState]  = getGlobalStatePda();
    const poolVaultPubkey = new PublicKey(vaultForPool(poolType));

    // ── Build remaining_accounts from on-chain program accounts ────────────
    // Filter UserDeposit accounts: pool_type matches + round_number matches
    // Filter FreeDeposit accounts: pool_type matches + is_active = true
    const remainingAccounts = await this._buildParticipantAccounts(
      poolType,
      pool.roundNumber.toNumber(),
      pool.regularCount,
      pool.freeCount
    );

    const drawSeed = await generateDrawSeed(this.connection);

    const tx = await this.program.methods
      .executeDraw(drawSeed)
      .accounts({
        caller,
        poolState:      poolStatePda,
        poolVault:      poolVaultPubkey,
        tokenMint:      new PublicKey(TOKEN_MINT),
        platformVault:  new PublicKey(PLATFORM_FEE_VAULT),
        globalState,
        tokenProgram:   TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .rpc();

    return { success: true, tx };
  }

  // ── Build remaining_accounts for executeDraw ─────────────────────────────

  async _buildParticipantAccounts(poolType, roundNumber, regularCount, freeCount) {
    const remaining = [];

    if (regularCount > 0) {
      // Fetch all UserDeposit PDAs for this pool+round
      const accounts = await this.connection.getProgramAccounts(PROGRAM, {
        commitment: "confirmed",
        filters: [
          { dataSize: 8 + 32 + 1 + 8 + 8 + 1 + 7 }, // UserDeposit size
          // pool_type at offset 40 (8 disc + 32 user)
          { memcmp: { offset: 40, bytes: Buffer.from([poolType]).toString("base64") } },
        ],
      });

      const rnBuf = Buffer.alloc(8);
      rnBuf.writeBigUInt64LE(BigInt(roundNumber));

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        // roundNumber starts at offset 41 (8 disc + 32 user + 1 pool_type)
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
      const accounts = await this.connection.getProgramAccounts(PROGRAM, {
        commitment: "confirmed",
        filters: [
          { dataSize: 8 + 32 + 1 + 1 + 8 + 1 + 7 }, // FreeDeposit size
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

    const tx = await this.program.methods
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
      .rpc();

    return { success: true, tx };
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

    const tx = await this.program.methods[method](new BN(stakeIndex))
      .accounts({
        user,
        stakingState,
        userStake,
        userToken,
        stakingVault:     new PublicKey(STAKING_VAULT),
        stakingAuthority,
        tokenProgram:     TOKEN_PROGRAM_ID,
      })
      .rpc();

    return { success: true, tx };
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

    const tx = await this.program.methods
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
      .rpc();

    return { success: true, tx };
  }
}
