import {
  AggregatedTicker,
  AggregatorConfig,
  CacheService,
  ConflictResolutionConfig,
  ConflictResolutionStrategyType,
  ExchangeId,
  ExchangeMetrics,
  InvalidSymbolError,
  NormalizedOrderBook,
  NormalizedTicker,
  NormalizedTickerBreakdown,
  NormalizedTrade,
  OrderBookLevel,
  Symbol,
} from './types';
import { InMemoryCacheService } from './cache.service';

type AggregatorOptions = AggregatorConfig & { cache?: CacheService };

const DEFAULT_CACHE_TTLS = {
  tickerMs: 3000,
  orderBookMs: 3000,
  tradesMs: 3000,
};

const DEFAULT_CONFLICT_RESOLUTION: Required<ConflictResolutionConfig> = {
  strategy: 'vwap',
  staleMs: 10000,
  outlierStdDev: 2,
};

const DEFAULT_CONFIG: Required<AggregatorConfig> = {
  staleMs: 10000,
  maxOrderBookDepth: 50,
  tradeHistoryLimit: 200,
  cacheTtls: DEFAULT_CACHE_TTLS,
  conflictResolution: DEFAULT_CONFLICT_RESOLUTION,
  strictSymbols: true,
};

export class MarketDataAggregator {
  private tickerCache: Map<Symbol, Map<ExchangeId, NormalizedTicker>> = new Map();
  private orderBookCache: Map<Symbol, Map<ExchangeId, NormalizedOrderBook>> = new Map();
  private tradeHistory: Map<Symbol, NormalizedTrade[]> = new Map();
  private metrics: Map<ExchangeId, ExchangeMetrics> = new Map();
  private cache: CacheService;
  private config: Required<AggregatorConfig>;

  constructor(options?: AggregatorOptions) {
    const { cache, ...rest } = options || {};
    this.config = {
      ...DEFAULT_CONFIG,
      ...rest,
      cacheTtls: { ...DEFAULT_CONFIG.cacheTtls, ...(rest.cacheTtls || {}) },
      conflictResolution: {
        ...DEFAULT_CONFIG.conflictResolution,
        ...(rest.conflictResolution || {}),
      },
    };

    this.cache = cache || new InMemoryCacheService({ defaultTtlMs: this.config.cacheTtls.tickerMs });
  }

  /** Ingest ticker update */
  public ingestTicker(ticker: NormalizedTicker): void {
    this.validateTicker(ticker);
    const symbolMap = this.ensureSymbolMap(this.tickerCache, ticker.symbol);
    symbolMap.set(ticker.exchange, ticker);
    this.safeCacheDelete(this.cacheKey('ticker', ticker.symbol));
    this.updateMetrics(ticker.exchange);
  }

  /** Ingest order book update */
  public ingestOrderBook(book: NormalizedOrderBook, exchange: ExchangeId): void {
    this.validateOrderBook(book);
    const symbolMap = this.ensureSymbolMap(this.orderBookCache, book.symbol);
    symbolMap.set(exchange, book);
    this.safeCacheDelete(this.cacheKey('orderbook', book.symbol));
    this.updateMetrics(exchange);
  }

  /** Ingest trade update */
  public ingestTrade(trade: NormalizedTrade): void {
    const trades = this.tradeHistory.get(trade.symbol) || [];
    trades.push(trade);
    trades.sort((a, b) => b.timestamp - a.timestamp);
    if (trades.length > this.config.tradeHistoryLimit) {
      trades.length = this.config.tradeHistoryLimit;
    }
    this.tradeHistory.set(trade.symbol, trades);
    this.safeCacheDelete(this.cacheKey('trades', trade.symbol));
    this.updateMetrics(trade.exchange);
  }

  /** Aggregated ticker with conflict resolution */
  public getCurrentTicker(symbol: Symbol): AggregatedTicker | null {
    const cached = this.safeCacheGet<AggregatedTicker>(this.cacheKey('ticker', symbol));
    if (cached) return cached;

    const aggregated = this.buildAggregatedTicker(symbol);
    if (aggregated) {
      this.safeCacheSet(this.cacheKey('ticker', symbol), aggregated, this.config.cacheTtls.tickerMs);
    }
    return aggregated;
  }

