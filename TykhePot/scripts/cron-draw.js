/**
 * TykhePot — Automated Draw Cron Service
 *
 * Permissionless crank: anyone can trigger a draw after round_end_time.
 * This script polls all three pools and calls execute_draw when eligible.
 *
 * Pool schedules:
 *   MIN30  (type 0) — every 30 minutes
 *   HOURLY (type 1) — every 1 hour
 *   DAILY  (type 2) — every 24 hours (at 00:00 UTC)
 *
 * Usage:
 *   # Continuous daemon (recommended — poll every 60s)
 *   node scripts/cron-draw.js
 *
 *   # One-shot check (use with system cron, e.g. * * * * *)
 *   node scripts/cron-draw.js --once
 *
 * Environment variables:
 *   CRON_KEYPAIR   — path to cron bot keypair JSON (default: smart-contract/target/deploy/royalpot-keypair.json)
 *   RPC_URL        — Solana RPC endpoint
 *   POLL_INTERVAL  — polling interval in ms (default: 60000)
 *
 * The cron wallet only needs enough SOL to pay tx fees (~0.001 SOL per draw).
 */

const anchor  = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} = require("@solana/spl-token");
const fs   = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────────────
const PROGRAM_ID       = new web3.PublicKey("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");
const TOKEN_MINT       = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");
const PLATFORM_FEE_WALLET = new web3.PublicKey("F4dQpEz69oQhhsYGiCASbPNAg3XaoGggbHAeuytqZtrm");
const RPC              = process.env.RPC_URL || "https://api.devnet.solana.com";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL) || 60_000; // 60s
const RUN_ONCE         = process.argv.includes("--once");

const POOL_TYPES = { MIN30: 0, HOURLY: 1, DAILY: 2 };
const POOL_NAMES = { 0: "MIN30", 1: "HOURLY", 2: "DAILY" };
const POOL_DURATIONS = { 0: 1800, 1: 3600, 2: 86400 }; // seconds

// Vault addresses (fill in after deploy; script will warn if empty)
// Override via env for safety: POOL_30MIN_VAULT, POOL_HOURLY_VAULT, POOL_DAILY_VAULT
const VAULT_ADDRESSES = {
  [POOL_TYPES.MIN30]:  process.env.POOL_30MIN_VAULT  || "",
  [POOL_TYPES.HOURLY]: process.env.POOL_HOURLY_VAULT || "",
  [POOL_TYPES.DAILY]:  process.env.POOL_DAILY_VAULT  || "",
};
const PLATFORM_VAULT  = process.env.PLATFORM_FEE_VAULT || "";

// ─── IDL (execute_draw only) ──────────────────────────────────────────────────
const IDL = {
  version: "0.1.0",
  name: "royalpot",
  instructions: [
    {
      name: "executeDraw",
      accounts: [
        { name: "caller",        isMut: true,  isSigner: true  },
        { name: "poolState",     isMut: true,  isSigner: false },
        { name: "poolVault",     isMut: true,  isSigner: false },
        { name: "tokenMint",     isMut: true,  isSigner: false },
        { name: "platformVault", isMut: true,  isSigner: false },
        { name: "globalState",   isMut: false, isSigner: false },
        { name: "tokenProgram",  isMut: false, isSigner: false },
      ],
      args: [{ name: "drawSeed", type: { array: ["u8", 32] } }],
    },
  ],
  accounts: [
    {
      name: "PoolState",
      type: {
        kind: "struct",
        fields: [
          { name: "poolType",       type: "u8"   },
          { name: "roundNumber",    type: "u64"  },
          { name: "roundStartTime", type: "i64"  },
          { name: "roundEndTime",   type: "i64"  },
          { name: "totalPool",      type: "u64"  },
          { name: "regularCount",   type: "u32"  },
          { name: "freeCount",      type: "u32"  },
          { name: "poolVault",      type: "publicKey" },
        ],
      },
    },
    {
      name: "GlobalState",
      type: { kind: "struct", fields: [] },
    },
  ],
  errors: [],
};

// ─── PDA helpers ─────────────────────────────────────────────────────────────
function getGlobalStatePda() {
  return web3.PublicKey.findProgramAddressSync([Buffer.from("global_state")], PROGRAM_ID);
}

