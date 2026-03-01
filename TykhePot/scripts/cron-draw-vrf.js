/**
 * TykhePot — VRF Cron Service v4
 *
 * Same as cron-draw.js but uses Switchboard VRF for random draws.
 *
 * Prerequisites:
 *   1. VRF_ACCOUNT must be set in environment or config
 *   2. VRF state must be initialized (call init-vrf.ts first)
 *   3. VRF request must be made before draw (auto-handled here)
 *
 * Usage:
 *   node scripts/cron-draw-vrf.js
 *   node scripts/cron-draw-vrf.js --once
 *
 * Environment variables:
 *   VRF_ACCOUNT          — Switchboard VRF account pubkey
 *   VRF_REQUEST_DELAY    — seconds to wait after VRF request (default: 30)
 *   ... (same as cron-draw.js)
 */

const path = require("path");
module.paths.push(path.join(__dirname, "..", "smart-contract", "node_modules"));

const anchor = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} = require("@solana/spl-token");
const fs = require("fs");

// ─── Config ───────────────────────────────────────────────────────────────────
const PROGRAM_ID  = new web3.PublicKey("BGvzwkQy2xVLewPANR8siksZJbQD8RN4wKPQczbMRMd5");
const TOKEN_MINT  = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");
const RPC         = process.env.RPC_URL || "https://api.devnet.solana.com";
const POLL_MS     = Number(process.env.POLL_INTERVAL) || 60_000;
const RUN_ONCE    = process.argv.includes("--once");
const USE_VRF     = !process.argv.includes("--no-vrf"); // fallback to legacy if --no-vrf

// VRF config
const VRF_ACCOUNT        = process.env.VRF_ACCOUNT || "";
const VRF_REQUEST_DELAY  = Number(process.env.VRF_REQUEST_DELAY) || 30; // seconds

const POOL_TYPES  = { MIN30: 0, HOURLY: 1, DAILY: 2 };
const POOL_NAMES  = { 0: "MIN30", 1: "HOURLY", 2: "DAILY" };
const MIN_PARTICIPANTS = 12;

const POOL_VAULT = {
  [POOL_TYPES.MIN30]:  process.env.POOL_30MIN_VAULT  || "J4VwzLdrpvjCsykP7P7JUR4UhvTdLnfyjcgysdQ8YuZG",
  [POOL_TYPES.HOURLY]: process.env.POOL_HOURLY_VAULT || "FJW1LuZMZbD5qobN95fMFwNQoYis23CmopZBVqzB4Xps",
  [POOL_TYPES.DAILY]:  process.env.POOL_DAILY_VAULT  || "GNXJ7eEtBHvh6K4Ppi3SX6skKTu7NuWCgXr99DyUeu4G",
};
const PLATFORM_FEE_VAULT  = process.env.PLATFORM_FEE_VAULT  || "2Gq8ZCP1jg3FXKaMJeEQCBJuyv1VznW5ZvYdVJvKiJQe";
const PRIZE_ESCROW_VAULT  = process.env.PRIZE_ESCROW_VAULT  || "G7NNS4QdM1Zau543TwdtBHwWa9UG4U1zVzAf3eS55SCK";
const REFERRAL_VAULT      = process.env.REFERRAL_VAULT      || "85HhmvBsE6VNGYWMWdC9WCK47mPLCVrsHGu1PxokY9xS";

