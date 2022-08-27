import { PinataPinResponse } from "@pinata/sdk";
import * as config from "./config"

async function createFeedMetadataFile(feedSymbol:string, feedDesc:string, feedName: string): Promise<PinataPinResponse>{
  const {pinata} = config;
  const content  = {feedDesc, feedName, feedSymbol}
  return pinata.pinJSONToIPFS(content, {})

}