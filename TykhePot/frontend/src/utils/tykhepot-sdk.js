import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  PROGRAM_ID,
  TOKEN_MINT,
  RPC_ENDPOINT,
  BURN_VAULT,
  PLATFORM_VAULT,
  HOURLY_POOL_VAULT,
  DAILY_POOL_VAULT,
  REFERRAL_VAULT,
  AIRDROP_VAULT,
  STAKING_VAULT,
  VESTING_VAULT,
} from "../config/contract";

// ─── IDL ────────────────────────────────────────────────────────────────────
// Matches smart-contract/programs/royalpot/src/lib.rs (Anchor 0.30)
const IDL = {
  version: "0.1.0",
  name: "royalpot",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "tokenMint", isMut: false, isSigner: false },
        { name: "platformWallet", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "params", type: { defined: "InitializeParams" } }],
    },
    {
      name: "pause",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [],
    },
    {
      name: "executePause",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [],
    },
    {
      name: "resume",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [],
    },
    {
      name: "withdrawPlatformFee",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "dest", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "depositHourly",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "burnVault", isMut: true, isSigner: false },
        { name: "platformVault", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "signer", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "depositDaily",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "burnVault", isMut: true, isSigner: false },
        { name: "platformVault", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "referralVault", isMut: true, isSigner: false },
        { name: "referrerToken", isMut: true, isSigner: false },
        { name: "userReferrerBonus", isMut: true, isSigner: false },
        { name: "signer", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "referrer", type: { option: "publicKey" } },
      ],
    },
    {
      name: "drawHourly",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [
        {
          name: "payouts",
          type: { vec: { defined: "WinnerPayout" } },
        },
        {
          name: "drawSeed",
          type: { array: ["u8", 32] },
        },
      ],
    },
    {
      name: "drawDaily",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [
        {
          name: "payouts",
          type: { vec: { defined: "WinnerPayout" } },
        },
        {
          name: "drawSeed",
          type: { array: ["u8", 32] },
        },
      ],
    },
    {
      name: "claimFreeAirdrop",
      accounts: [
        { name: "user", isMut: true, isSigner: false },
        { name: "userSigner", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "useFreeBetDaily",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: false },
        { name: "airdropVault", isMut: true, isSigner: false },
        { name: "dailyPoolVault", isMut: true, isSigner: false },
        { name: "airdropAuth", isMut: false, isSigner: false },
        { name: "userSigner", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    // ─── Staking ────────────────────────────────────────────────────────────
    {
      name: "initializeStaking",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "stakingState", isMut: true, isSigner: false },
        { name: "tokenMint", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "shortTermPool", type: "u64" },
        { name: "longTermPool", type: "u64" },
      ],
    },
    {
      name: "stake",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "stakingState", isMut: true, isSigner: false },
        { name: "userStake", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "stakingVault", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "stakeIndex", type: "u64" },
        { name: "amount", type: "u64" },
        { name: "stakeType", type: { defined: "StakeType" } },
      ],
    },
    {
      name: "releaseStake",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "stakingState", isMut: true, isSigner: false },
        { name: "userStake", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "stakingVault", isMut: true, isSigner: false },
        { name: "stakingAuthority", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "stakeIndex", type: "u64" }],
    },
    {
      name: "earlyWithdraw",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "stakingState", isMut: true, isSigner: false },
        { name: "userStake", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "stakingVault", isMut: true, isSigner: false },
        { name: "stakingAuthority", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "stakeIndex", type: "u64" }],
    },
    // ─── Profit Airdrop ─────────────────────────────────────────────────────
    {
      name: "initializeAirdrop",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "airdropState", isMut: true, isSigner: false },
        { name: "tokenMint", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "totalAirdrop", type: "u64" }],
    },
    {
      name: "recordProfit",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "airdropState", isMut: true, isSigner: false },
        { name: "userAirdrop", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "profitAmount", type: "u64" }],
    },
    {
      name: "claimProfitAirdrop",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "airdropState", isMut: true, isSigner: false },
        { name: "userAirdrop", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "airdropVault", isMut: true, isSigner: false },
        { name: "airdropAuthority", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    // ─── Prize Vesting ───────────────────────────────────────────────────────
    {
      name: "initVesting",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "vestingVault", isMut: true, isSigner: false },
        { name: "vestingAccount", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "winner", type: "publicKey" },
        { name: "amount", type: "u64" },
        { name: "vestingId", type: "u64" },
      ],
    },
    {
      name: "claimVested",
      accounts: [
        { name: "winner", isMut: false, isSigner: true },
        { name: "vestingAccount", isMut: true, isSigner: false },
        { name: "vestingVault", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "vestingAuthority", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "vestingId", type: "u64" }],
    },
  ],
  accounts: [
    {
      name: "State",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "tokenMint", type: "publicKey" },
          { name: "platformWallet", type: "publicKey" },
          { name: "prePool", type: "u64" },
          { name: "referralPool", type: "u64" },
          { name: "hourlyPool", type: "u64" },
          { name: "hourlyPlayers", type: "u32" },
          { name: "dailyPool", type: "u64" },
          { name: "dailyPlayers", type: "u32" },
          { name: "burned", type: "u64" },
          { name: "paused", type: "bool" },
          { name: "bump", type: "u8" },
          { name: "lastHourlyDraw", type: "i64" },
          { name: "lastDailyDraw", type: "i64" },
          { name: "hourlyRollover", type: "u64" },
          { name: "dailyRollover", type: "u64" },
          { name: "pauseScheduledAt", type: "i64" },
        ],
      },
    },
    {
      name: "UserData",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "hourlyTickets", type: "u64" },
          { name: "dailyTickets", type: "u64" },
          { name: "lastTime", type: "i64" },
          { name: "referrer", type: { option: "publicKey" } },
          { name: "hasRefBonus", type: "bool" },
          { name: "airdropClaimed", type: "bool" },
          { name: "totalDeposit", type: "u64" },
          { name: "freeBetAvailable", type: "bool" },
        ],
      },
    },
    {
      name: "StakingState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "tokenMint", type: "publicKey" },
          { name: "shortTermPool", type: "u64" },
          { name: "longTermPool", type: "u64" },
          { name: "totalStakedShort", type: "u64" },
          { name: "totalStakedLong", type: "u64" },
          { name: "shortTermReleased", type: "u64" },
          { name: "longTermReleased", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "UserStake",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "amount", type: "u64" },
          { name: "reward", type: "u64" },
          { name: "startTime", type: "i64" },
          { name: "endTime", type: "i64" },
          { name: "stakeType", type: { defined: "StakeType" } },
          { name: "claimed", type: "bool" },
          { name: "stakeIndex", type: "u64" },
        ],
      },
    },
    {
      name: "AirdropState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "tokenMint", type: "publicKey" },
          { name: "totalAirdrop", type: "u64" },
          { name: "claimedAmount", type: "u64" },
          { name: "remainingAmount", type: "u64" },
          { name: "participantCount", type: "u32" },
          { name: "claimedCount", type: "u32" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "UserAirdrop",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "hasParticipated", type: "bool" },
          { name: "firstParticipationTime", type: "i64" },
          { name: "totalProfit", type: "u64" },
          { name: "eligibleAirdrop", type: "u64" },
          { name: "hasClaimed", type: "bool" },
          { name: "claimedAmount", type: "u64" },
          { name: "claimTime", type: "i64" },
        ],
      },
    },
    {
      name: "VestingAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "winner", type: "publicKey" },
          { name: "totalAmount", type: "u64" },
          { name: "claimedAmount", type: "u64" },
          { name: "startTime", type: "i64" },
          { name: "vestingId", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  types: [
    {
      name: "InitializeParams",
      type: {
        kind: "struct",
        fields: [
          { name: "prePool", type: "u64" },
          { name: "referralPool", type: "u64" },
        ],
      },
    },
    {
      name: "WinnerPayout",
      type: {
        kind: "struct",
        fields: [
          { name: "winner", type: "publicKey" },
          { name: "amount", type: "u64" },
        ],
      },
    },
    {
      name: "PoolType",
      type: {
        kind: "enum",
        variants: [{ name: "Hourly" }, { name: "Daily" }],
      },
    },
    {
      name: "StakeType",
      type: {
        kind: "enum",
        variants: [{ name: "ShortTerm" }, { name: "LongTerm" }],
      },
    },
  ],
  events: [
    {
      name: "DrawCompleted",
      fields: [
        { name: "poolType", type: { defined: "PoolType" }, index: false },
        { name: "totalPool", type: "u64", index: false },
        { name: "distributed", type: "u64", index: false },
        { name: "rollover", type: "u64", index: false },
        { name: "winnerCount", type: "u32", index: false },
        { name: "timestamp", type: "i64", index: false },
        { name: "drawSeed", type: { array: ["u8", 32] }, index: false },
      ],
    },
    {
      name: "ReferralPoolExhausted",
      fields: [
        { name: "referrer", type: "publicKey", index: false },
        { name: "depositor", type: "publicKey", index: false },
        { name: "requested", type: "u64", index: false },
        { name: "available", type: "u64", index: false },
        { name: "timestamp", type: "i64", index: false },
      ],
    },
  ],
  errors: [
    { code: 6000, name: "Unauthorized", msg: "Unauthorized" },
    { code: 6001, name: "ContractPaused", msg: "Contract is paused" },
    { code: 6002, name: "InvalidAmount", msg: "Invalid amount" },
    { code: 6003, name: "BelowMinDeposit", msg: "Below minimum deposit" },
    { code: 6004, name: "DepositTooFrequent", msg: "Deposit too frequent" },
    { code: 6005, name: "AlreadyClaimed", msg: "Already claimed" },
    { code: 6006, name: "ExceedMaxDeposit", msg: "Exceed maximum deposit" },
    { code: 6007, name: "PoolLocked", msg: "Pool is locked, draw in progress" },
    { code: 6008, name: "DrawTooEarly", msg: "Draw too early" },
    { code: 6009, name: "NotEnoughParticipants", msg: "Not enough participants" },
    { code: 6010, name: "InsufficientPoolBalance", msg: "Insufficient pool balance" },
    { code: 6011, name: "InvalidReferrer", msg: "Invalid referrer" },
    { code: 6012, name: "ReferrerNotParticipated", msg: "Referrer has not participated in the game" },
    { code: 6013, name: "PauseAlreadyScheduled", msg: "A pause is already scheduled" },
    { code: 6014, name: "NoPauseScheduled", msg: "No pause has been scheduled" },
    { code: 6015, name: "PauseTimelockNotExpired", msg: "Pause timelock has not expired yet" },
    { code: 6016, name: "NothingToClaim", msg: "Nothing to claim yet" },
    { code: 6017, name: "VestingFullyClaimed", msg: "All vesting already claimed" },
  ],
};

// ─── PDA Helpers ─────────────────────────────────────────────────────────────

function findStatePDA(programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    programId
  );
}

