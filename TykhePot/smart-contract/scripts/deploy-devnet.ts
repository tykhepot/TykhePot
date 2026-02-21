import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import {
  createMint,
  createAccount,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { TykhePot } from "../target/types/tykhepot";
import * as fs from 'fs';
import * as path from 'path';

// 部署配置
const CONFIG = {
  // 代币分配 (10亿 TPOT)
  TOTAL_SUPPLY: 1_000_000_000_000_000_000, // 10亿 * 10^9 (9 decimals)
  
  // 各池子分配
  AIRDROP_POOL: 200_000_000_000_000_000,    // 20% - 2亿
  STAKING_SHORT: 50_000_000_000_000_000,    // 5% - 5000万 (30天)
  STAKING_LONG: 200_000_000_000_000_000,    // 20% - 2亿 (180天)
  REFERRAL_POOL: 200_000_000_000_000_000,   // 20% - 2亿
  GAME_RESERVE: 50_000_000_000_000_000,     // 5% - 5000万
  TEAM_VESTING: 150_000_000_000_000_000,    // 15% - 1.5亿
  DEX_LIQUIDITY: 100_000_000_000_000_000,   // 10% - 1亿
  ECOSYSTEM: 50_000_000_000_000_000,        // 5% - 5000万
};

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  console.log("🚀 TykhePot Devnet 部署脚本");
  console.log("============================");
  console.log("部署者:", provider.wallet.publicKey.toString());
  console.log("网络:", provider.connection.rpcEndpoint);
  console.log();

  // 1. 创建 TPOT 代币
  console.log("1. 创建 TPOT 代币...");
  const tokenMint = await createMint(
    provider.connection,
    // @ts-ignore
    provider.wallet.payer,
    provider.wallet.publicKey,
    null,
    9
  );
  console.log("   代币地址 (TPOT):", tokenMint.toString());

  // 2. 创建各类代币账户
  console.log("\n2. 创建代币账户...");
  
  // 平台账户
  const platformToken = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    // @ts-ignore
    provider.wallet.payer,
    tokenMint,
    provider.wallet.publicKey
  );
  console.log("   平台账户:", platformToken.address.toString());

  // 销毁账户
  const burnToken = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    // @ts-ignore
    provider.wallet.payer,
    tokenMint,
    provider.wallet.publicKey
  );
  console.log("   销毁账户:", burnToken.address.toString());

  // 3. 铸造代币到对应账户
  console.log("\n3. 铸造初始代币...");
  
  // 铸造到平台账户 (团队+生态)
  await mintTo(
    provider.connection,
    // @ts-ignore
    provider.wallet.payer,
    tokenMint,
    platformToken.address,
    provider.wallet.publicKey,
    CONFIG.TEAM_VESTING + CONFIG.ECOSYSTEM
  );
  console.log("   团队+生态代币已铸造:", ((CONFIG.TEAM_VESTING + CONFIG.ECOSYSTEM) / 1e9).toFixed(0), "TPOT");

  // 铸造到销毁账户 (空投池)
  await mintTo(
    provider.connection,
    // @ts-ignore
    provider.wallet.payer,
    tokenMint,
    burnToken.address,
    provider.wallet.publicKey,
    CONFIG.AIRDROP_POOL
  );
  console.log("   空投池代币已铸造:", (CONFIG.AIRDROP_POOL / 1e9).toFixed(0), "TPOT");

  // 4. 加载合约
  console.log("\n4. 加载合约...");
  const program = anchor.workspace.TykhePot as Program<TykhePot>;
  console.log("   程序ID:", program.programId.toString());

  // 5. 初始化合约
  console.log("\n5. 初始化合约...");
  
  // 获取PDA
  const [statePDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    program.programId
  );
  console.log("   状态PDA:", statePDA.toString());

  try {
    await program.methods
      .initialize({
        initialReserve: new BN(CONFIG.GAME_RESERVE),
        initialReferralPool: new BN(CONFIG.REFERRAL_POOL),
      })
      .accounts({
        authority: provider.wallet.publicKey,
        state: statePDA,
        tokenMint: tokenMint,
        reserveMint: tokenMint,
        platformWallet: platformToken.address,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("   ✅ 合约初始化成功!");
  } catch (error) {
    console.error("   ❌ 初始化失败:", error);
    throw error;
  }

  // 6. 保存部署信息
  console.log("\n6. 保存部署信息...");
  const deployInfo = {
    network: "devnet",
    deployTime: new Date().toISOString(),
    deployer: provider.wallet.publicKey.toString(),
    programId: program.programId.toString(),
    tokenMint: tokenMint.toString(),
    statePDA: statePDA.toString(),
    platformToken: platformToken.address.toString(),
    burnToken: burnToken.address.toString(),
    config: CONFIG,
  };

  const deployDir = path.join(__dirname, '..', 'deploys');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  const deployFile = path.join(deployDir, `devnet-${Date.now()}.json`);
  fs.writeFileSync(deployFile, JSON.stringify(deployInfo, null, 2));
  console.log("   部署信息已保存:", deployFile);

  // 7. 更新前端配置
  console.log("\n7. 更新前端配置...");
  const frontendConfig = {
    network: "devnet",
    endpoint: "https://api.devnet.solana.com",
    programId: program.programId.toString(),
    tokenMint: tokenMint.toString(),
    statePDA: statePDA.toString(),
  };

  const webappDir = path.join(__dirname, '..', '..', 'royalpot-frontend', 'src', 'config');
  if (!fs.existsSync(webappDir)) {
    fs.mkdirSync(webappDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(webappDir, 'devnet.json'),
    JSON.stringify(frontendConfig, null, 2)
  );
  console.log("   前端配置已更新");

  console.log("\n✅ Devnet 部署完成!");
  console.log("\n重要地址:");
  console.log("  程序ID:", program.programId.toString());
  console.log("  代币合约:", tokenMint.toString());
  console.log("  状态PDA:", statePDA.toString());
  console.log("\n下一步:");
  console.log("1. 在 Solscan Devnet 上验证合约");
  console.log("2. 测试合约功能");
  console.log("3. 准备主网部署");
}

main().catch((err) => {
  console.error("部署失败:", err);
  process.exit(1);
});
