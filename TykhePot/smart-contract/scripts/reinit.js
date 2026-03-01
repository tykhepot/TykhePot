/**
 * Re-initialize TykhePot after upgrade
 * 
 * WARNING: This will reset all state!
 */

const anchor = require("@coral-xyz/anchor");
const { web3, BN } = anchor;
const fs = require("fs");
const path = require("path");

// Configuration
const PROGRAM_ID = new web3.PublicKey("9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ");
const TOKEN_MINT = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");

// Vault addresses (from existing deployment)
const PLATFORM_FEE_VAULT = new web3.PublicKey("2Gq8ZCP1jg3FXKaMJeEQCBJuyv1VznW5ZvYdVJvKiJQe");
const AIRDROP_VAULT = new web3.PublicKey("Gagc5bk5pNh1sk79gs13W4RSK2wwZusdSFT9ZBMAwYUo");
const REFERRAL_VAULT = new web3.PublicKey("85HhmvBsE6VNGYWMWdC9WCK47mPLCVrsHGu1PxokY9xS");
const RESERVE_VAULT = new web3.PublicKey("78zVf9GNc2DZU87jS6R5qYS4A5cdZrzR15t1LqZmboRL");
const PRIZE_ESCROW_VAULT = new web3.PublicKey("G7NNS4QdM1Zau543TwdtBHwWa9UG4U1zVzAf3eS55SCK");

// Pool vaults
const POOL_30MIN_VAULT = new web3.PublicKey("J4VwzLdrpvjCsykP7P7JUR4UhvTdLnfyjcgysdQ8YuZG");
const POOL_HOURLY_VAULT = new web3.PublicKey("FJW1LuZMZbD5qobN95fMFwNQoYis23CmopZBVqzB4Xps");
const POOL_DAILY_VAULT = new web3.PublicKey("GNXJ7eEtBHvh6K4Ppi3SX6skKTu7NuWCgXr99DyUeu4G");

async function main() {
  console.log("🎯 Re-initializing TykhePot (after upgrade)");
  console.log("================================================\n");

  // Setup provider
  const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
  const walletKey = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET || path.join(process.env.HOME, ".config/solana/id.json"), "utf-8"));
  const wallet = new anchor.Wallet(web3.Keypair.fromSecretKey(Uint8Array.from(walletKey)));
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // Load IDL from frontend SDK
  const idlPath = path.join(__dirname, "../../frontend/src/utils/tykhepot-sdk.js");
  const sdkContent = fs.readFileSync(idlPath, "utf-8");
  
  // Extract IDL from SDK file
  const idlMatch = sdkContent.match(/const IDL = (\{[\s\S]*?\n\});/);
  if (!idlMatch) {
    console.error("❌ Could not extract IDL from SDK file");
    process.exit(1);
  }
  const idl = eval('(' + idlMatch[1] + ')');
  const program = new anchor.Program(idl, PROGRAM_ID, provider);

  console.log("Deployer:", wallet.publicKey.toBase58());
  console.log("Program:", PROGRAM_ID.toBase58());
  console.log("");

  // PDAs
  const [globalStatePDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global_state")],
    PROGRAM_ID
  );
  const [airdropStatePDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("airdrop_state")],
    PROGRAM_ID
  );
  const [stakingStatePDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("staking_state")],
    PROGRAM_ID
  );

  // Pool PDAs
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

  console.log("Global State PDA:", globalStatePDA.toBase58());
  console.log("");

  // Check if GlobalState exists and needs to be closed
  try {
    const existingState = await program.account.globalState.fetch(globalStatePDA);
    console.log("⚠️  GlobalState already exists!");
    console.log("   Authority:", existingState.authority?.toBase58?.() || "N/A");
    console.log("");
    console.log("❌ Cannot reinitialize - GlobalState already exists.");
    console.log("   If you need to reset, close the account manually first.");
    return;
  } catch (e) {
    // Account doesn't exist, we can proceed
    console.log("✅ GlobalState does not exist, proceeding with initialization...\n");
  }

  // Initialize GlobalState
  console.log("1. Initializing GlobalState...");
  try {
    const tx = await program.methods
      .initialize(
        PLATFORM_FEE_VAULT,
        REFERRAL_VAULT,
        RESERVE_VAULT,
        PRIZE_ESCROW_VAULT,
        null // timelock_duration: use default (24h)
      )
      .accounts({
        payer: wallet.publicKey,
        globalState: globalStatePDA,
        tokenMint: TOKEN_MINT,
        airdropVault: AIRDROP_VAULT,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log("   ✅ GlobalState initialized!");
    console.log("   Tx:", tx);
  } catch (e) {
    console.log("   ❌ Failed:", e.message);
    if (e.logs) console.log("   Logs:", e.logs);
  }

  // Initialize pools
  const now = Math.floor(Date.now() / 1000);
  
  console.log("\n2. Initializing 30-min Pool...");
  try {
    const tx = await program.methods
      .initializePool(0, new BN(now + 1800))
      .accounts({
        payer: wallet.publicKey,
        poolState: pool30PDA,
        poolVault: POOL_30MIN_VAULT,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log("   ✅ 30-min Pool initialized! Tx:", tx.slice(0, 20) + "...");
  } catch (e) {
    console.log("   ⚠️", e.message?.slice(0, 80));
  }

  console.log("\n3. Initializing Hourly Pool...");
  try {
    const tx = await program.methods
      .initializePool(1, new BN(now + 3600))
      .accounts({
        payer: wallet.publicKey,
        poolState: poolHourlyPDA,
        poolVault: POOL_HOURLY_VAULT,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log("   ✅ Hourly Pool initialized! Tx:", tx.slice(0, 20) + "...");
  } catch (e) {
    console.log("   ⚠️", e.message?.slice(0, 80));
  }

  console.log("\n4. Initializing Daily Pool...");
  try {
    const tx = await program.methods
      .initializePool(2, new BN(now + 86400))
      .accounts({
        payer: wallet.publicKey,
        poolState: poolDailyPDA,
        poolVault: POOL_DAILY_VAULT,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log("   ✅ Daily Pool initialized! Tx:", tx.slice(0, 20) + "...");
  } catch (e) {
    console.log("   ⚠️", e.message?.slice(0, 80));
  }

  // Initialize Airdrop State
  console.log("\n5. Initializing Airdrop State...");
  try {
    const tx = await program.methods
      .initializeAirdrop(new BN(200_000_000_000_000)) // 200M TPOT
      .accounts({
        payer: wallet.publicKey,
        airdropState: airdropStatePDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log("   ✅ Airdrop State initialized! Tx:", tx.slice(0, 20) + "...");
  } catch (e) {
    console.log("   ⚠️", e.message?.slice(0, 80));
  }

  // Initialize Staking State
  console.log("\n6. Initializing Staking State...");
  try {
    const tx = await program.methods
      .initializeStaking(
        new BN(10_000_000_000_000), // 10M short-term pool
        new BN(50_000_000_000_000)  // 50M long-term pool
      )
      .accounts({
        payer: wallet.publicKey,
        stakingState: stakingStatePDA,
        tokenMint: TOKEN_MINT,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log("   ✅ Staking State initialized! Tx:", tx.slice(0, 20) + "...");
  } catch (e) {
    console.log("   ⚠️", e.message?.slice(0, 80));
  }

  console.log("\n✅ Re-initialization complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Fund the Airdrop Vault with TPOT tokens");
  console.log("2. Fund the Reserve Vault for daily pool matching");
  console.log("3. Fund the Referral Vault for referral rewards");
  console.log("4. Test deposits and draws");
}

main().catch(console.error);
