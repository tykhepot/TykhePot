/**
 * TykhePot - Steps 2-4 only (vaults already created)
 * - Call initialize instruction
 * - Fund vaults (airdrop, referral, staking)
 * - Update contract.js
 */
const { web3 } = require("@coral-xyz/anchor");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PROGRAM_ID = new web3.PublicKey("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");
const TOKEN_MINT = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");
const RPC = "https://api.devnet.solana.com";
const DECIMALS = 9;

// Already created vaults (from Step 1)
const VAULT_ADDRS = {
  BURN_VAULT:        "HR4SnWjNdKYhNLJ5EQUiwF71cbs9WBy6drAkvwK8akKv",
  PLATFORM_VAULT:    "ApNWMySYxJNAYEXSeRCrbXjXXcdUuNwXZPUZttHMd4Qv",
  HOURLY_POOL_VAULT: "4i2JHN4F8tJ94qJzhMdStEK8YURwkuUiKCdkUq9Z9Tq2",
  DAILY_POOL_VAULT:  "AtcWwdUDUbW6T6n6eYMPzyzYgtDMky7pPSMiUw5rue7X",
  REFERRAL_VAULT:    "FdbfcrWUmEwazZLyVaj3gAxppMnkZnExdDQk2kXJADxH",
  AIRDROP_VAULT:     "C6MizafKESygetQBoPZ6ezgCV5syMBkWw7RuXpJzjD94",
  STAKING_VAULT:     "5CAwNZje1nyPRAKiLfPhsUAjNQu52Ymvzdo1iXBfatNt",
  VESTING_VAULT:     "939dBwYK6epmmUTAmYAco9cnCp3Vxa8MV27HBDmd3JYR",
};

const AIRDROP_FUND  = BigInt(100_000_000) * BigInt(10 ** DECIMALS);
const REFERRAL_FUND = BigInt(200_000_000) * BigInt(10 ** DECIMALS);
const STAKING_FUND  = BigInt(350_000_000) * BigInt(10 ** DECIMALS);

async function fundVault(connection, payer, payerTokenAccount, destVault, amount, label) {
  const buf = Buffer.alloc(9);
  buf.writeUInt8(3, 0);
  buf.writeBigUInt64LE(amount, 1);
  const tx = new web3.Transaction().add(new web3.TransactionInstruction({
    keys: [
      { pubkey: payerTokenAccount,   isSigner: false, isWritable: true  },
      { pubkey: new web3.PublicKey(destVault), isSigner: false, isWritable: true  },
      { pubkey: payer.publicKey,     isSigner: true,  isWritable: false },
    ],
    programId: TOKEN_PROGRAM_ID,
    data: buf,
  }));
  const sig = await web3.sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
  const human = Number(amount) / 10 ** DECIMALS;
  console.log(`  💰 Funded ${label}: ${human.toLocaleString()} TPOT (${sig.slice(0,12)}...)`);
}

async function main() {
  const secret = JSON.parse(fs.readFileSync("/home/guo5feng5/.config/solana/id.json"));
  const admin = web3.Keypair.fromSecretKey(Uint8Array.from(secret));
  const connection = new web3.Connection(RPC, "confirmed");

  const [statePDA] = web3.PublicKey.findProgramAddressSync([Buffer.from("state")], PROGRAM_ID);

  // Step 2: initialize
  console.log("⚙️  Step 2: Calling initialize...");
  const disc = crypto.createHash("sha256").update("global:initialize").digest().slice(0, 8);
  const params = Buffer.alloc(16);
  params.writeBigUInt64LE(BigInt(0), 0);
  params.writeBigUInt64LE(BigInt(200_000_000) * BigInt(10 ** DECIMALS), 8);

  const ix = new web3.TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: statePDA,                     isSigner: false, isWritable: true  },
      { pubkey: admin.publicKey,              isSigner: true,  isWritable: true  },
      { pubkey: TOKEN_MINT,                   isSigner: false, isWritable: false },
      { pubkey: admin.publicKey,              isSigner: false, isWritable: false },
      { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID,             isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([disc, params]),
  });
  const initSig = await web3.sendAndConfirmTransaction(connection, new web3.Transaction().add(ix), [admin], { commitment: "confirmed" });
  console.log(`  ✅ Initialized! tx: ${initSig}`);

  // Step 3: Fund vaults
  console.log("\n💸 Step 3: Funding vaults...");
  const { getAssociatedTokenAddressSync } = require("@solana/spl-token");
  const adminATA = getAssociatedTokenAddressSync(TOKEN_MINT, admin.publicKey);

  await fundVault(connection, admin, adminATA, VAULT_ADDRS.AIRDROP_VAULT,  AIRDROP_FUND,  "AIRDROP_VAULT");
  await fundVault(connection, admin, adminATA, VAULT_ADDRS.REFERRAL_VAULT, REFERRAL_FUND, "REFERRAL_VAULT");
  await fundVault(connection, admin, adminATA, VAULT_ADDRS.STAKING_VAULT,  STAKING_FUND,  "STAKING_VAULT");

  // Step 4: Update contract.js
  console.log("\n📝 Step 4: Updating contract.js...");
  const contractPath = path.join(__dirname, "src/config/contract.js");
  let src = fs.readFileSync(contractPath, "utf8");
  for (const [k, v] of Object.entries(VAULT_ADDRS)) {
    src = src.replace(new RegExp(`export const ${k} = ".*?";`), `export const ${k} = "${v}";`);
  }
  fs.writeFileSync(contractPath, src);
  console.log("  ✅ contract.js updated!\n");

  console.log("🎉 All done! Vault addresses:");
  for (const [k, v] of Object.entries(VAULT_ADDRS)) {
    console.log(`  ${k}: ${v}`);
  }
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
