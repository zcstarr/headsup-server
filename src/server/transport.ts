import { transports } from "@open-rpc/server-js";
import cors from "cors";
import { json as jsonParser } from "body-parser";
import connect, { HandleFunction } from "connect";
import http, { ServerOptions } from "http";
import { JSONRPCRequest } from "@open-rpc/server-js/build/transports/server-transport";
import formidable from "formidable";
import fs from "fs-extra";
import { Keccak } from "sha3";
import imageSize from "image-size";
import express, {Express, Router} from 'express'
import { pinata } from "../config";
import { encodeJSONURLValue } from "./erc725";
import { LSP4Metadata } from "../generated/lsp4_metadata_schema";
import { getFeedAndTranslateData } from "../lib";
import * as config from '../config'

const router = Router();
interface HTTPServerTransportOptions extends ServerOptions {
  middleware: HandleFunction[];
  port: number;
  cors?: cors.CorsOptions;
}

router.get("/feed/:feedAddr/rss",async (req,res)=>{

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8")
  const rssFeed = await getFeedAndTranslateData(req.params.feedAddr)
  res.end(rssFeed)
});

router.post("/image",(req,res)=>{
  const form = formidable();
  form.parse(req, async (err, fields, files: any) => {
    if (err) throw err;
    const rs = fs.createReadStream(files.entryImage.filepath);
    const pinResponse = await pinata.pinFileToIPFS(rs, {});
    const responseJson = {
      cid: pinResponse.IpfsHash
    };
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(responseJson));
  });
});

router.post('/covermeta',(req,res)=>{
  const form = formidable();
  let cid;
  form.parse(req, async (err, fields, files: any) => {
    if (err) throw err;
    const rs = fs.createReadStream(files.coverImage.filepath);
    const pinResponse = await pinata.pinFileToIPFS(rs, {});

    const file = await fs.readFileSync(files.coverImage.filepath);
    const hash = new Keccak(256);
    hash.update(file);
    const hashStr = hash.digest("hex");
    const { width, height } = await imageSize(file);
    const payloadData: LSP4Metadata = {
      description: fields.feedDesc as string,
      links: [
        {
          title: `The ${fields.feedAddr} feed`,
          url: `${config.FRONTEND_URL}/feed/${fields.feedAddr}/rss`
        }
      ],
      assets: [],
      icon: [],
      images: [
        [
          {
            width,
            hashFunction: "keccak256(bytes)",
            hash: hashStr,
            height,
            url: `ipfs://${pinResponse.IpfsHash}`
          }
        ]
      ]
    };
    const result = await pinata.pinJSONToIPFS(
      { LSP4Metadata: payloadData },
      {}
    );
    const jsonUrl = encodeJSONURLValue(result.IpfsHash, {
      LSP4Metadata: payloadData
    });
    const responseJson = {
      cid: result.IpfsHash,
      jsonUrl
    };
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(responseJson));
  });
});

export default class HTTPMixedServerTransport extends transports.ServerTransport {
  private static defaultCorsOptions = { origin: "*" };

  private server: http.Server;

  private options: HTTPServerTransportOptions;

  private xapp: Express;

  constructor(options: HTTPServerTransportOptions) {
    super();
    const app = connect();
    this.xapp = express();
    this.xapp.use(router);

    const corsOptions =
      options.cors || HTTPMixedServerTransport.defaultCorsOptions;
    this.options = {
      ...options,
      middleware: [
        cors(corsOptions) as HandleFunction,
        jsonParser({
          limit: "5mb"
        }),
        ...options.middleware
      ]
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
    try {
      if (req.url.includes("rpc")) {
        if (req.body instanceof Array) {
          result = await Promise.all(
            req.body.map((r: JSONRPCRequest) => super.routerHandler(r))
          );
        } else {
          result = await super.routerHandler(req.body);
        }

        res.setHeader("Content-Type", "application/json");
        console.log(result)
        res.end(JSON.stringify(result));
      } else {
        this.xapp(req,res);
      }
    }catch(e){
      console.log(e);
      res.status(400)
      res.end()
    }
  }
}
