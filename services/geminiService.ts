
import { NewsResponse } from "../types";

export const fetchTrendingNews = async (region: string): Promise<NewsResponse> => {
  try {
    // Call the Cloudflare Function backend
    // The path is relative to the domain root
    const response = await fetch(`/api/news?region=${region}`);

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data as NewsResponse;

  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};