function findUserDataPDA(userPubkey, programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userPubkey.toBuffer()],
    programId
  );
}

function findStakingStatePDA(programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("staking_state")],
    programId
  );
}

function findUserStakePDA(userPubkey, stakeIndex, programId) {
  const idx = Buffer.alloc(8);
  idx.writeBigUInt64LE(BigInt(stakeIndex));
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user_stake"), userPubkey.toBuffer(), idx],
    programId
  );
}

function findStakingAuthorityPDA(programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("staking")],
    programId
  );
}

function findAirdropStatePDA(programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("airdrop_state")],
    programId
  );
}

function findUserAirdropPDA(userPubkey, programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user_airdrop"), userPubkey.toBuffer()],
    programId
  );
}

function findAirdropAuthPDA(programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("airdrop")],
    programId
  );
}

function findVestingPDA(winnerPubkey, vestingId, programId) {
  const idx = Buffer.alloc(8);
  idx.writeBigUInt64LE(BigInt(vestingId));
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vesting"), winnerPubkey.toBuffer(), idx],
    programId
  );
}

function findVestingAuthPDA(programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vesting_auth")],
    programId
  );
}

// ─── Draw Seed Utilities ─────────────────────────────────────────────────────

/**
 * Generate a verifiable draw seed from a recent block hash.
 *
 * The backend calls this AFTER the lottery period closes to get an unpredictable seed
 * that was not known when tickets were sold. The seed is emitted on-chain in the
 * DrawCompleted event, allowing anyone to re-run the winner-selection algorithm and
 * verify the results are correct.
 *
 * Usage (backend/admin):
 *   const seed = await generateDrawSeed(connection);
 *   await sdk.drawHourly(payouts, winnerTokenAccounts, seed);
 *
 * @param {Connection} connection - Solana connection
 * @returns {Uint8Array} 32-byte seed derived from the most recent block hash
 */
