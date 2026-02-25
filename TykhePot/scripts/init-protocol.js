/**
 * TykhePot Protocol Initializer — New Architecture
 *
 * Steps:
 *  1. Derive all PDAs (GlobalState, PoolState × 3)
 *  2. Create vault token accounts with PDA authorities
 *  3. Call `initialize` → creates GlobalState on-chain
 *  4. Call `initialize_pool` × 3 → creates PoolState PDAs on-chain
 *  5. Create platform_fee_vault (authority = platform wallet)
 *  6. Fund airdrop_vault with TPOT from admin wallet
 *  7. Print all addresses → paste into frontend/src/config/contract.js
 *
 * Run:
 *   cd TykhePot/TykhePot
 *   node scripts/init-protocol.js
 *
 * Requirements:
 *   - Admin keypair at smart-contract/target/deploy/royalpot-keypair.json (or set ADMIN_KEYPAIR env)
 *   - Program already deployed at PROGRAM_ID
 *   - Admin wallet holds TPOT to fund the airdrop vault
 */

const anchor  = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  transfer: splTransfer,
  getMint,
} = require("@solana/spl-token");
const fs   = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────────────
const PROGRAM_ID  = new web3.PublicKey("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");
const TOKEN_MINT  = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");
const PLATFORM_FEE_WALLET = new web3.PublicKey("F4dQpEz69oQhhsYGiCASbPNAg3XaoGggbHAeuytqZtrm");
const RPC         = process.env.RPC_URL || "https://api.devnet.solana.com";
const DECIMALS    = 9;

// How much TPOT to put in the airdrop vault (100M TPOT)
const AIRDROP_FUND = BigInt(100_000_000) * BigInt(10 ** DECIMALS);

// Pool types matching the contract
const POOL_TYPES = { MIN30: 0, HOURLY: 1, DAILY: 2 };

