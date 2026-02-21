import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import {
  createMint,
  createAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Royalpot } from "../target/types/royalpot";

// 部署配置
const CONFIG = {
  // 代币分配
  TOTAL_SUPPLY: 1_000_000_000_000_000_000, // 10亿 RYPOT (9 decimals)
  
  // 各池子分配
  AIRDROP_POOL: 200_000_000_000_000_000,    // 20%
  STAKING_SHORT: 50_000_000_000_000_000,    // 5%
  STAKING_LONG: 200_000_000_000_000_000,    // 20%
  REFERRAL_POOL: 200_000_000_000_000_000,   // 20%
  GAME_RESERVE: 50_000_000_000_000_000,     // 5%
  TEAM_VESTING: 150_000_000_000_000_000,    // 15%
  DEX_LIQUIDITY: 100_000_000_000_000_000,   // 10%
  ECOSYSTEM: 50_000_000_000_000_000,        // 5%
};

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  console.log("🚀 RoyalPot 部署脚本");
  console.log("====================");
  console.log("部署者:", provider.wallet.publicKey.toString());
  console.log("网络:", provider.connection.rpcEndpoint);
  console.log();

  // 1. 创建代币
  console.log("1. 创建 RYPOT 代币...");
  const tokenMint = await createMint(
    provider.connection,
    // @ts-ignore
    provider.wallet.payer,
    provider.wallet.publicKey,
    null,
    9
  );
  console.log("   代币地址:", tokenMint.toString());

  // 2. 创建各类代币账户
  console.log("\n2. 创建代币账户...");
  
  const platformToken = await createAccount(
    provider.connection,
    // @ts-ignore
    provider.wallet.payer,
    tokenMint,
    provider.wallet.publicKey
  );
  console.log("   平台账户:", platformToken.toString());

  const burnToken = await createAccount(
    provider.connection,
    // @ts-ignore
    provider.wallet.payer,
    tokenMint,
    provider.wallet.publicKey
  );
  console.log("   销毁账户:", burnToken.toString());

  // 3. 铸造代币到对应账户
  console.log("\n3. 铸造初始代币...");
  
  await mintTo(
    provider.connection,
    // @ts-ignore
    provider.wallet.payer,
    tokenMint,
    platformToken,
    provider.wallet.publicKey,
    CONFIG.TEAM_VESTING + CONFIG.ECOSYSTEM
  );
  console.log("   团队+生态代币已铸造");

  // 4. 部署合约
  console.log("\n4. 部署智能合约...");
  // 这里需要调用 anchor deploy 命令
  console.log("   请运行: anchor deploy");

  // 5. 初始化合约
  console.log("\n5. 初始化合约...");
  console.log("   请运行: ts-node scripts/initialize.ts");

  console.log("\n✅ 部署准备完成!");
  console.log("\n下一步:");
  console.log("1. 运行 anchor deploy 部署合约");
  console.log("2. 运行 ts-node scripts/initialize.ts 初始化");
  console.log("3. 运行 ts-node scripts/setup_pools.ts 设置各池子");
}

main().catch((err) => {
  console.error("部署失败:", err);
  process.exit(1);
});
