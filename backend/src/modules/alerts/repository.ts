import {
  Alert,
  AlertConditionType,
  AlertStatus,
  AlertWithLogs,
  CreateAlertDto,
  TriggerLog,
} from './types';

let alertIdCounter = 1;
let logIdCounter = 1;

function generateAlertId(): string {
  return `alert_${alertIdCounter++}`;
}

function generateLogId(): string {
  return `log_${logIdCounter++}`;
}

export class AlertRepository {
  private alerts: Map<string, Alert> = new Map();
  private logs: Map<string, TriggerLog[]> = new Map();

  public create(userId: string, dto: CreateAlertDto): Alert {
    const now = Date.now();
    const alert: Alert = {
      id: generateAlertId(),
      userId,
      symbol: dto.symbol,
      conditionType: dto.conditionType,
      thresholdValue: dto.thresholdValue,
      status: AlertStatus.Active,
      createdAt: now,
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  public getAlertsByUser(userId: string): AlertWithLogs[] {
    const results: AlertWithLogs[] = [];
    this.alerts.forEach((alert) => {
      if (alert.userId !== userId) return;
      results.push({ ...alert, logs: this.logs.get(alert.id) || [] });
    });

    results.sort((a, b) => {
      if (a.status === b.status) return b.createdAt - a.createdAt;
      return a.status === AlertStatus.Active ? -1 : 1;
    });

    return results;
  }

  public delete(userId: string, alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.userId !== userId) return false;
    this.alerts.delete(alertId);
    return true;
  }

  public addTriggerLog(alertId: string, log: Omit<TriggerLog, 'id'>): TriggerLog {
    const entry: TriggerLog = { ...log, id: generateLogId() };
    const existing = this.logs.get(alertId) || [];
    existing.unshift(entry);
    this.logs.set(alertId, existing);
    return entry;
  }

  public getLogs(alertId: string): TriggerLog[] {
    return this.logs.get(alertId) || [];
  }

  public updateStatus(alertId: string, status: AlertStatus, triggeredAt?: number): void {
    const alert = this.alerts.get(alertId);
    if (!alert) return;
    this.alerts.set(alertId, { ...alert, status, triggeredAt });
  }

  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((a) => a.status === AlertStatus.Active);
  }
}