async function generateDrawSeed(connection) {
  const { blockhash } = await connection.getLatestBlockhash("finalized");
  // Decode base58 blockhash to bytes (blockhash is a base58-encoded 32-byte value)
  const decoded = web3.PublicKey.fromBase58(blockhash).toBytes();
  return decoded; // Uint8Array[32]
}

// ─── SDK Class ───────────────────────────────────────────────────────────────

class TykhePotSDK {
  constructor(connection, wallet, network = "devnet") {
    this.connection = connection;
    this.wallet = wallet;
    this.network = network;

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );

    this.program = new Program(
      IDL,
      new web3.PublicKey(PROGRAM_ID),
      provider
    );

    this.tokenMint = new web3.PublicKey(TOKEN_MINT);

    // Vault addresses (must be set up at deployment)
    this.burnVault = BURN_VAULT ? new web3.PublicKey(BURN_VAULT) : null;
    this.platformVault = PLATFORM_VAULT ? new web3.PublicKey(PLATFORM_VAULT) : null;
    this.hourlyPoolVault = HOURLY_POOL_VAULT ? new web3.PublicKey(HOURLY_POOL_VAULT) : null;
    this.dailyPoolVault = DAILY_POOL_VAULT ? new web3.PublicKey(DAILY_POOL_VAULT) : null;
    this.referralVault = REFERRAL_VAULT ? new web3.PublicKey(REFERRAL_VAULT) : null;
    this.airdropVault = AIRDROP_VAULT ? new web3.PublicKey(AIRDROP_VAULT) : null;
    this.stakingVault = STAKING_VAULT ? new web3.PublicKey(STAKING_VAULT) : null;
    this.vestingVault = VESTING_VAULT ? new web3.PublicKey(VESTING_VAULT) : null;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  formatAmount(amount) {
    return (Number(amount) / 1e9).toFixed(2);
  }

