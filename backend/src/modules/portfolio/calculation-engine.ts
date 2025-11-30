import {
  AllocationEntry,
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
    const unrealizedPnl = (price - position.entryPrice) * position.amount;
    const entryValue = position.entryPrice * position.amount;
    const pnlPercent = entryValue > 0 ? (unrealizedPnl / entryValue) * 100 : 0;

    return {
      ...position,
      currentPrice: price,
      currentValue,
      unrealizedPnl,
      pnlPercent,
    };
  }

  public summarize(positions: PositionWithMetrics[]): PortfolioSummary {
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    const totalEntryValue = positions.reduce((sum, p) => sum + p.entryPrice * p.amount, 0);
    const totalPnlPercent = totalEntryValue > 0 ? (totalUnrealizedPnl / totalEntryValue) * 100 : 0;

    return {
      totalValue,
      totalUnrealizedPnl,
      totalPnlPercent,
      positionCount: positions.length,
      timestamp: Date.now(),
    };
  }

  public allocation(positions: PositionWithMetrics[]): PortfolioAllocation {
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const entries: AllocationEntry[] = positions.map((p) => ({
      symbol: p.symbol,
      value: p.currentValue,
      percentage: totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0,
    }));

    const normalized = this.normalizePercentages(entries);

    return {
      entries: normalized,
      totalValue,
      timestamp: Date.now(),
    };
  }

  private normalizePercentages(entries: AllocationEntry[]): AllocationEntry[] {
    if (entries.length === 0) return entries;
    const sum = entries.reduce((acc, e) => acc + e.percentage, 0);
    if (sum === 100 || sum === 0) return entries;

    const factor = 100 / sum;
    return entries.map((e) => ({ ...e, percentage: e.percentage * factor }));
  }
}
