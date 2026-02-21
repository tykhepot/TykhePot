import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

// 配置 - 部署后更新
const CONFIG = {
  DEVNET: {
    programId: "TykhePot111111111111111111111111111111111",
    tokenMint: "TPOT11111111111111111111111111111111111111",
    statePDA: "StatePDA1111111111111111111111111111111111",
    endpoint: "https://api.devnet.solana.com",
  },
  MAINNET: {
    programId: "", // 主网部署后填写
    tokenMint: "",
    statePDA: "",
    endpoint: "https://api.mainnet-beta.solana.com",
  },
};

// IDL - 从 target/idl/tykhepot.json 复制
const IDL = {
  version: "0.1.0",
  name: "tykhepot",
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
        { name: "userState", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false },
        { name: "prizeVault", isMut: true, isSigner: false },
        { name: "prizeAuthority", isMut: false, isSigner: false },
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
          { name: "hourlyPool", type: { defined: "PrizePool" } },
          { name: "dailyPool", type: { defined: "PrizePool" } },
          { name: "reserveBalance", type: "u64" },
          { name: "referralPoolBalance", type: "u64" },
          { name: "totalBurned", type: "u64" },
          { name: "lastHourlyDraw", type: "i64" },
          { name: "lastDailyDraw", type: "i64" },
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
      const statePDA = new web3.PublicKey(this.config.statePDA);
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

      const tx = await this.program.methods
        .depositHourly(amountBN)
        .accounts({
          user,
          state: statePDA,
          userState: userStatePDA,
          userToken,
          // 其他账户从状态中派生
        })
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

      const userToken = await this.getOrCreateTokenAccount(user);

      const referrerKey = referrer ? new web3.PublicKey(referrer) : null;

      const tx = await this.program.methods
        .depositDaily(amountBN, referrerKey)
        .accounts({
          user,
          state: statePDA,
          userState: userStatePDA,
          userToken,
        })
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

      const [userStatePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), user.toBuffer()],
        this.program.programId
      );

      const userToken = await this.getOrCreateTokenAccount(user);

      const tx = await this.program.methods
        .claimVested()
        .accounts({
          user,
          userState: userStatePDA,
          userToken,
        })
        .rpc();

      return { success: true, tx };
    } catch (error) {
      console.error("Claim vested failed:", error);
      return { success: false, error: error.message };
    }
  }

  // ===== 质押相关 (Staking) =====

  async stakeShortTerm(amount) {
    // 调用 staking 模块
    console.log("Staking short term:", amount);
    // TODO: 实现质押调用
    return { success: false, error: "Not implemented yet" };
  }

  async stakeLongTerm(amount) {
    console.log("Staking long term:", amount);
    return { success: false, error: "Not implemented yet" };
  }

  // ===== 空投相关 (Airdrop) =====

  async claimAirdrop() {
    console.log("Claiming airdrop");
    return { success: false, error: "Not implemented yet" };
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
