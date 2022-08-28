import rehypeParse from 'rehype-parse'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import BN from 'bn.js';
import { HeadsUpDatum } from '../generated/headsup_datum_schema';
import HeadsUpABI from '../artifacts/HeadsUp.json';
import { HeadsUp } from '../generated/typechain';
import * as config from '../config';
import { fetchLSP4Metadata } from './lsp4'
import { fetchLSP8Metadata } from './lsp8'
import { Image } from '../generated/lsp4_metadata_schema'

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
}

export async function getNumberOfIssue(feedAddr: string): Promise<number> {
  const headsUp = new config.web3.eth.Contract(
    HeadsUpABI.abi as any,
    feedAddr,
  ) as any as HeadsUp;
  return new BN(await headsUp.methods.getNumberOfIssues().call()).toNumber();
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
  const tokenMetdata = await fetchLSP4Metadata(feedAddr, config.web3)
  // NOTE we only need to grabe metadata from any token as this is all dynamically set the same for all tokens
  const feedMetadata = await fetchLSP8Metadata(config.web3.utils.numberToHex(0), feedAddr, config.web3);
  const feedImage = feedMetadata.images![0][0] ? feedMetadata.images![0][0] : undefined
  let feedImageUrl = feedImage ? feedImage.url : '';
  if(feedImageUrl) feedImageUrl = convertIPFSUrl(feedImageUrl);
  const feedDesc = feedMetadata.description || '';
  // Token Name
  const feedTitle = tokenMetdata[0]

  const channelData: ChannelData = {
    channelDesc: feedDesc,
    channelImage: feedImageUrl,
    channelLink: getFeedLink(feedAddr),
    channelTitle: feedTitle 
  };


  for(let count= numIssues-1; count >= 0; count-= 1){
    issueNos.push(count)
    issues.push(getIssue(feedAddr, count));
  }
  (await Promise.allSettled(issues)).forEach(async (issue, idx)=>{
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
        imageUrl: imageUrl ? convertIPFSUrl(imageUrl): imageUrl
      };
      rssItems.push(rssData);
    }
  })
  const rssXml = buildChannel(channelData, rssItems)
  console.log(rssXml)
  return rssXml
}



function buildChannel(ch: ChannelData, rssItems: RssItem[]){
  const items =  rssItems.map(createFeedItem).join('\n'); 
  const data = 
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${ch.channelTitle}</title>
    <link>${ch.channelLink}</link>
    <description>${ch.channelDesc}</description>
    <atom:link href="${ch.channelLink}" rel="self"/>
    <image>
      <url>${ch.channelImage}</url>
      <title>${ch.channelTitle}</title>
      <link>${ch.channelLink}</link>
    </image>
    ${items}
  </channel>
</rss>`;
  return data;
}


function getFeedLink(feedAddr: string){
  return `${config.FEED_URL}/${feedAddr}`
}

function getFeedIssueLink(feedAddr: string, issueNo: number){
  return `${config.FEED_URL}/${feedAddr}/${issueNo}`
}

export function createFeedItem(rssItem: RssItem){
  const prefix = ` 
    <item>
			<title><![CDATA[Storage]]></title>
			<description><![CDATA[${rssItem.content}]]></description>
			<link>${rssItem.link}</link>
      <guid>${rssItem.link}</guid>
    `
  const optionalImage =  rssItem.imageUrl ? `
      <media:thumbnail xmlns:media="http://search.yahoo.com/mrss/"
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
    .use(remarkRehype)
    // TODO temporarily disable for typescript
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(content);
  console.log(result)
  return String(result) 
}