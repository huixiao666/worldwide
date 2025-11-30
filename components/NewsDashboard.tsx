import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ExternalLink, Zap, Flame, Newspaper, Download, Share2, Globe, Clock } from 'lucide-react';
import { fetchTrendingNews } from '../services/geminiService';
import { Region, NewsResponse } from '../types';
import { TrendChart } from './TrendChart';
import { toPng } from 'html-to-image';

const REGIONS: { id: Region; label: string; icon: string; color: string; desc: string }[] = [
  { id: 'Global', label: '全球热搜', icon: '🌍', color: 'from-blue-600 to-cyan-500', desc: 'Global Trends' },
  { id: 'China', label: '中国大陆', icon: '🇨🇳', color: 'from-red-600 to-rose-500', desc: 'Mainland China' },
  { id: 'Tech', label: '科技前沿', icon: '💻', color: 'from-violet-600 to-purple-500', desc: 'Technology' },
  { id: 'Finance', label: '财经动态', icon: '📈', color: 'from-emerald-600 to-teal-500', desc: 'Markets' },
  { id: 'Sports', label: '体育赛事', icon: '⚽', color: 'from-orange-600 to-amber-500', desc: 'Sports' },
];

export const NewsDashboard: React.FC = () => {
  const [activeRegion, setActiveRegion] = useState<Region>('Global');
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextUpdate, setNextUpdate] = useState<string>('');
  const [generatingImg, setGeneratingImg] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadNews = async (region: Region) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrendingNews(region);
      setNews(data);
    } catch (err) {
      setError("获取新闻失败，请检查 API Key 配置或网络连接。");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadNews(activeRegion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegion]);

  // Schedule next update for 6:00 AM China Time (UTC+8)
  useEffect(() => {
    const scheduleNextUpdate = () => {
      const now = new Date();
      
      // Create a date object for the current time in UTC
      const nowUTC = now.getTime() + (now.getTimezoneOffset() * 60000);
      
      // Calculate current time in Beijing (UTC+8)
      const nowBeijing = new Date(nowUTC + (3600000 * 8));
      
      // Target is 6:00 AM Beijing time
      const targetBeijing = new Date(nowBeijing);
      targetBeijing.setHours(6, 0, 0, 0);

      // If 6 AM has passed today in Beijing, schedule for tomorrow
      if (nowBeijing > targetBeijing) {
        targetBeijing.setDate(targetBeijing.getDate() + 1);
      }

      const timeUntilUpdate = targetBeijing.getTime() - nowBeijing.getTime();
      
      // Update UI for next update time (Local formatted)
      // We convert the target Beijing time back to local user's time for display
      const targetLocal = new Date(now.getTime() + timeUntilUpdate);
      setNextUpdate(targetLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      console.log(`Next auto-update scheduled in ${timeUntilUpdate / 1000 / 60} minutes.`);

      return setTimeout(() => {
        loadNews(activeRegion);
        // Reschedule for 24 hours later
        scheduleNextUpdate(); 
      }, timeUntilUpdate);
    };

    const timerId = scheduleNextUpdate();
    return () => clearTimeout(timerId);
  }, [activeRegion]);

  const handleDownloadImage = async () => {
    if (contentRef.current) {
      setGeneratingImg(true);
      try {
        // We use a filter to exclude <img> tags (favicons) because they cause CORS issues
        // when drawing to canvas if the server doesn't provide correct headers.
        const dataUrl = await toPng(contentRef.current, { 
          cacheBust: true, 
          backgroundColor: '#0f172a',
          filter: (node) => {
            // Filter out img tags to avoid Tainted Canvas errors from external favicons
            if (node.tagName === 'IMG') {
                return false;
            }
            return true;
          }
        });
        const link = document.createElement('a');
        link.download = `global-pulse-${activeRegion}-${new Date().toISOString().slice(0,10)}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to generate image', err);
        alert("图片生成失败 (CORS Error)。建议尝试使用系统截图功能。");
      } finally {
        setGeneratingImg(false);
      }
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) {
        const content = line.replace('### ', '');
        const match = content.match(/(.*?) \(Heat: (\d+)\)/);
        if (match) {
            return (
                <div key={i} className="mt-6 mb-2 flex items-start justify-between gap-3 border-l-4 border-blue-500 pl-4 bg-slate-800/30 py-3 rounded-r-xl hover:bg-slate-800/50 transition-colors">
                    <h3 className="text-lg md:text-xl font-bold text-white leading-snug">{match[1]}</h3>
                    <span className="shrink-0 flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-blue-400 ring-1 ring-inset ring-blue-500/20">
                        <Flame className="w-3 h-3 text-orange-500" /> {match[2]}
                    </span>
                </div>
            );
        }
        return <h3 key={i} className="text-xl font-bold text-white mt-6 mb-2 border-l-4 border-blue-500 pl-4">{content}</h3>;
      }
      
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().substring(2);
        return (
            <li key={i} className="ml-4 text-slate-300 mb-1 list-disc marker:text-blue-500 text-base">
                <span dangerouslySetInnerHTML={{ __html: parseBold(content) }} />
            </li>
        );
      }
      
      if (line.trim() === '') return <div key={i} className="h-2" />;

      return (
        <p key={i} className="text-slate-300 leading-relaxed mb-2 text-base">
           <span dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
        </p>
      );
    });
  };

  const parseBold = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold bg-slate-700/50 px-1 rounded mx-0.5">$1</strong>');
  };

  const currentRegion = REGIONS.find(r => r.id === activeRegion);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* 1. Square Navigation Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {REGIONS.map((region) => (
          <button
            key={region.id}
            onClick={() => setActiveRegion(region.id)}
            className={`
                relative overflow-hidden flex flex-col items-center justify-center p-4 h-36 rounded-2xl transition-all duration-300 border
                ${activeRegion === region.id 
                    ? 'border-transparent shadow-2xl scale-105 z-10' 
                    : 'bg-slate-800/40 border-slate-700/30 hover:bg-slate-800 hover:border-slate-600'
                }
            `}
          >
            {activeRegion === region.id && (
                <div className={`absolute inset-0 bg-gradient-to-br ${region.color} opacity-90`} />
            )}

            <span className={`text-4xl mb-2 z-10 transition-transform duration-300 ${activeRegion === region.id ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 grayscale opacity-70'}`}>
                {region.icon}
            </span>
            <span className={`text-lg font-bold z-10 ${activeRegion === region.id ? 'text-white' : 'text-slate-300'}`}>
                {region.label}
            </span>
            <span className={`text-xs uppercase tracking-wider font-medium mt-1 z-10 ${activeRegion === region.id ? 'text-white/80' : 'text-slate-500'}`}>
                {region.desc}
            </span>
          </button>
        ))}
      </div>

      {/* 2. Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
               {currentRegion?.label}头条
               <span className="text-xs font-normal text-slate-500 border border-slate-700 rounded-full px-3 py-1 bg-slate-800/50">
                   Top 25
               </span>
            </h2>
            <div className="text-slate-500 text-sm mt-1 flex items-center gap-4">
               <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded text-xs border border-slate-700">
                  <Clock className="w-3 h-3 text-blue-400" />
                  北京时间 06:00 自动更新
               </span>
               <span className="text-xs text-slate-600 flex items-center">
                  下次更新: {nextUpdate || '--:--'}
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button
                onClick={handleDownloadImage}
                disabled={loading || !news || generatingImg}
                className="hidden sm:flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all text-sm font-medium disabled:opacity-50"
                title="下载为图片"
              >
                {generatingImg ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
                <span>{generatingImg ? '生成中...' : '下载简报'}</span>
              </button>

              <button
                onClick={() => loadNews(activeRegion)}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">刷新数据</span>
              </button>
          </div>
      </div>

      {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-center animate-in fade-in slide-in-from-top-4">
                {error}
            </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse max-w-5xl mx-auto py-12">
             <div className="h-64 w-full bg-slate-800/50 rounded-2xl mb-8"></div>
             {[1,2,3,4,5].map(i => (
                 <div key={i} className="space-y-3">
                    <div className="h-8 w-2/3 bg-slate-800/50 rounded"></div>
                    <div className="h-4 w-full bg-slate-800/30 rounded"></div>
                    <div className="h-4 w-5/6 bg-slate-800/30 rounded"></div>
                 </div>
             ))}
        </div>
      ) : (
        /* Content Wrapper for Image Generation */
        <div ref={contentRef} className="bg-slate-900 p-2 sm:p-4 rounded-3xl" id="news-content-area">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Main Content & Chart */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Treemap Chart */}
                    {news?.chartData && news.chartData.length > 0 && (
                    <TrendChart data={news.chartData} />
                    )}

                    {/* News List */}
                    <div className="bg-slate-800/20 rounded-3xl p-6 sm:p-8 border border-slate-700/30 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Globe className="w-32 h-32 text-white" />
                         </div>
                         
                        <div className="prose prose-invert prose-lg max-w-none relative z-10">
                        {news ? renderMarkdown(news.markdown) : (
                            <div className="text-center py-20 text-slate-500">
                                <Zap className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>暂无数据，请刷新重试。</p>
                            </div>
                        )}
                        </div>
                    </div>
                </div>

                {/* Right: Sources & Metadata */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 sticky top-24">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                            <Newspaper className="w-5 h-5 text-blue-400" />
                            <h2 className="text-base font-bold text-white uppercase tracking-wider">
                                权威信源追踪
                            </h2>
                            <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                                {news?.sources?.length || 0} Sources
                            </span>
                        </div>
                    
                        {!loading && news?.sources && news.sources.length > 0 ? (
                            <ul className="space-y-3 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                            {news.sources.map((source, idx) => (
                                <li key={idx}>
                                <a 
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600 transition-all"
                                >
                                    <p className="text-sm text-slate-200 group-hover:text-blue-300 font-medium leading-snug mb-1 line-clamp-2">
                                    {source.title}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-1">
                                            <img 
                                                src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}`} 
                                                alt="icon" 
                                                className="w-3 h-3 opacity-70"
                                                onError={(e) => e.currentTarget.style.display = 'none'}
                                            />
                                            <span className="text-xs text-slate-500 group-hover:text-slate-400">
                                                {new URL(source.uri).hostname.replace('www.', '')}
                                            </span>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                                    </div>
                                </a>
                                </li>
                            ))}
                            </ul>
                        ) : (
                            <div className="text-center py-10 text-slate-600 text-sm">
                                <p>正在分析数据来源...</p>
                            </div>
                        )}
                        
                        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                            <p className="text-xs text-slate-600">
                                以上内容由 AI 基于互联网公开信息生成，<br/>仅供参考，不代表平台观点。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};