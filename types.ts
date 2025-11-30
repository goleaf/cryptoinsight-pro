export interface TickerData {
  s: string; // Symbol
  c: string; // Close price
  p: string; // Price change
  P: string; // Price change percent
  v: string; // Volume
  q: string; // Quote volume
}

export interface CoinData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PredictionResult {
  coin: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'SPECULATIVE';
  targetPrice: string;
}

export enum ConnectionStatus {
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
  ERROR
}