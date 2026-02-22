import { createUmi } from '@metaplex-foundation/umi';
import { createV1 } from '@metaplex-foundation/mpl-token-metadata';
import { keypairIdentity } from '@metaplex-foundation/umi-signer-keypair';
import { fromSecretKey } from '@metaplex-foundation/umi-signer-keypair';
import { publicKey } from '@metaplex-foundation/umi';
import fs from 'fs';

// 读取钱包
const keypairData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/TykhePot/smart-contract/target/deploy/royalpot-keypair.json', 'utf8'));
const keypair = fromSecretKey(new Uint8Array(keypairData));

const mintAddress = publicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');

async function main() {
  console.log('🔧 初始化 Umi...');
  
  const umi = createUmi('https://api.devnet.solana.com').use(keypairIdentity(keypair));

  console.log('📝 注册代币元数据...');
  console.log('钱包:', keypair.publicKey);
  console.log('代币:', mintAddress);

  try {
    const tx = await createV1(umi, {
      mint: mintAddress,
      authority: keypair.publicKey,
      name: 'TykhePot',
      symbol: 'TPOT',
      uri: 'https://tykhepot.io/metadata.json',
      sellerFeeBasisPoints: 0,
      creators: [],
      isMutable: true,
    }).sendAndConfirm(umi);

    console.log('✅ 成功!');
    console.log('签名:', tx.signature.toString());
    
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

main();
