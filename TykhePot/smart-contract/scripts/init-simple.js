const anchor = require('@coral-xyz/anchor');
const web3 = require('@solana/web3.js');

const PROGRAM_ID = new web3.PublicKey('5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b');
const TOKEN_MINT = new web3.PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');
const RESERVE_MINT = new web3.PublicKey('9Z3c9tVQo2YfakysXUbLr2UdP4HKnszNUz1BdLjCTQm2');

async function main() {
  const connection = new web3.Connection('https://api.devnet.solana.com');
  const wallet = anchor.Wallet.local();
  
  console.log('钱包地址:', wallet.publicKey.toString());
  
  // 获取状态PDA
  const [statePDA, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('state')],
    PROGRAM_ID
  );
  console.log('状态PDA:', statePDA.toString());
  console.log('Bump:', bump);
  
  // 读取 IDL
  const idl = await anchor.Program.fetchIdl(PROGRAM_ID, { connection, wallet });
  if (!idl) {
    console.log('无法获取IDL，尝试直接构建交易...');
    return;
  }
  
  const provider = new anchor.AnchorProvider(connection, wallet);
  const program = new anchor.Program(idl, PROGRAM_ID, provider);
  
  try {
    const tx = await program.methods
      .initialize({
        initialReserve: new anchor.BN(0),
        initialReferralPool: new anchor.BN(0),
      })
      .accounts({
        authority: wallet.publicKey,
        state: statePDA,
        tokenMint: TOKEN_MINT,
        reserveMint: RESERVE_MINT,
        platformWallet: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log('✅ 初始化成功!');
    console.log('交易ID:', tx);
  } catch (e) {
    console.error('初始化失败:', e.message);
  }
}

main();