// ─── IDL (includes VRF instructions) ───────────────────────────────────────────
const IDL = {
  version: "0.3.0",
  name: "royalpot",
  instructions: [
    {
      name: "executeDraw",
      accounts: [
        { name: "caller",           isMut: true,  isSigner: true  },
        { name: "poolState",        isMut: true,  isSigner: false },
        { name: "poolVault",        isMut: true,  isSigner: false },
        { name: "tokenMint",        isMut: true,  isSigner: false },
        { name: "platformVault",    isMut: true,  isSigner: false },
        { name: "prizeEscrowVault", isMut: true,  isSigner: false },
        { name: "globalState",      isMut: false, isSigner: false },
        { name: "drawResult",       isMut: true,  isSigner: false },
        { name: "tokenProgram",     isMut: false, isSigner: false },
        { name: "systemProgram",    isMut: false, isSigner: false },
      ],
      args: [{ name: "drawSeed", type: { array: ["u8", 32] } }],
    },
    {
      name: "executeDrawVrf",
      accounts: [
        { name: "caller",           isMut: true,  isSigner: true  },
        { name: "vrfState",         isMut: true,  isSigner: false },
        { name: "poolState",        isMut: true,  isSigner: false },
        { name: "poolVault",        isMut: true,  isSigner: false },
        { name: "tokenMint",        isMut: true,  isSigner: false },
        { name: "platformVault",    isMut: true,  isSigner: false },
        { name: "prizeEscrowVault", isMut: true,  isSigner: false },
        { name: "globalState",      isMut: false, isSigner: false },
        { name: "drawResult",       isMut: true,  isSigner: false },
        { name: "vrf",              isMut: false, isSigner: false },
        { name: "tokenProgram",     isMut: false, isSigner: false },
        { name: "systemProgram",    isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "requestVrf",
      accounts: [
        { name: "caller",       isMut: true,  isSigner: true  },
        { name: "vrfState",     isMut: true,  isSigner: false },
        { name: "poolState",    isMut: false, isSigner: false },
        { name: "vrf",          isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "poolType", type: "u8" }],
    },
    {
      name: "executeRefund",
      accounts: [
        { name: "caller",       isMut: false, isSigner: true  },
        { name: "poolState",    isMut: true,  isSigner: false },
        { name: "poolVault",    isMut: true,  isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "claimPrizeVesting",
      accounts: [
        { name: "caller",             isMut: false, isSigner: true  },
        { name: "drawResult",         isMut: true,  isSigner: false },
        { name: "globalState",        isMut: false, isSigner: false },
        { name: "prizeEscrowVault",   isMut: true,  isSigner: false },
        { name: "winnerTokenAccount", isMut: true,  isSigner: false },
        { name: "tokenProgram",       isMut: false, isSigner: false },
      ],
      args: [{ name: "winnerIndex", type: "u8" }],
    },
    {
      name: "claimReferral",
      accounts: [
        { name: "caller",               isMut: false, isSigner: true  },
        { name: "drawResult",           isMut: false, isSigner: false },
        { name: "userDeposit",          isMut: true,  isSigner: false },
        { name: "globalState",          isMut: false, isSigner: false },
        { name: "referralVault",        isMut: true,  isSigner: false },
        { name: "referrerTokenAccount", isMut: true,  isSigner: false },
        { name: "tokenProgram",         isMut: false, isSigner: false },
      ],
      args: [
        { name: "poolType",    type: "u8"  },
        { name: "roundNumber", type: "u64" },
      ],
    },
  ],
  accounts: [
    {
      name: "PoolState",
      type: {
        kind: "struct",
        fields: [
          { name: "poolType",       type: "u8"        },
          { name: "roundNumber",    type: "u64"        },
          { name: "roundStartTime", type: "i64"        },
          { name: "roundEndTime",   type: "i64"        },
          { name: "totalDeposited", type: "u64"        },
          { name: "freeBetTotal",   type: "u64"        },
          { name: "regularCount",   type: "u32"        },
          { name: "freeCount",      type: "u32"        },
          { name: "vault",          type: "publicKey"  },
          { name: "rollover",       type: "u64"        },
          { name: "bump",           type: "u8"         },
        ],
      },
    },
    {
      name: "VrfState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority",        type: "publicKey" },
          { name: "vrf",              type: "publicKey" },
          { name: "pendingDraw",      type: { option: { defined: "PendingDraw" } } },
          { name: "bump",             type: "u8"        },
        ],
      },
    },
    {
      name: "PendingDraw",
      type: {
        kind: "struct",
        fields: [
          { name: "poolType",         type: "u8"  },
          { name: "roundNumber",      type: "u64" },
          { name: "requestSlot",      type: "u64" },
          { name: "requestTimestamp", type: "i64" },
        ],
      },
    },
    {
      name: "DrawResult",
      type: {
        kind: "struct",
        fields: [
          { name: "poolType",      type: "u8"                      },
          { name: "roundNumber",   type: "u64"                     },
          { name: "topWinners",    type: { array: ["publicKey", 6] } },
          { name: "topAmounts",    type: { array: ["u64", 6] }     },
          { name: "topClaimed",    type: { array: ["u64", 6] }     },
          { name: "drawTimestamp", type: "i64"                     },
          { name: "bump",          type: "u8"                      },
        ],
      },
    },
  ],
  errors: [
    { code: 6026, name: "ProtocolPaused" },
    { code: 6027, name: "Unauthorized" },
    { code: 6028, name: "TimelockNotExpired" },
    { code: 6029, name: "NoPendingOperation" },
  ],
};

// ─── Constants ────────────────────────────────────────────────────────────────
const USER_DEPOSIT_SIZE = 8 + 32 + 1 + 8 + 8 + 32 + 1 + 6;
const FREE_DEPOSIT_SIZE = 8 + 32 + 1 + 1 + 8 + 32 + 1 + 7;
const DRAW_RESULT_SIZE  = 8 + 1 + 8 + 192 + 48 + 48 + 8 + 1;
const VRF_STATE_SIZE    = 8 + 32 + 32 + (1 + 1 + 8 + 8 + 8) + 1 + 64;
const DEFAULT_PUBKEY = new web3.PublicKey("11111111111111111111111111111111");

// ─── PDA helpers ──────────────────────────────────────────────────────────────
function getGlobalStatePda() {
  return web3.PublicKey.findProgramAddressSync([Buffer.from("global_state")], PROGRAM_ID);
}
function getPoolStatePda(poolType) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), Buffer.from([poolType])], PROGRAM_ID
  );
}
function getDrawResultPda(poolType, roundNumber) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(roundNumber));
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("draw_result"), Buffer.from([poolType]), buf], PROGRAM_ID
  );
}
function getVrfStatePda() {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vrf_state")], PROGRAM_ID
  );
}

