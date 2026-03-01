/**
 * Close existing accounts (admin only - for migration)
 */

const anchor = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const fs = require("fs");
const path = require("path");

const PROGRAM_ID = new web3.PublicKey("9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ");

async function main() {
  console.log("🔒 Closing TykhePot accounts for reinit\n");
  console.log("================================================\n");

  // Setup
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const walletKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET || path.join(process.env.HOME, ".config/solana/id.json"), "utf-8"));
  const wallet = new anchor.Wallet(web3.Keypair.fromSecretKey(Uint8Array.from(walletKey)));
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // Load IDL from frontend SDK
  const idlPath = path.join(__dirname, "../../frontend/src/utils/tykhepot-sdk.js");
  const sdkContent = fs.readFileSync(idlPath, "utf-8");
  const idlMatch = sdkContent.match(/const IDL = (\{[\s\S]*?\n\});/);
  if (!idlMatch) {
    console.error("❌ Could not extract IDL from SDK file");
    process.exit(1);
  }
  const idl = eval('(' + idlMatch[1] + ')');
  const program = new anchor.Program(idl, PROGRAM_ID, provider);

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

  // Close Pool States first (they reference GlobalState)
  const pools = [
    { name: "Pool30Min", pda: pool30PDA, type: 0 },
    { name: "PoolHourly", pda: poolHourlyPDA, type: 1 },
    { name: "PoolDaily", pda: poolDailyPDA, type: 2 },
  ];

  for (const pool of pools) {
    console.log(`\n🔒 Closing ${pool.name}...`);
    try {
      const info = await connection.getAccountInfo(pool.pda);
      if (!info) {
        console.log("   ⚠️  Account doesn't exist, skipping");
        continue;
      }

      const tx = await program.methods
        .closePoolState(pool.type)
        .accounts({
          authority: wallet.publicKey,
          globalState: globalStatePDA,
          poolState: pool.pda,
          recipient: wallet.publicKey,
        })
        .rpc();
      console.log("   ✅ Closed! Tx:", tx.slice(0, 20) + "...");
    } catch (e) {
      console.log("   ❌ Failed:", e.message?.slice(0, 100));
    }
  }

  // Close GlobalState last
  console.log("\n🔒 Closing GlobalState...");
  try {
    const info = await connection.getAccountInfo(globalStatePDA);
    if (!info) {
      console.log("   ⚠️  Account doesn't exist, skipping");
    } else {
      const tx = await program.methods
        .closeGlobalState()
        .accounts({
          authority: wallet.publicKey,
          globalState: globalStatePDA,
          recipient: wallet.publicKey,
        })
        .rpc();
      console.log("   ✅ Closed! Tx:", tx.slice(0, 20) + "...");
    }
  } catch (e) {
    console.log("   ❌ Failed:", e.message?.slice(0, 100));
    if (e.logs) console.log("   Logs:", e.logs.slice(0, 5));
  }

  console.log("\n✅ Done! Now run reinit.js to reinitialize accounts.");
}

main().catch(console.error);
