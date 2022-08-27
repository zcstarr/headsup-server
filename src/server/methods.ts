import { MethodMapping } from "@open-rpc/server-js/build/router";
import * as types from "../generated";
import {LSP4Metadata} from "../generated/lsp4_metadata_schema"
import createNftFeedMetadata from "../api";
import { pinata } from "../config";
import { encodeJSONURLValue } from "./erc725";
export interface HeadsupServerMapping extends MethodMapping {
  createNftFeedMetadata: types.CreateNftFeedMetadata;
}
/*
const dataToEncode: JSONURLDataToEncode = {
  url: 'ipfs://QmYr1VJLwerg6pEoscdhVGugo39pa6rycEZLjtRPDfW84UAx',
  json: {
    myProperty: 'is a string',
    anotherProperty: {
      key: 123456,
    },
  },
};
*/

export function makeMethodMapping() {
  const methodMapping: HeadsupServerMapping = {
    createNftFeedMetadata: async (feedSymbol, feedName, feedDesc) => {
      console.log(feedDesc, feedName, feedSymbol);
      
      const payloadData: LSP4Metadata = {
        description: feedDesc,
        links: [],
        assets: [],
        icons:[],
        images:[[]]
      };

      const result = await pinata.pinJSONToIPFS({LSP4Metadata: payloadData},{});
      const jsonUrl = encodeJSONURLValue(result.IpfsHash, {LSP4Metadata: payloadData});
      return {
        cid: result.IpfsHash,
        jsonUrl,
      };
    }
  };
  return methodMapping;
}
