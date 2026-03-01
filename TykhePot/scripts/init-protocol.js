/**
 * TykhePot Protocol Initialiser — v3
 *
 * Steps:
 *  1. Derive all PDAs  (GlobalState, PoolState × 3)
 *  2. Create vault token accounts with correct PDA authorities
 *       • 4 vaults whose authority = GlobalState PDA:
 *           airdrop_vault, referral_vault, reserve_vault, prize_escrow_vault
 *         These MUST be created as independent keypair-based accounts,
 *         NOT as ATAs, because multiple vaults sharing the same owner PDA
 *         and the same mint would all resolve to an identical ATA address.
 *       • 3 pool vaults: authority = PoolState[0/1/2] PDA  (ATA is fine here)
 *       • 1 platform fee vault: ATA for the human platform wallet
 *  3. Call `initialize(platformFeeVault, referralVault, reserveVault, prizeEscrowVault)`
 *  4. Call `initialize_pool(poolType, initialStartTime)` × 3
 *  5. Optionally fund the airdrop vault with TPOT
 *  6. Print all addresses → paste into frontend/src/config/contract.js
 *     and set env vars for cron-draw.js
 *
 * Run (from smart-contract/ — node_modules live there):
 *   cd smart-contract
 *   node ../scripts/init-protocol.js
 *   node ../scripts/init-protocol.js --dry-run    # simulate only, no tx sent
 *   node ../scripts/init-protocol.js --no-fund    # skip airdrop vault funding
 *
 * Environment variables:
 *   ADMIN_KEYPAIR   — path to admin keypair JSON (default: royalpot-keypair.json)
 *   RPC_URL         — Solana RPC (default: devnet)
 *   AIRDROP_FUND_TPOT — how many TPOT to deposit into airdrop vault (default: 100,000,000)
 */

// Allow running from any directory — resolve deps from smart-contract/node_modules
const path = require("path");
module.paths.push(path.join(__dirname, "..", "smart-contract", "node_modules"));

const anchor = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const {
  TOKEN_PROGRAM_ID,
  createAccount,
  getOrCreateAssociatedTokenAccount,
  transfer: splTransfer,
} = require("@solana/spl-token");
const fs   = require("fs");

// ─── Config ───────────────────────────────────────────────────────────────────
const PROGRAM_ID          = new web3.PublicKey("BGvzwkQy2xVLewPANR8siksZJbQD8RN4wKPQczbMRMd5");
const TOKEN_MINT          = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");
const PLATFORM_FEE_WALLET = new web3.PublicKey("F4dQpEz69oQhhsYGiCASbPNAg3XaoGggbHAeuytqZtrm");
const RPC                 = process.env.RPC_URL || "https://api.devnet.solana.com";
const DECIMALS            = 9;
const TPOT_UNIT           = BigInt(10 ** DECIMALS);

const DRY_RUN  = process.argv.includes("--dry-run");
const NO_FUND  = process.argv.includes("--no-fund");
const AIRDROP_FUND = BigInt(process.env.AIRDROP_FUND_TPOT || 100_000_000) * TPOT_UNIT;

// Pool durations (seconds) — must match contract constants
const POOL_DURATIONS = { 0: 1800, 1: 3600, 2: 86400 };
const POOL_NAMES     = { 0: "MIN30", 1: "HOURLY", 2: "DAILY" };

