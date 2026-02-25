/**
 * TykhePot Protocol Initializer
 *
 * This script:
 *  1. Creates all vault token accounts with correct PDA authorities
 *  2. Calls the `initialize` instruction to create the on-chain State
 *  3. Funds vaults: airdrop_vault (100M TPOT), referral_vault (200M TPOT),
 *     staking_vault (350M TPOT)
 *  4. Prints all vault addresses so they can be pasted into contract.js
 *
 * Run: node scripts/init-protocol.js
 */

const anchor = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const {
  createAccount,
  TOKEN_PROGRAM_ID,
  getAccount,
  createAssociatedTokenAccount,
  transfer: splTransfer,
  getOrCreateAssociatedTokenAccount,
} = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");

// ─── Config ─────────────────────────────────────────────────────────────────
const PROGRAM_ID = new web3.PublicKey("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");
const TOKEN_MINT = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");
const RPC = "https://api.devnet.solana.com";
const DECIMALS = 9;

// Token amounts (in raw lamports, 9 decimals)
const AIRDROP_FUND   = 100_000_000n * 10n ** BigInt(DECIMALS); // 100M TPOT
const REFERRAL_FUND  = 200_000_000n * 10n ** BigInt(DECIMALS); // 200M TPOT
const STAKING_FUND   = 350_000_000n * 10n ** BigInt(DECIMALS); // 350M TPOT

// ─── IDL (minimal, only initialize) ─────────────────────────────────────────
const IDL = {
  version: "0.1.0",
  name: "royalpot",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "state",          isMut: true,  isSigner: false },
        { name: "authority",      isMut: true,  isSigner: true  },
        { name: "tokenMint",      isMut: false, isSigner: false },
        { name: "platformWallet", isMut: false, isSigner: false },
        { name: "systemProgram",  isMut: false, isSigner: false },
        { name: "tokenProgram",   isMut: false, isSigner: false },
      ],
      args: [{ name: "params", type: { defined: "InitializeParams" } }],
    },
  ],
  accounts: [
    {
      name: "State",
      type: {
        kind: "struct",
        fields: [
          { name: "authority",         type: "publicKey" },
          { name: "tokenMint",         type: "publicKey" },
          { name: "platformWallet",    type: "publicKey" },
          { name: "prePool",           type: "u64" },
          { name: "referralPool",      type: "u64" },
          { name: "hourlyPool",        type: "u64" },
          { name: "hourlyPlayers",     type: "u32" },
          { name: "dailyPool",         type: "u64" },
          { name: "dailyPlayers",      type: "u32" },
          { name: "burned",            type: "u64" },
          { name: "paused",            type: "bool" },
          { name: "bump",              type: "u8" },
          { name: "lastHourlyDraw",    type: "i64" },
          { name: "lastDailyDraw",     type: "i64" },
          { name: "hourlyRollover",    type: "u64" },
          { name: "dailyRollover",     type: "u64" },
          { name: "pauseScheduledAt",  type: "i64" },
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
          { name: "prePool",      type: "u64" },
          { name: "referralPool", type: "u64" },
        ],
      },
    },
  ],
  errors: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createVaultAccount(connection, payer, mint, authority, label) {
  const newKeypair = web3.Keypair.generate();
  const lamports = await connection.getMinimumBalanceForRentExemption(165);

  const tx = new web3.Transaction().add(
    web3.SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: newKeypair.publicKey,
      space: 165,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    // InitializeAccount3 (no rent sysvar needed in newer versions)
    {
      keys: [
        { pubkey: newKeypair.publicKey, isSigner: false, isWritable: true },
        { pubkey: mint,                 isSigner: false, isWritable: false },
        { pubkey: authority,            isSigner: false, isWritable: false },
      ],
      programId: TOKEN_PROGRAM_ID,
      data: Buffer.concat([
        Buffer.from([18]), // InitializeAccount3 discriminator
        authority.toBuffer(),
      ]),
    }
  );

  const sig = await web3.sendAndConfirmTransaction(connection, tx, [payer, newKeypair], {
    commitment: "confirmed",
  });

  console.log(`  ✅ ${label}: ${newKeypair.publicKey.toBase58()} (authority: ${authority.toBase58().slice(0,8)}..., sig: ${sig.slice(0,12)}...)`);
  return newKeypair.publicKey;
}

