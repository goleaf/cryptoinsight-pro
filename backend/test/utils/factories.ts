import { AggregatedTicker, NormalizedOrderBook, NormalizedTicker, OrderBookLevel } from '../../src/modules/market-data/types';
import { PositionInput } from '../../src/modules/portfolio/types';
import { AlertConditionType, CreateAlertDto } from '../../src/modules/alerts/types';

export function tickerFactory(overrides: Partial<NormalizedTicker> = {}): NormalizedTicker {
  return {
    symbol: 'BTC-USDT',
    exchange: 'binance',
    price: 50000,
    bid: 49990,
    ask: 50010,
    volume24h: 1000,
    timestamp: Date.now(),
    ...overrides,
  };
}

export function aggregatedTickerFactory(overrides: Partial<AggregatedTicker> = {}): AggregatedTicker {
  return {
    symbol: 'BTC-USDT',
    price: 50000,
    change24h: 0,
    volume24h: 1000,
    bestBid: 49990,
    bestAsk: 50010,
    sources: 1,
    timestamp: Date.now(),
    ...overrides,
  };
}

export function orderBookFactory(overrides: Partial<NormalizedOrderBook> = {}): NormalizedOrderBook {
  const bids: OrderBookLevel[] = [{ price: 49900, amount: 1, exchange: 'binance' }];
  const asks: OrderBookLevel[] = [{ price: 50100, amount: 1, exchange: 'binance' }];
  return {
    symbol: 'BTC-USDT',
    timestamp: Date.now(),
    bids,
    asks,
    ...overrides,
  };
}

export function positionInputFactory(overrides: Partial<PositionInput> = {}): PositionInput {
  return {
    symbol: 'BTC-USDT',
    amount: 1,
    entryPrice: 100,
    entryDate: new Date().toISOString(),
    ...overrides,
  };
}

export function alertDtoFactory(overrides: Partial<CreateAlertDto> = {}): CreateAlertDto {
  return {
    symbol: 'BTC-USDT',
    conditionType: AlertConditionType.PriceAbove,
    thresholdValue: 100,
    ...overrides,
  };
}
