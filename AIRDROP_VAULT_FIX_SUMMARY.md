# 🔧 AIRDROP_VAULT 权限问题 - 完整解决方案

## 📊 问题诊断

### 错误日志
```
[SDK] useFreeBet: Transaction built, sending...
Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
Program log: Instruction: Transfer
Program log: Error: owner does not match
```

### 根本原因分析

**Token账户的owner机制**:
- 每个Token账户都有一个`owner`字段，存储谁被授权从这个账户转账
- 只有owner（或其授权）才能从这个账户转账

**当前状态**:
```
AIRDROP_VAULT: Gagc5bk5pNh1sk79gs13W4RSK2wwZusdSFT9ZBMAwYUo
├─ 当前owner: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA (Token Program)
└─ 期望owner: 9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ (TykhePot Program)

useFreeBet流程:
1. 程序构建交易: airdrop_vault → pool_vault, 转账100 TPOT
2. 调用token::transfer，authority = global_state PDA
3. Token程序检查: global_state PDA === airdrop_vault.owner?
4. 检查失败: Token程序拒绝转账
5. 错误码: 0x4 (owner does not match)
```

## ✅ 完成的修改

### 1. 智能合约修改

**文件**: `smart-contract/programs/royalpot/src/lib.rs`

**修改1: 添加SetAuthority导入**
```rust
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer, SetAuthority};
```

**修改2: Initialize结构使airdrop_vault可变**
```rust
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    // ... 其他字段 ...

    /// The token account that funds free bets. Authority will be set to global_state PDA.
    #[account(mut)]
    pub airdrop_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}
```

**修改3: initialize函数中添加authority设置**
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

    // ... 现有初始化代码 ...

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

### 2. 前端SDK改进

**文件**: `frontend/src/utils/tykhepot-sdk.js`

**修改**: useFreeBet方法改用`.rpc()`方法

```javascript
async useFreeBet() {
  // ... 现有代码 ...

  try {
    // Use Anchor's built-in .rpc() method which handles all transaction construction
    // and wallet communication internally. This is more compatible with Phantom wallet.
    const tx = this.program.methods
      .useFreeBet(poolType)
      .accounts({
        user,
        globalState,
        poolState:    poolStatePda,
        airdropClaim,
        freeDeposit,
        airdropVault: new PublicKey(AIRDROP_VAULT),
        poolVault:    poolVaultPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      });

    console.log('[SDK] useFreeBet: Transaction built, sending...');
    const sig = await tx.rpc();
    console.log('[SDK] useFreeBet: Transaction successful:', sig);

    return { success: true, tx: sig };
  } catch (err) {
    // ... 错误处理 ...
  }
}
```

### 3. DailyPool.js恢复

**文件**: `frontend/src/pages/DailyPool.js`

该文件之前为空，已从commit 55bcdef恢复。

## 🚀 部署步骤

### 前提条件

1. **修复Solana工具链** (由于当前环境缺少正确的BPF编译工具):
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
   ```

2. **验证工具安装**:
   ```bash
   solana --version  # 应显示 1.17.0 或更新版本
   ```

### 方案A: 使用Solana Playground (最快测试)

1. 访问 https://play.solana.com
2. 将 `smart-contract/programs/royalpot/src/lib.rs` 的完整内容粘贴进去
3. 修复编译错误（如果有）
4. Build → 部署到devnet
5. 测试功能
6. 如果成功，记录新程序ID并更新配置

### 方案B: 本地完整部署

#### 步骤1: 编译合约

```bash
cd ~/TykhePot/TykhePot/smart-contract

# 尝试编译（修复SetAuthority后）
anchor build

# 验证编译输出
ls -la target/deploy/ 2>/dev/null

# 应该看到类似输出：
# target/deploy/royalpot.so
```

如果`anchor build`失败，尝试：
```bash
# 尝试使用solana CLI编译
solana program build programs/royalpot/src/

# 或者使用cargo直接编译BPF
cargo build-sbf --manifest-path programs/royalpot/Cargo.toml
```

#### 步骤2: 部署合约

```bash
# 部署到devnet
anchor deploy --provider.cluster devnet

# 记录新的程序ID（输出中会显示）
# 程序ID格式: base58 编码的公钥
```

#### 步骤3: 初始化合约

```bash
# 初始化GlobalState（包括设置AIRDROP_VAULT authority）
cd ~/TykhePot/TykhePot/smart-contract

# 方法1: 使用TypeScript脚本
npm run initialize:devnet

