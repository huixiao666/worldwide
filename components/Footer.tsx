import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-gray-900 font-bold text-sm tracking-wide">
            全球热搜早报 Global Daily Brief
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Powered by Google Gemini 2.5 Flash & Google Search
          </p>
        </div>
        
        <div className="flex gap-6 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            自动聚合
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            北京时间 06:00 更新
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
            中英双语源
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;