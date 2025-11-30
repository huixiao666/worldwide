import { GoogleGenAI } from "@google/genai";
import { NewsItem } from "../types";

// Initialize Gemini Client
// IMPORTANT: API_KEY must be set in your Environment Variables (e.g. Cloudflare Pages Settings)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
你是一个专业的全球新闻聚合主编。你的任务是利用 Google Search 工具，搜集当前此时此刻全球范围内的最热门新闻，为中文读者整理一份"全球热搜早报"。

**核心指令**：
1. **严格数量**：必须返回 **30条** 新闻。不能少于30条。
2. **地域配比**：
   - **中国新闻 (China)**: 约 10 条 (30%)。包括大陆社会热点、港澳台重大新闻、国内科技财经。
   - **国际新闻 (Global)**: 约 20 条 (70%)。包括美国、欧洲、亚太(日韩印)、中东战争等。
3. **内容领域**：
   - 政治局势 (国际关系/选举/战争)
   - 宏观经济 (股市/政策/企业大事件)
   - 前沿科技 (AI/芯片/航天)
   - 重大社会事件 (灾难/气候/健康)
   - 体育与娱乐 (仅限全球级重大事件)
4. **格式要求**：
   - 标题：中文，简练有力，类似新闻客户端头条 (20字以内)。
   - 摘要：中文，客观中立，一针见血地概括核心事实 (50字以内)。
   - 来源：尽量识别原始媒体名称 (如 "新华社", "CNN", "Reuters", "BBC")。
   - **输出格式**：必须是纯粹的 JSON 格式。
`;

const PROMPT = `
请执行以下步骤：
1. 使用 Google Search 广泛搜索 "Top trending news in China today", "World breaking news today", "Global top stories summary" 和 "Major headlines China and World".
2. 筛选出今天最值得关注的 30 个新闻事件。
3. 确保包含 10 个中国相关新闻和 20 个国际新闻。
4. 按重要性排序。
5. **重要：请严格按照以下 JSON 格式输出，不要包含 Markdown 代码块标记（如 \`\`\`json），直接返回 JSON 字符串。**

JSON 结构示例：
{
  "items": [
    {
      "id": 1,
      "title": "新闻标题",
      "summary": "新闻摘要",
      "source": "媒体来源",
      "region": "地区（如：中国、北美、欧洲）",
      "category": "分类（如：科技、政治、财经）",
      "url": "https://原文链接(如果搜索工具有提供)"
    }
  ]
}
`;

export const fetchDailyNews = async (): Promise<NewsItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: PROMPT,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }], // Enable Live Search Grounding
        // Note: responseMimeType and responseSchema are NOT supported when using tools in this model version
        // We must rely on the prompt to get JSON and parse it manually.
      },
    });

    let text = response.text;
    if (!text) {
      throw new Error("No content generated");
    }

    // Clean up Markdown code blocks if the model includes them despite instructions
    // This removes ```json at the start and ``` at the end
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", text);
      throw new Error("Failed to parse news data from AI response.");
    }
    
    // Validate structure
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid data format received");
    }

    // Enhance items with URLs from grounding chunks if available and not present in JSON
    // The googleSearch tool returns groundingMetadata.groundingChunks which contains web.uri
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    return data.items.map((item: any, index: number) => {
        // Try to assign a real URL from grounding chunks if the AI didn't hallucinately provide one
        let realUrl = item.url;
        if (!realUrl && chunks && chunks.length > index) {
            // This is a rough mapping; ideally the model maps sources to URLs perfectly.
            // In a real app, we might just leave it empty if not certain.
             if(chunks[index].web?.uri) {
                 realUrl = chunks[index].web.uri;
             }
        }

        return {
            id: index + 1, // Ensure sequential IDs
            title: item.title || "无标题",
            summary: item.summary || "暂无详情",
            source: item.source || "网络",
            region: item.region || "全球",
            category: item.category || "综合",
            url: realUrl
        };
    });

  } catch (error) {
    console.error("Failed to fetch news:", error);
    throw error;
  }
};