function getPoolStatePda(poolType) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), Buffer.from([poolType])],
    PROGRAM_ID
  );
}

// ─── Draw seed: recent block hash → entropy ───────────────────────────────────
async function generateDrawSeed(connection) {
  const slot = await connection.getSlot("confirmed");
  const block = await connection.getBlock(slot, {
    maxSupportedTransactionVersion: 0,
    transactionDetails: "none",
    rewards: false,
  });
  const hashStr = block?.blockhash ?? slot.toString();
  const buf = Buffer.alloc(32);
  const src = Buffer.from(hashStr, "utf8");
  src.copy(buf, 0, 0, Math.min(src.length, 32));
  return [...buf];
}

// ─── Build remaining_accounts (UserDeposit + FreeDeposit) ────────────────────
async function buildParticipantAccounts(connection, poolType, roundNumber, regularCount, freeCount) {
  const remaining = [];

  if (regularCount > 0) {
    // Fetch UserDeposit accounts: dataSize filter + pool_type memcmp at offset 40
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: "confirmed",
      filters: [
        { dataSize: 8 + 32 + 1 + 8 + 8 + 1 + 7 }, // discriminator(8) + user(32) + pool_type(1) + round(8) + amount(8) + is_free(1) + padding(7)
        { memcmp: { offset: 40, bytes: Buffer.from([poolType]).toString("base64") } },
      ],
    });

    for (const { pubkey, account } of accounts) {
      const data = account.data;
      // round_number at offset 41 (after discriminator + user + pool_type)
      const roundInAccount = data.readBigUInt64LE(41);
      if (roundInAccount !== BigInt(roundNumber)) continue;

      const userKey = new web3.PublicKey(data.slice(8, 40));
      const userTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, userKey);

      remaining.push({ pubkey, isWritable: false, isSigner: false });
      remaining.push({ pubkey: userTokenAccount, isWritable: true, isSigner: false });
    }
  }

  if (freeCount > 0) {
    // Fetch active FreeDeposit accounts: pool_type at offset 40, is_active=1 at offset 41
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: "confirmed",
      filters: [
        { dataSize: 8 + 32 + 1 + 1 + 8 + 1 + 7 }, // FreeDeposit size
        { memcmp: { offset: 40, bytes: Buffer.from([poolType]).toString("base64") } },
        { memcmp: { offset: 41, bytes: Buffer.from([1]).toString("base64") } },
      ],
    });

    for (const { pubkey, account } of accounts) {
      const data = account.data;
      const userKey = new web3.PublicKey(data.slice(8, 40));
      const userTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, userKey);

      remaining.push({ pubkey, isWritable: true, isSigner: false }); // writable: clears is_active flag
      remaining.push({ pubkey: userTokenAccount, isWritable: true, isSigner: false });
    }
  }

  return remaining;
}

