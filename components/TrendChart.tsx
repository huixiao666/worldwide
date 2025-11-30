import React from 'react';
import {
  Treemap,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ChartData } from '../types';

interface TrendChartProps {
  data: ChartData[];
}

const COLORS = [
  '#ef4444', // Red-500 (High Heat)
  '#f97316', // Orange-500
  '#eab308', // Yellow-500
  '#10b981', // Emerald-500
  '#06b6d4', // Cyan-500
  '#3b82f6', // Blue-500 (Lower Heat)
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/90 backdrop-blur border border-slate-600 p-3 rounded-xl shadow-2xl z-50">
        <p className="text-white font-bold text-sm mb-1">{payload[0].payload.name}</p>
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <p className="text-slate-300 text-xs">
            热度指数: <span className="font-mono text-white font-bold text-sm">{payload[0].value}</span>
            </p>
        </div>
      </div>
    );
  }
  return null;
};

const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, value } = props;

  // Choose color based on index (assuming data is sorted by score desc)
  // or interpolate based on value. Here we map index to a color gradient.
  const colorIndex = Math.floor((index / 15) * COLORS.length);
  const bg = COLORS[Math.min(colorIndex, COLORS.length - 1)];

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: bg,
          stroke: '#1e293b',
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
        className="opacity-80 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
        rx={6}
        ry={6}
      />
      {width > 50 && height > 30 && (
        <foreignObject x={x + 4} y={y + 4} width={width - 8} height={height - 8}>
           <div className="w-full h-full flex flex-col justify-between p-1 overflow-hidden pointer-events-none">
              <span className="text-white font-bold text-xs leading-tight drop-shadow-md line-clamp-2 md:line-clamp-3">
                {name}
              </span>
              {height > 50 && (
                 <span className="text-white/80 text-[10px] font-mono mt-1 self-end bg-black/20 px-1 rounded">
                    {value}
                 </span>
              )}
           </div>
        </foreignObject>
      )}
    </g>
  );
};

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Take Top 15 and ensure they are sorted by score for the coloring logic
  const topData = [...data]
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map(item => ({ name: item.name, size: item.score, value: item.score })); // Treemap uses 'size' key by default or dataKey

  return (
    <div className="w-full mt-6 mb-8 bg-slate-800/40 rounded-3xl border border-slate-700/50 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-500 rounded-full"></span>
            话题热度图谱 (Top 15)
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> 高热度</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> 低热度</span>
        </div>
      </div>
      
      <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-inner bg-slate-900/50">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={topData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill="#8884d8"
            content={<CustomizedContent />}
            animationDuration={1000}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
