export type Title = string;
export type Url = string;
export type Content = string;
/**
 *
 * A schema for headsup data feed entries
 *
 */
export interface HeadsUpDatum {
  title?: Title;
  imageUrl?: Url;
  content?: Content;
  [k: string]: any;
}