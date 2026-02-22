import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createInitializeMintInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createInitializeMetadataPointerInstruction, createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import fs from 'fs';

const keypairData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/TykhePot/smart-contract/target/deploy/royalpot-keypair.json', 'utf8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6SPVmaKER8z4JgAUKT2bRuu');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6X8B48GqFTtTT');

// 新代币的密钥对
const newMintKeypair = Keypair.generate();
const newMint = newMintKeypair.publicKey;

async function main() {
  console.log('创建新代币 (Token-2022 + 元数据)...');
  console.log('钱包:', keypair.publicKey.toString());
  console.log('新代币 Mint:', newMint.toString());
  
  const mintAuthority = keypair.publicKey;
  const freezeAuthority = keypair.publicKey;
  const decimals = 9;
  
  // 元数据
  const metadata = {
    name: 'TykhePot',
    symbol: 'TPOT',
    uri: 'https://tykhepot.io/metadata.json',
    sellerFeeBasisPoints: 0,
    creators: null,
    isMutable: true,
    mint,
    authority: mintAuthority,
    updateAuthority: mintAuthority,
    key: 1,
  };
  
  const metadataBytes = pack(metadata);
  
  // 派生元数据 PDA
  const metadataPDA = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBytes(), newMint.toBytes()],
    METADATA_PROGRAM_ID
  )[0];
  
  console.log('元数据 PDA:', metadataPDA.toString());
  
  const transaction = new Transaction();
  
  // 1. 创建新代币 Mint
  transaction.add(
    createInitializeMintInstruction(
      newMint,
      decimals,
      mintAuthority,
      freezeAuthority,
      TOKEN_2022_PROGRAM_ID
    )
  );
  
  // 2. 初始化元数据指针
  transaction.add(
    createInitializeMetadataPointerInstruction(
      newMint,
      mintAuthority,
      metadataPDA,
      TOKEN_2022_PROGRAM_ID
    )
  );
  
  // 3. 创建元数据账户
  const metadataRent = await connection.getMinimumBalanceForRentExemption(metadataBytes.length);
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: mintAuthority,
      newAccountPubkey: metadataPDA,
      space: metadataBytes.length,
      lamports: metadataRent,
      programId: METADATA_PROGRAM_ID,
    })
  );
  
  // 4. 初始化元数据
  transaction.add(
    new TransactionInstruction({
      keys: [
        { pubkey: metadataPDA, isSigner: false, isWritable: true },
        { pubkey: newMint, isSigner: false, isWritable: false },
        { pubkey: mintAuthority, isSigner: true, isWritable: false },
      ],
      programId: METADATA_PROGRAM_ID,
      data: metadataBytes,
    })
  );
  
  // 获取最新的区块哈希
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = mintAuthority;
  
  // 部分签名
  transaction.partialSign(newMintKeypair);
  
  console.log('交易已创建');
  console.log('签名数量:', transaction.signatures.length);
  console.log('\n注意: 需要使用密钥对签名');
  console.log('新代币私钥 (base58):');
  console.log(Buffer.from(newMintKeypair.secretKey).toString('base64'));
}

main();
