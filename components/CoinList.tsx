import React from 'react';
import { CoinData } from '../types';
import { ArrowUpRight, ArrowDownRight, Activity, X } from 'lucide-react';

interface CoinListProps {
  data: CoinData[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  onClose?: () => void;
}

const CoinList: React.FC<CoinListProps> = ({ data, selectedSymbol, onSelect, onClose }) => {
  // Sort by volume descending by default
  const sortedData = [...data].sort((a, b) => b.volume - a.volume);

  return (
    <div className="flex flex-col h-full w-full bg-gray-950 border-r border-gray-850 shrink-0">
      <div className="p-4 border-b border-gray-850 bg-gray-900/50 backdrop-blur flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-500" />
          Рынок Live
        </h2>
        {/* Close button visible only when onClose is provided (mobile/tablet drawer mode) */}
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="overflow-y-auto flex-1 scrollbar-thin">
        {sortedData.map((coin) => {
          const isPositive = coin.changePercent >= 0;
          const isSelected = selectedSymbol === `${coin.symbol}USDT`;

          return (
            <div
              key={coin.symbol}
              onClick={() => {
                onSelect(`${coin.symbol}USDT`);
              }}
              className={`p-4 border-b border-gray-850 cursor-pointer transition-colors duration-200 hover:bg-gray-850/50 ${
                isSelected ? 'bg-gray-850 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {coin.symbol}
                </span>
                <span className="font-mono text-gray-200">
                  ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Vol: ${(coin.volume / 1000000).toFixed(1)}M</span>
                <span className={`flex items-center gap-1 ${isPositive ? 'text-green-450' : 'text-red-500'}`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(coin.changePercent).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoinList;