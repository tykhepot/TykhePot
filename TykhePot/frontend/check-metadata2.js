const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { createInitializeMetadataPointerInstruction, createInitializeMintInstruction, getMint, getMetadataPointerState } = require('@solana/spl-token-metadata');
const { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const { Transaction, TransactionInstruction, SystemProgram } = require('@solana/web3.js');

// 读取钱包
const keypairData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/TykhePot/smart-contract/target/deploy/royalpot-keypair.json', 'utf8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const TOKEN_MINT = new PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');

async function main() {
  console.log('🔍 检查代币元数据...');
  console.log('钱包:', keypair.publicKey.toString());
:', keypair.public  console.log('代币 Mint:', TOKEN_MINT.toString());

  try {
    // 检查是否支持 Token-2022
    const mintInfo = await getMint(connection, TOKEN_MINT, undefined, TOKEN_2022_PROGRAM_ID);
    console.log('✅ 使用 Token-2022 程序');
    
    // 尝试获取元数据指针
    const metadataPointer = await getMetadataPointerState(connection, TOKEN_MINT, TOKEN_2022_PROGRAM_ID);
    console.log('元数据指针:', metadataPointer);
    
    if (metadataPointer && metadataPointer.metadata) {
      console.log('✅ 元数据已存在!');
    } else {
      console.log('❌ 需要初始化元数据');
      
      // 创建初始化指令
      const metadataPDA = PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6X8B48GqFTtTT').toBytes(), TOKEN_MINT.toBytes()],
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6X8B48GqFTtTT')
      )[0];
      
      console.log('元数据 PDA:', metadataPDA.toString());
      
      // 注意: 需要先创建元数据账户，这需要使用 createMeta...指令
      console.log('\n需要使用更复杂的事务来初始化元数据');
      console.log('建议: 重新创建代币时使用 Token-2022 并启用 metadata');
    }
    
  } catch (e) {
    console.log('普通 SPL Token:', e.message);
  }
}

main();
