/**
 * TykhePot — Automated Cron Service v3
 *
 * Permissionless crank for all time-based protocol operations.
 *
 * What this does every poll cycle:
 *   1. For each pool where round_end_time has passed:
 *      - ≥12 participants → execute_draw
 *      - <12 participants → execute_refund
 *   2. For each DrawResult where vesting is not complete:
 *      - For each of the 6 top winners → claim_prize_vesting
 *   3. For each UserDeposit in a successfully drawn round with a referrer:
 *      - claim_referral (pays 8% referral from referral_vault)
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
 *   # One-shot check
 *   node scripts/cron-draw.js --once
 *
 * Environment variables:
 *   CRON_KEYPAIR        — path to cron bot keypair JSON
 *   RPC_URL             — Solana RPC endpoint
 *   POLL_INTERVAL       — polling interval in ms (default: 60000)
 *   POOL_30MIN_VAULT    — pool vault address (type 0)
 *   POOL_HOURLY_VAULT   — pool vault address (type 1)
 *   POOL_DAILY_VAULT    — pool vault address (type 2)
 *   PLATFORM_FEE_VAULT  — platform fee vault address
 *   PRIZE_ESCROW_VAULT  — prize escrow vault address
 *   REFERRAL_VAULT      — referral rewards vault address
 */

const anchor = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} = require("@solana/spl-token");
const fs   = require("fs");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────────────
const PROGRAM_ID  = new web3.PublicKey("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");
const TOKEN_MINT  = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");
const RPC         = process.env.RPC_URL || "https://api.devnet.solana.com";
const POLL_MS     = Number(process.env.POLL_INTERVAL) || 60_000;
const RUN_ONCE    = process.argv.includes("--once");

const POOL_TYPES  = { MIN30: 0, HOURLY: 1, DAILY: 2 };
const POOL_NAMES  = { 0: "MIN30", 1: "HOURLY", 2: "DAILY" };
const MIN_PARTICIPANTS = 12;

// Vault addresses — set via env after deploy
const POOL_VAULT = {
  [POOL_TYPES.MIN30]:  process.env.POOL_30MIN_VAULT  || "",
  [POOL_TYPES.HOURLY]: process.env.POOL_HOURLY_VAULT || "",
  [POOL_TYPES.DAILY]:  process.env.POOL_DAILY_VAULT  || "",
};
const PLATFORM_FEE_VAULT  = process.env.PLATFORM_FEE_VAULT  || "";
const PRIZE_ESCROW_VAULT  = process.env.PRIZE_ESCROW_VAULT  || "";
const REFERRAL_VAULT      = process.env.REFERRAL_VAULT      || "";

// ─── IDL (only the instructions used by this cron) ────────────────────────────
const IDL = {
  version: "0.2.0",
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
          { name: "bump",             type: "u8"        },
        ],
      },
    },
    {
      // top_winners[0]    = 1st prize, [1..2] = 2nd, [3..5] = 3rd
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
    {
      // UserDeposit: disc(8)+user(32)+pool_type(1)+round(8)+amount(8)+referrer(32)+bump(1)+pad(6) = 96
      name: "UserDeposit",
      type: {
        kind: "struct",
        fields: [
          { name: "user",        type: "publicKey" },
          { name: "poolType",    type: "u8"        },
          { name: "roundNumber", type: "u64"       },
          { name: "amount",      type: "u64"       },
          { name: "referrer",    type: "publicKey" },
          { name: "bump",        type: "u8"        },
        ],
      },
    },
  ],
  errors: [],
};

// ─── Constants ────────────────────────────────────────────────────────────────
// UserDeposit on-chain layout (with discriminator)
const USER_DEPOSIT_SIZE = 8 + 32 + 1 + 8 + 8 + 32 + 1 + 6; // 96
// FreeDeposit on-chain layout (with discriminator)
const FREE_DEPOSIT_SIZE = 8 + 32 + 1 + 1 + 8 + 32 + 1 + 7; // 90
// DrawResult on-chain layout (with discriminator): 8+1+8+192+48+48+8+1 = 314
const DRAW_RESULT_SIZE  = 8 + 1 + 8 + 192 + 48 + 48 + 8 + 1; // 314
// Pubkey::default (all zeros) — referrer is unset
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

// ─── Draw seed from finalized blockhash ───────────────────────────────────────
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

// ─── Build remaining_accounts (UserDeposit+FreeDeposit pairs) ─────────────────
async function buildParticipantAccounts(connection, poolType, roundNumber, regularCount, freeCount) {
  const remaining = [];

  if (regularCount > 0) {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: "confirmed",
      filters: [
        { dataSize: USER_DEPOSIT_SIZE }, // 96 bytes
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
        { dataSize: FREE_DEPOSIT_SIZE }, // 90 bytes
        { memcmp: { offset: 40, bytes: Buffer.from([poolType]).toString("base64") } },
        { memcmp: { offset: 41, bytes: Buffer.from([1]).toString("base64") } }, // is_active = true
      ],
    });

    for (const { pubkey, account } of accounts) {
      const data = account.data;
      const userKey = new web3.PublicKey(data.slice(8, 40));
      const userToken = await getAssociatedTokenAddress(TOKEN_MINT, userKey);

      remaining.push({ pubkey, isWritable: true, isSigner: false }); // writable: clears is_active
      remaining.push({ pubkey: userToken, isWritable: true, isSigner: false });
    }
  }

  return remaining;
}

