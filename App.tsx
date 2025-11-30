import React, { useEffect, useState, useRef } from 'react';
import { cryptoService, POPULAR_PAIRS } from './services/cryptoService';
import { CoinData, KlineData } from './types';
import CoinList from './components/CoinList';
import CryptoChart from './components/CryptoChart';
import PredictionPanel from './components/PredictionPanel';
import { Menu, X, BarChart2 } from 'lucide-react';

const App: React.FC = () => {
  const [tickerData, setTickerData] = useState<CoinData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(POPULAR_PAIRS[0]);
  const [klineData, setKlineData] = useState<KlineData[]>([]);
  const [interval, setInterval] = useState<string>('1m');
  
  // Mobile UI States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);
  
  useEffect(() => {
    // 1. Initialize Ticker Stream (All coins)
    cryptoService.connectTickerStream();
    const handleTickerUpdate = (data: CoinData[]) => {
      setTickerData(data);
    };
    cryptoService.subscribeTickers(handleTickerUpdate);

    return () => {
      cryptoService.disconnectAll();
    };
  }, []);

  useEffect(() => {
    // 2. Initialize Kline Stream (Selected coin)
    setKlineData([]);
    
    // Fetch historical data first to populate chart immediately
    const initData = async () => {
      const history = await cryptoService.getHistoricalKlines(selectedSymbol, interval, 500);
      setKlineData(history);
    };
    initData();
    
    // Connect to WebSocket for live updates
    cryptoService.connectKlineStream(selectedSymbol, interval);

    const handleKlineUpdate = (data: KlineData) => {
      setKlineData(prev => {
        // Keep last 500 points to allow for zooming out
        const newData = [...prev];
        // Check if updating the last candle or adding a new one
        if (newData.length > 0 && newData[newData.length - 1].time === data.time) {
          newData[newData.length - 1] = data;
        } else {
          newData.push(data);
        }
        if (newData.length > 500) return newData.slice(-500);
        return newData;
      });
    };

    cryptoService.subscribeKline(handleKlineUpdate);

    return () => {
      cryptoService.unsubscribeKline(handleKlineUpdate);
    };
  }, [selectedSymbol, interval]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      {/* 
        Mobile/Tablet Overlays
        - CoinList overlay for screens < LG
        - PredictionPanel overlay for screens < MD
      */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      {isPredictionOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-40 md:hidden" onClick={() => setIsPredictionOpen(false)} />
      )}

      {/* 
        Left Sidebar (Coin List)
        - Mobile/Tablet (< lg): Fixed drawer (transform toggled)
        - Desktop (>= lg): Relative column (always visible)
      */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-80 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <CoinList 
          data={tickerData} 
          selectedSymbol={selectedSymbol} 
          onSelect={(s) => {
            setSelectedSymbol(s);
            setIsMobileMenuOpen(false); // Close menu on select (mobile)
          }}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative z-0">
        {/* 
          Responsive Header 
          - Visible on Mobile and Tablet (< lg) because CoinList is hidden
        */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 hover:text-white p-1">
             <Menu className="w-6 h-6" />
          </button>
          
          <span className="font-bold text-lg tracking-wide text-slate-100">
            CryptoInsight Pro
          </span>

          {/* AI Toggle Button: Visible only on small Mobile (< md) */}
          <button 
            onClick={() => setIsPredictionOpen(true)} 
            className="md:hidden text-brand-500 hover:text-brand-400 p-1"
            title="Open Analytics"
          >
             <BarChart2 className="w-6 h-6" />
          </button>

          {/* Spacer for Tablet (md) where AI panel is already visible */}
          <div className="hidden md:block w-8"></div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative">
          <CryptoChart 
            data={klineData} 
            symbol={selectedSymbol}
            interval={interval}
            onIntervalChange={setInterval}
          />
        </div>
      </div>

      {/* 
        Right Sidebar (Prediction Panel) 
        - Mobile (< md): Fixed drawer (transform toggled)
        - Tablet/Desktop (>= md): Relative column (always visible side-by-side with chart)
      */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-80 lg:w-96 bg-slate-900 border-l border-slate-800 transform transition-transform duration-300 md:relative md:translate-x-0 ${isPredictionOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <PredictionPanel 
          marketData={tickerData} 
          onClose={() => setIsPredictionOpen(false)}
        />
      </div>
    </div>
  );
};

export default App;