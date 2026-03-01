/**
 * Force close accounts using raw instruction (bypasses deserialization)
 */

const anchor = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const fs = require("fs");
const path = require("path");

const PROGRAM_ID = new web3.PublicKey("BGvzwkQy2xVLewPANR8siksZJbQD8RN4wKPQczbMRMd5");

async function main() {
  console.log("🔥 Force closing accounts (raw instruction)\n");

  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const walletKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET || path.join(process.env.HOME, ".config/solana/id.json"), "utf-8"));
  const wallet = web3.Keypair.fromSecretKey(Uint8Array.from(walletKey));
  
  console.log("Authority:", wallet.publicKey.toBase58(), "\n");

  // PDAs
  const [globalStatePDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global_state")],
    PROGRAM_ID
  );
  const [pool30PDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), Buffer.from([0])],
    PROGRAM_ID
  );
  const [poolHourlyPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), Buffer.from([1])],
    PROGRAM_ID
  );
  const [poolDailyPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), Buffer.from([2])],
    PROGRAM_ID
  );

  // Check balances
  console.log("Account balances:");
  const accounts = [
    { name: "GlobalState", pda: globalStatePDA },
    { name: "Pool30Min", pda: pool30PDA },
    { name: "PoolHourly", pda: poolHourlyPDA },
    { name: "PoolDaily", pda: poolDailyPDA },
  ];

  let totalLamports = 0;
  for (const acc of accounts) {
    const info = await connection.getAccountInfo(acc.pda);
    if (info) {
      console.log(`  ${acc.name}: ${(info.lamports / 1e9).toFixed(4)} SOL`);
      totalLamports += info.lamports;
    }
  }
  console.log(`  Total: ${(totalLamports / 1e9).toFixed(4)} SOL\n`);

  // Try close with instruction discriminator only
  // close_global_state discriminator
  const closeGlobalStateDiscriminator = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]); // placeholder
  const closePoolStateDiscriminator = Buffer.from([0, 0, 0, 0, 0, 0, 0, 1]); // placeholder

  console.log("⚠️  Cannot close accounts with raw instruction due to Anchor constraints.");
  console.log("   The accounts have old data structure incompatible with new code.\n");
  
  console.log("💡 Solutions:");
  console.log("   1. Deploy new program with different PROGRAM_ID");
  console.log("   2. Use 'solana program withdraw' to reclaim all lamports from program");
  console.log("   3. Wait for devnet reset\n");
  
  console.log("📝 For devnet testing, deploying new program ID is recommended.\n");

  // Show command to withdraw all program funds
  console.log("To withdraw all program funds:");
  console.log(`  solana program show ${PROGRAM_ID.toBase58()} --url devnet`);
  console.log(`  # Get the ProgramData address from above output`);
  console.log(`  solana program withdraw <PROGRAM_DATA_ADDRESS> --url devnet\n`);
}

main().catch(console.error);
