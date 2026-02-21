import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { Royalpot } from "../target/types/royalpot";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Royalpot as Program<Royalpot>;

  console.log("🎯 初始化 RoyalPot 合约");
  console.log("========================");

  // 获取 PDA
  const [statePDA, stateBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    program.programId
  );

  console.log("状态账户 PDA:", statePDA.toString());

  // 代币配置（需要替换为实际地址）
  const TOKEN_MINT = new web3.PublicKey("YOUR_TOKEN_MINT");
  const PLATFORM_WALLET = provider.wallet.publicKey;

  try {
    await program.methods
      .initialize({
        initialReserve: new BN(50_000_000_000_000), // 50,000 RYPOT
        initialReferralPool: new BN(200_000_000_000_000), // 200,000 RYPOT
      })
      .accounts({
        authority: provider.wallet.publicKey,
        state: statePDA,
        tokenMint: TOKEN_MINT,
        platformWallet: PLATFORM_WALLET,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ 合约初始化成功!");
    
    // 获取状态
    const state = await program.account.protocolState.fetch(statePDA);
    console.log("\n合约状态:");
    console.log("  权限:", state.authority.toString());
    console.log("  储备余额:", state.reserveBalance.toString());
    console.log("  推广池余额:", state.referralPoolBalance.toString());
    
  } catch (error) {
    console.error("❌ 初始化失败:", error);
    process.exit(1);
  }
}

main();
