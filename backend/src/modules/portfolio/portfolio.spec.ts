// NOTE: These specs assume Jest/Vitest globals are available when executed.
import { CalculationEngine } from './calculation-engine';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PositionRepository } from './repository';
import { PriceSource } from './types';

declare const describe: any;
declare const test: any;
declare const expect: any;
declare const beforeEach: any;

class FakePriceSource implements PriceSource {
  constructor(private prices: Record<string, number>) {}
  getCurrentTicker(symbol: string) {
    if (!(symbol in this.prices)) return null;
    return { symbol, price: this.prices[symbol], change24h: 0, volume24h: 0, bestBid: 0, bestAsk: 0, sources: 1, timestamp: Date.now() } as any;
  }
}

describe('Portfolio module', () => {
  let repository: PositionRepository;
  let calculator: CalculationEngine;
  let service: PortfolioService;
  let controller: PortfolioController;

  beforeEach(() => {
    repository = new PositionRepository();
    calculator = new CalculationEngine(new FakePriceSource({ 'BTC-USDT': 200, 'ETH-USDT': 150, 'SOL-USDT': 50 }));
    service = new PortfolioService(repository, calculator);
    controller = new PortfolioController(service);
  });

  test('Feature: portfolio, Property 1: Position creation round-trip', () => {
    const created = repository.create('user1', { symbol: 'BTC-USDT', amount: 1, entryPrice: 100, entryDate: '2024-01-01' });
    const fetched = repository.findById('user1', created.id);
    expect(fetched).toBeDefined();
    expect(fetched!.symbol).toBe('BTC-USDT');
    expect(fetched!.amount).toBe(1);
  });

  test('Feature: portfolio, Property 2: Invalid position rejection', () => {
    expect(() => repository.create('user1', { symbol: 'BTC-USDT', amount: -1, entryPrice: 100, entryDate: '2024-01-01' })).toThrow();
  });

  test('Feature: portfolio, Property 9: Position deletion removes record', () => {
    const created = repository.create('user1', { symbol: 'ETH-USDT', amount: 2, entryPrice: 50, entryDate: '2024-01-01' });
    const deleted = repository.delete('user1', created.id);
    expect(deleted).toBe(true);
    expect(repository.findById('user1', created.id)).toBeNull();
  });

  test('Feature: portfolio, Property 17: User data isolation', () => {
    repository.create('user1', { symbol: 'SOL-USDT', amount: 3, entryPrice: 10, entryDate: '2024-01-01' });
    expect(repository.findAll('user2')).toHaveLength(0);
  });

  test('Feature: portfolio, Property 4: Current value calculation correctness', () => {
    const position = repository.create('user1', { symbol: 'BTC-USDT', amount: 2, entryPrice: 150, entryDate: '2024-01-01' });
    const withMetrics = calculator.withMetrics(position);
    expect(withMetrics.currentValue).toBeCloseTo(400); // 2 * 200
  });

  test('Feature: portfolio, Property 5: Unrealized PnL calculation correctness', () => {
    const position = repository.create('user1', { symbol: 'BTC-USDT', amount: 2, entryPrice: 150, entryDate: '2024-01-01' });
    const withMetrics = calculator.withMetrics(position);
    expect(withMetrics.unrealizedPnl).toBeCloseTo(100); // (200-150)*2
  });

  test('Feature: portfolio, Property 6: PnL percentage calculation correctness', () => {
    const position = repository.create('user1', { symbol: 'BTC-USDT', amount: 2, entryPrice: 150, entryDate: '2024-01-01' });
    const withMetrics = calculator.withMetrics(position);
    expect(withMetrics.pnlPercent).toBeCloseTo((100 / 300) * 100); // 33.33%
  });

  test('Feature: portfolio, Property 10: Total portfolio value is sum of positions', () => {
    repository.create('user1', { symbol: 'BTC-USDT', amount: 1, entryPrice: 100, entryDate: '2024-01-01' });
    repository.create('user1', { symbol: 'ETH-USDT', amount: 2, entryPrice: 100, entryDate: '2024-01-02' });
    const summary = service.getPortfolioSummary('user1');
    expect(summary.totalValue).toBeCloseTo(200 + 300); // 1*200 + 2*150
  });

  test('Feature: portfolio, Property 11: Total unrealized PnL is sum of position PnLs', () => {
    repository.create('user1', { symbol: 'BTC-USDT', amount: 1, entryPrice: 180, entryDate: '2024-01-01' });
    repository.create('user1', { symbol: 'ETH-USDT', amount: 2, entryPrice: 100, entryDate: '2024-01-02' });
    const metrics = service.getPositionsWithMetrics('user1');
    const summary = service.getPortfolioSummary('user1');
    const manualPnl = metrics.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    expect(summary.totalUnrealizedPnl).toBeCloseTo(manualPnl);
  });

  test('Feature: portfolio, Property 12: Total PnL percentage calculation correctness', () => {
    repository.create('user1', { symbol: 'BTC-USDT', amount: 1, entryPrice: 100, entryDate: '2024-01-01' });
    repository.create('user1', { symbol: 'ETH-USDT', amount: 1, entryPrice: 100, entryDate: '2024-01-02' });
    const summary = service.getPortfolioSummary('user1');
    // Total entry value = 200, current value = 200 + 150 = 350, pnl = 150
    expect(summary.totalPnlPercent).toBeCloseTo((150 / 200) * 100);
  });

  test('Feature: portfolio, Property 13: Allocation percentages sum to 100', () => {
    repository.create('user1', { symbol: 'BTC-USDT', amount: 1, entryPrice: 100, entryDate: '2024-01-01' });
    repository.create('user1', { symbol: 'ETH-USDT', amount: 2, entryPrice: 100, entryDate: '2024-01-02' });
    const allocation = service.getPortfolioAllocation('user1');
    const total = allocation.entries.reduce((sum, e) => sum + e.percentage, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  test('Feature: portfolio, Property 14: Allocation calculation correctness', () => {
    repository.create('user1', { symbol: 'BTC-USDT', amount: 1, entryPrice: 100, entryDate: '2024-01-01' });
    repository.create('user1', { symbol: 'ETH-USDT', amount: 2, entryPrice: 100, entryDate: '2024-01-02' });
    const allocation = service.getPortfolioAllocation('user1');
    const btc = allocation.entries.find((e) => e.symbol === 'BTC-USDT');
    const eth = allocation.entries.find((e) => e.symbol === 'ETH-USDT');
    expect(btc!.percentage).toBeCloseTo((200 / 500) * 100);
    expect(eth!.percentage).toBeCloseTo((300 / 500) * 100);
  });

  test('Feature: portfolio, Property 3: Position display completeness', () => {
    repository.create('user1', { symbol: 'BTC-USDT', amount: 1, entryPrice: 100, entryDate: '2024-01-01' });
    const positions = service.getPositionsWithMetrics('user1');
    expect(positions[0]).toHaveProperty('currentPrice');
    expect(positions[0]).toHaveProperty('currentValue');
    expect(positions[0]).toHaveProperty('unrealizedPnl');
  });

  test('Feature: portfolio, Property 15: Allocation completeness', () => {
    repository.create('user1', { symbol: 'BTC-USDT', amount: 1, entryPrice: 100, entryDate: '2024-01-01' });
    repository.create('user1', { symbol: 'ETH-USDT', amount: 2, entryPrice: 100, entryDate: '2024-01-02' });
    const allocation = service.getPortfolioAllocation('user1');
    expect(allocation.entries.map((e) => e.symbol)).toEqual(expect.arrayContaining(['BTC-USDT', 'ETH-USDT']));
  });

  test('Feature: portfolio, Property 7: Position update preserves identity', () => {
    const created = repository.create('user1', { symbol: 'SOL-USDT', amount: 3, entryPrice: 10, entryDate: '2024-01-01' });
    const updated = repository.update('user1', created.id, { amount: 4 });
    expect(updated.id).toBe(created.id);
  });

  test('Feature: portfolio, Property 8: Invalid update rejection', () => {
    const created = repository.create('user1', { symbol: 'SOL-USDT', amount: 3, entryPrice: 10, entryDate: '2024-01-01' });
    expect(() => repository.update('user1', created.id, { amount: -2 })).toThrow();
  });

  test('Feature: portfolio, Property 18: API error responses include status and message', () => {
    const response = controller.createPosition({ userId: 'user1', body: { symbol: '', amount: 0, entryPrice: -1, entryDate: '' } });
    expect((response as any).status).toBe(400);
    expect((response as any).message).toBeDefined();
  });
});
