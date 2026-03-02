# 🔧 AIRDROP_VAULT 修复和部署指南

## 📋 问题总结

### 错误信息
```
Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
Program log: Instruction: Transfer
Program log: Error: owner does not match
```

### 根本原因
- **AIRDROP_VAULT地址**: `Gagc5bk5pNh1sk79gs13W4RSK2wwZusdSFT9ZBMAwYUo`
- **当前owner**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` (Token Program)
- **期望owner**: `9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ` (TykhePot程序)

AIRDROP_VAULT是一个Token账户，它的owner字段存储了**谁被授权从这个账户转账**。

当`use_free_bet`指令尝试从AIRDROP_VAULT转账时：
- Token程序检查： signer (global_state PDA) 是否等于 owner (Token Program)
- 不匹配，因此拒绝转账

## ✅ 已完成的修复

### 1. 修改智能合约 (Commit: ec598be)

**文件**: `smart-contract/programs/royalpot/src/lib.rs`

**修改内容**:

```rust
// 添加SetAuthority到导入
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer, SetAuthority};

// Initialize结构：使airdrop_vault可变
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

// initialize函数：添加authority设置
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

### 2. 前端修复 (Commit: 869cced)

**文件**: `frontend/src/utils/tykhepot-sdk.js`

**修改**: useFreeBet方法改用`.rpc()`方法

### 3. DailyPool.js恢复 (Commit: 869cced)

**文件**: `frontend/src/pages/DailyPool.js`

## 🚀 部署步骤

### 方案A: 使用Solana Playground (推荐用于测试)

1. 访问 https://play.solana.com
2. 粘贴 `smart-contract/programs/royalpot/src/lib.rs` 的内容
3. 修复编译错误（如果有）
4. Build → 部署到devnet
5. 记录新的程序ID

### 方案B: 本地部署（需要修复编译工具链）

#### 步骤1: 修复Solana工具链

```bash
# 安装Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# 安装Rust工具链（如果已有，跳过）
rustup component add solana

# 验证安装
solana --version  # 应显示 1.17.0 或更新版本
```

#### 步骤2: 编译合约

```bash
cd ~/TykhePot/TykhePot/smart-contract

# 方式1: 尝试Anchor build
anchor build

# 方式2: 如果失败，尝试直接cargo编译
cargo build-sbf --program-name royalpot

# 验证编译输出
ls -la target/solana/release/*.so
# 应该看到 royalpot.so
```

#### 步骤3: 部署合约

```bash
# 查看当前部署的合约
solana program show --programs

# 部署新版本
solana program deploy target/solana/release/royalpot.so \
  --program-id 9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ \
  --url https://api.devnet.solana.com

# 验证部署
solana program show 9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ
```

#### 步骤4: 初始化合约

```bash
# 初始化全局状态（包括设置AIRDROP_VAULT authority）
cd ~/TykhePot/TykhePot/smart-contract
anchor deploy --provider.cluster devnet

# 或者使用init脚本
npm run initialize:devnet
```

#### 步骤5: 为AIRDROP_VAULT充值TPOT

需要向AIRDROP_VAULT转账TPOT代币：

```bash
# 使用Solana CLI转账TPOT到AIRDROP_VAULT
# 注意：初始化后，vault的authority已经是global_state PDA，所以需要用正确的权限转账

# 或者使用前端测试界面来转账
```

## 🧪 测试步骤

### 1. 验证AIRDROP_VAULT owner

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
import sys, json, base64
data = json.load(sys.stdin)
if data.get('result', {}).get('value'):
    owner = data['result']['value']['owner']
    print('AIRDROP_VAULT owner:', owner)
    expected = '9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ'
    if owner == expected:
        print('✅ CORRECT: owner is global_state PDA')
    else:
        print('❌ WRONG: owner should be global_state PDA')
else:
    print('Account not found')
