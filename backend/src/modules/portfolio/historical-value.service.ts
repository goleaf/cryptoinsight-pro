import { PositionRepository } from './repository';
import { PriceDataPoint, PriceSource, UserId } from './types';

export interface HistoricalPriceFetcher {
  fetchHistory(symbol: string, start: number, end: number, intervalMinutes: number): Promise<PriceDataPoint[]>;
}

const DEFAULT_INTERVAL_MINUTES = 60;

export class HistoricalValueService {
  constructor(private repository: PositionRepository, private priceSource: PriceSource | null) {}

  /**
   * Computes total portfolio value across time buckets. Uses provided historical fetcher when available,
   * otherwise falls back to current price snapshots for each time bucket.
   */
  public async getPortfolioHistory(
    userId: UserId,
    start: number,
    end: number,
    intervalMinutes: number = DEFAULT_INTERVAL_MINUTES,
    historicalFetcher?: HistoricalPriceFetcher,
  ): Promise<PriceDataPoint[]> {
    if (start >= end) return [];
    const positions = this.repository.findAll(userId);
    if (positions.length === 0) return [];

    const intervalMs = intervalMinutes * 60 * 1000;
    const points: PriceDataPoint[] = [];

    for (let t = start; t <= end; t += intervalMs) {
      let totalValue = 0;

      for (const position of positions) {
        let priceAtTime: number | null = null;

        if (historicalFetcher) {
          const history = await historicalFetcher.fetchHistory(position.symbol, t, t, intervalMinutes);
          if (history.length > 0) {
            priceAtTime = history[history.length - 1].price;
          }
        }

        if (priceAtTime === null && this.priceSource) {
          const ticker = this.priceSource.getCurrentTicker(position.symbol);
          priceAtTime = ticker?.price ?? null;
        }

        if (priceAtTime !== null) {
          totalValue += priceAtTime * position.amount;
        }
      }

      points.push({ timestamp: t, price: totalValue });
    }

    return points;
  }
}
