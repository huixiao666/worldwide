
interface Env {
  API_KEY: string;
}

interface NewsSource {
  title: string;
  uri: string;
}

interface ChartData {
  name: string;
  score: number;
}

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const region = url.searchParams.get('region') || 'Global';
  
  // CORS headers to allow access from the frontend
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const apiKey = env.API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error: API_KEY missing' }), { status: 500, headers });
  }

  // Define context based on region
  let contextText = "";
  if (region === 'Global') {
      contextText = "全球范围内的热门新闻和重大时事";
  } else if (region === 'China') {
      contextText = "中国（含港澳台）的实时热搜和重大新闻";
  } else if (region === 'Tech') {
      contextText = "全球科技界的热门新闻和突破性进展";
  } else if (region === 'Finance') {
      contextText = "全球金融市场和经济领域的热点新闻";
  } else if (region === 'Sports') {
      contextText = "全球体育界的重大赛事和热点新闻";
  } else {
      contextText = `${region} 相关的热门新闻`;
  }

  const systemInstruction = "你是一个专业的全球新闻聚合助手。你必须使用 Google Search 获取最新信息，始终用中文回答，并严格遵循格式要求输出25条内容。";

  const prompt = `
    扮演一位资深的新闻主编。请利用 Google Search 搜索当前的${contextText}。
    
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

  try {
    // Call Google Gemini API directly via REST to avoid Node.js dependency issues in Edge Runtime
    const googleRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: {
          temperature: 0.3
        },
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });

    if (!googleRes.ok) {
      const errorText = await googleRes.text();
      console.error('Google API Error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch from upstream AI provider', details: errorText }), { status: 502, headers });
    }

    const data: any = await googleRes.json();
    
    // Process the response
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p: any) => p.text).join('') || "未生成内容。";
    
    // Extract Grounding Metadata (Sources)
    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    const sources: NewsSource[] = chunks
      .map((chunk: any) => ({
        title: chunk.web?.title || "未知来源",
        uri: chunk.web?.uri || "#"
      }))
      .filter((s: NewsSource) => s.uri !== "#")
      // Remove duplicates
      .filter((v: NewsSource, i: number, a: NewsSource[]) => a.findIndex(t => t.uri === v.uri) === i)
      .slice(0, 30);

    // Parse Text to extract Chart Data
    const chartData: ChartData[] = [];
    const regex = /### (.*?) \(Heat: (\d+)\)/g;
    let match;
    
    // Clone logic from original service
    while ((match = regex.exec(text)) !== null) {
      if (match[1] && match[2]) {
        let shortName = match[1].trim();
        if (shortName.length > 8) {
          shortName = shortName.substring(0, 8) + '..';
        }
        chartData.push({
          name: shortName,
          score: parseInt(match[2], 10)
        });
      }
    }

    return new Response(JSON.stringify({
      markdown: text,
      sources,
      chartData
    }), { headers });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
};
