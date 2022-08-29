
import { ERC725JSONSchema } from '@erc725/erc725.js';
import {encodeValueContent, decodeValueContent , decodeValueType} from '@erc725/erc725.js/build/main/src/lib/encoder';
import { generateSchemasFromDynamicKeys } from '@erc725/erc725.js/build/main/src/lib/utils';
import BN from 'bn.js';
import {LSP4Metadata} from "../generated/lsp4_metadata_schema"


// eslint-disable-next-line import/prefer-default-export
export function encodeJSONURLValue(ipfsHash: string, payloadBlob: LSP4Metadata):string{

  const value = {
    url: `ipfs://${ipfsHash}`,
    json: {...payloadBlob} 
  }
  const result = encodeValueContent('JSONURL', value);
  if(!result) throw new Error("could not encode value")
  return result
}

export function decodeJSONUrlValue(value: string): string{
  const {url} = decodeValueContent('JSONURL', value) as {url : string};
  return url
}

const LSP8MetadataJSON = {
  name: 'LSP8MetadataJSON:<uint256>',
  key: '0x9a26b4060ae7f7d5e3cd0000<uint256>',
  keyType: 'Mapping',
  valueType: 'bytes',
  valueContent: 'JSONURL',
} as ERC725JSONSchema;

export function getTokenIdMetadataKey(id: BN): string{
  const tokenMetadataKeyParts = {
    keyName: `LSP8MetadataJSON:<uint256>`,
    dynamicKeyParts: id.toString(),
  };
  const resultSchema = generateSchemasFromDynamicKeys([tokenMetadataKeyParts],[LSP8MetadataJSON])
  return resultSchema[0].key
}