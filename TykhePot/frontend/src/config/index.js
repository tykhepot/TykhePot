// TykhePot 配置文件
import devnetConfig from './devnet.json';

const NETWORK = process.env.REACT_APP_SOLANA_NETWORK || 'devnet';

const CONFIG = {
  devnet: {
    ...devnetConfig,
    endpoint: 'https://api.devnet.solana.com',
  },
  mainnet: {
    network: 'mainnet',
    endpoint: 'https://api.mainnet-beta.solana.com',
    programId: process.env.REACT_APP_PROGRAM_ID || '',
    tokenMint: process.env.REACT_APP_TOKEN_MINT || '',
    statePDA: process.env.REACT_APP_STATE_PDA || '',
    tokenDecimals: 9,
    tokenSymbol: 'TPOT',
  },
};

export const getConfig = () => CONFIG[NETWORK] || CONFIG.devnet;

export const getProgramId = () => getConfig().programId;
export const getTokenMint = () => getConfig().tokenMint;
export const getEndpoint = () => getConfig().endpoint;

export default CONFIG;
