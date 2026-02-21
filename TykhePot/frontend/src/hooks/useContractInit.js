import { useState, useEffect } from 'react';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PROGRAM_ID, TOKEN_MINT, RESERVE_MINT } from '../config/contract';

const idl = {
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
  "accounts": [
    {
      "name": "ProtocolState",
      "type": {
        "kind": "struct",
        "fields": [
          {"name": "authority", "type": "publicKey"},
          {"name": "tokenMint", "type": "publicKey"},
          {"name": "reserveMint", "type": "publicKey"},
          {"name": "platformWallet", "type": "publicKey"}
        ]
      }
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

export function useContractInit(wallet, connection) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('state')],
    new PublicKey(PROGRAM_ID)
  );

  useEffect(() => {
    checkInitialization();
  }, [wallet, connection]);

  const checkInitialization = async () => {
    if (!connection) return;
    
    try {
      setIsLoading(true);
      const account = await connection.getAccountInfo(statePDA);
      setIsInitialized(account !== null);
    } catch (e) {
      console.error('Check init error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const initialize = async () => {
    if (!wallet || !wallet.publicKey) {
      throw new Error('Please connect wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'processed',
      });

      const program = new Program(idl, new PublicKey(PROGRAM_ID), provider);

      const tx = await program.methods
        .initialize({
          initialReserve: new BN(0),
          initialReferralPool: new BN(0),
        })
        .accounts({
          authority: wallet.publicKey,
          state: statePDA,
          tokenMint: new PublicKey(TOKEN_MINT),
          reserveMint: new PublicKey(RESERVE_MINT),
          platformWallet: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await checkInitialization();
      return tx;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { isInitialized, isLoading, error, initialize, statePDA };
}
