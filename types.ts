
export interface NewsSource {
  title: string;
  uri: string;
}

export interface ChartData {
  name: string;
  score: number;
}

export interface NewsResponse {
  markdown: string;
  sources: NewsSource[];
  chartData: ChartData[];
}

export type Region = 'Global' | 'China' | 'Tech' | 'Finance' | 'Sports';
