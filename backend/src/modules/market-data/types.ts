
export type ExchangeId = string; // e.g., 'binance', 'coinbase', 'kraken'
export type Symbol = string;     // e.g., 'BTC-USDT' (Unified format)

export interface NormalizedTicker {
  symbol: Symbol;
  exchange: ExchangeId;
  price: number;
  bid: number;
  ask: number;
  volume24h: number; // Base volume
  timestamp: number;
}

export interface NormalizedTickerBreakdown extends NormalizedTicker {
  weight: number;
}

export interface OrderBookLevel {
  price: number;
  amount: number;
  exchange: ExchangeId; // Track source for execution routing
}

export interface NormalizedOrderBook {
  symbol: Symbol;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface NormalizedTrade {
  id: string;
  symbol: Symbol;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  exchange: ExchangeId;
  timestamp: number;
}

export interface AggregatedTicker {
  symbol: Symbol;
  price: number;       // Aggregated price according to strategy
  change24h: number;   // Average change
  volume24h: number;   // Total volume across all exchanges
  bestBid: number;
  bestAsk: number;
  sources: number;     // Number of exchanges contributing
  timestamp: number;
  strategy?: ConflictResolutionStrategyType;
  perExchange?: NormalizedTickerBreakdown[];
  outliers?: ExchangeId[];
  staleSources?: ExchangeId[];
}

export interface ExchangeMetrics {
  exchange: ExchangeId;
  lastUpdate: number;
  updateCount: number;
  errorCount: number;
  status: 'ONLINE' | 'STALE' | 'OFFLINE';
}

export type ConflictResolutionStrategyType =
  | 'vwap'
  | 'per-exchange'
  | 'median'
  | 'best-bid-ask';

export interface ConflictResolutionConfig {
  strategy?: ConflictResolutionStrategyType;
  staleMs?: number;
  outlierStdDev?: number;
}

export interface CacheConfig {
  defaultTtlMs?: number;
  maxEntries?: number;
  cleanupIntervalMs?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

export interface CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs?: number): void;
  delete(key: string): void;
  clear(): void;
  stats(): CacheStats;
}

export interface AggregatorCacheTtls {
  tickerMs: number;
  orderBookMs: number;
  tradesMs: number;
}

export interface AggregatorConfig {
  staleMs?: number;
  maxOrderBookDepth?: number;
  tradeHistoryLimit?: number;
  cacheTtls?: AggregatorCacheTtls;
  conflictResolution?: ConflictResolutionConfig;
  strictSymbols?: boolean;
}

export class InvalidSymbolError extends Error {
  public symbol: Symbol;

  constructor(symbol: Symbol) {
    super(`Symbol ${symbol} is not tracked`);
    this.symbol = symbol;
  }
}
