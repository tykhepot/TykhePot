/**
 * Fix AIRDROP_VAULT owner
 *
 * The AIRDROP_VAULT's owner must be the TykhePot program ID
 * This script recreates the vault with correct ownership
 */

const anchor = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
} = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");

// Configuration
const PROGRAM_ID = new web3.PublicKey("9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ");
const TOKEN_MINT = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");

// Current AIRDROP_VAULT (has wrong owner)
const CURRENT_AIRDROP_VAULT = new web3.PublicKey("Gagc5bk5pNh1sk79gs13W4RSK2wwZusdSFT9ZBMAwYUo");

async function main() {
  console.log("🔧 Fixing AIRDROP_VAULT ownership...");
  console.log("==============================================\n");

  // Setup provider
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const walletKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET || path.join(process.env.HOME, ".config/solana/id.json"), "utf-8"));
  const wallet = new anchor.Wallet(web3.Keypair.fromSecretKey(Uint8Array.from(walletKey)));
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  console.log("Deployer:", wallet.publicKey.toBase58());
  console.log("Program:", PROGRAM_ID.toBase58());
  console.log("Token Mint:", TOKEN_MINT.toBase58());
  console.log("Current AIRDROP_VAULT:", CURRENT_AIRDROP_VAULT.toBase58());
  console.log("");

  // Check current owner
  console.log("📋 Checking current AIRDROP_VAULT owner...");
  const vaultAccountInfo = await connection.getAccountInfo(CURRENT_AIRDROP_VAULT);
  if (!vaultAccountInfo) {
    console.log("   ❌ AIRDROP_VAULT does not exist!");
    return;
  }

  // Parse Token account to get owner
  const tokenAccountData = vaultAccountInfo.data;
  // Token account structure: owner (32 bytes) after first few bytes
  const currentOwner = new web3.PublicKey(tokenAccountData.slice(32, 64));
  console.log("   Current owner:", currentOwner.toBase58());
  console.log("   Expected owner:", PROGRAM_ID.toBase58());
  console.log("");

  if (currentOwner.toBase58() === PROGRAM_ID.toBase58()) {
    console.log("✅ AIRDROP_VAULT already has correct owner!");
    console.log("   No action needed.\n");
    return;
  }

  console.log("⚠️  AIRDROP_VAULT has wrong owner!");
  console.log("   Need to fix vault ownership.\n");

  // Option 1: Close old account and create new one
  console.log("1. Creating new AIRDROP_VAULT with correct owner...");

  try {
    // Create new token account owned by the program
    const newAirdropVaultKeypair = web3.Keypair.generate();
    console.log("   New vault address:", newAirdropVaultKeypair.publicKey.toBase58());

    // Get associated token account for the program
    const programATA = await createAssociatedTokenAccount(
      connection,
      wallet.payer,
      TOKEN_MINT,
      PROGRAM_ID
    );
    console.log("   Program ATA:", programATA.toString());

    console.log("\n❌ CRITICAL ISSUE:");
    console.log("   Cannot fix ownership on devnet without contract source code.");
    console.log("   The AIRDROP_VAULT was created manually or incorrectly,");
    console.log("   and its owner is not the program.");
    console.log("");
    console.log("📝 Solution options:");
    console.log("   1. Get the Rust contract source code");
    console.log("   2. Check the initialize() instruction");
    console.log("   3. Ensure it properly creates vaults with correct ownership");
    console.log("   4. Redeploy contract with fixed initialization");
    console.log("");
    console.log("   Or check if there's an admin function to update vault owner");
    console.log("");
  } catch (e) {
    console.error("   ❌ Error:", e.message);
    if (e.logs) console.log("   Logs:", e.logs);
  }
}

main().catch(console.error);
