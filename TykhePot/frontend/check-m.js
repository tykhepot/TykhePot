const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { createInitializeMetadataPointerInstruction, getMetadataPointerState } = require('@solana/spl-token-metadata');
const { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

const keypairData = JSON.parse(fs.readFileSync('/home/guo5feng5/.openclaw/workspace/TykhePot/smart-contract/target/deploy/royalpot-keypair.json', 'utf8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const TOKEN_MINT = new PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');

async function main() {
  console.log('Checking token metadata...');
  console.log('Wallet:', keypair.publicKey.toString());
  console.log('Token Mint:', TOKEN_MINT.toString());

  try {
    const metadataPointer = await getMetadataPointerState(connection, TOKEN_MINT, TOKEN_2022_PROGRAM_ID);
    console.log('Metadata pointer:', metadataPointer);
    
    if (metadataPointer && metadataPointer.metadata) {
      console.log('Metadata already exists!');
    } else {
      console.log('No metadata - need to initialize');
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

main();
