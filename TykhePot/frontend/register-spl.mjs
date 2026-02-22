import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createInitializeMetadataPointerInstruction, createUpdateFieldInstruction, pack, getTokenMetadataStateData } from '@solana/spl-token-metadata';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';

// 读取钱包
const keypairData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/TykhePot/smart-contract/target/deploy/royalpot-keypair.json', 'utf8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const TOKEN_MINT = new PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6X8B48GqFTtTT');

async function main() {
  console.log('使用 spl-token-metadata 注册元数据...');
  console.log('钱包:', keypair.publicKey.toString());
  console.log('代币:', TOKEN_MINT.toString());

  // 创建元数据
  const metadata = {
    name: 'TykhePot',
    symbol: 'TPOT',
    uri: 'https://tykhepot.io/metadata.json',
    sellerFeeBasisPoints: 0,
    creators: null,
    isMutable: true,
  };

  // 打包元数据
  const metadataBytes = pack({ ...metadata, key: 1, updateAuthority: keypair.publicKey });

  // 创建事务
  const transaction = new Transaction();
  
  // 添加初始化元数据指针指令
  const initMetaPointer = createInitializeMetadataPointerInstruction(
    TOKEN_MINT,
    keypair.publicKey,
    // 这里需要元数据账户地址
    PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBytes(), TOKEN_MINT.toBytes()],
      METADATA_PROGRAM_ID
    )[0],
    TOKEN_2022_PROGRAM_ID
  );
  
  transaction.add(initMetaPointer);

  console.log('事务指令已创建');
  console.log('注意: 这个代币使用的是旧的 SPL Token 程序，不是 Token-2022');
  console.log('需要使用 Token-2022 程序才能使用元数据功能');
}

main();
