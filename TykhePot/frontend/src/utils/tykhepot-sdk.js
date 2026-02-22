import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { 
  PROGRAM_ID, 
  TOKEN_MINT, 
  NETWORK, 
  RPC_ENDPOINT 
} from "../config/contract";

// 从 contract.js 导入真实配置
const CONFIG = {
  DEVNET: {
    programId: PROGRAM_ID,
    tokenMint: TOKEN_MINT,
    endpoint: RPC_ENDPOINT,
  },
  MAINNET: {
    programId: "", // 主网部署后填写
    tokenMint: "",
    endpoint: "https://api.mainnet-beta.solana.com",
  },
};

// IDL - 需要从 target/idl/royalpot.json 复制更新
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
          type: { defined: "InitializeParams" },
        },
      ],
    },
    {
      name: "emergencyPause",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "state", isMut: true, isSigner: false },
      ],
      args: [],
    },
    {
      name: "emergencyResume",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "state", isMut: true, isSigner: false },
      ],
      args: [],
    },
    {
      name: "depositHourly",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "state", isMut: true, isSigner: false },
        { name: "userState", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "burnAccount", isMut: true, isSigner: false },
        { name: "platformToken", isMut: true, isSigner: false },
        { name: "hourlyPrizeVault", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "depositDaily",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "state", isMut: true, isSigner: false },
        { name: "userState", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "burnAccount", isMut: true, isSigner: false },
        { name: "platformToken", isMut: true, isSigner: false },
        { name: "dailyPrizeVault", isMut: true, isSigner: false },
        { name: "reserveVault", isMut: true, isSigner: false },
        { name: "reserveAuthority", isMut: false, isSigner: false },
        { name: "referralVault", isMut: true, isSigner: false },
        { name: "referralAuthority", isMut: false, isSigner: false },
        { name: "referrerToken", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "referrer", type: { option: "publicKey" } },
      ],
    },
    {
      name: "claimVested",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "state", isMut: true, isSigner: false },
        { name: "userState", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "prizeVault", isMut: true, isSigner: false },
        { name: "prizeAuthority", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "claimAirdrop",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "userData", isMut: true, isSigner: false, seeds: ["user", { kind: "account", type: "publicKey" }] },
        { name: "airdropVault", isMut: true, isSigner: false },
        { name: "destToken", isMut: true, isSigner: false },
        { name: "airdropAuth", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "drawHourly",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "firstPrizeWinner", isMut: true, isSigner: false },
        { name: "secondPrizeWinner", isMut: true, isSigner: false },
        { name: "thirdPrizeWinner", isMut: true, isSigner: false },
        { name: "luckyPrizeWinner", isMut: true, isSigner: false },
        { name: "universalPrizeRecipients", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "drawDaily",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "firstPrizeWinner", isMut: true, isSigner: false },
        { name: "secondPrizeWinnerA", isMut: true, isSigner: false },
        { name: "secondPrizeWinnerB", isMut: true, isSigner: false },
        { name: "thirdPrizeWinnerA", isMut: true, isSigner: false },
        { name: "thirdPrizeWinnerB", isMut: true, isSigner: false },
        { name: "thirdPrizeWinnerC", isMut: true, isSigner: false },
        { name: "luckyPrizeWinner", isMut: true, isSigner: false },
        { name: "universalPrizeRecipients", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "claimHourlyUniversal",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "claimDailyUniversal",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "ProtocolState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "tokenMint", type: "publicKey" },
          { name: "reserveMint", type: "publicKey" },
          { name: "platformWallet", type: "publicKey" },
          { name: "hourlyPool", type: { defined: "PrizePool" } },
          { name: "dailyPool", type: { defined: "PrizePool" } },
          { name: "reserveBalance", type: "u64" },
          { name: "referralPoolBalance", type: "u64" },
          { name: "totalBurned", type: "u64" },
          { name: "lastHourlyDraw", type: "i64" },
          { name: "lastDailyDraw", type: "i64" },
          { name: "paused", type: "bool" },
          { name: "emergencyWithdrawn", type: "bool" },
          { name: "lastHourlyWinningNumbers", type: { defined: "WinningNumbersStored" } },
          { name: "lastDailyWinningNumbers", type: { defined: "WinningNumbersStored" } },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "UserState",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "referrer", type: { option: "publicKey" } },
          { name: "hourlyTickets", type: "u64" },
          { name: "dailyTickets", type: "u64" },
          { name: "lastDepositTime", type: "i64" },
        ],
      },
    },
  ],
  types: [
    {
      name: "PrizePool",
      type: {
        kind: "struct",
        fields: [
          { name: "totalAmount", type: "u64" },
          { name: "participants", type: "u32" },
        ],
      },
    },
    {
      name: "WinningNumbersStored",
      type: {
        kind: "struct",
        fields: [
          { name: "firstPrize", type: "u64" },
          { name: "secondPrizes", type: { vec: "u64" } },
          { name: "thirdPrizes", type: { vec: "u64" } },
          { name: "luckyPrizes", type: { vec: "u64" } },
          { name: "drawTime", type: "i64" },
        ],
      },
    },
    {
      name: "InitializeParams",
      type: {
        kind: "struct",
        fields: [
          { name: "initialReserve", type: "u64" },
          { name: "initialReferralPool", type: "u64" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "BelowMinDeposit", msg: "Deposit amount below minimum" },
    { code: 6001, name: "PoolLocked", msg: "Pool is locked" },
    { code: 6002, name: "DrawTooEarly", msg: "Draw too early" },
    { code: 6003, name: "NotEnoughParticipants", msg: "Not enough participants" },
    { code: 6004, name: "NoClaimableAmount", msg: "No claimable amount" },
    { code: 6005, name: "ContractPaused", msg: "Contract is paused" },
    { code: 6006, name: "ExceedMaxDeposit", msg: "Exceeds maximum deposit per user" },
    { code: 6007, name: "DepositTooFrequent", msg: "Deposit too frequent, please wait" },
    { code: 6008, name: "InvalidAmount", msg: "Invalid amount" },
    { code: 6009, name: "InsufficientBalance", msg: "Insufficient balance" },
  ],
};

class TykhePotSDK {
  constructor(connection, wallet, network = "devnet") {
    this.connection = connection;
    this.wallet = wallet;
    this.network = network;
    this.config = CONFIG[network.toUpperCase()];
    
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );
    
    this.program = new Program(
      IDL,
      new web3.PublicKey(this.config.programId),
      provider
    );
    
    this.tokenMint = new web3.PublicKey(this.config.tokenMint);
  }

  // ===== 辅助方法 =====
  
  formatAmount(amount) {
    return (Number(amount) / 1e9).toFixed(2);
  }

  parseAmount(amount) {
    return new BN(Math.floor(parseFloat(amount) * 1e9));
  }

  async getTokenAccount(owner) {
    return await getAssociatedTokenAddress(
      this.tokenMint,
      new web3.PublicKey(owner)
    );
  }

  async getOrCreateTokenAccount(owner) {
    const ownerPubkey = new web3.PublicKey(owner);
    const ata = await getAssociatedTokenAddress(this.tokenMint, ownerPubkey);
    
    try {
      await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet.payer,
        this.tokenMint,
        ownerPubkey
      );
    } catch (e) {
      // 账户已存在或创建失败
    }
    
    return ata;
  }

  // ===== 状态查询 =====

  async getProtocolState() {
    try {
      const [statePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        this.program.programId
      );
      return await this.program.account.protocolState.fetch(statePDA);
    } catch (e) {
      console.error("Failed to fetch protocol state:", e);
      return null;
    }
  }

  async getUserState(userPublicKey) {
    try {
      const [userStatePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), new web3.PublicKey(userPublicKey).toBuffer()],
        this.program.programId
      );
      return await this.program.account.userState.fetch(userStatePDA);
    } catch (e) {
      return null;
    }
  }

  async getTokenBalance(userPublicKey) {
    try {
      const tokenAccount = await this.getTokenAccount(userPublicKey);
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return BigInt(balance.value.amount);
    } catch (e) {
      return BigInt(0);
    }
  }

  // 获取奖池统计
  async getPoolStats() {
    try {
      const state = await this.getProtocolState();
      if (!state) return null;

      return {
        hourlyPool: state.hourlyPool.totalAmount.toNumber(),
        dailyPool: state.dailyPool.totalAmount.toNumber(),
        hourlyParticipants: state.hourlyPool.participants,
        dailyParticipants: state.dailyPool.participants,
        totalBurned: state.totalBurned.toNumber(),
        reserveBalance: state.reserveBalance.toNumber(),
        referralPoolBalance: state.referralPoolBalance.toNumber(),
        lastHourlyDraw: state.lastHourlyDraw.toNumber(),
        lastDailyDraw: state.lastDailyDraw.toNumber(),
        paused: state.paused,
      };
    } catch (e) {
      console.error("Failed to get pool stats:", e);
      return null;
    }
  }

  // ===== 核心交易 =====

  async depositHourly(amount) {
    try {
      const user = this.wallet.publicKey;
      const amountBN = this.parseAmount(amount);

      const [statePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        this.program.programId
      );

      const [userStatePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), user.toBuffer()],
        this.program.programId
      );

      const userToken = await this.getOrCreateTokenAccount(user);

      // 获取状态以找到资金账户
      const state = await this.getProtocolState();
      if (!state) throw new Error("Protocol not initialized");

      // 构建账户列表
      const accounts = {
        user,
        state: statePDA,
        userState: userStatePDA,
        userToken,
        burnAccount: state.tokenMint, // 需要替换为实际的burn账户
        platformToken: state.platformWallet,
        hourlyPrizeVault: state.tokenMint, // 需要替换为实际的prize vault
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      };

      const tx = await this.program.methods
        .depositHourly(amountBN)
        .accounts(accounts)
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Deposit hourly failed:", error);
      return { success: false, error: error.message };
    }
  }

  async depositDaily(amount, referrer = null) {
    try {
      const user = this.wallet.publicKey;
      const amountBN = this.parseAmount(amount);

      const [statePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        this.program.programId
      );

      const [userStatePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), user.toBuffer()],
        this.program.programId
      );

      const [reserveAuthority] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("reserve")],
        this.program.programId
      );

      const [referralAuthority] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("referral")],
        this.program.programId
      );

      const userToken = await this.getOrCreateTokenAccount(user);

      const state = await this.getProtocolState();
      if (!state) throw new Error("Protocol not initialized");

      const referrerKey = referrer ? new web3.PublicKey(referrer) : null;

      // 需要获取referrer的token账户
      let referrerToken = state.platformWallet; // 默认回退
      if (referrerKey) {
        referrerToken = await this.getTokenAccount(referrerKey);
      }

      const accounts = {
        user,
        state: statePDA,
        userState: userStatePDA,
        userToken,
        burnAccount: state.tokenMint,
        platformToken: state.platformWallet,
        dailyPrizeVault: state.tokenMint,
        reserveVault: state.reserveMint,
        reserveAuthority,
        referralVault: state.tokenMint,
        referralAuthority,
        referrerToken,
        tokenProgram: TOKEN_PROGRAM_ID,
      };

      const tx = await this.program.methods
        .depositDaily(amountBN, referrerKey)
        .accounts(accounts)
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Deposit daily failed:", error);
      return { success: false, error: error.message };
    }
  }

  async claimVested() {
    try {
      const user = this.wallet.publicKey;

      const [statePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("state")],
        this.program.programId
      );

      const [userStatePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), user.toBuffer()],
        this.program.programId
      );

      const [prizeAuthority] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("prize")],
        this.program.programId
      );

      const userToken = await this.getOrCreateTokenAccount(user);

      const accounts = {
        user,
        state: statePDA,
        userState: userStatePDA,
        userToken,
        prizeVault: this.tokenMint, // 需要替换为实际的prize vault
        prizeAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      };

      const tx = await this.program.methods
        .claimVested()
        .accounts(accounts)
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Claim vested failed:", error);
      return { success: false, error: error.message };
    }
  }

  // ===== 质押相关 (Staking) =====

  async stakeShortTerm(amount) {
    console.log("Staking short term:", amount);
    return { success: false, error: "Not implemented yet" };
  }

  async stakeLongTerm(amount) {
    console.log("Staking long term:", amount);
    return { success: false, error: "Not implemented yet" };
  }

  // ===== 空投相关 (Airdrop) =====

  async claimAirdrop() {
    if (!this.wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = await this.program.methods
        .claimAirdrop()
        .accounts({
          user: this.wallet.publicKey,
          userData: this.wallet.publicKey,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Error claiming airdrop:", error);
      throw error;
    }
  }

  // 开奖：如果参与人数<10则退款，>=10则正常开奖
  async drawHourly() {
    if (!this.wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = await this.program.methods
        .drawHourly()
        .accounts({
          authority: this.wallet.publicKey,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Error drawing hourly:", error);
      throw error;
    }
  }

  async drawDaily() {
    if (!this.wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = await this.program.methods
        .drawDaily()
        .accounts({
          authority: this.wallet.publicKey,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Error drawing daily:", error);
      throw error;
    }
  }

  // 领取小时池普惠奖
  async claimHourlyUniversal(userTokenAccount) {
    if (!this.wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      const userPDA = await this.getUserPDA(this.wallet.publicKey);
      const tx = await this.program.methods
        .claimHourlyUniversal()
        .accounts({
          authority: this.wallet.publicKey,
          user: userPDA,
          poolVault: this.poolVault,
          userToken: userTokenAccount,
          tokenProgram: this.tokenProgram,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Error claiming hourly universal:", error);
      throw error;
    }
  }

  // 领取每日池普惠奖
  async claimDailyUniversal(userTokenAccount) {
    if (!this.wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      const userPDA = await this.getUserPDA(this.wallet.publicKey);
      const tx = await this.program.methods
        .claimDailyUniversal()
        .accounts({
          authority: this.wallet.publicKey,
          user: userPDA,
          poolVault: this.dailyPoolVault,
          userToken: userTokenAccount,
          tokenProgram: this.tokenProgram,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Error claiming daily universal:", error);
      throw error;
    }
  }

  // ===== 监听事件 =====

  onDeposit(callback) {
    this.program.addEventListener("DepositEvent", (event) => {
      callback(event);
    });
  }

  onDraw(callback) {
    this.program.addEventListener("DrawEvent", (event) => {
      callback(event);
    });
  }

  onClaim(callback) {
    this.program.addEventListener("ClaimEvent", (event) => {
      callback(event);
    });
  }
}

export default TykhePotSDK;
export { CONFIG };
