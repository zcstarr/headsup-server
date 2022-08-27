import { Server, ServerOptions } from "@open-rpc/server-js";
import { HTTPServerTransportOptions } from "@open-rpc/server-js/build/transports/http";
import { OpenrpcDocument } from "@open-rpc/meta-schema";
import { parseOpenRPCDocument } from "@open-rpc/schema-utils-js";
import cors from "cors";
import { json as jsonParser } from "body-parser";
// eslint-disable-next-line import/no-extraneous-dependencies
import { HandleFunction } from "connect";
import doc from "../../openrpc.json";
import {makeMethodMapping} from "./methods";
import HTTPMixedServerTransport from "./transport";



export default async function start(port: number): Promise<Server> {
  const corsOptions = { origin: "*" } as cors.CorsOptions;

  const serverOptions: ServerOptions = {
    openrpcDocument: await parseOpenRPCDocument(doc as OpenrpcDocument),
    transportConfigs: [
      /*     {
       type: "HTTPTransport",
        options: {
          port,
          middleware: [
            cors(corsOptions) as HandleFunction,
            jsonParser(),
          ],
        } as HTTPServerTransportOptions,
      } */
    ],
    methodMapping: makeMethodMapping()
  };

  console.log("Starting Server"); // tslint:disable-line
  const s = new Server(serverOptions);
  s.addTransport(new HTTPMixedServerTransport({port,middleware:[
    cors(corsOptions) as HandleFunction,
    jsonParser(), 
  ],}))
  s.start();
  return s;
}
