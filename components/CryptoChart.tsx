import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { KlineData } from '../types';
import { format } from 'date-fns';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw, Activity, Clock } from 'lucide-react';

interface CryptoChartProps {
  data: KlineData[];
  symbol: string;
  interval: string;
  onIntervalChange: (interval: string) => void;
}

const CryptoChart: React.FC<CryptoChartProps> = ({ data, symbol, interval, onIntervalChange }) => {
  const [viewSize, setViewSize] = useState(50); // Number of candles visible
  const [viewOffset, setViewOffset] = useState(0); // Offset from the right (0 = latest)

  // Reset view when symbol or interval changes
  useEffect(() => {
    setViewOffset(0);
    setViewSize(50);
  }, [symbol, interval]);

  // Handle calculating visible data
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Ensure we don't try to show more than we have
    const safeViewSize = Math.max(10, Math.min(viewSize, data.length));
    
    // Max offset allows us to scroll back to the beginning
    const maxOffset = Math.max(0, data.length - safeViewSize);
    const safeOffset = Math.max(0, Math.min(viewOffset, maxOffset));

    // Calculate slice indices
    // If offset is 0, we want data.slice(data.length - safeViewSize, data.length)
    let startIndex = data.length - safeOffset - safeViewSize;
    let endIndex = data.length - safeOffset;

    // Boundary checks
    if (startIndex < 0) startIndex = 0;
    if (endIndex > data.length) endIndex = data.length;

    const slice = data.slice(startIndex, endIndex);

    return slice.map(d => ({
      ...d,
      displayTime: format(new Date(d.time), interval === '1d' ? 'dd MMM' : 'HH:mm'),
    }));
  }, [data, viewSize, viewOffset, interval]);

  const latestPrice = data.length > 0 ? data[data.length - 1].close : 0;
  
  // Color depends on the visible trend (start of view vs end of view)
  const visibleStartPrice = chartData.length > 0 ? chartData[0].close : 0;
  const visibleEndPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
  const isPositive = visibleEndPrice >= visibleStartPrice;
  const color = isPositive ? '#4ade80' : '#ef4444'; 

  // Handlers for controls
  const handleZoomIn = () => setViewSize(s => Math.max(10, s - 10)); // Min 10 candles
  const handleZoomOut = () => setViewSize(s => Math.min(data.length, s + 10)); // Max all loaded candles
  const handlePanLeft = () => setViewOffset(o => Math.min(data.length - viewSize, o + 5));
  const handlePanRight = () => setViewOffset(o => Math.max(0, o - 5));
  const handleReset = () => { setViewOffset(0); setViewSize(50); };

  const availableIntervals = [
    { label: '1s', value: '1s' },
    { label: '1m', value: '1m' },
    { label: '3m', value: '3m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' },
  ];

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
        <Activity className="w-10 h-10 animate-pulse text-brand-500" />
        <span className="text-sm font-mono animate-pulse">Загрузка данных рынка...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 relative group">
      {/* Header Info */}
      <div className="mb-4 pl-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            {symbol.replace('USDT', '')} <span className="text-gray-500 text-sm font-normal">/ USDT</span>
          </h3>
          <p className={`text-xl font-mono ${isPositive ? 'text-green-450' : 'text-red-500'} flex items-center gap-2`}>
            ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            {viewOffset > 0 && (
               <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                 ИСТОРИЯ
               </span>
            )}
          </p>
        </div>

        <div className="flex gap-2 items-center">
            {/* Interval Selector */}
            <div className="relative group/select">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-gray-400">
                <Clock className="w-3 h-3" />
              </div>
              <select
                value={interval}
                onChange={(e) => onIntervalChange(e.target.value)}
                className="bg-gray-800/80 text-gray-200 text-sm rounded-lg border border-gray-700 block pl-8 pr-2 py-1.5 focus:ring-brand-500 focus:border-brand-500 outline-none appearance-none cursor-pointer hover:bg-gray-700 transition-colors"
              >
                {availableIntervals.map((int) => (
                  <option key={int.value} value={int.value}>{int.label}</option>
                ))}
              </select>
            </div>

            {/* Chart Controls */}
            <div className="flex items-center bg-gray-800/80 backdrop-blur rounded-lg border border-gray-700 p-1 shadow-lg">
              <button 
                onClick={handleZoomIn} 
                title="Приблизить"
                className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={handleZoomOut} 
                title="Отдалить"
                className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-700 mx-1"></div>
              <button 
                onClick={handlePanLeft} 
                title="Влево"
                className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handlePanRight} 
                title="Вправо"
                className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                disabled={viewOffset === 0}
              >
                <ChevronRight className={`w-4 h-4 ${viewOffset === 0 ? 'opacity-30' : ''}`} />
              </button>
              <div className="w-px h-4 bg-gray-700 mx-1"></div>
              <button 
                onClick={handleReset} 
                title="Сброс"
                className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-brand-400 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[calc(100%-80px)] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
            <XAxis 
              dataKey="displayTime" 
              stroke="#718096" 
              tick={{ fontSize: 11, fill: '#718096' }} 
              minTickGap={30}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#718096" 
              tick={{ fontSize: 11, fill: '#718096' }} 
              tickFormatter={(val) => `$${val.toLocaleString()}`}
              width={60}
              tickLine={false}
              axisLine={false}
              orientation="right"
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a202c', borderColor: '#4a5568', color: '#fff', borderRadius: '0.5rem' }}
              itemStyle={{ color: color }}
              labelStyle={{ color: '#a0aec0', marginBottom: '0.25rem' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Цена']}
            />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke={color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              isAnimationActive={false} // Disable animation for smoother panning
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CryptoChart;