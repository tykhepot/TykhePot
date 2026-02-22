const { Metaplex, keypairIdentity, bundlrStorage } = require('@metaplex-foundation/js');
const { Connection, Keypair } = require('@solana/web3.js');
const fs = require('fs');

// 读取钱包
const walletData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/royalpot-deploy/royalpot-deployer.json', 'utf8'));
const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));

// 连接网络
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// 代币地址
const TOKEN_MINT = 'FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY';

async function main() {
  console.log('开始注册代币元数据...');
  console.log('钱包:', wallet.publicKey.toString());
  console.log('代币 Mint:', TOKEN_MINT);

  // 初始化 Metaplex
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage());

  try {
    // 创建代币元数据
    const { response } = await metaplex.nfts().createNft({
      name: 'TykhePot',
      symbol: 'TPOT',
      uri: 'https://tykhepot.io/metadata.json',
      sellerFeeBasisPoints: 0,
      isMutable: true,
      mint: TOKEN_MINT,
      updateAuthority: wallet.publicKey,
    });

    console.log('✅ 代币元数据注册成功!');
    console.log('交易签名:', response.signature);
  } catch (error) {
    console.error('❌ 注册失败:', error.message);
    
    // 如果代币已存在，尝试更新
    if (error.message.includes('already in use')) {
      console.log('尝试更新现有元数据...');
      try {
        const nft = await metaplex.nfts().findByMint({ mintAddress: TOKEN_MINT });
        
        const { response } = await metaplex.nfts().update({
          nftOrSft: nft,
          name: 'TykhePot',
          symbol: 'TPOT',
          uri: 'https://tykhepot.io/metadata.json',
        });
        
        console.log('✅ 元数据更新成功!');
        console.log('交易签名:', response.signature);
      } catch (updateError) {
        console.error('❌ 更新失败:', updateError.message);
      }
    }
  }
}

main();
