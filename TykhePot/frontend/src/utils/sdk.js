import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { getProgramId, getTokenMint } from "../config";

const PROGRAM_ID = new web3.PublicKey(getProgramId());
const TOKEN_MINT = new web3.PublicKey(getTokenMint());

export class TykhePotSDK {
  constructor(provider) {
    this.provider = provider;
    this.program = new Program(IDL, PROGRAM_ID, provider);
  }

  // 获取状态PDA
  async getStatePDA() {
    const [pda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      PROGRAM_ID
    );
    return pda;
  }

  // 获取用户状态PDA
  async getUserStatePDA(userPublicKey) {
    const [pda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), userPublicKey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  }

  // 获取用户TPOT余额
  async getTokenBalance(userPublicKey) {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        userPublicKey
      );
      const account = await this.provider.connection.getTokenAccountBalance(tokenAccount);
      return BigInt(account.value.amount);
    } catch (error) {
      return BigInt(0);
    }
  }

  // 获取协议状态
  async getProtocolState() {
    const statePDA = await this.getStatePDA();
    return await this.program.account.protocolState.fetch(statePDA);
  }

  // 获取用户状态
  async getUserState(userPublicKey) {
    try {
      const userStatePDA = await this.getUserStatePDA(userPublicKey);
      return await this.program.account.userState.fetch(userStatePDA);
    } catch (error) {
      return null;
    }
  }

  // 参与小时池
  async depositHourly(amount) {
    const user = this.provider.wallet.publicKey;
    const statePDA = await this.getStatePDA();
    const userStatePDA = await this.getUserStatePDA(user);
    
    const userToken = await getAssociatedTokenAddress(TOKEN_MINT, user);
    
    // 获取合约状态以找到资金账户
    const state = await this.getProtocolState();
    
    const tx = await this.program.methods
      .depositHourly(new BN(amount))
      .accounts({
        user,
        state: statePDA,
        userState: userStatePDA,
        userToken,
        burnAccount: state.burnAccount,
        platformToken: state.platformWallet,
        hourlyPrizeVault: state.hourlyPrizeVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  }

  // 参与天池
  async depositDaily(amount, referrer = null) {
    const user = this.provider.wallet.publicKey;
    const statePDA = await this.getStatePDA();
    const userStatePDA = await this.getUserStatePDA(user);
    
    const userToken = await getAssociatedTokenAddress(TOKEN_MINT, user);
    const state = await this.getProtocolState();
    
    const tx = await this.program.methods
      .depositDaily(new BN(amount), referrer)
      .accounts({
        user,
        state: statePDA,
        userState: userStatePDA,
        userToken,
        burnAccount: state.burnAccount,
        platformToken: state.platformWallet,
        dailyPrizeVault: state.dailyPrizeVault,
        reserveVault: state.reserveVault,
        reserveAuthority: state.reserveAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    return tx;
  }

  // 领取已解锁奖金
  async claimVested() {
    const user = this.provider.wallet.publicKey;
    const userStatePDA = await this.getUserStatePDA(user);
    const state = await this.getProtocolState();
    const userToken = await getAssociatedTokenAddress(TOKEN_MINT, user);
    
    const tx = await this.program.methods
      .claimVested()
      .accounts({
        user,
        userState: userStatePDA,
        userToken,
        prizeVault: state.prizeVault,
        prizeAuthority: state.prizeAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    return tx;
  }

  // 格式化金额 (从原始单位到显示单位)
  static formatAmount(amount) {
    return Number(amount) / 1e9;
  }

  // 解析金额 (从显示单位到原始单位)
  static parseAmount(amount) {
    return BigInt(Math.floor(amount * 1e9));
  }
}

// IDL 定义 (从 tykhepot.json 导入)
const IDL = {
  version: "0.1.0",
  name: "tykhepot",
  // ... (完整IDL内容，实际使用时从文件导入)
};

export default TykhePotSDK;
