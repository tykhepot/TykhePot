# 🎮 Solana Playground 部署和测试指南

## 📋 步骤1: 访问 Solana Playground

请打开浏览器访问：
**https://play.solana.com**

## 📝 步骤2: 粘贴修复后的合约代码

### 文件位置
```
/home/guo5feng5/TykhePot/TykhePot/smart-contract/programs/royalpot/src/lib.rs
```

### 粘贴内容

1. 在Solana Playground中点击左侧的"+"号创建新文件
2. 命名文件为: `lib.rs`
3. 将 `smart-contract/programs/royalpot/src/lib.rs` 的完整内容复制粘贴进去

### 关键修改部分

以下是修复的核心代码，请确保这些部分存在：

#### 导入语句（文件开头）
```rust
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer, SetAuthority};
```

#### Initialize结构修改
```rust
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = GLOBAL_STATE_SIZE,
        seeds = [b"global_state"],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    pub token_mint: Account<'info, Mint>,

    /// The token account that funds free bets. Authority will be set to global_state PDA.
    #[account(mut)]
    pub airdrop_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}
```

#### initialize函数修改（找到initialize函数，替换为以下版本）
```rust
pub fn initialize(
    ctx: Context<Initialize>,
    platform_fee_vault: Pubkey,
    referral_vault: Pubkey,
    reserve_vault: Pubkey,
    prize_escrow_vault: Pubkey,
    timelock_duration: Option<i64>,
) -> Result<()> {
    let state = &mut ctx.accounts.global_state;
    let global_state_pda = ctx.accounts.global_state.key();
    state.token_mint = ctx.accounts.token_mint.key();
    state.platform_fee_vault = platform_fee_vault;
    state.airdrop_vault = ctx.accounts.airdrop_vault.key();
    state.referral_vault = referral_vault;
    state.reserve_vault = reserve_vault;
    state.prize_escrow_vault = prize_escrow_vault;
    state.authority = ctx.accounts.payer.key();
    state.is_paused = false;
    state.timelock_duration = timelock_duration.unwrap_or(DEFAULT_TIMELOCK_DURATION);
    state.pending_operation = TIMELOCK_OP_NONE;
    state.timelock_release = 0;
    state.bump = ctx.bumps.global_state;
    state._padding = [0u8; 5];

    // Set AIRDROP_VAULT authority to global_state PDA
    // This allows the program to transfer tokens from the vault
    msg!("Setting AIRDROP_VAULT authority to global_state PDA");
    token::set_authority(
        CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SetAuthority {
                    account: ctx.accounts.airdrop_vault.to_account_info(),
                    current_authority: ctx.accounts.payer.to_account_info(),
                    new_authority: global_state_pda,
                },
            ),
        )?;

    Ok(())
}
```

**重要**: 请替换完整的`initialize`函数，确保所有现有代码都在，然后添加set_authority调用。

## 🚀 步骤3: 编译和部署

### 配置

在Solana Playground左侧设置：
- **Connection**: Devnet
- **Confirm**: Finalized

### Build

1. 点击工具栏的"Build"按钮
2. 等待编译完成
3. 检查是否有编译错误

**如果没有错误**：
- 会显示"Build successful"
- 状态栏显示绿色✓

**如果有错误**：
- 检查错误信息
- 确保所有修改都正确粘贴
- 特别是SetAuthority导入和initialize函数

### Deploy

1. 点击工具栏的"Deploy"按钮
2. 会显示程序ID: `9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ`
3. 记录这个新程序ID（稍后可能需要更新配置）

## 🧪 步骤4: 初始化合约

### 创建测试文件

在Solana Playground右侧的"Test"区域：
1. 删除默认的测试代码
2. 点击"File" → "New"创建新测试文件
3. 命名文件为: `initialize_test.ts`

### 粘贴初始化测试代码

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";

const PROGRAM_ID = new web3.PublicKey("9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ");
const TOKEN_MINT = new web3.PublicKey("FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY");

// AIRDROP_VAULT 地址
const AIRDROP_VAULT = new web3.PublicKey("Gagc5bk5pNh1sk79gs13W4RSK2wwZusdSFT9ZBMAwYUo");

