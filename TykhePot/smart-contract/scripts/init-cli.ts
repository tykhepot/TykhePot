import * as anchor from '@coral-xyz/anchor';
import { Program, web3, BN } from '@coral-xyz/anchor';

const PROGRAM_ID = new web3.PublicKey('5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b');
const TOKEN_MINT = new web3.PublicKey('FQwBuM6DU76rXCLrJVciS8wQUPvkS58sbtQmrxG1WgdY');
const RESERVE_MINT = new web3.PublicKey('9Z3c9tVQo2YfakysXUbLr2UdP4HKnszNUz1BdLjCTQm2');

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const wallet = provider.wallet.publicKey;
  console.log('Wallet:', wallet.toString());
  
  // Get state PDA
  const [statePDA, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('state')],
    PROGRAM_ID
  );
  console.log('State PDA:', statePDA.toString());
  console.log('Bump:', bump);
  
  // Try to fetch IDL
  let idl;
  try {
    idl = await Program.fetchIdl(PROGRAM_ID, provider);
    console.log('IDL fetched successfully');
  } catch (e) {
    console.log('Could not fetch IDL, using embedded IDL');
    // Embedded minimal IDL
    idl = {
      "version": "0.1.0",
      "name": "royalpot",
      "instructions": [
        {
          "name": "initialize",
          "accounts": [
            {"name": "authority", "isMut": false, "isSigner": true},
            {"name": "state", "isMut": true, "isSigner": false},
            {"name": "tokenMint", "isMut": false, "isSigner": false},
            {"name": "reserveMint", "isMut": false, "isSigner": false},
            {"name": "platformWallet", "isMut": false, "isSigner": false},
            {"name": "systemProgram", "isMut": false, "isSigner": false}
          ],
          "args": [
            {
              "name": "params",
              "type": {
                "defined": "InitializeParams"
              }
            }
          ]
        }
      ],
      "types": [
        {
          "name": "InitializeParams",
          "type": {
            "kind": "struct",
            "fields": [
              {"name": "initialReserve", "type": "u64"},
              {"name": "initialReferralPool", "type": "u64"}
            ]
          }
        }
      ]
    };
  }
  
  const program = new Program(idl as any, PROGRAM_ID, provider);
  
  try {
    console.log('\nInitializing contract...');
    const tx = await program.methods
      .initialize({
        initialReserve: new BN(0),
        initialReferralPool: new BN(0),
      })
      .accounts({
        authority: wallet,
        state: statePDA,
        tokenMint: TOKEN_MINT,
        reserveMint: RESERVE_MINT,
        platformWallet: wallet,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc({ commitment: 'confirmed' });
    
    console.log('✅ SUCCESS!');
    console.log('Transaction:', tx);
    console.log('Solscan: https://solscan.io/tx/' + tx + '?cluster=devnet');
    
    // Verify
    const account = await provider.connection.getAccountInfo(statePDA);
    if (account) {
      console.log('\n✅ State account created successfully!');
      console.log('Account size:', account.data.length, 'bytes');
    }
  } catch (e: any) {
    console.error('❌ Failed:', e.message);
    if (e.message.includes('already in use')) {
      console.log('Contract may already be initialized. Checking...');
      const account = await provider.connection.getAccountInfo(statePDA);
      if (account) {
        console.log('✅ State account already exists!');
      }
    }
  }
}

main();
