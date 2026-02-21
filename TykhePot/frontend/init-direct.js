const web3 = require('@solana/web3.js');
const fs = require('fs');

const PROGRAM_ID = new web3.PublicKey('5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b');
const TOKEN_MINT = new web3.PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');
const RESERVE_MINT = new web3.PublicKey('9Z3c9tVQo2YfakysXUbLr2UdP4HKnszNUz1BdLjCTQm2');

async function main() {
  // Load wallet
  const keypairPath = process.env.HOME + '/.config/solana/id.json';
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
  const wallet = web3.Keypair.fromSecretKey(Uint8Array.from(keypairData));
  
  console.log('Wallet:', wallet.publicKey.toString());
  
  // Connection
  const connection = new web3.Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Get PDA
  const [statePDA, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('state')],
    PROGRAM_ID
  );
  console.log('State PDA:', statePDA.toString());
  
  // Check if already initialized
  const account = await connection.getAccountInfo(statePDA);
  if (account) {
    console.log('✅ Already initialized!');
    return;
  }
  
  // Build instruction data
  // Discriminator for "initialize" + params
  const discriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]); // initialize hash
  const initialReserve = Buffer.alloc(8);
  initialReserve.writeBigUInt64LE(BigInt(0), 0);
  const initialReferralPool = Buffer.alloc(8);
  initialReferralPool.writeBigUInt64LE(BigInt(0), 0);
  
  const data = Buffer.concat([discriminator, initialReserve, initialReferralPool]);
  
  // Build transaction
  const keys = [
    { pubkey: wallet.publicKey, isSigner: true, isWritable: false }, // authority
    { pubkey: statePDA, isSigner: false, isWritable: true }, // state
    { pubkey: TOKEN_MINT, isSigner: false, isWritable: false }, // tokenMint
    { pubkey: RESERVE_MINT, isSigner: false, isWritable: false }, // reserveMint
    { pubkey: wallet.publicKey, isSigner: false, isWritable: false }, // platformWallet
    { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
  ];
  
  const instruction = new web3.TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
  
  const transaction = new web3.Transaction().add(instruction);
  transaction.feePayer = wallet.publicKey;
  
  console.log('Sending transaction...');
  try {
    const signature = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet],
      { commitment: 'confirmed' }
    );
    console.log('✅ SUCCESS!');
    console.log('Tx:', signature);
    console.log('https://solscan.io/tx/' + signature + '?cluster=devnet');
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.log('\nPlease use frontend initialization instead:');
    console.log('https://frontend-nvvzbd4sr-tykhepots-projects.vercel.app/init');
  }
}

main();
