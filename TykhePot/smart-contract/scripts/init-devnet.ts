import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";

const PROGRAM_ID = new web3.PublicKey("5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b");
const TOKEN_MINT = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");
const RESERVE_MINT = new web3.PublicKey("9Z3c9tVQo2YfakysXUbLr2UdP4HKnszNUz1BdLjCTQm2");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const wallet = provider.wallet.publicKey;
  console.log("钱包地址:", wallet.toString());

  const [statePDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    PROGRAM_ID
  );
  console.log("状态 PDA:", statePDA.toString());

  const idl = await Program.fetchIdl(PROGRAM_ID, provider);
  if (!idl) {
    console.error("无法获取 IDL");
    return;
  }
  
  const program = new Program(idl, PROGRAM_ID, provider);

  try {
    await program.methods
      .initialize({
        initialReserve: new BN(0),
        initialReferralPool: new BN(0),
      })
      .accounts({
        authority: wallet,
        state: statePDA,
        tokenMint: TOKEN_MINT,
        reserveMint: RESERVE_MINT,
        platformWallet: wallet,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ 合约初始化成功!");
    console.log("状态 PDA:", statePDA.toString());
    
  } catch (error) {
    console.error("❌ 初始化失败:", error);
  }
}

main();
