import { GoogleGenAI, Tool } from "@google/genai";
import { NewsResponse, ChartData, GroundingChunk } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

const MODEL_NAME = 'gemini-2.5-flash';

export const fetchTrendingNews = async (region: string): Promise<NewsResponse> => {
  try {
    // Customized prompt based on region/category for Chinese context
    let context = "";
    if (region === 'Global') {
        context = "全球范围内的热门新闻和重大时事";
    } else if (region === 'China') {
        context = "中国（含港澳台）的实时热搜和重大新闻";
    } else if (region === 'Tech') {
        context = "全球科技界的热门新闻和突破性进展";
    } else if (region === 'Finance') {
        context = "全球金融市场和经济领域的热点新闻";
    } else if (region === 'Sports') {
        context = "全球体育界的重大赛事和热点新闻";
    } else {
        context = `${region} 相关的热门新闻`;
    }

    const prompt = `
      扮演一位资深的新闻主编。请利用 Google Search 搜索当前的${context}。
      
      请用**中文（简体）**回答。我需要你按照特定的格式生成回复，并为前 **25** 条最重要的新闻打一个“热度分”（Trending Heat，范围 0-100）。
      
      每一条新闻的格式必须严格遵守如下结构（请保留 Heat: 这个英文标记以便我解析）：
      
      ### [新闻标题] (Heat: [分数])
      [一段简明扼要的新闻摘要，约2-3句话。请使用 Markdown 加粗功能突出关键人物、地点或事件。]

      **重要要求**：
      1. 必须列出 **至少 25 条** 新闻。
      2. 涉及中国的内容请务必客观、准确。
      3. 热度分（Heat）应反映该事件在全球或该领域的讨论热度。
      4. 确保内容是即时的（Last 24 hours preferred）。
    `;

    const tools: Tool[] = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: tools,
        systemInstruction: "你是一个专业的全球新闻聚合助手。你必须使用 Google Search 获取最新信息，始终用中文回答，并严格遵循格式要求输出25条内容。",
        temperature: 0.3, 
      },
    });

    const text = response.text || "未生成内容。";
    
    // Extract Grounding Metadata (Sources)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    const sources = chunks
      .map(chunk => ({
        title: chunk.web?.title || "未知来源",
        uri: chunk.web?.uri || "#"
      }))
      .filter(s => s.uri !== "#")
      // Remove duplicates based on URI
      .filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i)
      .slice(0, 30); // Limit to 30 sources for the larger list

    // Parse Text to extract Chart Data
    const chartData: ChartData[] = [];
    const regex = /### (.*?) \(Heat: (\d+)\)/g;
    let match;
    
    // We clone the regex for iteration
    while ((match = regex.exec(text)) !== null) {
      if (match[1] && match[2]) {
        // Truncate very long titles for the chart display
        let shortName = match[1].trim();
        // Chinese characters visually take more space
        if (shortName.length > 8) {
          shortName = shortName.substring(0, 8) + '..';
        }
        
        chartData.push({
          name: shortName,
          score: parseInt(match[2], 10)
        });
      }
    }

    return {
      markdown: text,
      sources,
      chartData
    };

  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};
