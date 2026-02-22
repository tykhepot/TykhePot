const { createUmi } = require('@metaplex-foundation/umi');
const { createV1 } = require('@metaplex-foundation/mpl-token-metadata');
const { keypairIdentity } = require('@metaplex-foundation/umi-signer-memory');
const { fromSecretKey } = require('@metaplex-foundation/umi-signer-keypair');
const { PublicKey } = require('@solana/web3.js');
const fs = require('fs');

// 读取钱包
const keypairData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/TykhePot/smart-contract/target/deploy/royalpot-keypair.json', 'utf8'));
const keypair = fromSecretKey(new Uint8Array(keypairData));

const mintAddress = new PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');

async function main() {
  console.log('🔧 使用 Umi 注册代币元数据...');
  
  const umi = createUmi('https://api.devnet.solana.com')
    .use(keypairIdentity(keypair));

  try {
    console.log('\n📝 创建代币元数据...');
    
    const tx = await createV1(umi, {
      mint: mintAddress,
      authority: keypair.publicKey,
      name: 'TykhePot',
      symbol: 'TPOT',
      uri: 'https://tykhepot.io/metadata.json',
      sellerFeeBasisPoints: 0,
      creators: null,
      isMutable: true,
    }).sendAndConfirm(umi);

    console.log('✅ 成功!');
    console.log('签名:', tx.signature);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

main();
