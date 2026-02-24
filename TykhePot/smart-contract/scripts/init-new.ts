import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN, AnchorProvider } from "@coral-xyz/anchor";

// 新合约 ID
const PROGRAM_ID = new web3.PublicKey("8qSEv4yYQpfJuu18KTHfDZjasr52ZPgYGLPYRWBAvJvu");

// 已有代币
const TOKEN_MINT = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");
const RESERVE_MINT = new web3.PublicKey("9Z3c9tVQo2YfakysXUbLr2UdP4HKnszNUz1BdLjCTQm2");

const IDL = {
  version: "0.1.0",
  name: "royalpot",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "state", isMut: true, isSigner: false },
        { name: "tokenMint", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "InitializeParams"
          },
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
  const provider = new AnchorProvider(connection, wallet, {});
  
  const program = new Program(IDL as any, PROGRAM_ID, provider);
  
  const [statePDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    PROGRAM_ID
  );
  
  console.log("State PDA:", statePDA.toString());
  
  // 初始化参数 - 1B TPOT = 1,000,000,000 (考虑9位小数)
  const params = {
    prePool: new BN(200_000_000_000),      // 200M
    referralPool: new BN(200_000_000_000), // 200M
    airdropPool: new BN(100_000_000_000),   // 100M
    stakingPool: new BN(350_000_000_000),    // 350M
    preMatchPool: new BN(100_000_000_000),  // 100M
    teamPool: new BN(100_000_000_000),      // 100M
  };
  
  try {
    const tx = await program.methods.initialize(params).accounts({
      authority: wallet.publicKey,
      state: statePDA,
      tokenMint: TOKEN_MINT,
      systemProgram: web3.SystemProgram.programId,
    } as any).transaction();
    
    const sig = await provider.sendAndConfirm(tx);
    console.log("初始化成功! 交易:", sig);
  } catch (e) {
    console.error("初始化失败:", e);
  }
}

main();