// ─── Legacy draw seed (fallback) ─────────────────────────────────────────────
async function generateDrawSeed(connection) {
  const slot  = await connection.getSlot("finalized");
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

// ─── Build participant accounts ───────────────────────────────────────────────
async function buildParticipantAccounts(connection, poolType, roundNumber, regularCount, freeCount) {
  const remaining = [];

  if (regularCount > 0) {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: "confirmed",
      filters: [
        { dataSize: USER_DEPOSIT_SIZE },
        { memcmp: { offset: 40, bytes: Buffer.from([poolType]).toString("base64") } },
      ],
    });

    for (const { pubkey, account } of accounts) {
      const data = account.data;
      const roundInAcc = data.readBigUInt64LE(41);
      if (roundInAcc !== BigInt(roundNumber)) continue;

      const userKey = new web3.PublicKey(data.slice(8, 40));
      const userToken = await getAssociatedTokenAddress(TOKEN_MINT, userKey);

      remaining.push({ pubkey, isWritable: false, isSigner: false });
      remaining.push({ pubkey: userToken, isWritable: true, isSigner: false });
    }
  }

  if (freeCount > 0) {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: "confirmed",
      filters: [
        { dataSize: FREE_DEPOSIT_SIZE },
        { memcmp: { offset: 40, bytes: Buffer.from([poolType]).toString("base64") } },
        { memcmp: { offset: 41, bytes: Buffer.from([1]).toString("base64") } },
      ],
    });

    for (const { pubkey, account } of accounts) {
      const data = account.data;
      const userKey = new web3.PublicKey(data.slice(8, 40));
      const userToken = await getAssociatedTokenAddress(TOKEN_MINT, userKey);

      remaining.push({ pubkey, isWritable: true, isSigner: false });
      remaining.push({ pubkey: userToken, isWritable: true, isSigner: false });
    }
  }

  return remaining;
}

