export interface PriceDataPoint {
  timestamp: number; // ms epoch
  price: number;
}

export interface MACDResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export interface TechnicalIndicators {
  ma7: number | null;
  ma30: number | null;
  ema7: number | null;
  ema30: number | null;
  rsi14: number | null;
  macd: MACDResult | null;
}

export interface TrendSignal {
  classification: 'bullish' | 'neutral' | 'bearish';
  score: number; // 0-100
  explanation: string;
}

export interface MomentumSignal {
  score: number; // 0-100
  rsi: number | null;
  macdHistogram: number | null;
  explanation: string;
}

export interface VolatilityResult {
  volatility: number; // annualized percentage
  dailyStdDev: number;
  sampleSize: number;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface RiskSignal {
  level: RiskLevel;
  explanation: string;
  volatility: VolatilityResult;
}

export interface SignalResult {
  symbol: string;
  timestamp: number;
  trend: TrendSignal;
  momentum: MomentumSignal;
  risk: RiskSignal;
  indicators: TechnicalIndicators;
  disclaimer: string;
}

export const MAIN_DISCLAIMER =
  'Signals are informational and experimental; they do not constitute financial advice or assured outcomes.';

export const PROHIBITED_WORDS = ['guarantee', 'sure bet', 'risk-free'];