  parseAmount(amount) {
    return new BN(Math.floor(parseFloat(amount) * 1e9));
  }

  async getTokenAccount(owner) {
    return await getAssociatedTokenAddress(
      this.tokenMint,
      new web3.PublicKey(owner)
    );
  }

  _requireVaults(...names) {
    for (const name of names) {
      if (!this[name]) {
        throw new Error(
          `Vault address not configured: ${name}. Set the corresponding env variable in config/contract.js`
        );
      }
    }
  }

  // ─── State Queries ─────────────────────────────────────────────────────────

  async getProtocolState() {
    try {
      const [statePDA] = findStatePDA(this.program.programId);
      return await this.program.account.state.fetch(statePDA);
    } catch (e) {
      console.error("Failed to fetch protocol state:", e);
      return null;
    }
  }

  async getUserData(userPublicKey) {
    try {
      const [userPDA] = findUserDataPDA(
        new web3.PublicKey(userPublicKey),
        this.program.programId
      );
      return await this.program.account.userData.fetch(userPDA);
    } catch (e) {
      return null;
    }
  }

  // Legacy alias
  async getUserState(userPublicKey) {
    return this.getUserData(userPublicKey);
  }

  async getTokenBalance(userPublicKey) {
    try {
      const tokenAccount = await this.getTokenAccount(userPublicKey);
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return BigInt(balance.value.amount);
    } catch (e) {
      return BigInt(0);
    }
  }

  async getPoolStats() {
    try {
      const state = await this.getProtocolState();
      if (!state) return null;
      return {
        hourlyPool: state.hourlyPool.toNumber(),
        dailyPool: state.dailyPool.toNumber(),
        hourlyRollover: state.hourlyRollover.toNumber(),
        dailyRollover: state.dailyRollover.toNumber(),
        // Both names for compatibility
        hourlyPlayers: state.hourlyPlayers,
        dailyPlayers: state.dailyPlayers,
        hourlyParticipants: state.hourlyPlayers,
        dailyParticipants: state.dailyPlayers,
        totalBurned: state.burned.toNumber(),
        referralPool: state.referralPool.toNumber(),
        prePool: state.prePool.toNumber(),
        lastHourlyDraw: state.lastHourlyDraw.toNumber(),
        lastDailyDraw: state.lastDailyDraw.toNumber(),
        paused: state.paused,
      };
    } catch (e) {
      console.error("Failed to get pool stats:", e);
      return null;
    }
  }

