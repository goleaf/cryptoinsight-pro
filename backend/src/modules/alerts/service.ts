import {
  Alert,
  AlertConditionType,
  AlertStatus,
  AlertWithLogs,
  ConditionEvaluationResult,
  CreateAlertDto,
  DEFAULT_ALERT_DISCLAIMER,
  MarketSnapshot,
  PercentageChangeResult,
  TriggerLog,
  createAlertSchema,
} from './types';
import { AlertRepository } from './repository';

const SYMBOL_REGEX = /^[A-Z0-9:-]{2,20}$/i;

export interface MarketDataFetcher {
  fetchSnapshot(symbol: string): Promise<MarketSnapshot> | MarketSnapshot;
}

export class AlertService {
  constructor(private repository: AlertRepository) {}

  public createAlert(userId: string, dto: CreateAlertDto): Alert {
    const parsed = createAlertSchema.parse(dto);
    if (!SYMBOL_REGEX.test(parsed.symbol)) {
      throw new Error('Invalid symbol format');
    }

    return this.repository.create(userId, parsed);
  }

  public getAlertsByUser(userId: string): AlertWithLogs[] {
    return this.repository.getAlertsByUser(userId);
  }

  public deleteAlert(userId: string, alertId: string): boolean {
    return this.repository.delete(userId, alertId);
  }

  public percentageChange(current: number, previous: number | undefined): PercentageChangeResult {
    if (previous === undefined || previous <= 0) {
      return { percentage: 0, valid: false };
    }
    const percentage = ((current - previous) / previous) * 100;
    return { percentage, valid: Number.isFinite(percentage) };
  }

  public evaluateCondition(alert: Alert, snapshot: MarketSnapshot): ConditionEvaluationResult {
    if (snapshot.symbol !== alert.symbol) return { shouldTrigger: false, percentageChange: null };

    switch (alert.conditionType) {
      case AlertConditionType.PriceAbove:
        return { shouldTrigger: snapshot.currentPrice >= alert.thresholdValue, percentageChange: null };
      case AlertConditionType.PriceBelow:
        return { shouldTrigger: snapshot.currentPrice <= alert.thresholdValue, percentageChange: null };
      case AlertConditionType.ChangePercentAbove: {
        const change = this.percentageChange(snapshot.currentPrice, snapshot.previousPrice);
        return {
          shouldTrigger: change.valid && change.percentage >= alert.thresholdValue,
          percentageChange: change.valid ? change.percentage : null,
        };
      }
      case AlertConditionType.ChangePercentBelow: {
        const change = this.percentageChange(snapshot.currentPrice, snapshot.previousPrice);
        return {
          shouldTrigger: change.valid && change.percentage <= -Math.abs(alert.thresholdValue),
          percentageChange: change.valid ? change.percentage : null,
        };
      }
      default:
        return { shouldTrigger: false, percentageChange: null };
    }
  }

  public triggerAlert(alert: Alert, snapshot: MarketSnapshot, percentageChange: number | null): TriggerLog {
    const triggeredAt = Date.now();
    this.repository.updateStatus(alert.id, AlertStatus.Triggered, triggeredAt);
    return this.repository.addTriggerLog(alert.id, {
      alertId: alert.id,
      triggeredAt,
      marketPrice: snapshot.currentPrice,
      percentageChange,
      disclaimer: DEFAULT_ALERT_DISCLAIMER,
    });
  }

  public getActiveAlerts(): Alert[] {
    return this.repository.getActiveAlerts();
  }

  public evaluateAndTrigger(alert: Alert, snapshot: MarketSnapshot): TriggerLog | null {
    const evaluation = this.evaluateCondition(alert, snapshot);
    if (!evaluation.shouldTrigger) return null;
    return this.triggerAlert(alert, snapshot, evaluation.percentageChange);
  }
}

export class AlertChecker {
  constructor(private service: AlertService, private marketData: MarketDataFetcher) {}

  public async runOnce(): Promise<{ processed: number; triggered: number; errors: string[] }> {
    const activeAlerts = this.service.getActiveAlerts();
    const grouped = this.groupBySymbol(activeAlerts);
    let triggered = 0;
    const errors: string[] = [];

    await Promise.all(
      Array.from(grouped.entries()).map(async ([symbol, alerts]) => {
        try {
          const snapshot = await this.marketData.fetchSnapshot(symbol);
          alerts.forEach((alert) => {
            try {
              const log = this.service.evaluateAndTrigger(alert, snapshot);
              if (log) triggered++;
            } catch (err: any) {
              errors.push(err?.message || 'Evaluation error');
            }
          });
        } catch (err: any) {
          errors.push(err?.message || 'Snapshot fetch error');
        }
      }),
    );

    return { processed: activeAlerts.length, triggered, errors };
  }

  private groupBySymbol(alerts: Alert[]): Map<string, Alert[]> {
    const grouped = new Map<string, Alert[]>();
    alerts.forEach((alert) => {
      const list = grouped.get(alert.symbol) || [];
      list.push(alert);
      grouped.set(alert.symbol, list);
    });
    return grouped;
  }
}
