import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import NewsCard from './components/NewsCard';
import Footer from './components/Footer';
import { fetchDailyNews } from './services/geminiService';
import { NewsItem, NewsResponse, LoadingState } from './types';

const STORAGE_KEY = 'global_news_daily_cache';

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  /**
   * Check if cache is valid based on China Standard Time (UTC+8) 6:00 AM refresh cycle.
   * If current China time is past 6 AM, the content must be from today (after 6 AM).
   * If current China time is before 6 AM, the content must be from yesterday (after 6 AM yesterday).
   */
  const isCacheValid = (timestamp: number): boolean => {
    const now = new Date();
    // 1. Get current time in China (UTC+8)
    // We add timezone offset to get UTC, then add 8 hours (in ms)
    const chinaTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000);
    const chinaDate = new Date(chinaTimeMs);

    // 2. Determine the latest "Refresh Point" in China Time
    // Default refresh point is Today 06:00:00
    const refreshPointChina = new Date(chinaTimeMs);
    refreshPointChina.setHours(6, 0, 0, 0);

    // If currently it's strictly before 06:00 AM in China, the latest refresh point was Yesterday 06:00 AM
    if (chinaDate.getHours() < 6) {
      refreshPointChina.setDate(refreshPointChina.getDate() - 1);
    }

    // 3. Convert the refresh point back to absolute Epoch time for comparison
    // (Refresh Point China Time) - 8 hours = Refresh Point UTC -> Epoch
    // Note: Since we constructed refreshPointChina using shifted milliseconds, 
    // its "internal" UTC value is actually the China time. 
    // We need to be careful with comparison.
    // Simplest way: Convert the Cache Timestamp to China Time as well.
    
    const cacheDate = new Date(timestamp);
    const cacheTimeChinaMs = cacheDate.getTime() + (cacheDate.getTimezoneOffset() * 60000) + (8 * 3600000);

    // If the cache time (in China time) is greater than the Refresh Point (in China time), it is valid.
    return cacheTimeChinaMs > refreshPointChina.getTime();
  };

  const loadNews = useCallback(async (forceRefresh = false) => {
    setLoadingState(LoadingState.LOADING);
    setErrorMsg('');

    try {
      // 1. Check LocalStorage first unless forcing refresh
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(STORAGE_KEY);
        if (cachedData) {
          const parsed: NewsResponse = JSON.parse(cachedData);
          if (isCacheValid(parsed.generatedAt)) {
            console.log('Using valid cache (Data is fresh for current China Time cycle)');
            setNews(parsed.items);
            setLastUpdated(parsed.generatedAt);
            setLoadingState(LoadingState.SUCCESS);
            return;
          } else {
            console.log('Cache expired (New 6:00 AM cycle in China has passed), fetching fresh news...');
          }
        }
      }

      // 2. Fetch from Gemini
      const items = await fetchDailyNews();
      
      const newCache: NewsResponse = {
        date: new Date().toISOString().split('T')[0],
        items: items,
        generatedAt: Date.now(),
      };

      // 3. Save to LocalStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCache));
      
      setNews(items);
      setLastUpdated(newCache.generatedAt);
      setLoadingState(LoadingState.SUCCESS);

    } catch (err) {
      console.error(err);
      setErrorMsg('新闻聚合失败，可能是网络问题或 API 配额限制。');
      setLoadingState(LoadingState.ERROR);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header 
        lastUpdated={lastUpdated} 
        onRefresh={() => loadNews(true)} 
        isLoading={loadingState === LoadingState.LOADING}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error State */}
        {loadingState === LoadingState.ERROR && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMsg}</p>
                <button 
                  onClick={() => loadNews(true)}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-600 underline"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State Skeletons */}
        {loadingState === LoadingState.LOADING && (
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 h-64 animate-pulse flex flex-col">
                  <div className="flex justify-between mb-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-10"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="mt-auto h-3 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success State */}
        {loadingState === LoadingState.SUCCESS && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">今日全球热搜 ({news.length})</h2>
              <span className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 self-start sm:self-auto">
                已聚合 {news.filter(i => i.region.includes('中国')).length} 条中国新闻，{news.filter(i => !i.region.includes('中国')).length} 条国际资讯
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>

            {news.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 mb-4">暂无数据，可能是 API 返回了空结果。</p>
                <button
                  onClick={() => loadNews(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  刷新重试
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;