// 其他vault地址（需要根据实际devnet部署调整）
const PLATFORM_FEE_VAULT = new web3.PublicKey("2Gq8ZCP1jg3FXKaMJeEQCBJuyv1VznW5ZvYdVJvKiJQe");
const REFERRAL_VAULT = new web3.PublicKey("85HhmvBsE6VNGYWMWdC9WCK47mPLCVrsHGu1PxokY9xS");
const RESERVE_VAULT = new web3.PublicKey("78zVf9GNc2DZU87jS6R5qYS4A5cdZrzR15t1LqZmboRL");
const PRIZE_ESCROW_VAULT = new web3.PublicKey("G7NNS4QdM1Zau543TwdtBHwWa9UG4U1zVzAf3eS55SCK");

const IDL = {
  version: "0.2.0",
  name: "royalpot",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "authority", isMut: true,  isSigner: true },
        { name: "state", isMut: true,  isSigner: false },
        { name: "tokenMint", isMut: false, isSigner: false },
        { name: "airdropVault", isMut: true,  isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "platformFeeVault", type: "publicKey" },
        { name: "referralVault", type: "publicKey" },
        { name: "reserveVault", type: "publicKey" },
        { name: "prizeEscrowVault", type: "publicKey" },
        { name: "timelockDuration", type: { option: "i64" } },
      ],
    },
  ],
  types: [],
};

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  console.log("🔧 Testing initialize with AIRDROP_VAULT authority fix...");

  const program = new Program(IDL as any, PROGRAM_ID, provider);

  // Get PDA
  const [statePDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global_state")],
    PROGRAM_ID
  );

  console.log("State PDA:", statePDA.toString());
  console.log("AIRDROP_VAULT:", AIRDROP_VAULT.toString());

  try {
    // Call initialize with set_authority call
    const tx = await program.methods.initialize({
      platformFeeVault: PLATFORM_FEE_VAULT,
      referralVault: REFERRAL_VAULT,
      reserveVault: RESERVE_VAULT,
      prizeEscrowVault: PRIZE_ESCROW_VAULT,
      timelockDuration: new BN(86400), // 24 hours default
    }).accounts({
      authority: provider.wallet.publicKey,
      state: statePDA,
      tokenMint: TOKEN_MINT,
      airdropVault: AIRDROP_VAULT,
      systemProgram: web3.SystemProgram.programId,
    });

    const sig = await tx.rpc();
    console.log("✅ Initialize successful! Signature:", sig);

    // Verify AIRDROP_VAULT owner after initialization
    const accountInfo = await provider.connection.getAccountInfo(AIRDROP_VAULT);
    if (accountInfo) {
      console.log("AIRDROP_VAULT owner:", accountInfo.owner.toString());
      const expected = "9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ";
      if (accountInfo.owner.toString() === expected) {
        console.log("✅ AIRDROP_VAULT authority is CORRECT!");
        console.log("Fix verified successfully!");
      } else {
        console.log("❌ AIRDROP_VAULT authority is still WRONG!");
        console.log("Expected:", expected);
        console.log("Got:", accountInfo.owner.toString());
      }
    }

  } catch (error) {
    console.error("❌ Initialize failed:", error);
  }
}

main();
```

**注意**: 上述测试代码中使用的vault地址可能需要根据实际部署情况调整。

### 运行测试

1. 点击右侧工具栏的"Run"按钮
2. 选择 `initialize_test.ts`
3. 查看控制台输出

### 验证结果

**成功标志**:
- 看到 `Initialize successful! Signature: <hash>`
- 看到 `✅ AIRDROP_VAULT authority is CORRECT!`
- 看到 `Fix verified successfully!`

**如果失败**:
- 检查错误信息
- 确保set_authority调用已正确添加
- 确保所有导入都正确

## 📊 步骤5: 记录部署信息

部署成功后，记录以下信息：

### 必需信息（请记录）
```
✅ 新程序ID（从Deploy输出）:
   [ ] Program ID: _________________

✅ AIRDROP_VAULT owner验证:
   [ ] Owner is TykhePot program (9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ)
   [ ] Fix verified successfully
```

### 可选信息（如果适用）
```
⏰ Solana Playground URL:
   https://play.solana.com

