import { z } from 'zod';

export enum AlertConditionType {
  PriceAbove = 'priceAbove',
  PriceBelow = 'priceBelow',
  ChangePercentAbove = 'changePercentAbove',
  ChangePercentBelow = 'changePercentBelow',
}

export enum AlertStatus {
  Active = 'active',
  Triggered = 'triggered',
  Deleted = 'deleted',
}

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  conditionType: AlertConditionType;
  thresholdValue: number;
  status: AlertStatus;
  createdAt: number;
  triggeredAt?: number;
}

export interface TriggerLog {
  id: string;
  alertId: string;
  triggeredAt: number;
  marketPrice: number;
  percentageChange: number | null;
  disclaimer: string;
}

export interface AlertWithLogs extends Alert {
  logs: TriggerLog[];
}

export interface MarketSnapshot {
  symbol: string;
  currentPrice: number;
  previousPrice?: number;
}

export const createAlertSchema = z.object({
  symbol: z.string().min(1, 'symbol is required'),
  conditionType: z.nativeEnum(AlertConditionType),
  thresholdValue: z.number().positive('threshold must be positive'),
});

export type CreateAlertDto = z.infer<typeof createAlertSchema>;

export interface PercentageChangeResult {
  percentage: number;
  valid: boolean;
}

export interface ConditionEvaluationResult {
  shouldTrigger: boolean;
  percentageChange: number | null;
}

export const DEFAULT_ALERT_DISCLAIMER =
  'Alerts are informational only and do not constitute financial advice.';