# 方法2: 或手动调用
# 需要先为AIRDROP_VAULT充值TPOT，然后运行init脚本
```

#### 步骤4: 验证AIRDROP_VAULT owner

部署并初始化后，验证AIRDROP_VAULT的owner：

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

**期望结果**:
```
Owner: 9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ
✅ SUCCESS: AIRDROP_VAULT authority is CORRECT
```

#### 步骤5: 更新前端配置

如果合约地址改变，需要更新 `frontend/src/config/contract.js`:

```javascript
export const PROGRAM_ID = "<new-program-id>";
```

#### 步骤6: 测试前端

1. 访问前端应用 (devnet)
2. 连接Phantom钱包
3. 导航到Airdrop页面
4. 点击"Claim Free Airdrop"
5. 钱包签名并确认
6. 检查控制台日志

**成功标志**:
- 看到 `Transaction successful` 日志
- 没有错误信息
- 获取100 TPOT免费投注额度

#### 步骤7: 测试使用免费投注

1. 在Airdrop页面点击"Use in Daily Pool"
2. 钱包签名并确认
3. 导航到Daily Pool页面验证投注成功

**成功标志**:
- 交易在Solscan上确认
- DailyPool显示投注成功
- 免费投注显示为"已使用"状态

## 📝 技术说明

### Token账户Owner vs Authority

**重要概念**:
- `owner`: Token账户的owner字段，存储谁拥有这个账户
- `authority`: 谁被授权从这个账户转账（对于multi-sig可能是多个）

**对于AIRDROP_VAULT**:
- `owner`应该设置为：`9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ` (TykhePot程序)
- `authority`: 应该是`global_state` PDA（程序派生地址）
- 程序（通过global_state签名）可以转账，因为它被授权

**SetAuthority指令**:
- 修改Token账户的owner字段
- 调用后，只有新owner（或其授权）可以操作账户
- current_authority: 需要是当前的owner或其授权者

## 🔍 故障排除

### 问题1: 编译失败 - "build-bpf" command not found

**原因**: Solana CLI 0.29+使用不同的构建命令

**解决方案**:
```bash
# 安装正确版本的Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# 然后使用新的构建命令
anchor build
```

### 问题2: AIRDROP_VAULT authority仍然错误

**可能原因**:
1. 旧版本的initialize指令仍在运行
2. initialize没有正确执行（没有调用set_authority）

**解决方案**:
1. 检查Solscan确认initialize交易
2. 如果失败，需要重新初始化
3. 或者创建新的初始化脚本

### 问题3: 前端仍显示旧错误

**解决方案**:
1. 清除浏览器缓存
2. 硬刷新页面 (Ctrl+F5)
3. 检查网络请求，确认新的程序代码已加载

## 📊 相关文档

- **详细部署指南**: `AIRDROP_FIX_DEPLOYMENT_GUIDE.md`
- **验证脚本**: `fix-and-deploy-airdrop.sh`
- **诊断脚本**: `scripts/fix-airdrop-vault.js`

## ✅ 完成检查清单

部署成功后按以下顺序验证：

合约修复:
- [ ] lib.rs中添加了SetAuthority导入
- [ ] Initialize.airdrop_vault改为mut账户
- [ ] initialize中添加了set_authority调用
- [ ] 代码编译无错误

部署:
- [ ] 合约部署成功（新程序ID）
- [ ] initialize指令成功执行
- [ ] AIRDROP_VAULT owner验证为程序ID

前端:
- [ ] useFreeBet使用.rpc()方法
- [ ] DailyPool.js已恢复
- [ ] 前端能连接到新程序

功能测试:
- [ ] 成功领取空投（100 TPOT）
- [ ] 成功使用免费投注到Daily Pool
- [ ] 交易在Solscan上确认成功

## 🚨 重要提醒

1. **合约修改必须重新部署**
   - 当前devnet合约(9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ)需要替换

2. **初始化会设置vault authority**
   - initialize指令必须成功执行
   - set_authority调用必须成功
   - 才能修复"owner does not match"错误

3. **测试环境**
   - 使用devnet进行测试
   - 确认一切正常后再部署到mainnet

4. **前端代码已更新并推送**
   - commit 869cced包含了所有前端修改
   - Vercel会自动部署前端更新

---

**创建日期**: 2026-03-03
**状态**: 合约修改完成，等待部署测试
**Git Commits**:
- ec598be: 合约SetAuthority修复
- 5a25861: 部署指南文档