// ─── 1. Try to draw or refund one pool ────────────────────────────────────────
async function tryDrawOrRefund(program, connection, cronKp, poolType) {
  const name = POOL_NAMES[poolType];

  if (!POOL_VAULT[poolType]) {
    log(`[${name}] ⚠️  Pool vault not set (POOL_${name}_VAULT). Skipping.`);
    return;
  }
  if (!PLATFORM_FEE_VAULT || !PRIZE_ESCROW_VAULT) {
    log(`[${name}] ⚠️  PLATFORM_FEE_VAULT or PRIZE_ESCROW_VAULT not set. Skipping.`);
    return;
  }

  const [poolStatePda]  = getPoolStatePda(poolType);
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
  log(`[${name}] Round #${roundNum} eligible. Participants: ${total} (${pool.regularCount} reg + ${pool.freeCount} free)`);

  if (total < MIN_PARTICIPANTS) {
    // ── Refund path ──────────────────────────────────────────────────────────
    log(`[${name}] < ${MIN_PARTICIPANTS} participants — executing refund...`);
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
      log(`[${name}] ✅ execute_refund OK! tx: ${tx}`);
    } catch (err) {
      logTxError(name, "execute_refund", err);
    }
    return;
  }

  // ── Draw path ──────────────────────────────────────────────────────────────
  log(`[${name}] ≥ ${MIN_PARTICIPANTS} participants — executing draw...`);
  const remaining = await buildParticipantAccounts(
    connection, poolType, roundNum, pool.regularCount, pool.freeCount
  );
  const [drawResultPda] = getDrawResultPda(poolType, roundNum);
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
    log(`[${name}] ✅ execute_draw OK! tx: ${tx}`);
    log(`[${name}]    https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (err) {
    // Race condition: another cron already drew this round
    if (
      err.message?.includes("already in use") ||
      err.logs?.some(l => l.includes("already in use") || l.includes("AlreadyDrawn"))
    ) {
      log(`[${name}] ⚠️  Already drawn by another caller. OK.`);
    } else {
      logTxError(name, "execute_draw", err);
    }
  }
}

// ─── 2. Claim vested top prizes for all active DrawResults ────────────────────
async function claimAllVesting(program, connection, cronKp) {
  if (!PRIZE_ESCROW_VAULT) return;

  const [globalStatePda] = getGlobalStatePda();

  // Fetch all DrawResult accounts
  let drawAccounts;
  try {
    drawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: "confirmed",
      filters: [{ dataSize: DRAW_RESULT_SIZE }],
    });
  } catch (err) {
    log(`[Vesting] ⚠️  Could not fetch DrawResult accounts: ${err.message}`);
    return;
  }

  for (const { pubkey: drawPda, account } of drawAccounts) {
    let draw;
    try {
      draw = await program.account.drawResult.fetch(drawPda);
    } catch {
      continue;
    }

    for (let i = 0; i < 6; i++) {
      const total   = draw.topAmounts[i].toNumber();
      const claimed = draw.topClaimed[i].toNumber();
      if (total === 0 || claimed >= total) continue;

      const winner = draw.topWinners[i];
      if (winner.equals(web3.PublicKey.default)) continue;

      let winnerToken;
      try {
        winnerToken = await getAssociatedTokenAddress(TOKEN_MINT, winner);
      } catch {
        continue;
      }

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
        log(`[Vesting] Pool ${draw.poolType} Round #${draw.roundNumber} winner[${i}] → claimed. tx: ${tx}`);
      } catch (err) {
        // "BelowMinimum" = nothing vested today yet; "AlreadyFullyClaimed" = done
        if (
          err.logs?.some(l =>
            l.includes("BelowMinimum") || l.includes("AlreadyFullyClaimed")
          )
        ) {
          // Normal — skip silently
        } else {
          log(`[Vesting] ⚠️  Pool ${draw.poolType} Round #${draw.roundNumber} winner[${i}]: ${err.message}`);
        }
      }
    }
  }
}

