const anchor = require('@coral-xyz/anchor');
const web3 = require('@solana/web3.js');

const PROGRAM_ID = new web3.PublicKey('5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b');
const TOKEN_MINT = new web3.PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');
const RESERVE_MINT = new web3.PublicKey('9Z3c9tVQo2YfakysXUbLr2UdP4HKnszNUz1BdLjCTQm2');

async function main() {
  const connection = new web3.Connection('https://api.devnet.solana.com');
  const wallet = new anchor.Wallet(
    web3.Keypair.fromSecretKey(
      require('fs').readFileSync(require('os').homedir() + '/.config/solana/id.json', 'utf-8')
        .split('\n')
        .filter(x => x.trim())[0]
        .split('')
        .map((x, i) => i % 2 === 0 ? x : '')
        .join('')
        .slice(0, 64)
    ).map(x => parseInt(x, 16))
  ));
  
  console.log('钱包地址:', wallet.publicKey.toString());
  
  // 获取状态PDA
  const [statePDA, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('state')],
    PROGRAM_ID
  );
  console.log('状态PDA:', statePDA.toString());
  console.log('Bump:', bump);
  
  // 检查是否已存在
  const existingState = await connection.getAccountInfo(statePDA);
  if (existingState) {
    console.log('State account already exists!');
    return;
  }
  
  // 手动构建 initialize 指令
  // 根据 init-simple.js 的参数格式
  const initializeIx = new web3.TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: statePDA, isSigner: false, isWritable: true },  // state
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },  // authority
      { pubkey: TOKEN_MINT, isSigner: false, isWritable: false },  // token_mint
      { pubkey: RESERVE_MINT, isSigner: false, isWritable: false },  // reserve_mint
      { pubkey: wallet.publicKey, isSigner: false, isWritable: false },  // platform_wallet
      { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },  // system_program
      { pubkey: new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false },  // token_program
    ],
    data: Buffer.from([
      0,  // instruction index 0 = initialize
      ...new anchor.BN(0).toArray('le', 8),  // initialReserve: 0
      ...new anchor.BN(0).toArray('le', 8),  // initialReferralPool: 0
      bump  // bump seed
    ])
  });
  
  const tx = new web3.Transaction().add(initializeIx);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  
  try {
    const signature = await web3.sendAndConfirmTransaction(connection, tx, [wallet.payer]);
    console.log('✅ 初始化成功!');
    console.log('交易ID:', signature);
  } catch (e) {
    console.error('初始化失败:', e);
  }
}

main();
