import { PriceDataPoint, RiskLevel, RiskSignal, VolatilityResult } from './types';

const SQRT_DAYS = Math.sqrt(365);

export function calculateVolatility(data: PriceDataPoint[]): VolatilityResult {
  if (data.length < 2) {
    return { volatility: 0, dailyStdDev: 0, sampleSize: data.length };
  }

  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].price;
    const current = data[i].price;
    if (prev <= 0) continue;
    returns.push((current - prev) / prev);
  }

  if (returns.length === 0) {
    return { volatility: 0, dailyStdDev: 0, sampleSize: data.length };
  }

  const mean = returns.reduce((acc, v) => acc + v, 0) / returns.length;
  const variance = returns.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const annualized = stdDev * SQRT_DAYS * 100;

  return { volatility: annualized, dailyStdDev: stdDev, sampleSize: data.length };
}

export function classifyRisk(volatility: VolatilityResult): RiskSignal {
  let level: RiskLevel = 'Medium';
  if (volatility.volatility < 30) level = 'Low';
  else if (volatility.volatility >= 60) level = 'High';

  const explanation = `Volatility is ${volatility.volatility.toFixed(2)}% annualized, categorized as ${level}. This is informational only.`;

  return {
    level,
    explanation,
    volatility,
  };
}
