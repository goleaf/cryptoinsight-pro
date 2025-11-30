// NOTE: Run with Jest/Vitest; globals are assumed available.
import { AlertChecker, AlertService, MarketDataFetcher } from './service';
import { AlertConditionType, AlertStatus } from './types';
import { AlertRepository } from './repository';

declare const describe: any;
declare const test: any;
declare const expect: any;
declare const beforeEach: any;

describe('Alerts module', () => {
  let repo: AlertRepository;
  let service: AlertService;

  beforeEach(() => {
    repo = new AlertRepository();
    service = new AlertService(repo);
  });

  test('Feature: alerts, Property 1: Alert creation succeeds for all valid condition types', () => {
    Object.values(AlertConditionType).forEach((condition) => {
      const alert = service.createAlert('user1', {
        symbol: 'BTC-USDT',
        conditionType: condition,
        thresholdValue: 100,
      });
      expect(alert.conditionType).toBe(condition);
      expect(alert.status).toBe(AlertStatus.Active);
    });
  });

  test('Feature: alerts, Property 2: Invalid symbols are rejected', () => {
    expect(() =>
      service.createAlert('user1', {
        symbol: '',
        conditionType: AlertConditionType.PriceAbove,
        thresholdValue: 100,
      }),
    ).toThrow();
  });

  test('Feature: alerts, Property 3: Invalid threshold values are rejected', () => {
    expect(() =>
      service.createAlert('user1', {
        symbol: 'ETH-USDT',
        conditionType: AlertConditionType.PriceAbove,
        thresholdValue: -1,
      }),
    ).toThrow();
  });

  test('Feature: alerts, Property 4: Percentage change calculation is correct', () => {
    const result = service.percentageChange(110, 100);
    expect(result.valid).toBe(true);
    expect(result.percentage).toBeCloseTo(10);

    const invalid = service.percentageChange(110, 0);
    expect(invalid.valid).toBe(false);
  });

  test('Feature: alerts, Property 10: Condition evaluation is accurate', () => {
    const above = service.createAlert('user1', { symbol: 'BTC-USDT', conditionType: AlertConditionType.PriceAbove, thresholdValue: 100 });
    const below = service.createAlert('user1', { symbol: 'BTC-USDT', conditionType: AlertConditionType.PriceBelow, thresholdValue: 100 });
    const changeUp = service.createAlert('user1', { symbol: 'BTC-USDT', conditionType: AlertConditionType.ChangePercentAbove, thresholdValue: 5 });
    const changeDown = service.createAlert('user1', { symbol: 'BTC-USDT', conditionType: AlertConditionType.ChangePercentBelow, thresholdValue: 5 });

    expect(service.evaluateCondition(above, { symbol: 'BTC-USDT', currentPrice: 101, previousPrice: 100 }).shouldTrigger).toBe(true);
    expect(service.evaluateCondition(below, { symbol: 'BTC-USDT', currentPrice: 99, previousPrice: 100 }).shouldTrigger).toBe(true);
    expect(service.evaluateCondition(changeUp, { symbol: 'BTC-USDT', currentPrice: 106, previousPrice: 100 }).shouldTrigger).toBe(true);
    expect(service.evaluateCondition(changeDown, { symbol: 'BTC-USDT', currentPrice: 94, previousPrice: 100 }).shouldTrigger).toBe(true);
  });

  test('Feature: alerts, Property 5: Alert triggering is complete and correct', () => {
    const alert = service.createAlert('user1', { symbol: 'BTC-USDT', conditionType: AlertConditionType.PriceAbove, thresholdValue: 100 });
    const log = service.evaluateAndTrigger(alert, { symbol: 'BTC-USDT', currentPrice: 110, previousPrice: 100 });
    expect(log).toBeDefined();
    const fetched = repo.getAlertsByUser('user1')[0];
    expect(fetched.status).toBe(AlertStatus.Triggered);
    expect(fetched.logs.length).toBe(1);
  });

  test('Feature: alerts, Property 7: Alert list contains complete information', () => {
    const alert = service.createAlert('user1', { symbol: 'ETH-USDT', conditionType: AlertConditionType.PriceBelow, thresholdValue: 90 });
    service.evaluateAndTrigger(alert, { symbol: 'ETH-USDT', currentPrice: 80, previousPrice: 100 });
    const list = service.getAlertsByUser('user1');
    expect(list[0].logs.length).toBe(1);
    expect(list[0].symbol).toBe('ETH-USDT');
  });

  test('Feature: alerts, Property 8: Alert list sorting is correct', () => {
    const active = service.createAlert('user1', { symbol: 'SOL-USDT', conditionType: AlertConditionType.PriceAbove, thresholdValue: 50 });
    const triggered = service.createAlert('user1', { symbol: 'SOL-USDT', conditionType: AlertConditionType.PriceBelow, thresholdValue: 40 });
    service.evaluateAndTrigger(triggered, { symbol: 'SOL-USDT', currentPrice: 30, previousPrice: 50 });

    const list = service.getAlertsByUser('user1');
    expect(list[0].id).toBe(active.id); // active first
    expect(list[1].id).toBe(triggered.id);
  });

  test('Feature: alerts, Property 9: Alert deletion removes alert but preserves logs', () => {
    const alert = service.createAlert('user1', { symbol: 'XRP-USDT', conditionType: AlertConditionType.PriceAbove, thresholdValue: 1 });
    service.evaluateAndTrigger(alert, { symbol: 'XRP-USDT', currentPrice: 2, previousPrice: 1 });
    const logsBefore = repo.getLogs(alert.id).length;
    const deleted = service.deleteAlert('user1', alert.id);
    expect(deleted).toBe(true);
    expect(repo.getLogs(alert.id).length).toBe(logsBefore);
    expect(service.getAlertsByUser('user1')).toHaveLength(0);
  });

  test('Feature: alerts, Property 6: Alert evaluation continues despite errors', async () => {
    const good = service.createAlert('user1', { symbol: 'GOOD', conditionType: AlertConditionType.PriceAbove, thresholdValue: 1 });
    service.createAlert('user1', { symbol: 'BAD', conditionType: AlertConditionType.PriceAbove, thresholdValue: 1 });

    const fetcher: MarketDataFetcher = {
      fetchSnapshot: (symbol: string) => {
        if (symbol === 'BAD') throw new Error('fetch failed');
        return { symbol, currentPrice: 2, previousPrice: 1 };
      },
    };

    const checker = new AlertChecker(service, fetcher);
    const result = await checker.runOnce();
    const goodAlert = service.getAlertsByUser('user1').find((a) => a.id === good.id);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(goodAlert?.status).toBe(AlertStatus.Triggered);
  });
});