// ─── Minimal IDL (initialize + initialize_pool only) ─────────────────────────
const IDL = {
  version: "0.1.0",
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
      args: [],
    },
    {
      name: "initializePool",
      accounts: [
        { name: "payer",         isMut: true,  isSigner: true  },
        { name: "poolState",     isMut: true,  isSigner: false },
        { name: "poolVault",     isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "poolType", type: "u8" }],
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

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // Load admin keypair
  const keypairPath = process.env.ADMIN_KEYPAIR
    || path.join(__dirname, "../smart-contract/target/deploy/royalpot-keypair.json");
  const adminKp = web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf8")))
  );
  console.log("Admin wallet:", adminKp.publicKey.toBase58());

  // Setup Anchor provider
  const connection = new web3.Connection(RPC, "confirmed");
  const wallet     = new anchor.Wallet(adminKp);
  const provider   = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);
  const program    = new anchor.Program(IDL, PROGRAM_ID, provider);

  // Check balance
  const balance = await connection.getBalance(adminKp.publicKey);
  console.log(`Admin SOL balance: ${(balance / 1e9).toFixed(3)} SOL`);
  if (balance < 0.5e9) {
    console.error("❌ Insufficient SOL. Need at least 0.5 SOL.");
    process.exit(1);
  }

  // ── Step 1: Derive PDAs ────────────────────────────────────────────────────
  const [globalStatePda, globalStateBump] = getGlobalStatePda();
  console.log("\n📍 PDAs derived:");
  console.log("  GlobalState:", globalStatePda.toBase58());

  const poolPdas = {};
  for (const [name, poolType] of Object.entries(POOL_TYPES)) {
    const [pda] = getPoolStatePda(poolType);
    poolPdas[poolType] = pda;
    console.log(`  PoolState[${poolType}] (${name}):`, pda.toBase58());
  }

  // ── Step 2: Create vault token accounts ───────────────────────────────────
  console.log("\n🏦 Creating vault token accounts...");

  // airdrop_vault — authority = GlobalState PDA
  console.log("  Creating airdrop_vault (authority = GlobalState PDA)...");
  const airdropVaultAcc = await getOrCreateAssociatedTokenAccount(
    connection, adminKp, TOKEN_MINT, globalStatePda, true /* allowOwnerOffCurve */
  );
  console.log("  airdrop_vault:", airdropVaultAcc.address.toBase58());

  // pool vaults — authority = PoolState PDA for each pool
  const poolVaults = {};
  for (const [poolType, pda] of Object.entries(poolPdas)) {
    const ptNum = Number(poolType);
    console.log(`  Creating pool_vault[${ptNum}] (authority = PoolState[${ptNum}] PDA)...`);
    const vaultAcc = await getOrCreateAssociatedTokenAccount(
      connection, adminKp, TOKEN_MINT, pda, true
    );
    poolVaults[ptNum] = vaultAcc.address;
    console.log(`  pool_vault[${ptNum}]:`, vaultAcc.address.toBase58());
  }

  // platform_fee_vault — authority = platform wallet (regular signer)
  console.log("  Creating platform_fee_vault (authority = platform wallet)...");
  const platformVaultAcc = await getOrCreateAssociatedTokenAccount(
    connection, adminKp, TOKEN_MINT, PLATFORM_FEE_WALLET
  );
  console.log("  platform_fee_vault:", platformVaultAcc.address.toBase58());

  // ── Step 3: Call initialize ────────────────────────────────────────────────
  console.log("\n🚀 Calling initialize...");
  try {
    const txInit = await program.methods
      .initialize()
      .accounts({
        payer:         adminKp.publicKey,
        globalState:   globalStatePda,
        tokenMint:     TOKEN_MINT,
        airdropVault:  airdropVaultAcc.address,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([adminKp])
      .rpc();
    console.log("  ✅ initialize:", txInit);
  } catch (err) {
    if (err.message?.includes("already in use") || err.logs?.some(l => l.includes("already in use"))) {
      console.log("  ⚠️  GlobalState already initialized, skipping.");
    } else {
      console.error("  ❌ initialize failed:", err.message);
      throw err;
    }
  }

  // ── Step 4: initialize_pool × 3 ───────────────────────────────────────────
  for (const [name, poolType] of Object.entries(POOL_TYPES)) {
    console.log(`\n🚀 Calling initialize_pool(${poolType}) [${name}]...`);
    try {
      const txPool = await program.methods
        .initializePool(poolType)
        .accounts({
          payer:         adminKp.publicKey,
          poolState:     poolPdas[poolType],
          poolVault:     poolVaults[poolType],
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([adminKp])
        .rpc();
      console.log(`  ✅ initialize_pool(${poolType}):`, txPool);
    } catch (err) {
      if (err.message?.includes("already in use") || err.logs?.some(l => l.includes("already in use"))) {
        console.log(`  ⚠️  PoolState[${poolType}] already initialized, skipping.`);
      } else {
        console.error(`  ❌ initialize_pool(${poolType}) failed:`, err.message);
        throw err;
      }
    }
  }

  // ── Step 5: Fund airdrop vault ────────────────────────────────────────────
  console.log("\n💰 Funding airdrop vault...");
  try {
    // Find admin's token account
    const adminAta = await getOrCreateAssociatedTokenAccount(
      connection, adminKp, TOKEN_MINT, adminKp.publicKey
    );
    const adminBalance = BigInt(adminAta.amount);
    console.log(`  Admin TPOT balance: ${adminBalance / BigInt(10**DECIMALS)} TPOT`);

    if (adminBalance < AIRDROP_FUND) {
      console.warn(`  ⚠️  Insufficient TPOT to fund airdrop vault (need ${AIRDROP_FUND / BigInt(10**DECIMALS)} TPOT). Skipping funding.`);
    } else {
      // Check current airdrop vault balance
      const vaultInfo = await connection.getTokenAccountBalance(airdropVaultAcc.address);
      const vaultBalance = BigInt(vaultInfo.value.amount);

      if (vaultBalance >= AIRDROP_FUND) {
        console.log(`  ⚠️  Airdrop vault already has ${vaultBalance / BigInt(10**DECIMALS)} TPOT, skipping funding.`);
      } else {
        const toFund = AIRDROP_FUND - vaultBalance;
        console.log(`  Transferring ${toFund / BigInt(10**DECIMALS)} TPOT to airdrop vault...`);
        const txFund = await splTransfer(
          connection,
          adminKp,
          adminAta.address,
          airdropVaultAcc.address,
          adminKp,
          toFund
        );
        console.log("  ✅ Funded airdrop vault:", txFund);
      }
    }
  } catch (err) {
    console.warn("  ⚠️  Could not fund airdrop vault:", err.message);
  }

  // ── Step 6: Print summary ─────────────────────────────────────────────────
  console.log("\n" + "=".repeat(70));
  console.log("✅  INITIALIZATION COMPLETE");
  console.log("=".repeat(70));
  console.log("\nPaste these values into frontend/src/config/contract.js:\n");
  console.log(`export const POOL_30MIN_VAULT  = "${poolVaults[POOL_TYPES.MIN30].toBase58()}";`);
  console.log(`export const POOL_HOURLY_VAULT = "${poolVaults[POOL_TYPES.HOURLY].toBase58()}";`);
  console.log(`export const POOL_DAILY_VAULT  = "${poolVaults[POOL_TYPES.DAILY].toBase58()}";`);
  console.log(`export const AIRDROP_VAULT     = "${airdropVaultAcc.address.toBase58()}";`);
  console.log(`export const PLATFORM_FEE_VAULT= "${platformVaultAcc.address.toBase58()}";`);
  console.log("\nPDA addresses (for reference):");
  console.log(`  GlobalState : ${globalStatePda.toBase58()}`);
  console.log(`  PoolState[0]: ${poolPdas[POOL_TYPES.MIN30].toBase58()}`);
  console.log(`  PoolState[1]: ${poolPdas[POOL_TYPES.HOURLY].toBase58()}`);
  console.log(`  PoolState[2]: ${poolPdas[POOL_TYPES.DAILY].toBase58()}`);
  console.log("=".repeat(70));
}

main().catch(err => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
