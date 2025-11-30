-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL CHECK (threshold_value > 0),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  triggered_at TIMESTAMPTZ
);

-- Trigger logs table
CREATE TABLE IF NOT EXISTS trigger_logs (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER NOT NULL REFERENCES alerts(id),
  triggered_at TIMESTAMPTZ NOT NULL,
  market_price NUMERIC NOT NULL,
  percentage_change NUMERIC,
  disclaimer TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts (user_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_status_symbol ON alerts (status, symbol);
CREATE INDEX IF NOT EXISTS idx_trigger_logs_alert ON trigger_logs (alert_id);
