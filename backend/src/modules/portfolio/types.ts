import { AggregatedTicker } from '../market-data/types';

export type PositionId = string;
export type UserId = string;

export interface Position {
  id: PositionId;                    // UUID
  userId: UserId;                    // User identifier
  symbol: string;                    // Cryptocurrency symbol (e.g., 'BTC-USDT')
  entryPrice: number;                // Price at which position was acquired
  amount: number;                    // Quantity of cryptocurrency
  entryDate: Date;                   // Date position was acquired
  createdAt: Date;                   // Record creation timestamp
  updatedAt: Date;                   // Record last update timestamp
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
  currentPrice: number;              // Current market price
  currentValue: number;              // amount * currentPrice
  initialValue: number;              // amount * entryPrice
  unrealizedPnL: number;             // currentValue - initialValue
  pnLPercentage: number;             // (unrealizedPnL / initialValue) * 100
  priceTimestamp: number;            // Timestamp of current price
}

export interface PortfolioSummary {
  totalValue: number;                // Sum of all position current values
  totalUnrealizedPnL: number;        // Sum of all position unrealized PnL
  totalPnLPercentage: number;        // (totalUnrealizedPnL / totalInitialValue) * 100
  positionCount: number;             // Number of positions
  lastUpdated: number;               // Timestamp of calculation
}

export interface AllocationItem {
  symbol: string;
  value: number;
  percentage: number;
  color?: string;                    // For chart rendering
}

export interface PortfolioAllocation {
  items: AllocationItem[];
  totalValue: number;
  lastUpdated: number;
}

export interface PriceQuote {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface HistoricalDataPoint {
  timestamp: number;
  value: number;
}

export interface HistoricalPortfolioValue {
  dataPoints: HistoricalDataPoint[];
  startDate: number;
  endDate: number;
}

export interface PriceDataPoint {
  timestamp: number;
  price: number;
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
