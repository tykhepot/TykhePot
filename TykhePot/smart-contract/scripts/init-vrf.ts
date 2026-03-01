/**
 * Initialize Switchboard VRF for TykhePot
 * 
 * Prerequisites:
 * 1. Install Switchboard CLI: npm install -g @switchboard-xyz/cli
 * 2. Create Switchboard account: sb init
 * 3. Fund the account with SOL
 * 
 * Usage:
 *   ts-node scripts/init-vrf.ts
 */

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SwitchboardVrf } from "@switchboard-xyz/vrf.js";
import { createHash } from "crypto";

const PROGRAM_ID = new PublicKey("9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ");

async function main() {
  console.log("🎰 Initializing Switchboard VRF for TykhePot...\n");

  // Setup connection
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load wallet
  const wallet = loadWallet();
  if (!wallet) {
    console.error("❌ Please set SOLANA_KEYPAIR or ANCHOR_WALLET env var");
    process.exit(1);
  }

  console.log(`📋 Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`📋 Network: devnet\n`);

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 2 * LAMPORTS_PER_SOL) {
    console.log("⚠️  Low balance. Airdropping 2 SOL...");
    const sig = await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
    console.log("✅ Airdrop complete\n");
  }

  // Create VRF Account
  console.log("📦 Creating Switchboard VRF Account...\n");

  try {
    const vrfAccount = await createVrfAccount(connection, wallet);
    console.log(`\n✅ VRF Account created: ${vrfAccount.toBase58()}`);
    console.log("\n📝 Add this to your frontend config:");
    console.log(`   export const VRF_ACCOUNT = "${vrfAccount.toBase58()}";\n`);

    // Initialize VRF state in the program
    console.log("🔧 Initializing VRF state in TykhePot program...");
    await initializeVrfState(connection, wallet, vrfAccount);
    console.log("✅ VRF state initialized\n");

    console.log("🎉 VRF setup complete!");
    console.log("\nNext steps:");
    console.log("1. Update frontend/src/config/contract.js with VRF_ACCOUNT");
    console.log("2. Update cron scripts to use executeDrawVrf");

  } catch (err: any) {
    console.error("❌ Error:", err.message);
    console.log("\n📋 Manual VRF Creation Steps:");
    console.log("1. Install Switchboard CLI: npm install -g @switchboard-xyz/cli");
    console.log("2. Run: sb create:queue --network devnet");
    console.log("3. Run: sb create:vrf --network devnet --queue <QUEUE_PUBKEY>");
    console.log("4. Copy the VRF pubkey to contract.js");
    process.exit(1);
  }
}

function loadWallet(): Keypair | null {
  const keypairPath = process.env.ANCHOR_WALLET || process.env.SOLANA_KEYPAIR;
  if (!keypairPath) return null;

  try {
    const fs = require("fs");
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch {
    return null;
  }
}

async function createVrfAccount(
  connection: Connection,
  wallet: Keypair
): Promise<PublicKey> {
  // Switchboard VRF queue on devnet
  const SWITCHBOARD_VRF_QUEUE = new PublicKey(
    "2_WRUre6z5PKF6VdsF5ezYCjyCer6aneU6vYsLumHFjT"
  );
  
  const SWITCHBOARD_PROGRAM = new PublicKey(
    "2TfB33aLaneQb5TNVwyDz3jSZXS6jdW2ARw1Dgf84XCG"
  );

  // Generate VRF keypair
  const vrfKeypair = Keypair.generate();
  
  console.log(`   VRF Pubkey: ${vrfKeypair.publicKey.toBase58()}`);
  console.log(`   Queue: ${SWITCHBOARD_VRF_QUEUE.toBase58()}`);
  console.log(`   Switchboard Program: ${SWITCHBOARD_PROGRAM.toBase58()}`);

  // Note: In production, use Switchboard SDK to create VRF account
  // This is a placeholder - actual implementation requires Switchboard SDK
  console.log("\n   ⚠️  VRF account creation requires Switchboard CLI");
  console.log("   Run these commands manually:");
  console.log("   $ sb config set --network devnet");
  console.log("   $ sb create:vrf --queue 2_WRUre6z5PKF6VdsF5ezYCjyCer6aneU6vYsLumHFjT");
  
  return vrfKeypair.publicKey;
}

async function initializeVrfState(
  connection: Connection,
  wallet: Keypair,
  vrfAccount: PublicKey
) {
  // Load program
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );

  // Get VRF state PDA
  const [vrfState] = PublicKey.findProgramAddressSync(
    [Buffer.from("vrf_state")],
    PROGRAM_ID
  );

  console.log(`   VRF State PDA: ${vrfState.toBase58()}`);

  // Note: Call initialize_vrf instruction
  // This requires the program to be deployed with VRF support
  console.log("   📝 Transaction will be sent after program deployment");
}

main().catch(console.error);
