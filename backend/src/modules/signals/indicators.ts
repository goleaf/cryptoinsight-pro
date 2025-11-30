import { MACDResult, PriceDataPoint } from './types';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function calculateMA(prices: number[], period: number): number | null {
  if (period <= 0 || prices.length < period) return null;
  const window = prices.slice(-period);
  const sum = window.reduce((acc, v) => acc + v, 0);
  return sum / period;
}

export function calculateEMA(prices: number[], period: number): number | null {
  if (period <= 0 || prices.length === 0) return null;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calculateRSI(prices: number[], period = 14): number | null {
  if (period <= 0 || prices.length <= period) return null;

  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  if (avgGain === 0) return 0;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return clamp(rsi, 0, 100);
}

export function calculateMACD(prices: number[], shortPeriod = 12, longPeriod = 26, signalPeriod = 9): MACDResult | null {
  if (prices.length < longPeriod) return null;

  // EMA series
  const emaShortSeries: number[] = [];
  const emaLongSeries: number[] = [];

  let emaShort: number | null = null;
  let emaLong: number | null = null;
  const kShort = 2 / (shortPeriod + 1);
  const kLong = 2 / (longPeriod + 1);

  prices.forEach((price, idx) => {
    emaShort = emaShort === null ? price : price * kShort + emaShort * (1 - kShort);
    emaLong = emaLong === null ? price : price * kLong + emaLong * (1 - kLong);
    emaShortSeries.push(emaShort);
    emaLongSeries.push(emaLong);
  });

  const macdLine = emaShortSeries.map((v, i) => v - emaLongSeries[i]);

  const signalLine: number[] = [];
  let emaSignal: number | null = null;
  const kSignal = 2 / (signalPeriod + 1);
  macdLine.forEach((value) => {
    emaSignal = emaSignal === null ? value : value * kSignal + emaSignal * (1 - kSignal);
    signalLine.push(emaSignal);
  });

  const histogram = macdLine.map((v, i) => v - signalLine[i]);

  return { macdLine, signalLine, histogram };
}

export function extractPrices(data: PriceDataPoint[]): number[] {
  return data.map((p) => p.price);
}

export function normalizeMacdHistogram(value: number): number {
  // Simple normalization to 0-100 anchored at 50 with moderate scaling
  const scaled = 50 + value * 10;
  return clamp(scaled, 0, 100);
}
