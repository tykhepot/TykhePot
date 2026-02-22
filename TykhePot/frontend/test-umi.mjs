import { createUmi } from '@metaplex-foundation/umi';
import { createV1 } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { readFileSync } from 'fs';

// 读取钱包
const keypairData = JSON.parse(readFileSync('/home/guo5feng5/.openclaw/workspace/TykhePot/smart-contract/target/deploy/royalpot-keypair.json', 'utf8'));

// Umi 使用 base58 格式的密钥
const umi = createUmi('https://api.devnet.solana.com');

// 使用内存 signer
const signer = umi.ed25519()
console.log('Signer type:', signer);

console.log('Testing Umi...');
console.log('Mint:', 'FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');