// ─── Try to draw one pool ─────────────────────────────────────────────────────
async function tryDraw(program, connection, cronKp, poolType) {
  const name = POOL_NAMES[poolType];

  // Check vault addresses
  if (!VAULT_ADDRESSES[poolType]) {
    log(`[${name}] ⚠️  Pool vault address not set. Set env POOL_${name}_VAULT after deploy.`);
    return;
  }
  if (!PLATFORM_VAULT) {
    log(`[${name}] ⚠️  PLATFORM_FEE_VAULT not set. Set env PLATFORM_FEE_VAULT after deploy.`);
    return;
  }

  const [poolStatePda] = getPoolStatePda(poolType);
  const [globalStatePda] = getGlobalStatePda();

  // Fetch pool state
  let pool;
  try {
    pool = await program.account.poolState.fetch(poolStatePda);
  } catch {
    log(`[${name}] ⚠️  PoolState not initialized yet. Skipping.`);
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const roundEnd = pool.roundEndTime.toNumber();
  const remaining = roundEnd - now;

  if (remaining > 0) {
    log(`[${name}] Round #${pool.roundNumber} — ${remaining}s until draw. Skipping.`);
    return;
  }

  const totalParticipants = pool.regularCount + pool.freeCount;
  log(`[${name}] Round #${pool.roundNumber} — Draw eligible! ` +
    `Participants: ${totalParticipants} (${pool.regularCount} regular + ${pool.freeCount} free). ` +
    `Total pool: ${pool.totalPool.toNumber() / 1e9} TPOT`);

  // Build remaining accounts
  log(`[${name}] Building participant accounts...`);
  const remainingAccounts = await buildParticipantAccounts(
    connection,
    poolType,
    pool.roundNumber.toNumber(),
    pool.regularCount,
    pool.freeCount
  );
  log(`[${name}] Passing ${remainingAccounts.length / 2} participant(s) to contract.`);

  // Generate draw seed from recent block hash
  const drawSeed = await generateDrawSeed(connection);

  // Send transaction
  log(`[${name}] Sending execute_draw...`);
  try {
    const tx = await program.methods
      .executeDraw(drawSeed)
      .accounts({
        caller:        cronKp.publicKey,
        poolState:     poolStatePda,
        poolVault:     new web3.PublicKey(VAULT_ADDRESSES[poolType]),
        tokenMint:     TOKEN_MINT,
        platformVault: new web3.PublicKey(PLATFORM_VAULT),
        globalState:   globalStatePda,
        tokenProgram:  TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .signers([cronKp])
      .rpc();

    log(`[${name}] ✅ execute_draw success! tx: ${tx}`);
    log(`[${name}]    https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (err) {
    // Round may have been drawn by someone else already
    if (
      err.message?.includes("already in use") ||
      err.message?.includes("RoundNotOver") ||
      err.logs?.some(l => l.includes("RoundNotOver") || l.includes("already drawn"))
    ) {
      log(`[${name}] ⚠️  Already drawn or race condition: ${err.message}`);
    } else {
      log(`[${name}] ❌ execute_draw failed: ${err.message}`);
      if (err.logs) {
        err.logs.forEach(l => log(`  ${l}`));
      }
    }
  }
}

// ─── Check all pools ──────────────────────────────────────────────────────────
async function checkAllPools(program, connection, cronKp) {
  for (const poolType of Object.values(POOL_TYPES)) {
    try {
      await tryDraw(program, connection, cronKp, poolType);
    } catch (err) {
      log(`[${POOL_NAMES[poolType]}] ❌ Unexpected error: ${err.message}`);
    }
  }
}

// ─── Logger ───────────────────────────────────────────────────────────────────
function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // Load cron keypair
  const keypairPath = process.env.CRON_KEYPAIR
    || path.join(__dirname, "../smart-contract/target/deploy/royalpot-keypair.json");

  if (!fs.existsSync(keypairPath)) {
    console.error(`❌ Keypair not found at ${keypairPath}`);
    console.error("   Set CRON_KEYPAIR env variable to point to your bot wallet keypair.");
    process.exit(1);
  }

  const cronKp = web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf8")))
  );
  log(`Cron wallet: ${cronKp.publicKey.toBase58()}`);

  // Setup Anchor provider
  const connection = new web3.Connection(RPC, "confirmed");
  const wallet     = new anchor.Wallet(cronKp);
  const provider   = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);
  const program    = new anchor.Program(IDL, PROGRAM_ID, provider);

  // Check balance
  const balance = await connection.getBalance(cronKp.publicKey);
  log(`Cron wallet SOL balance: ${(balance / 1e9).toFixed(4)} SOL`);
  if (balance < 0.01e9) {
    console.warn("⚠️  Low SOL balance. Cron wallet needs SOL for tx fees.");
  }

  if (RUN_ONCE) {
    log("Running one-shot check...");
    await checkAllPools(program, connection, cronKp);
    log("One-shot done.");
    return;
  }

  // Continuous daemon
  log(`Starting daemon. Poll interval: ${POLL_INTERVAL_MS / 1000}s`);
  log("Vault addresses from env:");
  log(`  MIN30  vault: ${VAULT_ADDRESSES[0] || "(not set)"}`);
  log(`  HOURLY vault: ${VAULT_ADDRESSES[1] || "(not set)"}`);
  log(`  DAILY  vault: ${VAULT_ADDRESSES[2] || "(not set)"}`);
  log(`  Platform vault: ${PLATFORM_VAULT || "(not set)"}`);

  // Run immediately, then on interval
  await checkAllPools(program, connection, cronKp);

  setInterval(async () => {
    try {
      await checkAllPools(program, connection, cronKp);
    } catch (err) {
      log(`❌ Poll cycle error: ${err.message}`);
    }
  }, POLL_INTERVAL_MS);
}

main().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
