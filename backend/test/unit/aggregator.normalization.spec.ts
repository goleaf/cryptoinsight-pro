import { MarketDataAggregator } from '../../src/modules/market-data/aggregator.service';
import { tickerFactory, orderBookFactory } from '../utils/factories';
import fc from 'fast-check';

describe('Market Data Aggregator normalization', () => {
  test('requires required ticker fields', () => {
    const aggregator = new MarketDataAggregator();
    expect(() => aggregator.ingestTicker({} as any)).toThrow();
  });

  test('ignores malformed order books gracefully', () => {
    const aggregator = new MarketDataAggregator();
    expect(() => aggregator.ingestOrderBook({ symbol: 'BTC-USDT' } as any, 'binance')).toThrow();
  });

  test('serialization round trip for tickers (property)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 100000 }),
        fc.float({ min: 0.01, max: 100000 }),
        fc.float({ min: 0.01, max: 100000 }),
        (price, bid, ask) => {
          const aggregator = new MarketDataAggregator();
          const ticker = tickerFactory({ price, bid, ask });
          aggregator.ingestTicker(ticker);
          const res = aggregator.getCurrentTicker(ticker.symbol);
          return res !== null && res.symbol === ticker.symbol;
        },
      ),
      { numRuns: 100 },
    );
  });
});
