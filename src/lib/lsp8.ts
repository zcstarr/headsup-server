/* eslint-disable @typescript-eslint/no-use-before-define */
/**
 * This logic is largely cribbed from
 * https://github.com/lukso-network/wallet.universalprofile.cloud/tree/1b8dc764f84c53a679b7a8b6f2d0ae698923c6f1/utils
 * MIT and Apache 2.0 logic, we want the LSP8s to be generally consummed by ecosystem so
 * it was taken to just use the same logic that other consumers are using in the wild
 *
 *
 */

import Web3 from 'web3';
import LSP8DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import { ethers } from 'ethers';
// eslint-disable-next-line import/named
import ERC725js, { ERC725JSONSchema, ERC725 } from '@erc725/erc725.js';
import UniversalProfileSchema from '@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json';
import { LSP4Metadata } from '../generated/lsp4_metadata_schema';
import { L16_RPC_URL, IPFS_BASE_GATEWAY } from '../config';
import { fetchLSP4Metadata, validateLSP4MetaData } from './lsp4';

const LSP8TokenIdType = {
  name: 'LSP8TokenIdType',
  key: '0x715f248956de7ce65e94d9d836bfead479f7e70d69b718d47bfe7b00e05b4fe4',
  keyType: 'Singleton',
  valueType: 'uint256',
  valueContent: 'Number',
};

const LSP8MetadataJSON = {
  name: 'LSP8MetadataJSON:<uint256>',
  key: '0x9a26b4060ae7f7d5e3cd0000<uint256>',
  keyType: 'Mapping',
  valueType: 'bytes',
  valueContent: 'JSONURL',
};

enum TokenIdType {
  address = '1',
  number = '2',
  bytes32 = '3',
}

export interface Lsp8AssetType {
  image: string;
  icon: string;
  tokenId: string;
  description: string;
  collectionName: string;
  collectionDescription: string;
  collectionImage: string;
  collectionIcon: string;
  collectionAddress: string;
}

export const fetchReceivedAssets = async (
  address: string,
  provider: any,
): Promise<string[]> => {
  const profile = new ERC725(
    UniversalProfileSchema as ERC725JSONSchema[],
    address,
    provider,
  );
  const result = await profile.fetchData('LSP5ReceivedAssets[]');
  const ownedAssets = result.value as string[];
  return ownedAssets;
};

const fetchLSP8Assets = async (
  assetAddress: string,
  UPAddress: string,
  web3Provider: any,
): Promise<Lsp8AssetType[] | undefined> => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  console.log(assetAddress)
  const tokensIds = await fetchLSP8TokensIds(
    assetAddress,
    UPAddress,
    web3Provider,
  );

  // TODO undo
  /* if (!tokensIds.length) {
    return undefined;
  } */

  const [collectionName, collectionSymbol, collectionLSP4Metadata] =
    await fetchLSP4Metadata(assetAddress, web3Provider);
  console.log(
    'collection stuff',
    collectionName,
    collectionSymbol,
    collectionLSP4Metadata,
  );

  const newLSP8Assets: Lsp8AssetType[] = [];

  await Promise.all(
    tokensIds.map(async (tokenId) => {
      const NFTLSP4MetadataJSON = await fetchLSP8Metadata(
        tokenId,
        assetAddress,
        web3Provider,
      );
      const lsp8AssetObject: Lsp8AssetType = createLSP8Object(
        NFTLSP4MetadataJSON,
        tokenId,
        collectionName,
        collectionSymbol,
        assetAddress,
        collectionLSP4Metadata,
      );
      newLSP8Assets.push(lsp8AssetObject);
    }),
  );
  return newLSP8Assets;
};

const fetchLSP8TokensIds = async (
  contractAddress: string,
  UPAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  provider: any,
): Promise<string[]> => {
  const web3 = new Web3(L16_RPC_URL);

  const lsp8Contract = new web3.eth.Contract(
    LSP8DigitalAsset.abi as any,
    contractAddress,
  );

  const tokensIds = (await lsp8Contract.methods
    .tokenIdsOf(UPAddress)
    .call()) as string[];
  return tokensIds;
};

const createLSP8Object = (
  NFTLSP4MetadataJSON: LSP4Metadata,
  tokenId: string,
  collectionName: string,
  collectionSymbol: string,
  assetAddress: string,
  collectionLSP4Metadata: LSP4Metadata,
): Lsp8AssetType => {
  const { description, links, images, assets, icons } =
    NFTLSP4MetadataJSON.LSP4Metadata;
  const lsp8AssetObject = {
    tokenId,
    description,
    image: images[0][0]?.url ? images[0][0].url : '',
    icon: icons[0]?.url ? icons[0].url : '',
    collectionName,
    collectionSymbol,
    collectionAddress: assetAddress,
    collectionDescription: collectionLSP4Metadata?.LSP4Metadata.description,
    collectionImage: collectionLSP4Metadata?.LSP4Metadata.images[0][0]?.url
      ? collectionLSP4Metadata.LSP4Metadata.images[0][0]?.url
      : '',
    collectionIcon: collectionLSP4Metadata.LSP4Metadata.icons[0]?.url
      ? collectionLSP4Metadata.LSP4Metadata.icons[0]?.url
      : '',
  };
  return lsp8AssetObject as Lsp8AssetType;
};

export const fetchLSP8Metadata = async (
  tokenId: string,
  address: string,
  provider: any,
): Promise<LSP4Metadata> => {
  const LSP8MetadataGetter = async (
    tokenIdType: string,
    tokenIdPart: string,
  ): Promise<LSP4Metadata> => {
    const LSP8Metadata = await erc725Asset.fetchData([
      {
        keyName: `LSP8MetadataJSON:<${tokenIdType}>`,
        dynamicKeyParts: tokenIdPart,
      },
    ]);
    return validateLSP4MetaData(LSP8Metadata[0].value);
  };

  const options = {
    ipfsGateway: IPFS_BASE_GATEWAY,
  };

  const erc725Asset = new ERC725js(
    [LSP8TokenIdType, LSP8MetadataJSON] as ERC725JSONSchema[],
    address,
    provider,
    options,
  );

  try {
    // fetch tokenIdType
    const tokenIdTypeData = await erc725Asset.fetchData(['LSP8TokenIdType']);

    const tokenIdType = tokenIdTypeData[0].value.toString();

    // fetch LSP8MetadataJSON depending on tokenIdType
    if (tokenIdType === TokenIdType.address) {
      return LSP8MetadataGetter(
        'address',
        ethers.utils.hexDataSlice(tokenId.toString(), 12),
      );
    } if (tokenIdType === TokenIdType.number) {
      return LSP8MetadataGetter('uint256', parseInt(tokenId, 10).toString());
    } if (tokenIdType === TokenIdType.bytes32) {
      return LSP8MetadataGetter('bytes32', tokenId.toString());
    }
    return {
      LSP4Metadata: {
        description: '',
        links: [],
        images: [[]],
        icons: [],
        assets: [],
      },
    };
  } catch (error) {
    console.log(error);
    return {
      LSP4Metadata: {
        description: '',
        links: [],
        images: [[]],
        icons: [],
        assets: [],
      },
    };
  }
};

export default fetchLSP8Assets;
