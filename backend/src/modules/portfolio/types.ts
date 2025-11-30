import { AggregatedTicker } from '../market-data/types';

export type PositionId = string;
export type UserId = string;

export interface Position {
  id: PositionId;
  userId: UserId;
  symbol: string;
  amount: number;
  entryPrice: number;
  entryDate: string;
  createdAt: number;
  updatedAt: number;
}

export interface PositionInput {
  symbol: string;
  amount: number;
  entryPrice: number;
  entryDate: string;
}

export interface PositionUpdate {
  symbol?: string;
  amount?: number;
  entryPrice?: number;
  entryDate?: string;
}

export interface PositionWithMetrics extends Position {
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  pnlPercent: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalUnrealizedPnl: number;
  totalPnlPercent: number;
  positionCount: number;
  timestamp: number;
}

export interface AllocationEntry {
  symbol: string;
  value: number;
  percentage: number;
}

export interface PortfolioAllocation {
  entries: AllocationEntry[];
  totalValue: number;
  timestamp: number;
}

export interface PriceQuote {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface PriceSource {
  getCurrentTicker(symbol: string): AggregatedTicker | null;
}

export interface ApiResponse<T = any> {
  status: number;
  body: T;
}

export interface ErrorResponse {
  status: number;
  message: string;
}
