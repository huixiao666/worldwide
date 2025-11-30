import React from 'react';
import { NewsItem } from '../types';

interface NewsCardProps {
  item: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ item }) => {
  const getCategoryColor = (category: string) => {
    if (category.includes('科技')) return 'bg-indigo-100 text-indigo-800';
    if (category.includes('财经') || category.includes('经济')) return 'bg-emerald-100 text-emerald-800';
    if (category.includes('政治')) return 'bg-slate-100 text-slate-800';
    if (category.includes('体育')) return 'bg-orange-100 text-orange-800';
    if (category.includes('娱乐')) return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  const isChina = item.region.includes('中国');

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
            {item.category}
          </span>
          <span className={`text-xs font-semibold tracking-wide ${isChina ? 'text-red-600' : 'text-blue-600'}`}>
            {item.region}
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 flex-1 leading-relaxed">
          {item.summary}
        </p>
        
        <div className="pt-4 border-t border-gray-50 flex justify-between items-center mt-auto">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span>{item.source || '网络新闻'}</span>
          </div>
          
          {item.url && (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              阅读原文 &rarr;
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;