async function fundVault(connection, payer, payerTokenAccount, destVault, amount, label) {
  const tx = new web3.Transaction().add(
    {
      keys: [
        { pubkey: payerTokenAccount, isSigner: false, isWritable: true },
        { pubkey: destVault,         isSigner: false, isWritable: true },
        { pubkey: payer.publicKey,   isSigner: true,  isWritable: false },
      ],
      programId: TOKEN_PROGRAM_ID,
      data: (() => {
        const buf = Buffer.alloc(9);
        buf.writeUInt8(3, 0); // Transfer instruction
        buf.writeBigUInt64LE(amount, 1);
        return buf;
      })(),
    }
  );
  const sig = await web3.sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
  const humanAmount = Number(amount) / 10 ** DECIMALS;
  console.log(`  💰 Funded ${label} with ${humanAmount.toLocaleString()} TPOT (sig: ${sig.slice(0,12)}...)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 TykhePot Protocol Initializer\n");

  // Load keypair
  const keypairPath = process.env.SOLANA_KEYPAIR || "/home/guo5feng5/.config/solana/id.json";
  const secret = JSON.parse(fs.readFileSync(keypairPath));
  const adminKeypair = web3.Keypair.fromSecretKey(Uint8Array.from(secret));
  console.log(`Admin wallet: ${adminKeypair.publicKey.toBase58()}`);

  const connection = new web3.Connection(RPC, "confirmed");
  const balance = await connection.getBalance(adminKeypair.publicKey);
  console.log(`SOL balance: ${(balance / 1e9).toFixed(4)} SOL`);

  // Derive PDAs
  const [statePDA, stateBump] = web3.PublicKey.findProgramAddressSync([Buffer.from("state")], PROGRAM_ID);
  const [airdropPDA]          = web3.PublicKey.findProgramAddressSync([Buffer.from("airdrop")], PROGRAM_ID);
  const [stakingPDA]          = web3.PublicKey.findProgramAddressSync([Buffer.from("staking")], PROGRAM_ID);
  const [vestingAuthPDA]      = web3.PublicKey.findProgramAddressSync([Buffer.from("vesting_auth")], PROGRAM_ID);

  console.log(`\nPDAs:`);
  console.log(`  state PDA:       ${statePDA.toBase58()}`);
  console.log(`  airdrop PDA:     ${airdropPDA.toBase58()}`);
  console.log(`  staking PDA:     ${stakingPDA.toBase58()}`);
  console.log(`  vestingAuth PDA: ${vestingAuthPDA.toBase58()}`);

  // Check if already initialized
  const stateInfo = await connection.getAccountInfo(statePDA);
  if (stateInfo) {
    console.log("\n⚠️  State PDA already exists — protocol already initialized!");
    process.exit(0);
  }

  // Find admin's TPOT token account
  const { getAssociatedTokenAddressSync } = require("@solana/spl-token");
  const adminTokenAccount = getAssociatedTokenAddressSync(TOKEN_MINT, adminKeypair.publicKey);
  const adminTokenInfo = await connection.getTokenAccountBalance(adminTokenAccount);
  console.log(`\nAdmin TPOT balance: ${Number(adminTokenInfo.value.amount) / 10 ** DECIMALS} TPOT`);

  // ── Step 1: Create all vault token accounts ──────────────────────────────
  console.log("\n📦 Step 1: Creating vault token accounts...");

  const burnVault        = await createVaultAccount(connection, adminKeypair, TOKEN_MINT, statePDA,       "BURN_VAULT");
  const platformVault    = await createVaultAccount(connection, adminKeypair, TOKEN_MINT, statePDA,       "PLATFORM_VAULT");
  const hourlyPoolVault  = await createVaultAccount(connection, adminKeypair, TOKEN_MINT, statePDA,       "HOURLY_POOL_VAULT");
  const dailyPoolVault   = await createVaultAccount(connection, adminKeypair, TOKEN_MINT, statePDA,       "DAILY_POOL_VAULT");
  const referralVault    = await createVaultAccount(connection, adminKeypair, TOKEN_MINT, statePDA,       "REFERRAL_VAULT");
  const airdropVault     = await createVaultAccount(connection, adminKeypair, TOKEN_MINT, airdropPDA,     "AIRDROP_VAULT");
  const stakingVault     = await createVaultAccount(connection, adminKeypair, TOKEN_MINT, stakingPDA,     "STAKING_VAULT");
  const vestingVault     = await createVaultAccount(connection, adminKeypair, TOKEN_MINT, vestingAuthPDA, "VESTING_VAULT");

  // ── Step 2: Initialize protocol ──────────────────────────────────────────
  console.log("\n⚙️  Step 2: Calling initialize instruction...");

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(adminKeypair),
    { commitment: "confirmed" }
  );
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  const initTx = await program.methods
    .initialize({
      prePool:      new BN(0),                         // start with no pre-match
      referralPool: new BN("200000000000000000"),       // 200M TPOT in raw
    })
    .accounts({
      state:          statePDA,
      authority:      adminKeypair.publicKey,
      tokenMint:      TOKEN_MINT,
      platformWallet: adminKeypair.publicKey,          // admin wallet receives platform fees
      systemProgram:  web3.SystemProgram.programId,
      tokenProgram:   TOKEN_PROGRAM_ID,
    })
    .signers([adminKeypair])
    .rpc();

  console.log(`  ✅ Protocol initialized! tx: ${initTx}`);

  // ── Step 3: Fund vaults ────────────────────────────────────────────────
  console.log("\n💸 Step 3: Funding vaults...");

  await fundVault(connection, adminKeypair, adminTokenAccount, airdropVault,  AIRDROP_FUND,  "airdropVault");
  await fundVault(connection, adminKeypair, adminTokenAccount, referralVault, REFERRAL_FUND, "referralVault");
  await fundVault(connection, adminKeypair, adminTokenAccount, stakingVault,  STAKING_FUND,  "stakingVault");

  // ── Step 4: Print results ──────────────────────────────────────────────
  console.log("\n✅ Initialization complete! Update config/contract.js:\n");
  const result = {
    BURN_VAULT:         burnVault.toBase58(),
    PLATFORM_VAULT:     platformVault.toBase58(),
    HOURLY_POOL_VAULT:  hourlyPoolVault.toBase58(),
    DAILY_POOL_VAULT:   dailyPoolVault.toBase58(),
    REFERRAL_VAULT:     referralVault.toBase58(),
    AIRDROP_VAULT:      airdropVault.toBase58(),
    STAKING_VAULT:      stakingVault.toBase58(),
    VESTING_VAULT:      vestingVault.toBase58(),
  };

  for (const [k, v] of Object.entries(result)) {
    console.log(`export const ${k} = "${v}";`);
  }

  // Auto-update contract.js
  const contractPath = path.join(__dirname, "../frontend/src/config/contract.js");
  let src = fs.readFileSync(contractPath, "utf8");
  for (const [k, v] of Object.entries(result)) {
    src = src.replace(
      new RegExp(`export const ${k} = ".*?";`),
      `export const ${k} = "${v}";`
    );
  }
  fs.writeFileSync(contractPath, src);
  console.log(`\n📝 contract.js has been auto-updated: ${contractPath}`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message || err);
  process.exit(1);
});
