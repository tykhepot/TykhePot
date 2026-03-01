/**
 * Close existing accounts before reinit
 */

const anchor = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const fs = require("fs");
const path = require("path");

const PROGRAM_ID = new web3.PublicKey("9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ");

async function main() {
  console.log("🔒 Closing existing accounts...\n");

  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const walletKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET || path.join(process.env.HOME, ".config/solana/id.json"), "utf-8"));
  const wallet = new anchor.Wallet(web3.Keypair.fromSecretKey(Uint8Array.from(walletKey)));
  
  console.log("Wallet:", wallet.publicKey.toBase58());
  
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

  const accountsToClose = [
    { name: "GlobalState", pda: globalStatePDA },
    { name: "Pool30Min", pda: pool30PDA },
    { name: "PoolHourly", pda: poolHourlyPDA },
    { name: "PoolDaily", pda: poolDailyPDA },
  ];

  for (const acc of accountsToClose) {
    try {
      const info = await connection.getAccountInfo(acc.pda);
      if (info) {
        console.log(`${acc.name}: ${acc.pda.toBase58()} - ${info.lamports} lamports`);
        
        // Try to close using raw transaction
        const closeIx = web3.SystemProgram.transfer({
          fromPubkey: acc.pda,
          toPubkey: wallet.publicKey,
          lamports: info.lamports,
        });
        
        // This won't work because PDA needs program signature
        console.log(`  ⚠️  Cannot close directly - PDA owned by program`);
        console.log(`  Need to use program's close instruction or upgrade authority`);
      } else {
        console.log(`${acc.name}: Does not exist`);
      }
    } catch (e) {
      console.log(`${acc.name}: Error - ${e.message}`);
    }
  }

  console.log("\n📝 Solution: Use solana program close-buffer or redeploy with --force");
  console.log("Or: Use program authority to close accounts");
}

main().catch(console.error);
