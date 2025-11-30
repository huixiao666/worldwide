import React from 'react';

interface HeaderProps {
  lastUpdated: number | null;
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, isLoading }) => {
  const formattedDate = new Intl.DateTimeFormat('zh-CN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const updatedTime = lastUpdated 
    ? new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastUpdated))
    : '从未';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span className="bg-blue-600 text-white rounded p-1 text-sm shadow-sm">NEWS</span> 全球热搜早报
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-wide mt-0.5 hidden sm:block">
              {formattedDate} | 北京时间 06:00 自动更新
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">上次更新</p>
              <p className="text-xs font-semibold text-gray-700 font-mono">{updatedTime}</p>
            </div>
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`
                px-4 py-2 rounded-full text-sm font-bold shadow-sm border transition-all duration-200
                ${isLoading 
                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-md active:scale-95'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  聚合中...
                </span>
              ) : '刷新'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;