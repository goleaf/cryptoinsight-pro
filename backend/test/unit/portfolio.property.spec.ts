import fc from 'fast-check';
import { PositionRepository } from '../../src/modules/portfolio/repository';
import { CalculationEngine } from '../../src/modules/portfolio/calculation-engine';
import { PriceSource } from '../../src/modules/portfolio/types';

class StaticPriceSource implements PriceSource {
  constructor(private price: number) {}
  getCurrentTicker(symbol: string) {
    return { symbol, price: this.price, change24h: 0, volume24h: 0, bestBid: 0, bestAsk: 0, sources: 1, timestamp: Date.now() } as any;
  }
}

describe('Portfolio property-based tests', () => {
  test('total value equals sum of positions (100 runs)', () => {
    fc.assert(
      fc.property(fc.array(fc.float({ min: 0.01, max: 10 }), { minLength: 1, maxLength: 10 }), (amounts) => {
        const repo = new PositionRepository();
        const priceSource = new StaticPriceSource(100);
        const calc = new CalculationEngine(priceSource, 1000);

        amounts.forEach((amt, idx) => {
          repo.create('user', { symbol: `ASSET-${idx}`, amount: amt, entryPrice: 50, entryDate: '2024-01-01' });
          // seed price to avoid fetch
          calc.seedPrice(`ASSET-${idx}`, 100);
        });

        const metrics = repo.findAll('user').map((p) => calc.withMetrics(p));
        const summary = calc.summarize(metrics);
        const manual = metrics.reduce((sum, p) => sum + p.currentValue, 0);
        return Math.abs(summary.totalValue - manual) < 0.0001;
      }),
      { numRuns: 100 },
    );
  });
});