  /** All tracked tickers */
  public getAllTickers(): AggregatedTicker[] {
    const symbols = Array.from(this.tickerCache.keys());
    return symbols
      .map((symbol) => this.getCurrentTicker(symbol))
      .filter((t): t is AggregatedTicker => !!t);
  }

  /** Aggregated order book */
  public getOrderBook(symbol: Symbol): NormalizedOrderBook | null {
    const cached = this.safeCacheGet<NormalizedOrderBook>(this.cacheKey('orderbook', symbol));
    if (cached) return cached;

    const exchangeBooks = this.orderBookCache.get(symbol);
    if (!exchangeBooks || exchangeBooks.size === 0) {
      if (this.config.strictSymbols) throw new InvalidSymbolError(symbol);
      return null;
    }

    const allBids: OrderBookLevel[] = [];
    const allAsks: OrderBookLevel[] = [];
    const now = Date.now();
    const staleMs = this.config.conflictResolution.staleMs || this.config.staleMs;

    for (const [, book] of exchangeBooks.entries()) {
      if (now - book.timestamp > staleMs) continue;
      allBids.push(...book.bids);
      allAsks.push(...book.asks);
    }

    if (allBids.length === 0 && allAsks.length === 0) return null;

    allBids.sort((a, b) => b.price - a.price);
    allAsks.sort((a, b) => a.price - b.price);

    const merged: NormalizedOrderBook = {
      symbol,
      bids: allBids.slice(0, this.config.maxOrderBookDepth),
      asks: allAsks.slice(0, this.config.maxOrderBookDepth),
      timestamp: now,
    };

    this.safeCacheSet(this.cacheKey('orderbook', symbol), merged, this.config.cacheTtls.orderBookMs);
    return merged;
  }

  /** Recent trades merged across exchanges */
  public getRecentTrades(symbol: Symbol, limit = 50): NormalizedTrade[] {
    const cached = this.safeCacheGet<NormalizedTrade[]>(this.cacheKey('trades', symbol));
    if (cached) return cached.slice(0, limit);

    const trades = this.tradeHistory.get(symbol);
    if (!trades || trades.length === 0) {
      if (this.config.strictSymbols) throw new InvalidSymbolError(symbol);
      return [];
    }

    const result = trades.slice(0, limit);
    this.safeCacheSet(this.cacheKey('trades', symbol), result, this.config.cacheTtls.tradesMs);
    return result;
  }

  public getMetrics(): ExchangeMetrics[] {
    const now = Date.now();
    const staleMs = this.config.conflictResolution.staleMs || this.config.staleMs;
    return Array.from(this.metrics.values()).map((m) => ({
      ...m,
      status: now - m.lastUpdate > staleMs ? 'STALE' : 'ONLINE',
    }));
  }

  public reportError(exchange: ExchangeId): void {
    const current = this.metrics.get(exchange);
    if (current) {
      current.errorCount++;
      this.metrics.set(exchange, current);
    }
  }

  private buildAggregatedTicker(symbol: Symbol): AggregatedTicker | null {
    const exchangeData = this.tickerCache.get(symbol);
    if (!exchangeData || exchangeData.size === 0) {
      if (this.config.strictSymbols) throw new InvalidSymbolError(symbol);
      return null;
    }

    const now = Date.now();
    const staleMs = this.config.conflictResolution.staleMs || this.config.staleMs;
    const fresh: NormalizedTicker[] = [];
    const staleSources: ExchangeId[] = [];

    exchangeData.forEach((ticker) => {
      if (now - ticker.timestamp > staleMs) {
        staleSources.push(ticker.exchange);
      } else {
        fresh.push(ticker);
      }
    });

    if (fresh.length === 0) return null;

    const { filtered, outliers } = this.filterOutliers(fresh);
    if (filtered.length === 0) return null;

    const perExchange: NormalizedTickerBreakdown[] = filtered.map((ticker) => ({
      ...ticker,
      weight: Math.max(ticker.volume24h, 1),
    }));

    const strategy: ConflictResolutionStrategyType = this.config.conflictResolution.strategy || 'vwap';
    const volume24h = filtered.reduce((sum, t) => sum + t.volume24h, 0);
    const bestBid = Math.max(...filtered.map((t) => t.bid));
    const asks = filtered.filter((t) => t.ask > 0).map((t) => t.ask);
    const bestAsk = asks.length > 0 ? Math.min(...asks) : 0;

    const price = this.resolvePrice(perExchange, strategy, bestBid, bestAsk);

    return {
      symbol,
      price,
      change24h: 0,
      volume24h,
      bestBid: Number.isFinite(bestBid) ? bestBid : 0,
      bestAsk: Number.isFinite(bestAsk) ? bestAsk : 0,
      sources: filtered.length,
      timestamp: now,
      strategy,
      perExchange,
      outliers,
      staleSources,
    };
  }

