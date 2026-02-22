const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transferInstruction, getAccount, getMint } = require('@solana/spl-token');
const fs = require('fs');

// 读取钱包
const keypairData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/TykhePot/smart-contract/target/deploy/royalpot-keypair.json', 'utf8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const TOKEN_MINT = new PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');

async function main() {
  console.log('检查代币...');
  
  try {
    // 获取代币信息
    const mintInfo = await getMint(connection, TOKEN_MINT);
    console.log('✅ 代币 Mint 信息:');
    console.log('  - Decimals:', mintInfo.decimals);
    console.log('  - Supply:', mintInfo.supply.toString());
    console.log('  - Authority:', mintInfo.mintAuthority?.toString());
    console.log('  - Freeze Authority:', mintInfo.freezeAuthority?.toString());
    
    // 检查代币账户
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      TOKEN_MINT,
      keypair.publicKey
    );
    console.log('✅ 代币账户:', tokenAccount.address.toString());
    console.log('  - Balance:', tokenAccount.amount.toString());
    
    console.log('\n💡 注意: 要在钱包中显示代币名称，需要注册 Token Metadata');
    console.log('   这是 Solana Token-2022 的新功能');
    console.log('\n替代方案: 用户可以在钱包中手动添加代币');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

main();
