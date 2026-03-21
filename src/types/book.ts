import { Timestamp } from "firebase/firestore";

export interface Book {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  coverUrl: string;
  description: string;
  cachedAt: Timestamp;
}

export interface NaverBookSearchResult {
  title: string;
  link: string;
  image: string;
  author: string;
  discount: string;
  publisher: string;
  isbn: string;
  description: string;
  pubdate: string;
}

export interface NaverBookSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverBookSearchResult[];
}
