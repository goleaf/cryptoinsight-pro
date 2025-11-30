import { CalculationEngine } from './calculation-engine';
import { PositionRepository } from './repository';
import {
  PortfolioAllocation,
  PortfolioSummary,
  Position,
  PositionInput,
  PositionUpdate,
  PositionWithMetrics,
  UserId,
} from './types';

export class PortfolioService {
  constructor(private repository: PositionRepository, private calculator: CalculationEngine) {}

  public createPosition(userId: UserId, input: PositionInput): Position {
    return this.repository.create(userId, input);
  }

  public updatePosition(userId: UserId, id: string, input: PositionUpdate): Position {
    return this.repository.update(userId, id, input);
  }

  public deletePosition(userId: UserId, id: string): boolean {
    return this.repository.delete(userId, id);
  }

  public getPosition(userId: UserId, id: string): Position | null {
    return this.repository.findById(userId, id);
  }

  public getPositionsWithMetrics(userId: UserId): PositionWithMetrics[] {
    const positions = this.repository.findAll(userId);
    return positions.map((p) => this.calculator.withMetrics(p));
  }

  public getPortfolioSummary(userId: UserId): PortfolioSummary {
    const withMetrics = this.getPositionsWithMetrics(userId);
    return this.calculator.summarize(withMetrics);
  }

  public getPortfolioAllocation(userId: UserId): PortfolioAllocation {
    const withMetrics = this.getPositionsWithMetrics(userId);
    const aggregated = this.aggregateBySymbol(withMetrics);
    return this.calculator.allocation(aggregated);
  }

  private aggregateBySymbol(positions: PositionWithMetrics[]): PositionWithMetrics[] {
    const grouped = new Map<string, PositionWithMetrics>();

    positions.forEach((p) => {
      const existing = grouped.get(p.symbol);
      if (!existing) {
        grouped.set(p.symbol, { ...p });
        return;
      }

      const mergedAmount = existing.amount + p.amount;
      const mergedEntryValue = existing.entryPrice * existing.amount + p.entryPrice * p.amount;
      const mergedEntryPrice = mergedAmount > 0 ? mergedEntryValue / mergedAmount : existing.entryPrice;

      const mergedCurrentValue = existing.currentValue + p.currentValue;
      const mergedInitialValue = existing.initialValue + p.initialValue;
      const mergedUnrealizedPnL = existing.unrealizedPnL + p.unrealizedPnL;
      const mergedPnLPercentage = mergedInitialValue > 0 ? (mergedUnrealizedPnL / mergedInitialValue) * 100 : 0;

      grouped.set(p.symbol, {
        ...existing,
        amount: mergedAmount,
        entryPrice: mergedEntryPrice,
        currentPrice: existing.currentPrice,
        currentValue: mergedCurrentValue,
        initialValue: mergedInitialValue,
        unrealizedPnL: mergedUnrealizedPnL,
        pnLPercentage: mergedPnLPercentage,
        priceTimestamp: existing.priceTimestamp,
      });
    });

    return Array.from(grouped.values());
  }
}