// ─── 3. Claim referral rewards for all eligible UserDeposit accounts ──────────
async function claimAllReferrals(program, connection, cronKp) {
  if (!REFERRAL_VAULT) {
    log("[Referral] ⚠️  REFERRAL_VAULT not set. Skipping.");
    return;
  }

  const [globalStatePda] = getGlobalStatePda();

  // Fetch all UserDeposit accounts that have a non-default referrer
  // referrer field offset: disc(8)+user(32)+pool_type(1)+round(8)+amount(8) = offset 57
  // A non-default referrer means the 32 bytes at offset 57 are not all zeros.
  // We can't easily filter non-zero with memcmp, so fetch all and filter in JS.
  let deposits;
  try {
    deposits = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: "confirmed",
      filters: [{ dataSize: USER_DEPOSIT_SIZE }], // 96 bytes
    });
  } catch (err) {
    log(`[Referral] ⚠️  Could not fetch UserDeposit accounts: ${err.message}`);
    return;
  }

  for (const { pubkey: depositPda, account } of deposits) {
    const data = account.data;

    // Read referrer pubkey at offset 57 (8 disc + 32 user + 1 pool_type + 8 round + 8 amount)
    const referrerBytes = data.slice(57, 89);
    const referrerKey   = new web3.PublicKey(referrerBytes);
    if (referrerKey.equals(DEFAULT_PUBKEY)) continue; // no referrer set

    // Read pool_type at offset 40, round_number at offset 41
    const poolType   = data[40];
    const roundNum   = Number(data.readBigUInt64LE(41));

    // Verify DrawResult PDA exists (proves draw was successful, not refunded)
    const [drawResultPda] = getDrawResultPda(poolType, roundNum);
    let drawExists = false;
    try {
      await program.account.drawResult.fetch(drawResultPda);
      drawExists = true;
    } catch {
      drawExists = false;
    }
    if (!drawExists) continue; // round was refunded — skip

    // Pay referral
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
      log(`[Referral] Pool ${poolType} Round #${roundNum} referral paid → tx: ${tx}`);
    } catch (err) {
      if (
        err.logs?.some(l =>
          l.includes("NoReferral") || l.includes("already in use")
        )
      ) {
        // Already claimed — normal
      } else {
        log(`[Referral] ⚠️  Pool ${poolType} Round #${roundNum}: ${err.message}`);
      }
    }
  }
}

// ─── Main poll cycle ──────────────────────────────────────────────────────────
async function runCycle(program, connection, cronKp) {
  // 1. Draw or refund each pool
  for (const poolType of Object.values(POOL_TYPES)) {
    try {
      await tryDrawOrRefund(program, connection, cronKp, poolType);
    } catch (err) {
      log(`[${POOL_NAMES[poolType]}] ❌ Unexpected error: ${err.message}`);
    }
  }

  // 2. Vesting payouts (top prize 5%/day × 20 days)
  try {
    await claimAllVesting(program, connection, cronKp);
  } catch (err) {
    log(`[Vesting] ❌ Unexpected error: ${err.message}`);
  }

  // 3. Referral payouts (8% to referrer, deferred to draw time)
  try {
    await claimAllReferrals(program, connection, cronKp);
  } catch (err) {
    log(`[Referral] ❌ Unexpected error: ${err.message}`);
  }
}

// ─── Logger ───────────────────────────────────────────────────────────────────
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function logTxError(tag, ix, err) {
  log(`[${tag}] ❌ ${ix} failed: ${err.message}`);
  if (err.logs) err.logs.forEach(l => log(`  ${l}`));
}

// ─── Entry point ──────────────────────────────────────────────────────────────
async function main() {
  const keypairPath = process.env.CRON_KEYPAIR
    || path.join(__dirname, "../smart-contract/target/deploy/royalpot-keypair.json");

  if (!fs.existsSync(keypairPath)) {
    console.error(`❌ Keypair not found at ${keypairPath}`);
    console.error("   Set CRON_KEYPAIR env to your bot wallet keypair path.");
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
  if (balance < 0.05e9) log("⚠️  Low SOL — top up cron wallet to ensure tx fees.");

  if (RUN_ONCE) {
    log("Running one-shot cycle...");
    await runCycle(program, connection, cronKp);
    log("Done.");
    return;
  }

  // Continuous daemon
  log(`Daemon started. Poll interval: ${POLL_MS / 1000}s`);
  log(`Pool vaults: MIN30=${POOL_VAULT[0]||"(not set)"}, HOURLY=${POOL_VAULT[1]||"(not set)"}, DAILY=${POOL_VAULT[2]||"(not set)"}`);
  log(`PLATFORM_FEE_VAULT:  ${PLATFORM_FEE_VAULT  || "(not set)"}`);
  log(`PRIZE_ESCROW_VAULT:  ${PRIZE_ESCROW_VAULT  || "(not set)"}`);
  log(`REFERRAL_VAULT:      ${REFERRAL_VAULT      || "(not set)"}`);

  await runCycle(program, connection, cronKp);
  setInterval(async () => {
    try {
      await runCycle(program, connection, cronKp);
    } catch (err) {
      log(`❌ Poll cycle error: ${err.message}`);
    }
  }, POLL_MS);
}

main().catch(err => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
