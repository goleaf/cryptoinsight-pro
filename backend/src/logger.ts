type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  err?: { message: string; stack?: string };
}

const SENSITIVE_KEYS = ['apiKey', 'password', 'secret', 'token', 'authorization'];

export function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const clone: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      clone[key] = '***';
    } else if (typeof obj[key] === 'object') {
      clone[key] = sanitize(obj[key]);
    } else {
      clone[key] = obj[key];
    }
  }
  return clone;
}

function write(entry: LogEntry) {
  const payload = JSON.stringify(entry);
  // eslint-disable-next-line no-console
  console.log(payload);
}

function base(level: LogLevel, message: string, context?: LogContext, error?: Error) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ? sanitize(context) : undefined,
    err: error ? { message: error.message, stack: error.stack } : undefined,
  };
  write(entry);
}

export const logger = {
  debug: (message: string, context?: LogContext) => base('debug', message, context),
  info: (message: string, context?: LogContext) => base('info', message, context),
  warn: (message: string, context?: LogContext) => base('warn', message, context),
  error: (message: string, error?: Error, context?: LogContext) => base('error', message, context, error),
  slowRequest: (durationMs: number, endpoint: string, context?: LogContext) =>
    base('warn', 'Slow external request', { durationMs, endpoint, ...context }),
};

export function logInitialization(message = 'Service initialization complete') {
  logger.info(message);
}