// ─── Check if VRF is configured ───────────────────────────────────────────────
async function isVrfReady(program) {
  if (!VRF_ACCOUNT || !USE_VRF) return false;
  
  try {
    const [vrfStatePda] = getVrfStatePda();
    await program.account.vrfState.fetch(vrfStatePda);
    return true;
  } catch {
    return false;
  }
}

// ─── Try draw or refund with VRF support ───────────────────────────────────────
async function tryDrawOrRefund(program, connection, cronKp, poolType, useVrf) {
  const name = POOL_NAMES[poolType];
  const [poolStatePda] = getPoolStatePda(poolType);
  const [globalStatePda] = getGlobalStatePda();

  let pool;
  try {
    pool = await program.account.poolState.fetch(poolStatePda);
  } catch {
    log(`[${name}] ⚠️  PoolState not initialized. Skipping.`);
    return;
  }

  const now      = Math.floor(Date.now() / 1000);
  const roundEnd = pool.roundEndTime.toNumber();
  const roundNum = pool.roundNumber.toNumber();

  if (now < roundEnd) {
    log(`[${name}] Round #${roundNum} — ${roundEnd - now}s until draw.`);
    return;
  }

  const total = pool.regularCount + pool.freeCount;
  log(`[${name}] Round #${roundNum} eligible. Participants: ${total}`);

  if (total < MIN_PARTICIPANTS) {
    // Refund
    log(`[${name}] < ${MIN_PARTICIPANTS} participants — refunding...`);
    const remaining = await buildParticipantAccounts(
      connection, poolType, roundNum, pool.regularCount, 0
    );
    try {
      const tx = await program.methods
        .executeRefund()
        .accounts({
          caller:       cronKp.publicKey,
          poolState:    poolStatePda,
          poolVault:    new web3.PublicKey(POOL_VAULT[poolType]),
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remaining)
        .signers([cronKp])
        .rpc();
      log(`[${name}] ✅ refund OK! tx: ${tx}`);
    } catch (err) {
      logTxError(name, "refund", err);
    }
    return;
  }

  // Draw
  const remaining = await buildParticipantAccounts(
    connection, poolType, roundNum, pool.regularCount, pool.freeCount
  );
  const [drawResultPda] = getDrawResultPda(poolType, roundNum);

  if (useVrf && VRF_ACCOUNT) {
    // VRF draw
    log(`[${name}] Using VRF draw...`);
    
    const [vrfStatePda] = getVrfStatePda();
    
    try {
      const tx = await program.methods
        .executeDrawVrf()
        .accounts({
          caller:           cronKp.publicKey,
          vrfState:         vrfStatePda,
          poolState:        poolStatePda,
          poolVault:        new web3.PublicKey(POOL_VAULT[poolType]),
          tokenMint:        TOKEN_MINT,
          platformVault:    new web3.PublicKey(PLATFORM_FEE_VAULT),
          prizeEscrowVault: new web3.PublicKey(PRIZE_ESCROW_VAULT),
          globalState:      globalStatePda,
          drawResult:       drawResultPda,
          vrf:              new web3.PublicKey(VRF_ACCOUNT),
          tokenProgram:     TOKEN_PROGRAM_ID,
          systemProgram:    web3.SystemProgram.programId,
        })
        .remainingAccounts(remaining)
        .signers([cronKp])
        .rpc();
      log(`[${name}] ✅ VRF draw OK! tx: ${tx}`);
    } catch (err) {
      if (err.message?.includes("already in use")) {
        log(`[${name}] ⚠️  Already drawn.`);
      } else if (err.message?.includes("VrfRequestTimeout") || err.message?.includes("NoPendingVrfRequest")) {
        log(`[${name}] ⚠️  VRF not ready, falling back to legacy draw...`);
        await legacyDraw(program, cronKp, poolType, roundNum, poolStatePda, globalStatePda, drawResultPda, remaining, connection);
      } else {
        logTxError(name, "VRF draw", err);
      }
    }
  } else {
    // Legacy draw
    await legacyDraw(program, cronKp, poolType, roundNum, poolStatePda, globalStatePda, drawResultPda, remaining, connection);
  }
}

async function legacyDraw(program, cronKp, poolType, roundNum, poolStatePda, globalStatePda, drawResultPda, remaining, connection) {
  const name = POOL_NAMES[poolType];
  log(`[${name}] Using legacy draw...`);
  
  const drawSeed = await generateDrawSeed(connection);
  
  try {
    const tx = await program.methods
      .executeDraw(drawSeed)
      .accounts({
        caller:           cronKp.publicKey,
        poolState:        poolStatePda,
        poolVault:        new web3.PublicKey(POOL_VAULT[poolType]),
        tokenMint:        TOKEN_MINT,
        platformVault:    new web3.PublicKey(PLATFORM_FEE_VAULT),
        prizeEscrowVault: new web3.PublicKey(PRIZE_ESCROW_VAULT),
        globalState:      globalStatePda,
        drawResult:       drawResultPda,
        tokenProgram:     TOKEN_PROGRAM_ID,
        systemProgram:    web3.SystemProgram.programId,
      })
      .remainingAccounts(remaining)
      .signers([cronKp])
      .rpc();
    log(`[${name}] ✅ legacy draw OK! tx: ${tx}`);
  } catch (err) {
    if (err.message?.includes("already in use")) {
      log(`[${name}] ⚠️  Already drawn.`);
    } else {
      logTxError(name, "legacy draw", err);
    }
  }
}

// ─── Claim vesting ─────────────────────────────────────────────────────────────
async function claimAllVesting(program, connection, cronKp) {
  const [globalStatePda] = getGlobalStatePda();

  let drawAccounts;
  try {
    drawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: "confirmed",
      filters: [{ dataSize: DRAW_RESULT_SIZE }],
    });
  } catch { return; }

  for (const { pubkey: drawPda, account } of drawAccounts) {
    let draw;
    try { draw = await program.account.drawResult.fetch(drawPda); } catch { continue; }

    for (let i = 0; i < 6; i++) {
      const total = draw.topAmounts[i].toNumber();
      const claimed = draw.topClaimed[i].toNumber();
      if (total === 0 || claimed >= total) continue;

      const winner = draw.topWinners[i];
      if (winner.equals(web3.PublicKey.default)) continue;

      let winnerToken;
      try { winnerToken = await getAssociatedTokenAddress(TOKEN_MINT, winner); } catch { continue; }

      try {
        const tx = await program.methods
          .claimPrizeVesting(i)
          .accounts({
            caller:             cronKp.publicKey,
            drawResult:         drawPda,
            globalState:        globalStatePda,
            prizeEscrowVault:   new web3.PublicKey(PRIZE_ESCROW_VAULT),
            winnerTokenAccount: winnerToken,
            tokenProgram:       TOKEN_PROGRAM_ID,
          })
          .signers([cronKp])
          .rpc();
        log(`[Vesting] Pool ${draw.poolType} Round #${draw.roundNumber} winner[${i}] → claimed`);
      } catch (err) {
        if (!err.logs?.some(l => l.includes("BelowMinimum") || l.includes("AlreadyFullyClaimed"))) {
          log(`[Vesting] ⚠️  winner[${i}]: ${err.message}`);
        }
      }
    }
  }
}