  async getStakingState() {
    try {
      const [stakingPDA] = findStakingStatePDA(this.program.programId);
      return await this.program.account.stakingState.fetch(stakingPDA);
    } catch (e) {
      return null;
    }
  }

  async getUserStake(userPublicKey, stakeIndex) {
    try {
      const [userStakePDA] = findUserStakePDA(
        new web3.PublicKey(userPublicKey),
        stakeIndex,
        this.program.programId
      );
      return await this.program.account.userStake.fetch(userStakePDA);
    } catch (e) {
      return null;
    }
  }

  async getUserAirdropData(userPublicKey) {
    try {
      const [userAirdropPDA] = findUserAirdropPDA(
        new web3.PublicKey(userPublicKey),
        this.program.programId
      );
      return await this.program.account.userAirdrop.fetch(userAirdropPDA);
    } catch (e) {
      return null;
    }
  }

  // ─── Core Instructions ─────────────────────────────────────────────────────

  async depositHourly(amount) {
    try {
      this._requireVaults("burnVault", "platformVault", "hourlyPoolVault");
      const user = this.wallet.publicKey;
      const amountBN = this.parseAmount(amount);
      const [statePDA] = findStatePDA(this.program.programId);
      const [userPDA] = findUserDataPDA(user, this.program.programId);
      const userToken = await this.getTokenAccount(user);

      const tx = await this.program.methods
        .depositHourly(amountBN)
        .accounts({
          state: statePDA,
          user: userPDA,
          userToken,
          burnVault: this.burnVault,
          platformVault: this.platformVault,
          poolVault: this.hourlyPoolVault,
          signer: user,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("depositHourly failed:", error);
      return { success: false, error: error.message };
    }
  }

  async depositDaily(amount, referrer = null) {
    try {
      this._requireVaults(
        "burnVault", "platformVault", "dailyPoolVault", "referralVault"
      );
      const user = this.wallet.publicKey;
      const amountBN = this.parseAmount(amount);
      const [statePDA] = findStatePDA(this.program.programId);
      const [userPDA] = findUserDataPDA(user, this.program.programId);
      const userToken = await this.getTokenAccount(user);

      const referrerKey = referrer ? new web3.PublicKey(referrer) : null;
      // When no referrer, use user's own token account as dummy (contract ignores these
      // when referrer arg is null).
      const referrerToken = referrerKey
        ? await this.getTokenAccount(referrerKey)
        : userToken;
      const userReferrerBonus = userToken; // user's own ATA as fallback

      // MED-2: When referrer provided, pass referrer's UserData PDA as remaining_accounts[0]
      // so the contract can verify the referrer has actually participated.
      const remainingAccounts = referrerKey
        ? (() => {
            const [referrerUserDataPDA] = findUserDataPDA(
              referrerKey,
              this.program.programId
            );
            return [{ pubkey: referrerUserDataPDA, isWritable: false, isSigner: false }];
          })()
        : [];

      const tx = await this.program.methods
        .depositDaily(amountBN, referrerKey)
        .accounts({
          state: statePDA,
          user: userPDA,
          userToken,
          burnVault: this.burnVault,
          platformVault: this.platformVault,
          poolVault: this.dailyPoolVault,
          referralVault: this.referralVault,
          referrerToken,
          userReferrerBonus,
          signer: user,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("depositDaily failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Admin: draw hourly lottery with off-chain computed payouts
  // payouts: [{ winner: PublicKey, amount: BN }, ...]
  // winnerTokenAccounts: PublicKey[] (winner ATA list, same order as payouts)
  // drawSeed: Uint8Array | number[] (32 bytes) — use generateDrawSeed(connection) to produce
  async drawHourly(payouts, winnerTokenAccounts, drawSeed) {
    try {
      this._requireVaults("hourlyPoolVault");
      if (!drawSeed || drawSeed.length !== 32) {
        throw new Error("drawSeed must be a 32-byte Uint8Array. Use generateDrawSeed(connection).");
      }
      const [statePDA] = findStatePDA(this.program.programId);

      const formattedPayouts = payouts.map((p) => ({
        winner: new web3.PublicKey(p.winner),
        amount: p.amount instanceof BN ? p.amount : new BN(p.amount),
      }));

      const remainingAccounts = winnerTokenAccounts.map((pk) => ({
        pubkey: new web3.PublicKey(pk),
        isWritable: true,
        isSigner: false,
      }));

      // Anchor expects fixed-size array as number[]
      const seedArray = Array.from(drawSeed);

      const tx = await this.program.methods
        .drawHourly(formattedPayouts, seedArray)
        .accounts({
          state: statePDA,
          authority: this.wallet.publicKey,
          poolVault: this.hourlyPoolVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("drawHourly failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Admin: draw daily lottery
  // drawSeed: Uint8Array | number[] (32 bytes) — use generateDrawSeed(connection) to produce
  async drawDaily(payouts, winnerTokenAccounts, drawSeed) {
    try {
      this._requireVaults("dailyPoolVault");
      if (!drawSeed || drawSeed.length !== 32) {
        throw new Error("drawSeed must be a 32-byte Uint8Array. Use generateDrawSeed(connection).");
      }
      const [statePDA] = findStatePDA(this.program.programId);

      const formattedPayouts = payouts.map((p) => ({
        winner: new web3.PublicKey(p.winner),
        amount: p.amount instanceof BN ? p.amount : new BN(p.amount),
      }));

      const remainingAccounts = winnerTokenAccounts.map((pk) => ({
        pubkey: new web3.PublicKey(pk),
        isWritable: true,
        isSigner: false,
      }));

      // Anchor expects fixed-size array as number[]
      const seedArray = Array.from(drawSeed);

      const tx = await this.program.methods
        .drawDaily(formattedPayouts, seedArray)
        .accounts({
          state: statePDA,
          authority: this.wallet.publicKey,
          poolVault: this.dailyPoolVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("drawDaily failed:", error);
      return { success: false, error: error.message };
    }
  }

  // ─── Free Airdrop (100 TPOT) ───────────────────────────────────────────────

  // Register for free bet. No tokens move — sets free_bet_available = true on-chain.
  async claimFreeAirdrop() {
    try {
      const user = this.wallet.publicKey;
      const [userPDA] = findUserDataPDA(user, this.program.programId);

      const tx = await this.program.methods
        .claimFreeAirdrop()
        .accounts({
          user: userPDA,
          userSigner: user,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("claimFreeAirdrop failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Place the free 100-TPOT bet directly into the daily pool.
  async useFreeBetDaily() {
    try {
      this._requireVaults("airdropVault", "dailyPoolVault");
      const user = this.wallet.publicKey;
      const [statePDA] = findStatePDA(this.program.programId);
      const [userPDA] = findUserDataPDA(user, this.program.programId);
      const [airdropAuth] = findAirdropAuthPDA(this.program.programId);

      const tx = await this.program.methods
        .useFreeBetDaily()
        .accounts({
          state: statePDA,
          user: userPDA,
          airdropVault: this.airdropVault,
          dailyPoolVault: this.dailyPoolVault,
          airdropAuth,
          userSigner: user,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("useFreeBetDaily failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Legacy alias kept for existing callers
  async claimAirdrop() {
    return this.claimFreeAirdrop();
  }

  // ─── Staking ───────────────────────────────────────────────────────────────

  // stakeType: "ShortTerm" | "LongTerm"
  async stake(amount, stakeType, stakeIndex) {
    try {
      this._requireVaults("stakingVault");
      const user = this.wallet.publicKey;
      const amountBN = this.parseAmount(amount);
      const stakeIndexBN = new BN(stakeIndex);
      const [stakingStatePDA] = findStakingStatePDA(this.program.programId);
      const [userStakePDA] = findUserStakePDA(user, stakeIndex, this.program.programId);
      const userToken = await this.getTokenAccount(user);

      const stakeTypeEnum =
        stakeType === "LongTerm" ? { longTerm: {} } : { shortTerm: {} };

      const tx = await this.program.methods
        .stake(stakeIndexBN, amountBN, stakeTypeEnum)
        .accounts({
          user,
          stakingState: stakingStatePDA,
          userStake: userStakePDA,
          userToken,
          stakingVault: this.stakingVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("stake failed:", error);
      return { success: false, error: error.message };
    }
  }

  async stakeShortTerm(amount, stakeIndex = 0) {
    return this.stake(amount, "ShortTerm", stakeIndex);
  }

  async stakeLongTerm(amount, stakeIndex = 0) {
    return this.stake(amount, "LongTerm", stakeIndex);
  }

  async releaseStake(stakeIndex) {
    try {
      this._requireVaults("stakingVault");
      const user = this.wallet.publicKey;
      const stakeIndexBN = new BN(stakeIndex);
      const [stakingStatePDA] = findStakingStatePDA(this.program.programId);
      const [userStakePDA] = findUserStakePDA(user, stakeIndex, this.program.programId);
      const [stakingAuthority] = findStakingAuthorityPDA(this.program.programId);
      const userToken = await this.getTokenAccount(user);

      const tx = await this.program.methods
        .releaseStake(stakeIndexBN)
        .accounts({
          user,
          stakingState: stakingStatePDA,
          userStake: userStakePDA,
          userToken,
          stakingVault: this.stakingVault,
          stakingAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("releaseStake failed:", error);
      return { success: false, error: error.message };
    }
  }

  async earlyWithdraw(stakeIndex) {
    try {
      this._requireVaults("stakingVault");
      const user = this.wallet.publicKey;
      const stakeIndexBN = new BN(stakeIndex);
      const [stakingStatePDA] = findStakingStatePDA(this.program.programId);
      const [userStakePDA] = findUserStakePDA(user, stakeIndex, this.program.programId);
      const [stakingAuthority] = findStakingAuthorityPDA(this.program.programId);
      const userToken = await this.getTokenAccount(user);

      const tx = await this.program.methods
        .earlyWithdraw(stakeIndexBN)
        .accounts({
          user,
          stakingState: stakingStatePDA,
          userStake: userStakePDA,
          userToken,
          stakingVault: this.stakingVault,
          stakingAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("earlyWithdraw failed:", error);
      return { success: false, error: error.message };
    }
  }

  // ─── Profit-Based Airdrop ─────────────────────────────────────────────────

  async claimProfitAirdrop() {
    try {
      this._requireVaults("airdropVault");
      const user = this.wallet.publicKey;
      const [airdropStatePDA] = findAirdropStatePDA(this.program.programId);
      const [userAirdropPDA] = findUserAirdropPDA(user, this.program.programId);
      const [airdropAuthority] = findAirdropAuthPDA(this.program.programId);
      const userToken = await this.getTokenAccount(user);

      const tx = await this.program.methods
        .claimProfitAirdrop()
        .accounts({
          user,
          airdropState: airdropStatePDA,
          userAirdrop: userAirdropPDA,
          userToken,
          airdropVault: this.airdropVault,
          airdropAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("claimProfitAirdrop failed:", error);
      return { success: false, error: error.message };
    }
  }

  // ─── Prize Vesting ────────────────────────────────────────────────────────

  // Admin: lock a winner's prize in vesting_vault and create vesting record
  // poolVaultPubkey: PublicKey of the hourly/daily pool_vault (source of funds)
  // winner: PublicKey | string of the prize winner
  // amount: number (TPOT, human-readable)
  // vestingId: number (use draw timestamp ms / 1000 for uniqueness)
  async initVesting(poolVaultPubkey, winner, amount, vestingId) {
    try {
      this._requireVaults("vestingVault");
      const [statePDA] = findStatePDA(this.program.programId);
      const winnerPubkey = new web3.PublicKey(winner);
      const amountBN = this.parseAmount(amount);
      const vestingIdBN = new BN(vestingId);
      const [vestingAccountPDA] = findVestingPDA(winnerPubkey, vestingId, this.program.programId);

      const tx = await this.program.methods
        .initVesting(winnerPubkey, amountBN, vestingIdBN)
        .accounts({
          state: statePDA,
          authority: this.wallet.publicKey,
          poolVault: new web3.PublicKey(poolVaultPubkey),
          vestingVault: this.vestingVault,
          vestingAccount: vestingAccountPDA,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("initVesting failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Winner: claim all currently unlocked vesting tokens
  // vestingId: number (same value used in initVesting)
  async claimVested(vestingId) {
    try {
      this._requireVaults("vestingVault");
      const user = this.wallet.publicKey;
      const vestingIdBN = new BN(vestingId);
      const [vestingAccountPDA] = findVestingPDA(user, vestingId, this.program.programId);
      const [vestingAuthority] = findVestingAuthPDA(this.program.programId);
      const userToken = await this.getTokenAccount(user);

      const tx = await this.program.methods
        .claimVested(vestingIdBN)
        .accounts({
          winner: user,
          vestingAccount: vestingAccountPDA,
          vestingVault: this.vestingVault,
          userToken,
          vestingAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("claimVested failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Query a vesting record and compute claimable amount
  async getVestingInfo(winnerPublicKey, vestingId) {
    try {
      const winnerPubkey = new web3.PublicKey(winnerPublicKey);
      const [vestingPDA] = findVestingPDA(winnerPubkey, vestingId, this.program.programId);
      const va = await this.program.account.vestingAccount.fetch(vestingPDA);
      const now = Math.floor(Date.now() / 1000);
      const VESTING_DAYS = 20;
      const elapsedDays = Math.floor((now - va.startTime.toNumber()) / 86400);
      const daysVested = Math.min(elapsedDays, VESTING_DAYS);
      const unlockedBps = daysVested * 500; // 5% per day in basis points
      const unlockedAmount = va.totalAmount.toNumber() * unlockedBps / 10000;
      const claimable = Math.max(0, unlockedAmount - va.claimedAmount.toNumber());
      return {
        winner: va.winner.toBase58(),
        totalAmount: va.totalAmount.toNumber() / 1e9,
        claimedAmount: va.claimedAmount.toNumber() / 1e9,
        claimable: claimable / 1e9,
        daysVested,
        daysRemaining: Math.max(0, VESTING_DAYS - elapsedDays),
        startTime: new Date(va.startTime.toNumber() * 1000),
      };
    } catch (e) {
      return null;
    }
  }

  // ─── Admin: Pause Timelock ────────────────────────────────────────────────

  // Schedule a pause 48h in the future (admin only)
  async schedulePause() {
    try {
      const [statePDA] = findStatePDA(this.program.programId);
      const tx = await this.program.methods
        .pause()
        .accounts({ state: statePDA, authority: this.wallet.publicKey })
        .rpc();
      return { success: true, tx };
    } catch (error) {
      console.error("schedulePause failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Execute the scheduled pause after 48h timelock expires (admin only)
  async executePause() {
    try {
      const [statePDA] = findStatePDA(this.program.programId);
      const tx = await this.program.methods
        .executePause()
        .accounts({ state: statePDA, authority: this.wallet.publicKey })
        .rpc();
      return { success: true, tx };
    } catch (error) {
      console.error("executePause failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Resume immediately and cancel any pending pause schedule (admin only)
  async resume() {
    try {
      const [statePDA] = findStatePDA(this.program.programId);
      const tx = await this.program.methods
        .resume()
        .accounts({ state: statePDA, authority: this.wallet.publicKey })
        .rpc();
      return { success: true, tx };
    } catch (error) {
      console.error("resume failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Returns pause schedule info for UI display
  async getPauseStatus() {
    const state = await this.getProtocolState();
    if (!state) return null;
    const scheduledAt = state.pauseScheduledAt?.toNumber?.() ?? 0;
    const now = Math.floor(Date.now() / 1000);
    return {
      paused: state.paused,
      scheduledAt,                             // unix timestamp, 0 = not scheduled
      scheduledAtDate: scheduledAt ? new Date(scheduledAt * 1000) : null,
      timelockExpired: scheduledAt > 0 && now >= scheduledAt,
      secondsRemaining: scheduledAt > 0 ? Math.max(0, scheduledAt - now) : 0,
    };
  }

  // ─── Event Listeners ──────────────────────────────────────────────────────

  onDrawCompleted(callback) {
    return this.program.addEventListener("DrawCompleted", callback);
  }

  onReferralPoolExhausted(callback) {
    return this.program.addEventListener("ReferralPoolExhausted", callback);
  }

  removeEventListener(listenerId) {
    this.program.removeEventListener(listenerId);
  }
}

export default TykhePotSDK;
export { IDL, generateDrawSeed };
