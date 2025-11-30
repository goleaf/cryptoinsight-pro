// NOTE: Run with Jest/Vitest; globals assumed.
import { SignalAggregator } from './aggregator';
import { calculateMACD, calculateRSI } from './indicators';
import { classifyRisk, calculateVolatility } from './volatility';
import { MAIN_DISCLAIMER, PROHIBITED_WORDS } from './types';

declare const describe: any;
declare const test: any;
declare const expect: any;

function generatePriceSeries(length: number, start = 100, step = 1) {
  const data = [] as { timestamp: number; price: number }[];
  for (let i = 0; i < length; i++) {
    data.push({ timestamp: i, price: start + step * i });
  }
  return data;
}

function generateMixedSeries() {
  // Rises then falls to create divergence/neutral scenarios
  const up = generatePriceSeries(20, 100, 1);
  const down = generatePriceSeries(20, 120, -1);
  return [...up, ...down];
}

describe('Signals module', () => {
  test('Feature: signals, Property 1: Signal result completeness', () => {
    const aggregator = new SignalAggregator();
    const result = aggregator.compute('BTC-USDT', generatePriceSeries(50));
    expect(result.symbol).toBe('BTC-USDT');
    expect(result.trend).toBeDefined();
    expect(result.momentum).toBeDefined();
    expect(result.risk).toBeDefined();
    expect(result.indicators).toBeDefined();
    expect(result.disclaimer).toContain('informational');
  });

  test('Feature: signals, Property 12: JSON serialization round trip', () => {
    const aggregator = new SignalAggregator();
    const result = aggregator.compute('ETH-USDT', generatePriceSeries(40));
    const parsed = JSON.parse(JSON.stringify(result));
    expect(parsed.symbol).toBe('ETH-USDT');
    expect(parsed.trend.classification).toBeDefined();
    expect(parsed.momentum.score).toBeDefined();
    expect(parsed.risk.level).toBeDefined();
  });

  test('Feature: signals, Property 7: RSI value bounds', () => {
    const prices = generatePriceSeries(30).map((p) => p.price);
    const rsi = calculateRSI(prices, 14);
    expect(rsi).not.toBeNull();
    expect(rsi!).toBeGreaterThanOrEqual(0);
    expect(rsi!).toBeLessThanOrEqual(100);
  });

  test('Feature: signals, Property 8: MACD structure completeness', () => {
    const prices = generatePriceSeries(60).map((p) => p.price);
    const macd = calculateMACD(prices, 12, 26, 9);
    expect(macd).not.toBeNull();
    expect(macd!.macdLine.length).toBe(prices.length);
    expect(macd!.histogram.length).toBe(prices.length);
  });

  test('Feature: signals, Property 3: Risk classification validity', () => {
    const low = classifyRisk({ volatility: 20, dailyStdDev: 0.01, sampleSize: 10 });
    const high = classifyRisk({ volatility: 80, dailyStdDev: 0.03, sampleSize: 10 });
    expect(low.level).toBe('Low');
    expect(high.level).toBe('High');
  });

  test('Feature: signals, Property 2: Trend classification validity', () => {
    const aggregator = new SignalAggregator();
    const bullish = aggregator.compute('BTC-USDT', generatePriceSeries(50));
    expect(bullish.trend.classification).toBe('bullish');

    const bearish = aggregator.compute('BTC-USDT', generatePriceSeries(50, 150, -1));
    expect(bearish.trend.classification).toBe('bearish');
  });

  test('Feature: signals, Property 14: Multiple timeframe analysis', () => {
    const aggregator = new SignalAggregator();
    const result = aggregator.compute('BTC-USDT', generatePriceSeries(60));
    expect(result.indicators.ma7).not.toBeNull();
    expect(result.indicators.ma30).not.toBeNull();
  });

  test('Feature: signals, Property 15: Timeframe divergence notification', () => {
    const aggregator = new SignalAggregator();
    const result = aggregator.compute('BTC-USDT', generateMixedSeries());
    expect(result.trend.classification).toBe('neutral');
  });

  test('Feature: signals, Property 4: Momentum score bounds', () => {
    const aggregator = new SignalAggregator();
    const result = aggregator.compute('BTC-USDT', generatePriceSeries(60));
    expect(result.momentum.score).toBeGreaterThanOrEqual(0);
    expect(result.momentum.score).toBeLessThanOrEqual(100);
  });

  test('Feature: signals, Property 5: Disclaimer presence', () => {
    const aggregator = new SignalAggregator();
    const result = aggregator.compute('BTC-USDT', generatePriceSeries(40));
    expect(result.disclaimer).toBe(MAIN_DISCLAIMER);
    expect(result.trend.explanation.length).toBeGreaterThan(0);
  });

  test('Feature: signals, Property 6: Prohibited language exclusion', () => {
    const aggregator = new SignalAggregator();
    const result = aggregator.compute('BTC-USDT', generatePriceSeries(40));
    const texts = [result.disclaimer, result.trend.explanation, result.momentum.explanation, result.risk.explanation];
    PROHIBITED_WORDS.forEach((word) => {
      texts.forEach((t) => expect(t.toLowerCase()).not.toContain(word));
    });
  });

  test('Feature: signals, Property 13: Volatility calculation correctness', () => {
    const flat = calculateVolatility(generatePriceSeries(10, 100, 0));
    expect(flat.volatility).toBeCloseTo(0);

    const choppy = calculateVolatility([
      { timestamp: 0, price: 100 },
      { timestamp: 1, price: 120 },
      { timestamp: 2, price: 90 },
      { timestamp: 3, price: 130 },
    ]);
    expect(choppy.volatility).toBeGreaterThan(0);
  });
});
