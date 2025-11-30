import React, { useState, useEffect } from 'react';
import { CoinData, PredictionResult } from '../types';
import { generateMarketPrediction } from '../services/geminiService';
import { cryptoService } from '../services/cryptoService';
import { 
  TrendingUp, 
  AlertTriangle, 
  Crosshair, 
  Target, 
  Zap, 
  Activity, 
  Waves, 
  MoveVertical, 
  X,
  ShieldAlert,
  BarChart2,
  Info
} from 'lucide-react';

interface PredictionPanelProps {
  marketData: CoinData[];
  onClose?: () => void;
}

interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
    history: number[]; // Last N histogram bars for viz
  };
  bb: {
    upper: number;
    lower: number;
    percentB: number;
    history: { upper: number; lower: number; price: number }[]; // Last N points for viz
  };
}

const PredictionPanel: React.FC<PredictionPanelProps> = ({ marketData, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loadingText, setLoadingText] = useState('Инициализация анализа...');
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [calculatingIndicators, setCalculatingIndicators] = useState(false);

  // Cycle through loading texts to keep user engaged
  useEffect(() => {
    if (!loading) return;
    const texts = [
      'Агрегация рыночных данных...',
      'Расчет волатильности...',
      'Анализ уровней поддержки/сопротивления...',
      'Проверка технических индикаторов...',
      'Формирование отчета...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingText(texts[i % texts.length]);
      i++;
    }, 800);
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch data and calculate indicators when prediction changes
  useEffect(() => {
    if (!prediction?.coin) {
      setIndicators(null);
      return;
    }

    const fetchAndCalculate = async () => {
      setCalculatingIndicators(true);
      try {
        const symbol = prediction.coin.toUpperCase().endsWith('USDT') 
          ? prediction.coin.toUpperCase() 
          : `${prediction.coin.toUpperCase()}USDT`;

        // Fetch enough history for calculations (needs ~50+ for stable EMA/RSI)
        const klines = await cryptoService.getHistoricalKlines(symbol, '15m', 100);
        
        if (klines.length > 50) {
          const closes = klines.map(k => k.close);
          
          const rsi = calculateRSI(closes);
          const macd = calculateMACD(closes);
          const bb = calculateBollingerBands(closes);

          setIndicators({ rsi, macd, bb });
        } else {
          setIndicators(null);
        }
      } catch (e) {
        console.error("Failed to calculate indicators", e);
        setIndicators(null);
      } finally {
        setCalculatingIndicators(false);
      }
    };

    fetchAndCalculate();
  }, [prediction]);

  const handlePredict = async () => {
    if (marketData.length === 0) return;
    setLoading(true);
    setPrediction(null);
    setIndicators(null);
    try {
      const result = await generateMarketPrediction(marketData);
      setPrediction(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Technical Indicator Math Utils ---

  const calculateRSI = (prices: number[], period = 14) => {
    if (prices.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;

    // Simple initialization
    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    const rs = avgGain / (avgLoss || 1); 
    return 100 - (100 / (1 + rs));
  };

  const calculateEMAArray = (prices: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const emas = new Array(prices.length).fill(0);
    
    // Initialize with simple SMA
    let sum = 0;
    for (let i = 0; i < period; i++) sum += prices[i];
    emas[period - 1] = sum / period;

    // Calculate EMA rest
    for (let i = period; i < prices.length; i++) {
      emas[i] = prices[i] * k + emas[i - 1] * (1 - k);
    }
    return emas;
  }

  const calculateMACD = (prices: number[]) => {
    // Need at least 26 + 9 points
    if (prices.length < 35) return { value: 0, signal: 0, histogram: 0, history: [] };
    
    const ema12 = calculateEMAArray(prices, 12);
    const ema26 = calculateEMAArray(prices, 26);
    
    const macdLine = [];
    // Calculate MACD line where both EMAs exist
    for(let i = 0; i < prices.length; i++) {
        if (i >= 25) macdLine.push(ema12[i] - ema26[i]);
        else macdLine.push(0);
    }

    // Calculate Signal Line (9 EMA of MACD Line)
    const validMacdStart = 26;
    const signalLine = new Array(prices.length).fill(0);
    
    // Simple SMA for first signal point
    let sum = 0;
    for(let i=validMacdStart; i < validMacdStart+9; i++) sum += macdLine[i];
    signalLine[validMacdStart+8] = sum/9;

    const k = 2 / (9 + 1);
    for(let i = validMacdStart+9; i < prices.length; i++) {
        signalLine[i] = macdLine[i] * k + signalLine[i-1] * (1 - k);
    }

    const currentIdx = prices.length - 1;
    const value = macdLine[currentIdx];
    const signal = signalLine[currentIdx];
    const histogram = value - signal;

    // Get last 20 bars for history viz to show more context
    const history = [];
    const lookback = 20;
    const start = Math.max(0, prices.length - lookback);
    for(let i = start; i < prices.length; i++) {
        history.push(macdLine[i] - signalLine[i]);
    }

    return { value, signal, histogram, history };
  };

  const calculateBollingerBands = (prices: number[], period = 20) => {
    if (prices.length < period) return { upper: 0, lower: 0, percentB: 0.5, history: [] };
    
    const history = [];
    
    // Calculate for the last 20 points to show a trend line
    const startIdx = Math.max(period, prices.length - 20);
    
    for (let i = startIdx; i < prices.length; i++) {
        const slice = prices.slice(i - period + 1, i + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        const mean = sum / period;
        const squaredDiffs = slice.map(p => Math.pow(p - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
        const stdDev = Math.sqrt(variance);
        
        history.push({
            upper: mean + 2 * stdDev,
            lower: mean - 2 * stdDev,
            price: prices[i]
        });
    }

    const current = history[history.length - 1];
    
    return {
      upper: current.upper,
      lower: current.lower,
      percentB: (current.price - current.lower) / (current.upper - current.lower),
      history
    };
  };

  // --- Render Utils ---

  const translateRisk = (risk: string) => {
     switch(risk) {
      case 'LOW': return 'НИЗКИЙ';
      case 'MEDIUM': return 'СРЕДНИЙ';
      case 'HIGH': return 'ВЫСОКИЙ';
      case 'SPECULATIVE': return 'СПЕКУЛЯТИВНЫЙ';
      default: return risk;
    }
  };

  const translateAction = (action: string) => {
    switch(action) {
      case 'BUY': return 'ПОКУПКА (LONG)';
      case 'SELL': return 'ПРОДАЖА (SHORT)';
      case 'HOLD': return 'УДЕРЖАНИЕ';
      default: return action;
    }
  };

  const getActionStyles = (action: string) => {
    switch(action) {
      case 'BUY': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'SELL': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getConfidenceColorClass = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  const renderRiskBars = (level: string) => {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'SPECULATIVE'];
    const currentIndex = levels.indexOf(level);
    
    return (
      <div className="flex gap-1 h-1.5 w-full mt-2 bg-slate-800 rounded-full overflow-hidden">
        {levels.map((l, idx) => {
          let colorClass = 'bg-slate-700';
          
          if (idx <= currentIndex) {
            if (currentIndex === 0) colorClass = 'bg-green-500'; 
            else if (currentIndex === 1) colorClass = 'bg-blue-400'; 
            else if (currentIndex === 2) colorClass = 'bg-amber-500'; 
            else colorClass = 'bg-red-500'; 
          }
          
          return (
            <div 
              key={l} 
              className={`flex-1 transition-all duration-500 ${colorClass}`} 
            />
          );
        })}
      </div>
    );
  };

  // Render Bollinger Bands Mini Chart using SVG
  const renderBBChart = (history: { upper: number; lower: number; price: number }[]) => {
      if (history.length === 0) return null;
      
      const width = 80;
      const height = 40;
      const padding = 2;
      
      const minVal = Math.min(...history.map(h => h.lower));
      const maxVal = Math.max(...history.map(h => h.upper));
      const range = maxVal - minVal || 1;
      
      const normalize = (val: number) => {
          return height - padding - ((val - minVal) / range) * (height - 2 * padding);
      };
      
      const getPath = (key: 'upper' | 'lower' | 'price') => {
          return history.map((d, i) => {
              const x = (i / (history.length - 1)) * width;
              const y = normalize(d[key]);
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');
      };

      return (
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
              <path d={getPath('upper')} fill="none" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.4" />
              <path d={getPath('lower')} fill="none" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.4" />
              <path d={getPath('price')} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
          </svg>
      );
  };

  // Render MACD Histogram Chart using SVG
  const renderMACDChart = (history: number[]) => {
      if (history.length === 0) return null;

      const height = 32; 
      const width = 120;
      const maxAbs = Math.max(...history.map(Math.abs)) || 0.00001; 
      
      const count = history.length;
      const barWidth = (width / count) * 0.7; 
      const gap = (width / count) * 0.3; 

      return (
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
              <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#475569" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
              
              {history.map((val, i) => {
                  const h = (Math.abs(val) / maxAbs) * (height / 2 * 0.85); 
                  const x = i * (width / count) + gap / 2;
                  const isPositive = val >= 0;
                  const y = isPositive ? (height / 2 - h) : (height / 2);
                  
                  return (
                      <rect 
                        key={i}
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={Math.max(1, h)} 
                        fill={isPositive ? '#4ade80' : '#f87171'}
                        rx={1}
                        className="transition-all duration-300"
                      />
                  );
              })}
          </svg>
      );
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 border-l border-slate-800 shrink-0 relative overflow-hidden font-sans">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900 z-10 relative flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-500" />
            Market Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Технический анализ и оценка рисков
          </p>
        </div>
        
        {/* Mobile Close Button */}
        {onClose && (
            <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white transition-colors p-2">
                <X className="w-6 h-6" />
            </button>
        )}
      </div>

      <div className="flex-1 p-5 overflow-y-auto relative z-10 scrollbar-thin">
        {!prediction && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
            <div className="p-6 bg-slate-800/50 rounded-full">
              <Activity className="w-12 h-12 text-slate-500" />
            </div>
            <div className="max-w-[260px] space-y-2">
              <h3 className="text-slate-300 font-medium">Готов к анализу</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Нажмите кнопку ниже для проведения комплексного анализа рынка с использованием ИИ. Будут рассмотрены тренды, объемы и уровни риска.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-brand-500 text-xs font-medium tracking-wide animate-pulse">
              {loadingText}
            </p>
          </div>
        )}

        {prediction && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-800 rounded-lg p-5 border border-slate-700 shadow-sm relative overflow-hidden">
               
               {/* Header Info */}
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Тикер</span>
                   <h3 className="text-3xl font-bold text-white mt-1">{prediction.coin}</h3>
                 </div>
                 <div className={`px-3 py-1.5 rounded-md text-xs font-bold border ${getActionStyles(prediction.action)}`}>
                   {translateAction(prediction.action)}
                 </div>
               </div>

               {/* Metrics Grid */}
               <div className="grid gap-4 mb-6">
                 <div className="grid grid-cols-2 gap-4">
                   {/* Target */}
                   <div className="p-3 bg-slate-900/50 rounded border border-slate-700/50">
                     <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                       <Target className="w-3 h-3 text-brand-500" />
                       Техн. Цель
                     </div>
                     <span className="font-mono text-slate-200 font-medium text-base">{prediction.targetPrice}</span>
                   </div>

                   {/* Signal Strength */}
                   <div className="p-3 bg-slate-900/50 rounded border border-slate-700/50">
                     <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">
                       <Crosshair className="w-3 h-3 text-brand-500" />
                       Сила Сигнала
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full ${getConfidenceColorClass(prediction.confidence)}`} 
                           style={{ width: `${prediction.confidence}%` }}
                         />
                       </div>
                       <span className="text-xs text-slate-300 font-mono">{prediction.confidence}%</span>
                     </div>
                   </div>
                 </div>

                 {/* Risk Assessment */}
                 <div className="p-3 bg-slate-900/50 rounded border border-slate-700/50">
                   <div className="flex justify-between items-center mb-1">
                     <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                       <ShieldAlert className="w-3 h-3 text-amber-500" />
                       Уровень Риска
                     </div>
                     <span className="font-mono text-xs font-bold text-slate-300">
                       {translateRisk(prediction.riskLevel)}
                     </span>
                   </div>
                   {renderRiskBars(prediction.riskLevel)}
                 </div>
               </div>

               {/* Analysis Text */}
               <div>
                 <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-2">Аналитическое Обоснование</h4>
                 <div className="p-3 bg-slate-900/30 rounded border border-slate-700/30">
                   <p className="text-slate-300 text-sm leading-relaxed">
                     {prediction.reasoning}
                   </p>
                 </div>
               </div>
            </div>

            {/* Technical Analysis Section */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Технические Индикаторы (15m)
                 </h4>
                 {calculatingIndicators && <span className="text-[10px] text-slate-500 animate-pulse">Обновление...</span>}
               </div>
               
               {indicators ? (
                 <div className="grid grid-cols-3 gap-2">
                   {/* RSI */}
                   <div className="p-2 bg-slate-900 rounded border border-slate-800 flex flex-col items-center justify-center">
                     <span className="text-[9px] text-slate-500 font-mono mb-1">RSI (14)</span>
                     <span className={`font-mono font-bold text-lg ${
                         indicators.rsi > 70 ? 'text-red-400' : 
                         indicators.rsi < 30 ? 'text-green-400' : 
                         'text-slate-200'
                     }`}>
                       {indicators.rsi.toFixed(1)}
                     </span>
                     <div className="w-full h-1 bg-slate-800 mt-1 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500" style={{ width: `${indicators.rsi}%` }}></div>
                     </div>
                   </div>

                   {/* MACD */}
                   <div className="p-2 bg-slate-900 rounded border border-slate-800 flex flex-col items-center justify-between">
                     <span className="text-[9px] text-slate-500 font-mono flex gap-1 items-center">MACD</span>
                     <div className="w-full h-8 my-1 opacity-80">
                        {renderMACDChart(indicators.macd.history)}
                     </div>
                   </div>

                   {/* Bollinger */}
                   <div className="p-2 bg-slate-900 rounded border border-slate-800 flex flex-col items-center justify-between">
                     <span className="text-[9px] text-slate-500 font-mono flex gap-1 items-center">BB %</span>
                     <div className="w-full h-8 opacity-80 my-1">
                        {renderBBChart(indicators.bb.history)}
                     </div>
                     <span className="font-mono font-medium text-slate-300 text-[10px]">
                       {(indicators.bb.percentB * 100).toFixed(0)}%
                     </span>
                   </div>
                 </div>
               ) : (
                 <div className="text-center text-xs text-slate-600 py-4 italic">
                    {calculatingIndicators ? 'Загрузка...' : 'Нет данных'}
                 </div>
               )}
            </div>

             {/* Disclaimer Box */}
             <div className="p-3 bg-amber-900/10 border border-amber-900/20 rounded flex gap-3 items-start">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-500/80 leading-tight">
                    <span className="font-bold">Предупреждение о рисках:</span> Данный анализ сформирован ИИ на основе исторических данных и не является финансовой рекомендацией. Торговля криптовалютами сопряжена с высоким риском потери капитала.
                </p>
             </div>
          </div>
        )}
      </div>

      {/* Footer / Action Button */}
      <div className="p-5 border-t border-slate-800 bg-slate-900 z-20">
        <button
          onClick={handlePredict}
          disabled={loading || marketData.length === 0}
          className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-brand-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
             {loading ? 'Анализ рынка...' : 'Сгенерировать отчет'}
             {!loading && <Zap className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default PredictionPanel;