
# Backend Modules

## Market Data Aggregator
Located in `src/modules/market-data`.

### Usage
1. Import `MarketDataAggregator`.
2. Ingest data from adapters via `ingestTicker`, `ingestOrderBook`, and `ingestTrade`.
3. Query aggregated data via `getCurrentTicker`, `getAllTickers`, `getOrderBook`, and `getRecentTrades`.

Key features:
- Conflict resolution strategies: VWAP (default), median, per-exchange transparency, or best-bid-ask.
- Outlier and staleness filtering to keep results fresh.
- Cache-aware responses with TTLs, LRU eviction, and graceful fallback when cache is unavailable.

### Testing
Run `npm test` to execute the specs in `aggregator.spec.ts`.

## WebSocket Gateway
Path: `/ws`

### Protocol

**Subscribe**
```json
{
  "event": "subscribe",
  "channel": "ticker",
  "symbols": ["BTC-USDT"]
}
```

**Messages**
```json
{
  "channel": "ticker",
  "symbol": "BTC-USDT",
  "data": { "price": 50000, ... }
}
```

## Portfolio Module
Located in `src/modules/portfolio`.

- `PositionRepository`: in-memory persistence with user scoping and validation.
- `CalculationEngine`: computes current values, unrealized PnL, PnL %, and allocations with a 30s price cache.
- `PortfolioService`: orchestrates repository and pricing to provide summaries, allocations, and enriched positions.
- `PortfolioController`: simple REST-style wrapper returning `{ status, body/message }` payloads.
- Migration stub: `migrations/001_create_positions.sql` for a positions table with indexes.

## Alerts Module
Located in `src/modules/alerts`.

- SQL migration stub for `alerts` and `trigger_logs` with helpful indexes.
- Zod-backed validation for alert creation DTOs and condition enums.
- In-memory repository with user scoping, trigger logs, and status updates.
- AlertService for creation, evaluation, triggering, and sorting active vs triggered.
- AlertChecker helper to poll active alerts against market snapshots and continue past errors.

## Signals Module
Located in `src/modules/signals`.

- Indicator utilities (MA, EMA, RSI, MACD) and volatility/risk classification.
- SignalAggregator combines trend, momentum, and risk with technical indicator snapshots and disclaimers.
- Property-style specs in `signals.spec.ts` validate bounds, structures, and safe language.
