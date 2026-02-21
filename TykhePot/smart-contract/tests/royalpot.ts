import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Royalpot } from "../target/types/royalpot";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";

describe("RoyalPot Contract Tests", () => {
  // 配置 provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Royalpot as Program<Royalpot>;
  
  // 测试账户
  let authority: anchor.web3.Keypair;
  let user1: anchor.web3.Keypair;
  let user2: anchor.web3.Keypair;
  let referrer: anchor.web3.Keypair;
  
  // 代币账户
  let tokenMint: anchor.web3.PublicKey;
  let reserveMint: anchor.web3.PublicKey;
  
  // ATA账户
  let authorityToken: anchor.web3.PublicKey;
  let user1Token: anchor.web3.PublicKey;
  let user2Token: anchor.web3.PublicKey;
  let referrerToken: anchor.web3.PublicKey;
  let platformToken: anchor.web3.PublicKey;
  let burnToken: anchor.web3.PublicKey;
  
  // PDA账户
  let statePDA: anchor.web3.PublicKey;
  let stateBump: number;
  let hourlyVault: anchor.web3.PublicKey;
  let dailyVault: anchor.web3.PublicKey;
  let reserveVault: anchor.web3.PublicKey;

  before(async () => {
    // 创建测试账户
    authority = anchor.web3.Keypair.generate();
    user1 = anchor.web3.Keypair.generate();
    user2 = anchor.web3.Keypair.generate();
    referrer = anchor.web3.Keypair.generate();

    // 空投 SOL
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(authority.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user1.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user2.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(referrer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // 创建代币
    tokenMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9
    );

    // 创建 ATA
    authorityToken = await createAccount(provider.connection, authority, tokenMint, authority.publicKey);
    user1Token = await createAccount(provider.connection, user1, tokenMint, user1.publicKey);
    user2Token = await createAccount(provider.connection, user2, tokenMint, user2.publicKey);
    referrerToken = await createAccount(provider.connection, referrer, tokenMint, referrer.publicKey);
    platformToken = await createAccount(provider.connection, authority, tokenMint, authority.publicKey);
    burnToken = await createAccount(provider.connection, authority, tokenMint, authority.publicKey);

    // 铸造代币给测试用户
    await mintTo(provider.connection, authority, tokenMint, user1Token, authority, 1_000_000_000_000); // 1000 RYPOT
    await mintTo(provider.connection, authority, tokenMint, user2Token, authority, 1_000_000_000_000);
    await mintTo(provider.connection, authority, tokenMint, referrerToken, authority, 1_000_000_000_000);

    // 获取 PDA
    [statePDA, stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      program.programId
    );

    // 初始化合约
    await program.methods
      .initialize({
        initialReserve: new anchor.BN(50_000_000_000_000), // 50,000 RYPOT
        initialReferralPool: new anchor.BN(200_000_000_000_000), // 200,000 RYPOT
      })
      .accounts({
        authority: authority.publicKey,
        state: statePDA,
        tokenMint,
        platformWallet: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();
  });

  describe("Initialize", () => {
    it("Should initialize the protocol correctly", async () => {
      const state = await program.account.protocolState.fetch(statePDA);
      
      expect(state.authority.toString()).to.equal(authority.publicKey.toString());
      expect(state.tokenMint.toString()).to.equal(tokenMint.toString());
      expect(state.reserveBalance.toNumber()).to.equal(50_000_000_000_000);
      expect(state.referralPoolBalance.toNumber()).to.equal(200_000_000_000_000);
      expect(state.totalBurned.toNumber()).to.equal(0);
    });
  });

  describe("Deposit Hourly Pool", () => {
    it("Should allow user to deposit into hourly pool", async () => {
      const depositAmount = new anchor.BN(500_000_000_000); // 500 RYPOT
      
      // 获取用户PDA
      const [userPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), user1.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .depositHourly(depositAmount)
        .accounts({
          user: user1.publicKey,
          state: statePDA,
          userState: userPDA,
          userToken: user1Token,
          burnAccount: burnToken,
          platformToken: platformToken,
          hourlyPrizeVault: hourlyVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      // 验证状态
      const state = await program.account.protocolState.fetch(statePDA);
      expect(state.hourlyPool.totalAmount.toNumber()).to.be.greaterThan(0);
      expect(state.totalBurned.toNumber()).to.be.greaterThan(0);

      // 验证用户状态
      const userState = await program.account.userState.fetch(userPDA);
      expect(userState.hourlyTickets.toNumber()).to.be.greaterThan(0);
    });

    it("Should reject deposit below minimum", async () => {
      const depositAmount = new anchor.BN(100_000_000_000); // 100 RYPOT (below 200 minimum)
      
      const [userPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), user2.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .depositHourly(depositAmount)
          .accounts({
            user: user2.publicKey,
            state: statePDA,
            userState: userPDA,
            userToken: user2Token,
            burnAccount: burnToken,
            platformToken: platformToken,
            hourlyPrizeVault: hourlyVault,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.toString()).to.include("BelowMinDeposit");
      }
    });
  });

  describe("Deposit Daily Pool with Referral", () => {
    it("Should allow deposit with referral", async () => {
      const depositAmount = new anchor.BN(1_000_000_000_000); // 1000 RYPOT
      
      const [userPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), user1.publicKey.toBuffer()],
        program.programId
      );

      const initialReferrerBalance = (await getAccount(provider.connection, referrerToken)).amount;

      await program.methods
        .depositDaily(depositAmount, referrer.publicKey)
        .accounts({
          user: user1.publicKey,
          state: statePDA,
          userState: userPDA,
          userToken: user1Token,
          burnAccount: burnToken,
          platformToken: platformToken,
          dailyPrizeVault: dailyVault,
          reserveVault: reserveVault,
          reserveAuthority: statePDA, // PDA as authority
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

      // 验证推荐人获得奖励
      const finalReferrerBalance = (await getAccount(provider.connection, referrerToken)).amount;
      const referralReward = Number(finalReferrerBalance) - Number(initialReferrerBalance);
      
      // 8% of 1000 = 80 RYPOT
      expect(referralReward).to.be.closeTo(80_000_000_000, 1_000_000_000);
    });
  });

  describe("Staking", () => {
    let stakingStatePDA: anchor.web3.PublicKey;
    let stakingVault: anchor.web3.PublicKey;

    before(async () => {
      [stakingStatePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("staking_state")],
        program.programId
      );

      // 初始化质押池
      await program.methods
        .initializeStaking(
          new anchor.BN(50_000_000_000_000), // 短期池 50,000
          new anchor.BN(200_000_000_000_000) // 长期池 200,000
        )
        .accounts({
          authority: authority.publicKey,
          stakingState: stakingStatePDA,
          tokenMint,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
    });

    it("Should allow short-term staking", async () => {
      const stakeAmount = new anchor.BN(10_000_000_000); // 10 RYPOT
      
      const [userStakePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_stake"), user1.publicKey.toBuffer(), Buffer.from([0, 0, 0, 0])],
        program.programId
      );

      await program.methods
        .stakeShortTerm(stakeAmount)
        .accounts({
          user: user1.publicKey,
          stakingState: stakingStatePDA,
          userStake: userStakePDA,
          userToken: user1Token,
          stakingVault: stakingVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const userStake = await program.account.userStake.fetch(userStakePDA);
      expect(userStake.amount.toNumber()).to.equal(stakeAmount.toNumber());
      expect(userStake.stakeType).to.deep.equal({ shortTerm: {} });
    });

    it("Should calculate correct reward for long-term staking", async () => {
      // 10 RYPOT * 48% * 180/365 = ~2.36 RYPOT
      const stakeAmount = new anchor.BN(10_000_000_000);
      const expectedReward = stakeAmount.toNumber() * 0.48 * 180 / 365;
      
      const [userStakePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_stake"), user2.publicKey.toBuffer(), Buffer.from([0, 0, 0, 0])],
        program.programId
      );

      await program.methods
        .stakeLongTerm(stakeAmount)
        .accounts({
          user: user2.publicKey,
          stakingState: stakingStatePDA,
          userStake: userStakePDA,
          userToken: user2Token,
          stakingVault: stakingVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      const userStake = await program.account.userStake.fetch(userStakePDA);
      const actualReward = userStake.reward.toNumber();
      
      // 允许 1% 误差
      expect(actualReward).to.be.closeTo(expectedReward, expectedReward * 0.01);
    });
  });

  describe("Airdrop", () => {
    let airdropStatePDA: anchor.web3.PublicKey;
    let airdropVault: anchor.web3.PublicKey;

    before(async () => {
      [airdropStatePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("airdrop_state")],
        program.programId
      );

      // 初始化空投
      await program.methods
        .initializeAirdrop(new anchor.BN(200_000_000_000_000)) // 200,000 RYPOT
        .accounts({
          authority: authority.publicKey,
          airdropState: airdropStatePDA,
          tokenMint,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
    });

    it("Should record profit and calculate eligible airdrop", async () => {
      const profitAmount = new anchor.BN(2_000_000_000_000); // 2000 RYPOT profit
      
      const [userAirdropPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_airdrop"), user1.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .recordProfit(profitAmount)
        .accounts({
          user: user1.publicKey,
          gameProgram: program.programId,
          airdropState: airdropStatePDA,
          userAirdrop: userAirdropPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const userAirdrop = await program.account.userAirdrop.fetch(userAirdropPDA);
      expect(userAirdrop.totalProfit.toNumber()).to.equal(profitAmount.toNumber());
      expect(userAirdrop.hasParticipated).to.be.true;
      
      // 2000 * 10 = 20,000 RYPOT (but capped at 10,000)
      expect(userAirdrop.eligibleAirdrop.toNumber()).to.equal(10_000_000_000_000);
    });

    it("Should allow claiming airdrop", async () => {
      const [userAirdropPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_airdrop"), user1.publicKey.toBuffer()],
        program.programId
      );

      const initialBalance = (await getAccount(provider.connection, user1Token)).amount;

      await program.methods
        .claimAirdrop()
        .accounts({
          user: user1.publicKey,
          airdropState: airdropStatePDA,
          userAirdrop: userAirdropPDA,
          userToken: user1Token,
          airdropVault: airdropVault,
          airdropAuthority: airdropStatePDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

      const finalBalance = (await getAccount(provider.connection, user1Token)).amount;
      const claimedAmount = Number(finalBalance) - Number(initialBalance);
      
      expect(claimedAmount).to.be.greaterThan(0);
      
      const userAirdrop = await program.account.userAirdrop.fetch(userAirdropPDA);
      expect(userAirdrop.hasClaimed).to.be.true;
    });
  });

  describe("Edge Cases", () => {
    it("Should handle reserve depletion correctly", async () => {
      // 模拟储备耗尽场景
      // ...
    });

    it("Should prevent double claiming", async () => {
      // 测试重复领取
      // ...
    });

    it("Should allow early withdrawal without penalty", async () => {
      // 测试提前赎回
      // ...
    });
  });
});
