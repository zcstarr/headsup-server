import pinataSdk from '@pinata/sdk';
import {ethers} from 'ethers';
import Web3 from 'web3'
export const HEAD_ENV=process.env.HEAD_ENV || 'development';
export const PINATA_SECRET = process.env.PINATA_SECRET || ''; 
export const PINATA_API_KEY = process.env.PINATA_API_KEY || '' 
export const pinata = pinataSdk(PINATA_API_KEY, PINATA_SECRET);
export const L16_RPC_URL = 'https://rpc.l16.lukso.network';
export const L16_CHAIN_ID = 2828;
export const web3 = new Web3(new Web3.providers.HttpProvider(L16_RPC_URL));

export const FRONTEND_URL= HEAD_ENV === "development" ? 'http://localhost:9011' : "https://feedhead.xyz"
export const FEED_URL= `${FRONTEND_URL}/feed`
// export const IPFS_BASE_GATEWAY ="https://ipfs.io/ipfs/"
export const IPFS_BASE_GATEWAY ="https://swappland.mypinata.cloud/ipfs/"
export const ethersProvider = new ethers.providers.JsonRpcBatchProvider(L16_RPC_URL);
