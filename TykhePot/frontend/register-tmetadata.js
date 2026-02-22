const { Metaplex, keypairIdentity } = require('@metaplex-foundation/js');
const { Connection, Keypair } = require('@solana/web3.js');
const fs = require('fs');

// 读取钱包密钥
const keypairData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/TykhePot/smart-contract/target/deploy/royalpot-keypair.json', 'utf8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const mintAddress = 'FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY';

async function main() {
  console.log('🔧 初始化 Metaplex...');
  console.log('钱包:', keypair.publicKey.toString());
  console.log('代币:', mintAddress);
  
  const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair));

  try {
    console.log('\n📝 正在注册代币元数据...');
    
    // 创建代币元数据 (作为 pNFT 或 sNFT)
    const { nft, response } = await metaplex.nfts().create({
      name: 'TykhePot',
      symbol: 'TPOT',
      uri: 'https://tykhepot.io/metadata.json',
      sellerFeeBasisPoints: 0,
      isMutable: true,
      mintAuthority: keypair.publicKey,
      updateAuthority: keypair.publicKey,
    }, { confirmOptions: { commitment: 'confirmed' } });

    console.log('✅ 成功!');
    console.log('NFT 地址:', nft.address.toString());
    console.log('交易签名:', response.signature);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    
    // 尝试更新现有
    if (error.message.includes('already')) {
      console.log('\n尝试查找现有元数据...');
      try {
        const nft = await metaplex.nfts().findByMint({ mintAddress });
        console.log('找到现有 NFT:', nft.name, nft.symbol);
      } catch (e) {
        console.log('未找到现有元数据');
      }
    }
  }
}

main();