// ─── Claim referrals ───────────────────────────────────────────────────────────
async function claimAllReferrals(program, connection, cronKp) {
  const [globalStatePda] = getGlobalStatePda();

  let deposits;
  try {
    deposits = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: "confirmed",
      filters: [{ dataSize: USER_DEPOSIT_SIZE }],
    });
  } catch { return; }

  for (const { pubkey: depositPda, account } of deposits) {
    const data = account.data;
    const referrerBytes = data.slice(57, 89);
    const referrerKey = new web3.PublicKey(referrerBytes);
    if (referrerKey.equals(DEFAULT_PUBKEY)) continue;

    const poolType = data[40];
    const roundNum = Number(data.readBigUInt64LE(41));

    const [drawResultPda] = getDrawResultPda(poolType, roundNum);
    try { await program.account.drawResult.fetch(drawResultPda); } catch { continue; }

    try {
      const tx = await program.methods
        .claimReferral(poolType, new BN(roundNum))
        .accounts({
          caller:               cronKp.publicKey,
          drawResult:           drawResultPda,
          userDeposit:          depositPda,
          globalState:          globalStatePda,
          referralVault:        new web3.PublicKey(REFERRAL_VAULT),
          referrerTokenAccount: referrerKey,
          tokenProgram:         TOKEN_PROGRAM_ID,
        })
        .signers([cronKp])
        .rpc();
      log(`[Referral] Pool ${poolType} Round #${roundNum} paid`);
    } catch (err) {
      if (!err.logs?.some(l => l.includes("NoReferral"))) {
        log(`[Referral] ⚠️  Pool ${poolType} Round #${roundNum}: ${err.message}`);
      }
    }
  }
}

