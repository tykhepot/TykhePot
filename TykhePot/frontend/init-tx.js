const web3 = require('@solana/web3.js');
const fs = require('fs');

const PROGRAM_ID = new web3.PublicKey('5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b');
const TOKEN_MINT = new web3.PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');
const RESERVE_MINT = new web3.PublicKey('9Z3c9tVQo2YfakysXUbLr2UdP4HKnszNUz1BdLjCTQm2');

async function main() {
  const keypairPath = process.env.HOME + '/.config/solana/id.json';
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
  const wallet = web3.Keypair.fromSecretKey(Uint8Array.from(keypairData));
  
  console.log('Wallet:', wallet.publicKey.toString());
  
  const connection = new web3.Connection('https://api.devnet.solana.com', 'confirmed');
  
  const [statePDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('state')], PROGRAM_ID
  );
  console.log('State PDA:', statePDA.toString());
  
  const account = await connection.getAccountInfo(statePDA);
  if (account) {
    console.log('✅ Already initialized!');
    return;
  }
  
  const discriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
  const params = Buffer.alloc(16);
  const data = Buffer.concat([discriminator, params]);
  
  const keys = [
    { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    { pubkey: statePDA, isSigner: false, isWritable: true },
    { pubkey: TOKEN_MINT, isSigner: false, isWritable: false },
    { pubkey: RESERVE_MINT, isSigner: false, isWritable: false },
    { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
    { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  
  const instruction = new web3.TransactionInstruction({ keys, programId: PROGRAM_ID, data });
  const transaction = new web3.Transaction().add(instruction);
  transaction.feePayer = wallet.publicKey;
  
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  
  console.log('Sending...');
  const signature = await web3.sendAndConfirmTransaction(connection, transaction, [wallet]);
  console.log('✅ SUCCESS:', signature);
  console.log('https://solscan.io/tx/' + signature + '?cluster=devnet');
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  if (e.logs) console.log('Logs:', e.logs);
});