"
```

**期望结果**:
```
AIRDROP_VAULT owner: 9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ
✅ CORRECT: owner is global_state PDA
```

### 2. 测试领取空投

1. 访问前端应用（devnet）
2. 连接Phantom钱包
3. 导航到Airdrop页面
4. 点击"Claim Free Airdrop"
5. 钱包签名确认
6. 检查控制台日志：

```javascript
// 应该看到：
[SDK] useFreeBet: Starting...
[SDK] User: <wallet-address>
[SDK] Pool type: 2
[SDK] Pool vault: GNXJ7eEtBHvh6K4Ppi3SX6skKTu7NuWCgXr99DyUeu4G
[SDK] Airdrop vault: Gagc5bk5pNh1sk79gs13W4RSK2wwZusdSFT9ZBMAwYUo
[SDK] useFreeBet: Transaction built, sending...
[SDK] useFreeBet: Transaction successful: <signature>
```

**成功标志**: 看到"Transaction successful"而不是错误

### 3. 测试使用免费投注

1. 在Airdrop页面点击"Use in Daily Pool"
2. 钱包签名确认
3. 检查是否成功完成投注

## 📝 前端配置更新

部署成功后，前端配置可能需要更新：

### 1. 检查contract.js配置

文件：`frontend/src/config/contract.js`

确认以下地址正确：
```javascript
export const PROGRAM_ID = "9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ";
export const TOKEN_MINT = "FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY";
// AIRDROP_VAULT地址应该在初始化后保持不变
// 如果合约升级改变了程序ID，需要更新
```

### 2. 部署前端到Vercel

```bash
cd ~/TykhePot/TykhePot/frontend

# 确保使用正确的配置
# 如果部署到devnet，配置应该是devnet
# 如果部署到mainnet，配置应该是mainnet

npm run build

# 手动部署到Vercel（如果自动部署失败）
vercel --prod
```

## 🔍 故障排除

### 问题: 编译失败 - "build-bpf" command not found

**解决方案**:
```bash
# 安装Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# 然后重新尝试
anchor build
```

### 问题: 权限不足

**错误**:
```
Error: Attempt to debit an account but found no instructions for it
```

**解决方案**: 确保钱包有足够的SOL（至少0.01 SOL）

### 问题: 仍然出现"owner does not match"

**可能原因**:
1. 旧程序部署仍在运行
2. initialize指令没有被正确执行

**解决方案**:
1. 检查Solscan上的程序日志
2. 确认initialize指令已成功执行
3. 如果需要，重新初始化

## 📊 相关文件

- `smart-contract/programs/royalpot/src/lib.rs` - 合约源代码
- `frontend/src/utils/tykhepot-sdk.js` - SDK实现
- `frontend/src/pages/DailyPool.js` - Daily Pool页面
- `frontend/src/pages/Airdrop.js` - Airdrop页面
- `fix-and-deploy-airdrop.sh` - 验证脚本
- `AIRDROP_FIX_DEPLOYMENT_GUIDE.md` - 本文档

## ✅ 验证清单

部署后，按以下顺序验证：

- [ ] AIRDROP_VAULT owner是程序ID（不是Token程序）
- [ ] 初始化指令成功执行
- [ ] 前端能连接到新的程序ID
- [ ] 能成功领取空投
- [ ] 能成功使用免费投注到Daily Pool
- [ ] useFreeBet交易在Solscan上成功确认

## 🚨 重要提示

1. **合约修改需要重新部署**
   - 当前在devnet上的程序(9U7hbTQEoM4vY2Uwd6RKKCz3TMvocAtEFjpHRbMxSHAQ)需要用新版本替换

2. **初始化会设置vault authority**
   - 必须确保initialize指令被调用
   - 确认set_authority成功执行

3. **前端代码已更新**
   - commit 869cced包含了前端修复
   - Vercel应该会自动部署

4. **测试环境**
   - 使用devnet进行测试
   - 确认一切正常后再部署到mainnet

---

**创建日期**: 2026-03-03
**问题修复**: AIRDROP_VAULT owner配置
**预期结果**: 免费投注功能正常工作
