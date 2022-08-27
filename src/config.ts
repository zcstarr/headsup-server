import pinataSdk from '@pinata/sdk';
export const PINATA_SECRET = process.env.PINATA_SECRET || ''; 
export const PINATA_API_KEY = process.env.PINATA_API_KEY || '' 

export const pinata = pinataSdk(PINATA_API_KEY, PINATA_SECRET);
