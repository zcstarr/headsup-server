import rehypeParse from 'rehype-parse'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import unified from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import BN from 'bn.js';
import LSP8DigitalAssetABI from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import axios from 'axios'
import { HeadsUpDatum } from '../generated/headsup_datum_schema';
import HeadsUpABI from '../artifacts/HeadsUp.json';
import { HeadsUp, LSP8IdentifiableDigitalAsset } from '../generated/typechain';
import * as config from '../config';
import { fetchLSP4Metadata } from './lsp4'
import { fetchLSP8Metadata } from './lsp8'
import { Image, LSP4Metadata } from '../generated/lsp4_metadata_schema'
import { decodeJSONUrlValue, getTokenIdMetadataKey } from '../server/erc725'

interface ChannelData{
  channelTitle: string,
  channelLink: string,
  channelDesc: string,
  channelImage?: string
}

interface RssItem {
  title: string
  content: string
  link: string
  imageUrl?: string
  issueNo: number
}

export async function getNumberOfIssue(feedAddr: string): Promise<number> {
  const headsUp = new config.web3.eth.Contract(
    HeadsUpABI.abi as any,
    feedAddr,
  ) as any as HeadsUp;
  return new BN(await headsUp.methods.getNumberOfIssues().call()).toNumber();
}

export async function getTokenName(feedAddr: string): Promise<string> {
  const lsp8Contract = new config.web3.eth.Contract(
    LSP8DigitalAssetABI.abi as any,
    feedAddr,
  )as any as LSP8IdentifiableDigitalAsset;

  const rawName = await lsp8Contract.methods['getData(bytes32)']("0xdeba1e292f8ba88238e10ab3c7f88bd4be4fac56cad5194b6ecceaf653468af1").call()
  return config.web3.utils.hexToUtf8(rawName)
}

interface SimpleMeta {
  imageUrl: string | undefined,
  desc?:string
}

export async function getTokenIdMetadata(feedAddr: string): Promise<SimpleMeta> {
  const lsp8Contract = new config.web3.eth.Contract(
    LSP8DigitalAssetABI.abi as any,
    feedAddr,
  )as any as LSP8IdentifiableDigitalAsset;

  const keyName = await getTokenIdMetadataKey(new BN("0"));
  const jsonURLRaw = await lsp8Contract.methods['getData(bytes32)'](keyName).call()
  const url = decodeJSONUrlValue(jsonURLRaw)
  const ipfsUrl = convertIPFSUrl(url);
  const response = await axios.get(ipfsUrl)
  const value = response.data as {LSP4Metadata: LSP4Metadata};
  const {images} = value.LSP4Metadata;
  let imageUrl: undefined | string
  if(images){
    imageUrl = images[0][0]?.url
  }
  return {imageUrl, desc: value.LSP4Metadata.description}

}
export async function getTokenMetadata(feedAddr: string): Promise<SimpleMeta> {
  const lsp8Contract = new config.web3.eth.Contract(
    LSP8DigitalAssetABI.abi as any,
    feedAddr,
  )as any as LSP8IdentifiableDigitalAsset;

  const jsonURLRaw = await lsp8Contract.methods['getData(bytes32)']("0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e").call()
  const url = decodeJSONUrlValue(jsonURLRaw)
  const ipfsUrl = convertIPFSUrl(url);
  console.log(ipfsUrl)
  const response = await axios.get(ipfsUrl)
  const value = response.data as {LSP4Metadata: LSP4Metadata};
  console.log(value)
  const {images} = value.LSP4Metadata;
  let imageUrl: undefined | string
  if(images){
    imageUrl = images[0][0]?.url
  }
  return {imageUrl, desc: value.LSP4Metadata.description}
}

export async function getIssue(feedAddr: string, issueNo: number) {
  const headsUp = new config.web3.eth.Contract(
    HeadsUpABI.abi as any,
    feedAddr,
  ) as any as HeadsUp;

  const result = await headsUp.methods.getIssue(issueNo).call();
  const decodedResult = config.web3.utils.hexToUtf8(result);
  return JSON.parse(decodedResult) as HeadsUpDatum;
}

export  function convertIPFSUrl(url: string): string{
  return url.replace("ipfs://", config.IPFS_BASE_GATEWAY)
}

