import {
  AllocationItem,
  PortfolioAllocation,
  PortfolioSummary,
  Position,
  PositionWithMetrics,
  PriceQuote,
  PriceSource,
} from './types';

const DEFAULT_PRICE_TTL_MS = 30000;

export class CalculationEngine {
  private priceCache: Map<string, PriceQuote> = new Map();
  private ttlMs: number;
  private priceSource?: PriceSource;

  constructor(priceSource?: PriceSource, ttlMs: number = DEFAULT_PRICE_TTL_MS) {
    this.priceSource = priceSource;
    this.ttlMs = ttlMs;
  }

  public seedPrice(symbol: string, price: number): void {
    this.priceCache.set(symbol, { symbol, price, timestamp: Date.now() });
  }

  public getPrice(symbol: string): number {
    const now = Date.now();
    const cached = this.priceCache.get(symbol);
    if (cached && now - cached.timestamp <= this.ttlMs) {
      return cached.price;
    }

    const ticker = this.priceSource?.getCurrentTicker(symbol);
    if (ticker && ticker.price > 0) {
      const quote: PriceQuote = { symbol, price: ticker.price, timestamp: now };
      this.priceCache.set(symbol, quote);
      return quote.price;
    }

    if (cached) {
      return cached.price; // Fallback to last known price when source is down
    }

    throw new Error(`Price unavailable for ${symbol}`);
  }

  public withMetrics(position: Position): PositionWithMetrics {
    const price = this.getPrice(position.symbol);
    const currentValue = price * position.amount;
    const initialValue = position.entryPrice * position.amount;
    const unrealizedPnL = currentValue - initialValue;
    const pnLPercentage = initialValue > 0 ? (unrealizedPnL / initialValue) * 100 : 0;

    return {
      ...position,
      currentPrice: price,
      currentValue,
      initialValue,
      unrealizedPnL,
      pnLPercentage,
      priceTimestamp: Date.now(),
    };
  }

  public summarize(positions: PositionWithMetrics[]): PortfolioSummary {
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const totalInitialValue = positions.reduce((sum, p) => sum + p.initialValue, 0);
    const totalPnLPercentage = totalInitialValue > 0 ? (totalUnrealizedPnL / totalInitialValue) * 100 : 0;

    return {
      totalValue,
      totalUnrealizedPnL,
      totalPnLPercentage,
      positionCount: positions.length,
      lastUpdated: Date.now(),
    };
  }

  public allocation(positions: PositionWithMetrics[]): PortfolioAllocation {
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const items: AllocationItem[] = positions.map((p) => ({
      symbol: p.symbol,
      value: p.currentValue,
      percentage: totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0,
    }));

    const normalized = this.normalizePercentages(items);

    return {
      items: normalized,
      totalValue,
      lastUpdated: Date.now(),
    };
  }

  private normalizePercentages(items: AllocationItem[]): AllocationItem[] {
    if (items.length === 0) return items;
    const sum = items.reduce((acc, e) => acc + e.percentage, 0);
    if (sum === 100 || sum === 0) return items;

    const factor = 100 / sum;
    return items.map((e) => ({ ...e, percentage: e.percentage * factor }));
  }
}
