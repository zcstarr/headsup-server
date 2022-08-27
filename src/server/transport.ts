import {transports} from "@open-rpc/server-js";
import cors from "cors";
import { json as jsonParser } from "body-parser";
import connect, { HandleFunction } from "connect";
import http, { ServerOptions } from "http";
import { JSONRPCRequest } from "@open-rpc/server-js/build/transports/server-transport";
import formidable from "formidable";
import fs from 'fs-extra';
import { Keccak } from 'sha3';
import imageSize from 'image-size'
import { pinata } from "../config";
import { encodeJSONURLValue } from "./erc725";
import { LSP4Metadata } from "../generated/lsp4_metadata_schema";


interface HTTPServerTransportOptions extends ServerOptions {
  middleware: HandleFunction[];
  port: number;
  cors?: cors.CorsOptions;
}

function httpReqHandler(req: any, res: any ){
  // eslint-disable-next-line default-case
  switch(req.url) {
  // eslint-disable-next-line no-empty
  default:
    return;
  case "/covermeta": {
    console.log('yess')
    const form = formidable();
    let cid;
    form.parse(req, async (err, fields, files: any) => {
      if(err) throw err
      console.log('fields: ', fields);
      console.log('files: ', files);
      const rs = fs.createReadStream(files.coverImage.filepath);
      const pinResponse = await pinata.pinFileToIPFS(rs,{}); 

      const file = await fs.readFileSync(files.coverImage.filepath);
      const hash = new Keccak(256);
      hash.update(file);
      const hashStr = hash.digest('hex');
      const {width, height} = await imageSize(file)
      const payloadData: LSP4Metadata = {
        description: fields.feedDesc as string,
        links: [
          {
            title: `The ${fields.feedAddr} feed`,
            url: 'https://anchor.fm/s/add25bb0/podcast/rss'
          }
        ],
        assets: [],
        icon:[],
        images:[[
          {
            width,
            hashFunction: 'keccak256(bytes)',
            hash: hashStr,
            height,
            url: `ipfs://${pinResponse.IpfsHash}` 
          }
        ]]
      };
      const result =  await pinata.pinJSONToIPFS({LSP4Metadata: payloadData}, {})
      const jsonUrl = encodeJSONURLValue(result.IpfsHash, {LSP4Metadata: payloadData});
      const responseJson = {
        cid: result.IpfsHash,
        jsonUrl,
      };
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(responseJson));
      console.log(responseJson)

    });
  }
  }
}

export default class HTTPMixedServerTransport extends transports.ServerTransport {
  private static defaultCorsOptions = { origin: "*" };

  private server: http.Server;

  private options: HTTPServerTransportOptions;

  constructor(options: HTTPServerTransportOptions) {
    super();
    const app = connect();

    const corsOptions = options.cors || HTTPMixedServerTransport.defaultCorsOptions;
    this.options = {
      ...options,
      middleware: [
        cors(corsOptions) as HandleFunction,
        jsonParser({
          limit: "5mb"
        }),
        ...options.middleware,
      ],
    };

    this.options.middleware.forEach((mw) => app.use(mw));

    app.use(this.httpRouterHandler.bind(this) as HandleFunction);

    this.server = http.createServer(app);
  }

  public start(): void {
    this.server.listen(this.options.port);
  }

  public stop(): void {
    this.server.close();
  }

  private async httpRouterHandler(req: any, res: any): Promise<void> {
    let result = null;

    console.log(req.url)
    if(req.url.includes('rpc')){
      console.log("WWWWWWWWHHHHy")
      if (req.body instanceof Array) {
        result = await Promise.all(req.body.map((r: JSONRPCRequest) => super.routerHandler(r)));
      } else {
        result = await super.routerHandler(req.body);
      }

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    }else{ 
      console.log("nooooooooWWWWWWWWHHHHy")
      httpReqHandler(req,res)
    }
  }
}