  private resolvePrice(
    tickers: NormalizedTickerBreakdown[],
    strategy: ConflictResolutionStrategyType,
    bestBid: number,
    bestAsk: number,
  ): number {
    switch (strategy) {
      case 'median':
        return this.calculateMedian(tickers.map((t) => t.price));
      case 'best-bid-ask':
        if (Number.isFinite(bestBid) && Number.isFinite(bestAsk) && bestAsk > 0) {
          return (bestBid + bestAsk) / 2;
        }
        return this.calculateVwap(tickers);
      case 'per-exchange':
        return this.calculateVwap(tickers);
      case 'vwap':
      default:
        return this.calculateVwap(tickers);
    }
  }

  private calculateVwap(tickers: NormalizedTickerBreakdown[]): number {
    let weightedPriceSum = 0;
    let totalVolume = 0;
    tickers.forEach((t) => {
      weightedPriceSum += t.price * t.weight;
      totalVolume += t.weight;
    });
    return totalVolume > 0 ? weightedPriceSum / totalVolume : 0;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  private filterOutliers(tickers: NormalizedTicker[]) {
    const stdDevThreshold = this.config.conflictResolution.outlierStdDev;
    if (!stdDevThreshold || tickers.length < 2) return { filtered: tickers, outliers: [] };

    const prices = tickers.map((t) => t.price);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) return { filtered: tickers, outliers: [] };

    const upper = mean + stdDevThreshold * stdDev;
    const lower = mean - stdDevThreshold * stdDev;

    const filtered = tickers.filter((t) => t.price >= lower && t.price <= upper);
    const outliers = tickers.filter((t) => t.price < lower || t.price > upper).map((t) => t.exchange);

    return { filtered: filtered.length > 0 ? filtered : tickers, outliers };
  }

  private cacheKey(scope: 'ticker' | 'orderbook' | 'trades', symbol: Symbol): string {
    return `${scope}:${symbol}`;
  }

  private validateTicker(ticker: NormalizedTicker) {
    if (!ticker?.symbol || !ticker.exchange) throw new Error('Invalid ticker');
    if (!Number.isFinite(ticker.price) || !Number.isFinite(ticker.bid) || !Number.isFinite(ticker.ask)) {
      throw new Error('Invalid ticker pricing');
    }
    if (!Number.isFinite(ticker.volume24h) || ticker.volume24h < 0) {
      throw new Error('Invalid ticker volume');
    }
  }

  private validateOrderBook(book: NormalizedOrderBook) {
    if (!book?.symbol || !Array.isArray(book.bids) || !Array.isArray(book.asks)) {
      throw new Error('Invalid order book');
    }
  }

  private ensureSymbolMap<T>(store: Map<Symbol, Map<ExchangeId, T>>, symbol: Symbol): Map<ExchangeId, T> {
    if (!store.has(symbol)) {
      store.set(symbol, new Map());
    }
    return store.get(symbol)!;
  }

  private updateMetrics(exchange: ExchangeId): void {
    const current = this.metrics.get(exchange) || {
      exchange,
      lastUpdate: 0,
      updateCount: 0,
      errorCount: 0,
      status: 'OFFLINE' as const,
    };

    current.lastUpdate = Date.now();
    current.updateCount++;
    this.metrics.set(exchange, current);
  }

  private safeCacheGet<T>(key: string): T | null {
    try {
      return this.cache.get<T>(key);
    } catch {
      return null;
    }
  }

  private safeCacheSet<T>(key: string, value: T, ttlMs: number): void {
    try {
      this.cache.set<T>(key, value, ttlMs);
    } catch {
      // Ignore cache write errors and continue
    }
  }

  private safeCacheDelete(key: string): void {
    try {
      this.cache.delete(key);
    } catch {
      // Ignore cache delete errors
    }
  }
}
