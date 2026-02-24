import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";

// 程序ID - 使用旧合约
const PROGRAM_ID = new web3.PublicKey("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");

// 完整IDL
const IDL = {
  version: "0.1.0",
  name: "royalpot",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "tokenMint", isMut: false, isSigner: false },
        { name: "platformWallet", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [
        {
          name: "params",
          type: { defined: "InitializeParams" },
        },
      ],
    },
  ],
  types: [
    {
      name: "InitializeParams",
      type: {
        kind: "struct",
        fields: [
          { name: "prePool", type: "u64" },
          { name: "referralPool", type: "u64" },
          { name: "airdropPool", type: "u64" },
          { name: "stakingPool", type: "u64" },
          { name: "preMatchPool", type: "u64" },
          { name: "teamPool", type: "u64" },
        ],
      },
    },
  ],
};

async function main() {
  const connection = new web3.Connection("https://api.devnet.solana.com");
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  
  const program = new Program(IDL as any, PROGRAM_ID, provider);
  
  const [statePDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    PROGRAM_ID
  );
  
  console.log("State PDA:", statePDA.toString());
  
  // 检查是否已存在
  const existingState = await connection.getAccountInfo(statePDA);
  if (existingState) {
    console.log("State account already exists!");
    return;
  }
  
  // 初始化参数 - 10亿TPOT = 1,000,000,000 * 10^9 (9位小数)
  const params = {
    prePool: new BN(200_000_000_000),      // 200M
    referralPool: new BN(200_000_000_000), // 200M
    airdropPool: new BN(100_000_000_000),   // 100M
    stakingPool: new BN(350_000_000_000),    // 350M
    preMatchPool: new BN(100_000_000_000),  // 100M
    teamPool: new BN(100_000_000_000),      // 100M
  };
  
  // 代币地址
  const TOKEN_MINT = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");
  // 平台钱包 - 使用部署者钱包
  const PLATFORM_WALLET = wallet.publicKey;
  
  try {
    const tx = await program.methods.initialize(params).accounts({
      authority: wallet.publicKey,
      state: statePDA,
      tokenMint: TOKEN_MINT,
      platformWallet: PLATFORM_WALLET,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    } as any).transaction();
    
    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    const sig = await provider.sendAndConfirm(tx);
    console.log("初始化成功! 交易:", sig);
  } catch (e) {
    console.error("初始化失败:", e);
  }
}

main();