🔧 Initialize测试结果:
   [ ] Initialize successful
   [ ] AIRDROP_VAULT authority verified
   [ ] 错误（如果有）
```

## 🎯 步骤6: 更新前端配置（如需要）

如果新部署的程序ID与原ID不同，需要：

1. 打开 `frontend/src/config/contract.js`
2. 更新PROGRAM_ID为新的地址
3. 保存文件

## 📱 步骤7: 前端功能测试

部署成功后，在浏览器中测试：

### 测试Airdrop页面

1. 访问前端应用（确保使用devnet环境）
2. 连接Phantom钱包
3. 导航到Airdrop页面
4. 点击"Claim Free Airdrop"
5. 查看控制台日志

**预期日志**:
```javascript
[SDK] Starting claimFreeAirdrop...
[SDK] Transaction successful: <signature>
[SDK] claimFreeAirdrop completed
```

### 测试Use Free Bet

1. 在Airdrop页面点击"Use in Daily Pool"
2. 钱包签名确认
3. 检查控制台日志

**预期日志**:
```javascript
[SDK] useFreeBet: Starting...
[SDK] useFreeBet: Transaction built, sending...
[SDK] useFreeBet: Transaction successful: <signature>
```

**成功标志**:
- 看到"Transaction successful"
- 没有错误信息
- 交易在Solscan上可以查到

## 🔍 验证AIRDROP_VAULT Owner

部署完成后，可以验证AIRDROP_VAULT的owner是否正确：

```bash
curl -s -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAccountInfo",
    "params": [
      "Gagc5bk5pNh1sk79gs13W4RSK2wwZusdSFT9ZBMAwYUo",
      {"encoding": "base64"}
    ]
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('result', {}).get('value'):
    account = data['result']['value']
    owner = account['owner']
    print('Owner:', owner)
    expected = '9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ'
    if owner == expected:
        print('✅ SUCCESS: AIRDROP_VAULT authority is CORRECT')
    else:
        print('❌ FAILED: AIRDROP_VAULT authority is WRONG')
        print('  Expected:', expected)
        print('  Got:', owner)
"
```

## ✅ 预期结果

成功部署并初始化后，AIRDROP_VAULT的owner应该变为：
```
9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ
```

此时：
- ✅ useFreeBet交易应该成功
- ✅ 免费投注功能完全正常工作
- ✅ 用户可以领取100 TPOT空投
- ✅ 用户可以使用免费投注参与Daily Pool

## 🚨 故障排除

### 问题1: Playground编译错误

**错误**: `error[E0433]: failed to resolve: could not find \`SetAuthority\``

**原因**: `anchor_spl::token` 中的 `SetAuthority` 可能没有导出或名称不匹配

**解决方案**:
- 尝试只导入 `SetAuthority`，不使用完整路径
- 或使用 `use anchor_spl::token::*` 语法

### 问题2: Initialize测试失败

**错误**: `Error: failed to send transaction`

**原因**:
- AIRDROP_VAULT账户不存在
- 或vault地址不正确

**解决方案**:
- 确保使用了正确的AIRDROP_VAULT地址
- 先在devnet上创建或部署合约，再初始化

### 问题3: 前端仍显示旧错误

**原因**: 浏览器缓存

**解决方案**:
- 硬刷新 (Ctrl+Shift+R)
- 清除浏览器缓存
- 确认连接到devnet

## 📚 相关文件

- **合约源码**: `smart-contract/programs/royalpot/src/lib.rs`
- **部署指南**: `AIRDROP_FIX_DEPLOYMENT_GUIDE.md`
- **技术总结**: `AIRDROP_VAULT_FIX_SUMMARY.md`
- **Playground指南**: `SOLANA_PLAYGROUND_GUIDE.md` (本文档)

## 📞 快速检查清单

在开始前确认：
- [ ] 已访问 https://play.solana.com
- [ ] 已连接到Devnet
- [ ] 已准备好修复后的lib.rs代码
- [ ] 已准备好initialize测试代码
- [ ] 了解测试步骤

---

**提示**: 请将部署和测试过程中遇到的任何问题或成功结果告诉我，我会帮您进一步解决。
