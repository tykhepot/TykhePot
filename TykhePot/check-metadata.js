const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { createInitializeMetadataPointerInstruction, createInitializeMintInstruction, getMint, getMetadataPointerState, getTokenMetadata, TokenMetadataVersion, TokenMetadataState } = require('@solana/spl-token-metadata');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

// 读取钱包
const walletData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/royalpot-deploy/royalpot-deployer.json', 'utf8'));
const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));

// 连接网络
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// 代币地址
const TOKEN_MINT = new PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6X8B48GqFTtTT');

async function main() {
  console.log('检查代币元数据...');
  console.log('钱包:', wallet.publicKey.toString());
  console.log('代币 Mint:', TOKEN_MINT.toString());

  try {
    // 获取代币信息
    const mintInfo = await getMint(connection, TOKEN_MINT);
    console.log('当前代币信息:', mintInfo);

    // 检查是否已有元数据
    const metadata = await getMetadataPointerState(connection, TOKEN_MINT);
    console.log('元数据指针状态:', metadata);

    if (metadata && metadata.metadata) {
      console.log('元数据已存在:', metadata.metadata.toString());
      
      // 获取详细元数据
      const tokenMetadata = await getTokenMetadata(connection, TOKEN_MINT);
      console.log('Token Metadata:', tokenMetadata);
    } else {
      console.log('❌ 需要先创建元数据');
      console.log('需要使用更高级的指令来添加元数据');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

main();
