
import {encodeValueContent, decodeValueContent} from '@erc725/erc725.js/build/main/src/lib/encoder';
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
