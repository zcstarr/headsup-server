export type Cid = string;
export type JsonUrl = string;
export type FeedSymbol = string;
export type FeedName = string;
export type FeedDesc = string;
export interface NftFeedMetadata {
  cid?: Cid;
  jsonUrl?: JsonUrl;
  [k: string]: any;
}
/**
 *
 * Generated! Represents an alias to any of the provided schemas
 *
 */
export type AnyOfFeedSymbolFeedNameFeedDescNftFeedMetadata = FeedSymbol | FeedName | FeedDesc | NftFeedMetadata;
export type CreateNftFeedMetadata = (feedSymbol: FeedSymbol, feedName: FeedName, feedDesc: FeedDesc) => Promise<NftFeedMetadata>;