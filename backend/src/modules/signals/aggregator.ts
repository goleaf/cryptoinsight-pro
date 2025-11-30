import {
  MAIN_DISCLAIMER,
  MomentumSignal,
  PriceDataPoint,
  RiskSignal,
  SignalResult,
  TechnicalIndicators,
  TrendSignal,
} from './types';
import {
  calculateEMA,
  calculateMA,
  calculateMACD,
  calculateRSI,
  extractPrices,
  normalizeMacdHistogram,
} from './indicators';
import { calculateVolatility, classifyRisk } from './volatility';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export class SignalAggregator {
  public compute(symbol: string, prices: PriceDataPoint[]): SignalResult {
    const indicators = this.computeIndicators(prices);
    const trend = this.computeTrend(indicators);
    const momentum = this.computeMomentum(indicators);
    const risk = this.computeRisk(prices);

    return {
      symbol,
      timestamp: Date.now(),
      trend,
      momentum,
      risk,
      indicators,
      disclaimer: MAIN_DISCLAIMER,
    };
  }

  private computeIndicators(data: PriceDataPoint[]): TechnicalIndicators {
    const prices = extractPrices(data);
    const ma7 = calculateMA(prices, 7);
    const ma30 = calculateMA(prices, 30);
    const ema7 = calculateEMA(prices, 7);
    const ema30 = calculateEMA(prices, 30);
    const rsi14 = calculateRSI(prices, 14);
    const macd = calculateMACD(prices, 12, 26, 9);

    return { ma7, ma30, ema7, ema30, rsi14, macd };
  }

  private computeTrend(indicators: TechnicalIndicators): TrendSignal {
    const { ma7, ma30, ema7, ema30 } = indicators;
    let classification: TrendSignal['classification'] = 'neutral';
    if (ma7 !== null && ma30 !== null && ema7 !== null && ema30 !== null) {
      if (ma7 > ma30 && ema7 > ema30) classification = 'bullish';
      else if (ma7 < ma30 && ema7 < ema30) classification = 'bearish';
    }

    const score = classification === 'bullish' ? 80 : classification === 'bearish' ? 20 : 50;
    const explanation = `Short-term (7) vs long-term (30) moving averages suggest a ${classification} tilt. This is informational and speculative.`;

    return { classification, score, explanation };
  }

  private computeMomentum(indicators: TechnicalIndicators): MomentumSignal {
    const rsi = indicators.rsi14 ?? null;
    const macdHistogram = indicators.macd ? indicators.macd.histogram.at(-1)! : null;
    const normalizedMacd = macdHistogram !== null ? normalizeMacdHistogram(macdHistogram) : 50;
    const rsiValue = rsi ?? 50;

    const score = clamp(0.6 * rsiValue + 0.4 * normalizedMacd, 0, 100);
    const explanation = `RSI and MACD momentum combined into a balanced score. Interpret cautiously; no outcomes are promised.`;

    return {
      score,
      rsi,
      macdHistogram,
      explanation,
    };
  }

  private computeRisk(prices: PriceDataPoint[]): RiskSignal {
    const vol = calculateVolatility(prices);
    return classifyRisk(vol);
  }
}