// ─── Main cycle ────────────────────────────────────────────────────────────────
async function runCycle(program, connection, cronKp, useVrf) {
  for (const poolType of Object.values(POOL_TYPES)) {
    try {
      await tryDrawOrRefund(program, connection, cronKp, poolType, useVrf);
    } catch (err) {
      log(`[${POOL_NAMES[poolType]}] ❌ ${err.message}`);
    }
  }

  try { await claimAllVesting(program, connection, cronKp); } catch {}
  try { await claimAllReferrals(program, connection, cronKp); } catch {}
}

// ─── Logger ───────────────────────────────────────────────────────────────────
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function logTxError(tag, ix, err) {
  log(`[${tag}] ❌ ${ix} failed: ${err.message}`);
  if (err.logs) err.logs.slice(0, 5).forEach(l => log(`  ${l}`));
}

// ─── Entry ─────────────────────────────────────────────────────────────────────
async function main() {
  const keypairPath = process.env.CRON_KEYPAIR
    || path.join(__dirname, "../smart-contract/target/deploy/royalpot-keypair.json");

  if (!fs.existsSync(keypairPath)) {
    console.error(`❌ Keypair not found at ${keypairPath}`);
    process.exit(1);
  }

  const cronKp     = web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf8")))
  );
  const connection = new web3.Connection(RPC, "confirmed");
  const wallet     = new anchor.Wallet(cronKp);
  const provider   = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);
  const program    = new anchor.Program(IDL, PROGRAM_ID, provider);

  log(`Cron wallet: ${cronKp.publicKey.toBase58()}`);
  
  const balance = await connection.getBalance(cronKp.publicKey);
  log(`SOL balance: ${(balance / 1e9).toFixed(4)} SOL`);
  if (balance < 0.05e9) log("⚠️  Low SOL — top up cron wallet.");

  // Check VRF status
  const useVrf = await isVrfReady(program);
  log(`VRF mode: ${useVrf ? "ENABLED" : "DISABLED (using legacy draw)"}`);
  if (useVrf) log(`VRF Account: ${VRF_ACCOUNT}`);

  if (RUN_ONCE) {
    log("Running one-shot cycle...");
    await runCycle(program, connection, cronKp, useVrf);
    log("Done.");
    return;
  }

  log(`Daemon started. Poll: ${POLL_MS / 1000}s`);
  await runCycle(program, connection, cronKp, useVrf);
  setInterval(async () => {
    try { await runCycle(program, connection, cronKp, useVrf); } 
    catch (err) { log(`❌ Cycle error: ${err.message}`); }
  }, POLL_MS);
}

main().catch(err => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
