// NOTE: In a real project, run this with Jest or Vitest
import { MarketDataAggregator } from './aggregator.service';
import { FailingCacheService, InMemoryCacheService } from './cache.service';
import {
  InvalidSymbolError,
  NormalizedOrderBook,
  NormalizedTicker,
  NormalizedTrade,
} from './types';

// Declare Jest globals to satisfy TypeScript compiler when @types/jest is missing
declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

console.log = jest.fn();

describe('CacheService', () => {
  test('Feature: crypto-analytics-platform, Property 29: Cache TTL enforcement', async () => {
    const cache = new InMemoryCacheService({ defaultTtlMs: 5, cleanupIntervalMs: 1000 });
    cache.set('key', 'value');
    expect(cache.get<string>('key')).toBe('value');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(cache.get<string>('key')).toBeNull();
    cache.dispose();
  });

  test('Feature: crypto-analytics-platform, Property 31: Cache eviction under pressure', () => {
    const cache = new InMemoryCacheService({ maxEntries: 2, defaultTtlMs: 1000, cleanupIntervalMs: 1000 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // Should evict the least recently used key "a"

    expect(cache.get<number>('a')).toBeNull();
    expect(cache.get<number>('b')).toBe(2);
    expect(cache.get<number>('c')).toBe(3);
    expect(cache.stats().evictions).toBeGreaterThan(0);
    cache.dispose();
  });
});

describe('MarketDataAggregator', () => {
  let aggregator: MarketDataAggregator;

  beforeEach(() => {
    aggregator = new MarketDataAggregator({
      cacheTtls: { tickerMs: 100, orderBookMs: 100, tradesMs: 100 },
      conflictResolution: { strategy: 'vwap', staleMs: 10000, outlierStdDev: 2 },
    });
  });

  test('Feature: crypto-analytics-platform, Property 32: VWAP calculation correctness', () => {
    const binanceTicker: NormalizedTicker = {
      symbol: 'BTC-USDT',
      exchange: 'binance',
      price: 50000,
      bid: 49990,
      ask: 50010,
      volume24h: 1000,
      timestamp: Date.now(),
    };

    const krakenTicker: NormalizedTicker = {
      symbol: 'BTC-USDT',
      exchange: 'kraken',
      price: 51000,
      bid: 50990,
      ask: 51010,
      volume24h: 100,
      timestamp: Date.now(),
    };

    aggregator.ingestTicker(binanceTicker);
    aggregator.ingestTicker(krakenTicker);

    const result = aggregator.getCurrentTicker('BTC-USDT');
    expect(result).toBeDefined();
    expect(result!.price).toBeCloseTo(50090.9, 1);
    expect(result!.volume24h).toBe(1100);
    expect(result!.sources).toBe(2);
  });

  test('Feature: crypto-analytics-platform, Property 33: Per-exchange price preservation', () => {
    const agg = new MarketDataAggregator({ conflictResolution: { strategy: 'per-exchange', staleMs: 10000, outlierStdDev: 2 } });
    agg.ingestTicker({ symbol: 'ETH-USDT', exchange: 'binance', price: 3000, bid: 2998, ask: 3002, volume24h: 500, timestamp: Date.now() });
    agg.ingestTicker({ symbol: 'ETH-USDT', exchange: 'coinbase', price: 3010, bid: 3008, ask: 3012, volume24h: 300, timestamp: Date.now() });

    const result = agg.getCurrentTicker('ETH-USDT');
    expect(result).toBeDefined();
    expect(result!.perExchange).toHaveLength(2);
    expect(result!.perExchange!.find((p) => p.exchange === 'binance')!.price).toBe(3000);
    expect(result!.perExchange!.find((p) => p.exchange === 'coinbase')!.price).toBe(3010);
  });

  test('Feature: crypto-analytics-platform, Property 34: Stale data exclusion', () => {
    const oldTicker: NormalizedTicker = {
      symbol: 'ETH-USDT',
      exchange: 'binance',
      price: 3000,
      bid: 2990,
      ask: 3010,
      volume24h: 500,
      timestamp: Date.now() - 20000,
    };

    aggregator.ingestTicker(oldTicker);
    const result = aggregator.getCurrentTicker('ETH-USDT');
    expect(result).toBeNull();
  });

  test('Feature: crypto-analytics-platform, Property 35: Outlier flagging', () => {
    const agg = new MarketDataAggregator({ conflictResolution: { strategy: 'vwap', staleMs: 10000, outlierStdDev: 1 } });
    agg.ingestTicker({ symbol: 'BTC-USDT', exchange: 'binance', price: 50000, bid: 49990, ask: 50010, volume24h: 1000, timestamp: Date.now() });
    agg.ingestTicker({ symbol: 'BTC-USDT', exchange: 'coinbase', price: 50100, bid: 50090, ask: 50110, volume24h: 900, timestamp: Date.now() });
    agg.ingestTicker({ symbol: 'BTC-USDT', exchange: 'skewed', price: 52000, bid: 51990, ask: 52010, volume24h: 10, timestamp: Date.now() });

    const result = agg.getCurrentTicker('BTC-USDT');
    expect(result).toBeDefined();
    expect(result!.outliers).toContain('skewed');
    expect(result!.price).toBeLessThan(50500);
  });

  test('Feature: crypto-analytics-platform, Property 36: getCurrentTicker function validity', () => {
    const agg = new MarketDataAggregator({ conflictResolution: { strategy: 'best-bid-ask', staleMs: 10000, outlierStdDev: 2 } });
    agg.ingestTicker({ symbol: 'SOL-USDT', exchange: 'binance', price: 100, bid: 99, ask: 101, volume24h: 50, timestamp: Date.now() });
    agg.ingestTicker({ symbol: 'SOL-USDT', exchange: 'kraken', price: 101, bid: 100, ask: 102, volume24h: 75, timestamp: Date.now() });

    const result = agg.getCurrentTicker('SOL-USDT');
    expect(result).toBeDefined();
    expect(result!.price).toBeCloseTo((100 + 101) / 2, 1);
    expect(result!.bestBid).toBe(100);
    expect(result!.bestAsk).toBe(101);
  });

  test('Feature: crypto-analytics-platform, Property 37: getAllTickers completeness', () => {
    aggregator.ingestTicker({ symbol: 'BTC-USDT', exchange: 'binance', price: 50000, bid: 49990, ask: 50010, volume24h: 1000, timestamp: Date.now() });
    aggregator.ingestTicker({ symbol: 'ETH-USDT', exchange: 'binance', price: 3000, bid: 2995, ask: 3005, volume24h: 500, timestamp: Date.now() });

    const results = aggregator.getAllTickers();
    const symbols = results.map((r) => r.symbol);
    expect(symbols).toContain('BTC-USDT');
    expect(symbols).toContain('ETH-USDT');
  });

  test('Feature: crypto-analytics-platform, Property 38: getOrderBook merge correctness', () => {
    const binanceBook: NormalizedOrderBook = {
      symbol: 'BTC-USDT',
      timestamp: Date.now(),
      bids: [{ price: 49900, amount: 1, exchange: 'binance' }],
      asks: [{ price: 50100, amount: 1, exchange: 'binance' }],
    };

    const krakenBook: NormalizedOrderBook = {
      symbol: 'BTC-USDT',
      timestamp: Date.now(),
      bids: [{ price: 50000, amount: 0.5, exchange: 'kraken' }],
      asks: [{ price: 50050, amount: 0.5, exchange: 'kraken' }],
    };

    aggregator.ingestOrderBook(binanceBook, 'binance');
    aggregator.ingestOrderBook(krakenBook, 'kraken');

    const result = aggregator.getOrderBook('BTC-USDT');
    expect(result).toBeDefined();
    expect(result!.bids[0].price).toBe(50000);
    expect(result!.asks[0].price).toBe(50050);
  });

  test('Feature: crypto-analytics-platform, Property 39: getRecentTrades aggregation', () => {
    const tradeA: NormalizedTrade = { id: '1', symbol: 'BTC-USDT', price: 50000, amount: 0.1, side: 'buy', exchange: 'binance', timestamp: Date.now() };
    const tradeB: NormalizedTrade = { id: '2', symbol: 'BTC-USDT', price: 50010, amount: 0.2, side: 'sell', exchange: 'coinbase', timestamp: Date.now() + 5 };
    const tradeC: NormalizedTrade = { id: '3', symbol: 'BTC-USDT', price: 49990, amount: 0.15, side: 'buy', exchange: 'kraken', timestamp: Date.now() - 5 };

    aggregator.ingestTrade(tradeA);
    aggregator.ingestTrade(tradeB);
    aggregator.ingestTrade(tradeC);

    const trades = aggregator.getRecentTrades('BTC-USDT', 2);
    expect(trades).toHaveLength(2);
    expect(trades[0].id).toBe('2');
    expect(trades[1].id).toBe('1');
  });

  test('Feature: crypto-analytics-platform, Property 30: Cache fallback resilience', () => {
    const agg = new MarketDataAggregator({ cache: new FailingCacheService(), strictSymbols: false });
    agg.ingestTicker({ symbol: 'BTC-USDT', exchange: 'binance', price: 50000, bid: 49990, ask: 50010, volume24h: 1000, timestamp: Date.now() });
    const result = agg.getCurrentTicker('BTC-USDT');
    expect(result).toBeDefined();
    expect(result!.price).toBeGreaterThan(0);
  });

  test('Feature: crypto-analytics-platform, Property 40: Invalid symbol handling', () => {
    const agg = new MarketDataAggregator({ strictSymbols: true });
    expect(() => agg.getCurrentTicker('UNKNOWN')).toThrow(InvalidSymbolError);
    expect(() => agg.getOrderBook('UNKNOWN')).toThrow(InvalidSymbolError);
  });
});