export const getFeedAndTranslateData = async (feedAddr: string)=>{

  const numIssues= await getNumberOfIssue(feedAddr);
  const issueNos: number[]=[]; 
  const issues = []
  const rssItems: RssItem[] = [];
  const tokenMetdata = {}// await fetchLSP4Metadata(feedAddr, config.web3)
  // NOTE we only need to grabe metadata from any token as this is all dynamically set the same for all tokens
  /*  const feedMetadata = {} // await fetchLSP8Metadata(config.web3.utils.numberToHex(0), feedAddr, config.web3);
  const feedImage = feedMetadata.images![0][0] ? feedMetadata.images![0][0] : undefined
  let feedImageUrl = feedImage ? feedImage.url : '';
  if(feedImageUrl) feedImageUrl = convertIPFSUrl(feedImageUrl);
  const feedDesc = feedMetadata.description || '';
  // Token Name
  const feedTitle = 'placeholder' // tokenMetdata[0]
const channelData: ChannelData = {
    channelDesc: feedDesc,
    channelImage: feedImageUrl,
    channelLink: getFeedLink(feedAddr),
    channelTitle: feedTitle 
  };



*/
  const title = await getTokenName(feedAddr)
  const meta = await getTokenMetadata(feedAddr);
  const tokenIdMeta = await getTokenIdMetadata(feedAddr);
  const channelData: ChannelData = {
    channelDesc: tokenIdMeta.desc || '',
    channelImage: tokenIdMeta.imageUrl ? convertIPFSUrl(tokenIdMeta.imageUrl): tokenIdMeta.imageUrl,
    channelLink: getFeedLink(feedAddr),
    channelTitle: title 
  };


  for(let count= numIssues-1; count >= 0; count-= 1){
    issueNos.push(count)
    issues.push(getIssue(feedAddr, count));
  }
  const promIssues = await Promise.allSettled(issues);
  const resolvedIssues = promIssues.map(async (issue, idx)=>{
    if(issue.status === "fulfilled"){
      // TODO should in future be non blocking
      const issueNo = issueNos[idx];
      const datum = issue.value;
      const issueTitle = datum.title || 'Untitled';
      const {imageUrl} = datum
      let cleanContent = "";
      if(datum.content)
        cleanContent = await cleanUp(datum.content)
      
      const issueLink = getFeedIssueLink(feedAddr, issueNo) 
      
      const rssData = {
        content: cleanContent,
        link: issueLink,
        title: issueTitle,
        imageUrl: imageUrl ? convertIPFSUrl(imageUrl): imageUrl,
        issueNo,
      };
      rssItems.push(rssData);
    }
  })
  await Promise.allSettled(resolvedIssues);
  // sort the feed
  rssItems.sort((a,b)=>( b.issueNo - a.issueNo))
  // eslint-disable-next-line no-debugger
  debugger
  const rssXml = buildChannel(channelData, rssItems)
  return rssXml
}



function buildChannel(ch: ChannelData, rssItems: RssItem[]){
  const items =  rssItems.map(createFeedItem).join('\n'); 
  const imageSection = ch.channelImage ?  `
    <image>
      <url>${ch.channelImage}</url>
      <title>${ch.channelTitle}</title>
      <link>${ch.channelLink}</link>
    </image>
    ` : `` 
  const data = 
`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">
  <channel>
    <title>${ch.channelTitle}</title>
    <link>${ch.channelLink}</link>
    <description>${ch.channelDesc}</description>
    <atom:link href="${ch.channelLink}/rss" rel="self"/>
    ${imageSection}
    ${items}
  </channel>
</rss>`;
  return data;
}


function getFeedLink(feedAddr: string){
  return `${config.FEED_URL}/${feedAddr}`
}

function getFeedIssueLink(feedAddr: string, issueNo: number){
  return `${config.FEED_URL}/${feedAddr}/entry/${issueNo}`
}

export function createFeedItem(rssItem: RssItem){
  const prefix = ` 
    <item>
			<title><![CDATA[${rssItem.title}]]></title>
			<description><![CDATA[${rssItem.content}]]></description>
			<link>${rssItem.link}</link>
      <guid>${rssItem.link}</guid>
    `
  const optionalImage =  rssItem.imageUrl ? `
      <media:thumbnail xmlns:media="http://search.yahoo.com/mrss/"
        width="400"
        height="400"
        url="${rssItem.imageUrl}"/>
    ` : '';
  const endTag = `</item>`;
  return `${prefix}
  ${optionalImage}
   ${endTag}`	
}


// TODO fix view layer sanitizer that breaks html 
async function cleanUp(content: string): Promise<any>{
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype as any)
    // TODO temporarily disable for typescript
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(content);
  return String(result.contents) 
}