// ─── Minimal IDL (only the instructions used by this script) ─────────────────
const IDL = {
  version: "0.2.0",
  name: "royalpot",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "payer",         isMut: true,  isSigner: true  },
        { name: "globalState",   isMut: true,  isSigner: false },
        { name: "tokenMint",     isMut: false, isSigner: false },
        { name: "airdropVault",  isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      // v3: 4 Pubkey args — the vaults whose authority = GlobalState PDA
      args: [
        { name: "platformFeeVault", type: "publicKey" },
        { name: "referralVault",    type: "publicKey" },
        { name: "reserveVault",     type: "publicKey" },
        { name: "prizeEscrowVault", type: "publicKey" },
      ],
    },
    {
      name: "initializePool",
      accounts: [
        { name: "payer",         isMut: true,  isSigner: true  },
        { name: "poolState",     isMut: true,  isSigner: false },
        { name: "poolVault",     isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "poolType",         type: "u8"  },
        { name: "initialStartTime", type: "i64" },
      ],
    },
  ],
  accounts: [
    { name: "GlobalState", type: { kind: "struct", fields: [] } },
    { name: "PoolState",   type: { kind: "struct", fields: [] } },
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

// ─── Compute aligned round-start times ───────────────────────────────────────
// For clean UX: align each pool's first round to the next natural boundary.
// MIN30  → next :00 or :30 UTC
// HOURLY → next :00 UTC
// DAILY  → next 00:00 UTC
function nextBoundary(poolType) {
  const now = Math.floor(Date.now() / 1000);
  if (poolType === 0) { // 30-min: next :00 or :30
    return Math.ceil(now / 1800) * 1800;
  }
  if (poolType === 1) { // hourly: next :00
    return Math.ceil(now / 3600) * 3600;
  }
  // daily: next midnight UTC
  return Math.ceil(now / 86400) * 86400;
}

// ─── Create a raw token account with a given PDA authority ───────────────────
// We use a unique keypair per vault so that multiple vaults sharing the same
// authority PDA each get a distinct on-chain address.
async function createVaultAccount(connection, payerKp, mint, authorityPda, label) {
  if (DRY_RUN) {
    const fake = web3.Keypair.generate();
    log(`  [dry-run] ${label}: would create ${fake.publicKey.toBase58()} (auth=${authorityPda.toBase58()})`);
    return fake.publicKey;
  }
  const vaultKp = web3.Keypair.generate();
  const addr = await createAccount(connection, payerKp, mint, authorityPda, vaultKp);
  log(`  ${label}: ${addr.toBase58()}`);
  return addr;
}

// ─── Logger ───────────────────────────────────────────────────────────────────
function log(msg) { console.log(msg); }
function section(title) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(` ${title}`);
  console.log("─".repeat(60));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Load admin keypair
  const keypairPath = process.env.ADMIN_KEYPAIR
    || path.join(require("os").homedir(), ".config/solana/id.json");
  if (!fs.existsSync(keypairPath)) {
    console.error(`❌ Keypair not found at ${keypairPath}`);
    console.error("   Set ADMIN_KEYPAIR env to your wallet keypair path.");
    process.exit(1);
  }
  const adminKp = web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf8")))
  );

  const connection = new web3.Connection(RPC, "confirmed");
  const wallet     = new anchor.Wallet(adminKp);
  const provider   = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  console.log("═".repeat(60));
  console.log(" TykhePot v3 — Protocol Initialiser");
  if (DRY_RUN) console.log(" MODE: DRY RUN — no transactions will be sent");
  console.log("═".repeat(60));
  log(`Admin wallet : ${adminKp.publicKey.toBase58()}`);

  const balance = await connection.getBalance(adminKp.publicKey);
  log(`SOL balance  : ${(balance / 1e9).toFixed(4)} SOL`);
  if (!DRY_RUN && balance < 1.5e9) {
    console.error("❌ Need at least 1.5 SOL for vault creation + protocol init.");
    process.exit(1);
  }

  // ── Step 1: Derive PDAs ────────────────────────────────────────────────────
  section("Step 1 — Derive PDAs");
  const [globalStatePda] = getGlobalStatePda();
  const poolStatePdas    = [0, 1, 2].map(pt => getPoolStatePda(pt)[0]);
  log(`  global_state   : ${globalStatePda.toBase58()}`);
  for (let i = 0; i < 3; i++) {
    log(`  pool_state[${i}]  : ${poolStatePdas[i].toBase58()} (${POOL_NAMES[i]})`);
  }

  // ── Step 2: Create vault token accounts ───────────────────────────────────
  section("Step 2 — Create vault token accounts");

  // 4 vaults: authority = GlobalState PDA — MUST be independent keypair accounts (not ATAs)
  // because getOrCreateAssociatedTokenAccount with the same owner+mint always returns
  // the same address, which would make all four vaults point to the same account.
  log("Creating GlobalState-authority vaults (unique keypairs)...");
  const airdropVault     = await createVaultAccount(connection, adminKp, TOKEN_MINT, globalStatePda, "airdrop_vault    ");
  const referralVault    = await createVaultAccount(connection, adminKp, TOKEN_MINT, globalStatePda, "referral_vault   ");
  const reserveVault     = await createVaultAccount(connection, adminKp, TOKEN_MINT, globalStatePda, "reserve_vault    ");
  const prizeEscrowVault = await createVaultAccount(connection, adminKp, TOKEN_MINT, globalStatePda, "prize_escrow_vault");

  // platform_fee_vault — ATA for the human platform wallet (external signer, not PDA)
  log("Creating platform_fee_vault (ATA for platform wallet)...");
  let platformFeeVault;
  if (DRY_RUN) {
    platformFeeVault = web3.Keypair.generate().publicKey;
    log(`  [dry-run] platform_fee_vault: ${platformFeeVault.toBase58()}`);
  } else {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection, adminKp, TOKEN_MINT, PLATFORM_FEE_WALLET
    );
    platformFeeVault = ata.address;
    log(`  platform_fee_vault: ${platformFeeVault.toBase58()}`);
  }

  // 3 pool vaults — authority = PoolState[i] PDA (each PDA is unique, so ATA is fine)
  log("Creating pool vaults (ATA with PoolState PDA authority)...");
  const poolVaults = [];
  for (let i = 0; i < 3; i++) {
    if (DRY_RUN) {
      const fake = web3.Keypair.generate().publicKey;
      log(`  [dry-run] pool_vault[${i}] (${POOL_NAMES[i]}): ${fake.toBase58()}`);
      poolVaults.push(fake);
    } else {
      const ata = await getOrCreateAssociatedTokenAccount(
        connection, adminKp, TOKEN_MINT, poolStatePdas[i], true /* allowOwnerOffCurve */
      );
      log(`  pool_vault[${i}] (${POOL_NAMES[i]}): ${ata.address.toBase58()}`);
      poolVaults.push(ata.address);
    }
  }

  // ── Step 3: Call initialize() ─────────────────────────────────────────────
  section("Step 3 — initialize()");
  if (!DRY_RUN) {
    try {
      const tx = await program.methods
        .initialize(platformFeeVault, referralVault, reserveVault, prizeEscrowVault)
        .accounts({
          payer:         adminKp.publicKey,
          globalState:   globalStatePda,
          tokenMint:     TOKEN_MINT,
          airdropVault,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      log(`✅ initialize OK — tx: ${tx}`);
    } catch (err) {
      if (err.logs?.some(l => l.includes("already in use"))) {
        log("⚠️  GlobalState already initialized — skipping.");
      } else {
        console.error("❌ initialize failed:", err.message);
        if (err.logs) err.logs.forEach(l => console.error("  ", l));
        process.exit(1);
      }
    }
  } else {
    log("[dry-run] Would call initialize(platformFeeVault, referralVault, reserveVault, prizeEscrowVault)");
  }

  // ── Step 4: initialize_pool() × 3 ────────────────────────────────────────
  section("Step 4 — initialize_pool() × 3");
  for (let i = 0; i < 3; i++) {
    const startTime = nextBoundary(i);
    const firstDraw = new Date((startTime + POOL_DURATIONS[i]) * 1000).toUTCString();
    log(`Pool ${i} (${POOL_NAMES[i]}): startTime=${startTime}, first draw at ${firstDraw}`);

    if (!DRY_RUN) {
      try {
        const tx = await program.methods
          .initializePool(i, new BN(startTime))
          .accounts({
            payer:         adminKp.publicKey,
            poolState:     poolStatePdas[i],
            poolVault:     poolVaults[i],
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc();
        log(`✅ initialize_pool(${i}) OK — tx: ${tx}`);
      } catch (err) {
        if (err.logs?.some(l => l.includes("already in use"))) {
          log(`⚠️  PoolState[${i}] already initialized — skipping.`);
        } else {
          console.error(`❌ initialize_pool(${i}) failed:`, err.message);
          if (err.logs) err.logs.forEach(l => console.error("  ", l));
          process.exit(1);
        }
      }
    } else {
      log(`[dry-run] Would call initialize_pool(${i}, ${startTime})`);
    }
  }

  // ── Step 5: Fund airdrop vault ────────────────────────────────────────────
  if (!NO_FUND && !DRY_RUN) {
    section("Step 5 — Fund airdrop vault");
    try {
      const adminAta = await getOrCreateAssociatedTokenAccount(
        connection, adminKp, TOKEN_MINT, adminKp.publicKey
      );
      const adminBalance = BigInt(adminAta.amount);
      log(`Admin TPOT balance: ${adminBalance / TPOT_UNIT} TPOT`);

      if (adminBalance < AIRDROP_FUND) {
        log(`⚠️  Insufficient TPOT (have ${adminBalance / TPOT_UNIT}, need ${AIRDROP_FUND / TPOT_UNIT}). Skipping airdrop fund.`);
      } else {
        const vaultInfo    = await connection.getTokenAccountBalance(airdropVault);
        const vaultBalance = BigInt(vaultInfo.value.amount);
        if (vaultBalance >= AIRDROP_FUND) {
          log(`⚠️  Airdrop vault already has ${vaultBalance / TPOT_UNIT} TPOT — skipping.`);
        } else {
          const toFund = AIRDROP_FUND - vaultBalance;
          log(`Transferring ${toFund / TPOT_UNIT} TPOT to airdrop vault...`);
          const tx = await splTransfer(
            connection, adminKp,
            adminAta.address, airdropVault,
            adminKp, toFund
          );
          log(`✅ Airdrop vault funded — tx: ${tx}`);
        }
      }
    } catch (err) {
      log(`⚠️  Could not fund airdrop vault: ${err.message}`);
    }
  } else if (NO_FUND) {
    section("Step 5 — Skipped (--no-fund)");
  }

  // ── Step 6: Print summary ─────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log(" ✅  INITIALISATION COMPLETE");
  console.log("═".repeat(60));
  console.log("\n1) Update frontend/src/config/contract.js:\n");
  console.log(`export const POOL_30MIN_VAULT   = "${poolVaults[0].toBase58()}";`);
  console.log(`export const POOL_HOURLY_VAULT  = "${poolVaults[1].toBase58()}";`);
  console.log(`export const POOL_DAILY_VAULT   = "${poolVaults[2].toBase58()}";`);
  console.log(`export const AIRDROP_VAULT      = "${airdropVault.toBase58()}";`);
  console.log(`export const PLATFORM_FEE_VAULT = "${platformFeeVault.toBase58()}";`);
  console.log(`export const REFERRAL_VAULT     = "${referralVault.toBase58()}";`);
  console.log(`export const RESERVE_VAULT      = "${reserveVault.toBase58()}";`);
  console.log(`export const PRIZE_ESCROW_VAULT = "${prizeEscrowVault.toBase58()}";`);
  console.log("\n2) Set env vars for cron-draw.js:\n");
  console.log(`export POOL_30MIN_VAULT="${poolVaults[0].toBase58()}"`);
  console.log(`export POOL_HOURLY_VAULT="${poolVaults[1].toBase58()}"`);
  console.log(`export POOL_DAILY_VAULT="${poolVaults[2].toBase58()}"`);
  console.log(`export PLATFORM_FEE_VAULT="${platformFeeVault.toBase58()}"`);
  console.log(`export PRIZE_ESCROW_VAULT="${prizeEscrowVault.toBase58()}"`);
  console.log(`export REFERRAL_VAULT="${referralVault.toBase58()}"`);
  console.log("\n3) PDA addresses (for reference):");
  console.log(`   global_state   : ${globalStatePda.toBase58()}`);
  for (let i = 0; i < 3; i++) {
    console.log(`   pool_state[${i}]  : ${poolStatePdas[i].toBase58()} (${POOL_NAMES[i]})`);
  }
  console.log("═".repeat(60));
}

main().catch(err => {
  console.error("\n❌ Fatal:", err);
  process.exit(1);
});
