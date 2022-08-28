export type Description = string;
export type Title = string;
export type Url = string;
export interface Link {
  title?: Title;
  url?: Url;
  [k: string]: any;
}
export type Links = Link[];
export type Width = number;
export type Height = number;
export type HashFunction = string;
export type Hash = string;
export interface Image {
  width?: Width;
  height?: Height;
  hashFunction?: HashFunction;
  hash?: Hash;
  url?: Url;
  [k: string]: any;
}
export type Icons = Image[];
export type ImageSet = Image[];
export type Images = ImageSet[];
export type FileType = string;
export interface Asset {
  hashFunction: HashFunction;
  hash: Hash;
  url: Url;
  fileType: FileType;
  [k: string]: any;
}
export type Assets = Asset[];
/**
 *
 * A metadata schema for Lukso/ LSP4
 *
 */
export interface LSP4Metadata {
  description?: Description;
  links?: Links;
  icon?: Icons;
  images?: Images;
  assets?: Assets;
  [k: string]: any;
}