const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { createInitializeMetadataPointerInstruction, getMetadataPointerState, getTokenMetadata, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const { createInitializeInstruction, createUpdateFieldInstruction, createRemoveKeyInstruction, pack, getTokenMetadataStateData } = require('@solana/spl-token-metadata');
const fs = require('fs');

// 读取钱包
const walletData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/TykhePot/smart-contract/target/deploy/royalpot-keypair.json', 'utf8'));
const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const TOKEN_MINT = new PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6X8B48GqFTtTT');

async function main() {
  console.log('🔍 检查代币元数据...');

  try {
    // 检查是否已有元数据指针
    const metadataPointer = await getMetadataPointerState(connection, TOKEN_MINT);
    console.log('元数据指针:', metadataPointer);

    if (metadataPointer && metadataPointer.metadata) {
      console.log('✅ 元数据已存在!');
      const tokenMeta = await getTokenMetadata(connection, TOKEN_MINT);
      console.log('名称:', tokenMeta.name);
      console.log('符号:', tokenMeta.symbol);
    } else {
      console.log('❌ 代币尚未注册元数据');
      console.log('');
      console.log('要注册元数据，需要:');
      console.log('1. 安装 Metaplex CLI');
      console.log('2. 运行: metaplex-token-metadata register -m ' + TOKEN_MINT.toString());
      console.log('');
      console.log('或者使用: solana-action register-token ' + TOKEN_MINT.toString());
    }
  } catch (error) {
    console.error('错误:', error.message);
  }
}

main();
