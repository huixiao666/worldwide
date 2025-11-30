export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  source: string;
  region: string; // e.g., 中国, 北美, 欧洲, 亚太
  category: string; // e.g., 科技, 政治, 财经, 体育
  url?: string;
  timestamp?: string;
}

export interface NewsResponse {
  date: string;
  items: NewsItem[];
  generatedAt: number; // Unix timestamp
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}