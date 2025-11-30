# Design Document: Testing, Logging, and CI Infrastructure

## Overview

This design establishes a comprehensive testing, logging, and continuous integration infrastructure for the crypto analytics platform. The system will provide:

- **Unit and integration testing** with property-based testing for critical calculations
- **Structured logging** with sensitive data masking and performance monitoring
- **CI/CD pipeline** for automated quality gates
- **Test utilities** for efficient test authoring

The design prioritizes reliability of exchange adapters, market data aggregation, and signal calculations while maintaining developer productivity through fast feedback loops.

## Architecture

### Testing Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Test Suites                          │
├─────────────────────────────────────────────────────────┤
│  Unit Tests          │  Integration Tests  │  Property  │
│  - Calculations      │  - API Endpoints    │  Tests     │
│  - Normalization     │  - Database Ops     │  - Math    │
│  - Validation        │  - Mocked External  │  - Round   │
│                      │    Services         │    Trips   │
└──────────┬───────────┴──────────┬──────────┴────────────┘
           │                      │
           v                      v
    ┌──────────────┐      ┌──────────────┐
    │ Test Utils   │      │  Fixtures    │
    │ - Factories  │      │  - Mock Data │
    │ - Generators │      │  - Stubs     │
    │ - Matchers   │      │  - Builders  │
    └──────────────┘      └──────────────┘
```

### Logging Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Application Code                       │
└────────────┬────────────────────────────────────────────┘
             │
             v
      ┌──────────────┐
      │   Logger     │
      │  Interface   │
      └──────┬───────┘
             │
             v
      ┌──────────────────┐
      │  Log Processor   │
      │  - Formatting    │
      │  - Masking       │
      │  - Enrichment    │
      └──────┬───────────┘
             │
             v
      ┌──────────────────┐
      │   Transport      │
      │  - Console       │
      │  - File          │
      │  - External      │
      └──────────────────┘
```

### CI Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Git Push Event                       │
└────────────┬────────────────────────────────────────────┘
             │
             v
      ┌──────────────┐
      │  Checkout    │
      │  Code        │
      └──────┬───────┘
             │
             v
      ┌──────────────┐
      │  Install     │
      │  Dependencies│
      └──────┬───────┘
             │
             ├──────────────┬──────────────┬──────────────┐
             v              v              v              v
      ┌──────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
      │  Lint    │   │  Type    │  │  Unit    │  │  Integ   │
      │  Check   │   │  Check   │  │  Tests   │  │  Tests   │
      └──────┬───┘   └──────┬───┘  └──────┬───┘  └──────┬───┘
             │              │              │              │
             └──────────────┴──────────────┴──────────────┘
                            │
                            v
                     ┌──────────────┐
                     │  Coverage    │
                     │  Report      │
                     └──────┬───────┘
                            │
                            v
                     ┌──────────────┐
                     │  Report      │
                     │  Results     │
                     └──────────────┘
```

## Components and Interfaces

### 1. Test Framework Setup

**Technology Stack:**
- **Test Runner**: Vitest (fast, TypeScript-native, compatible with Jest API)
- **Property Testing**: fast-check (mature TypeScript PBT library)
- **Mocking**: Vitest built-in mocking
- **Coverage**: c8 (V8 coverage, integrated with Vitest)

**Configuration:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '**/*.spec.ts', '**/*.test.ts'],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
    testTimeout: 10000,
  },
});
```

### 2. Test Utilities Module

**Factory Functions:**
```typescript
// test/factories.ts
export interface TestFactories {
  createTicker(overrides?: Partial<NormalizedTicker>): NormalizedTicker;
  createPosition(overrides?: Partial<Position>): Position;
  createOrderBook(overrides?: Partial<NormalizedOrderBook>): NormalizedOrderBook;
  createTrade(overrides?: Partial<NormalizedTrade>): NormalizedTrade;
  createPriceHistory(length: number, options?: PriceHistoryOptions): PriceDataPoint[];
}
```

**Mock Services:**
```typescript
// test/mocks.ts
export class MockExchangeAdapter implements ExchangeAdapter {
  fetchTicker(symbol: string): Promise<NormalizedTicker>;
  fetchOrderBook(symbol: string): Promise<NormalizedOrderBook>;
  // Configurable responses and delays
}

export class MockPriceSource implements PriceSource {
  constructor(private prices: Record<string, number>);
  getCurrentTicker(symbol: string): AggregatedTicker | null;
}
```

**Property Generators:**
```typescript
// test/generators.ts
export const arbitraries = {
  symbol: fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toUpperCase()),
  price: fc.double({ min: 0.01, max: 100000, noNaN: true }),
  amount: fc.double({ min: 0.001, max: 1000, noNaN: true }),
  timestamp: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
  ticker: fc.record({
    symbol: arbitraries.symbol,
    exchange: fc.constantFrom('binance', 'coinbase', 'kraken'),
    price: arbitraries.price,
    bid: arbitraries.price,
    ask: arbitraries.price,
    volume24h: fc.double({ min: 0, max: 1000000 }),
    timestamp: arbitraries.timestamp,
  }),
};
```

### 3. Logging System

**Logger Interface:**
```typescript
// logging/logger.ts
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
}

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}
```

**Structured Logger Implementation:**
```typescript
// logging/structured-logger.ts
export class StructuredLogger implements Logger {
  constructor(
    private config: LoggerConfig,
    private transport: LogTransport,
    private masker: DataMasker
  ) {}

  info(message: string, context?: LogContext): void {
    const entry = this.createEntry('info', message, context);
    this.transport.write(entry);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createEntry('error', message, context, error);
    this.transport.write(entry);
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const maskedContext = context ? this.masker.mask(context) : undefined;
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: maskedContext,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      } : undefined,
    };
  }
}
```

**Data Masker:**
```typescript
// logging/masker.ts
export class DataMasker {
  private sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /authorization/i,
    /bearer/i,
  ];

  mask(data: any): any {
    if (typeof data === 'string') {
      return this.maskString(data);
    }
    if (Array.isArray(data)) {
      return data.map(item => this.mask(item));
    }
    if (typeof data === 'object' && data !== null) {
      return this.maskObject(data);
    }
    return data;
  }

  private maskObject(obj: Record<string, any>): Record<string, any> {
    const masked: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveKey(key)) {
        masked[key] = '***MASKED***';
      } else {
        masked[key] = this.mask(value);
      }
    }
    return masked;
  }

  private isSensitiveKey(key: string): boolean {
    return this.sensitivePatterns.some(pattern => pattern.test(key));
  }

  private maskString(str: string): string {
    // Mask potential API keys (long alphanumeric strings)
    return str.replace(/\b[A-Za-z0-9]{32,}\b/g, '***MASKED***');
  }
}
```

**Performance Monitoring Middleware:**
```typescript
// logging/performance-middleware.ts
export class PerformanceMonitor {
  constructor(
    private logger: Logger,
    private slowThresholdMs: number = 2000
  ) {}

  async trackRequest<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      if (duration > this.slowThresholdMs) {
        this.logger.warn('Slow operation detected', {
          operation,
          durationMs: duration,
          threshold: this.slowThresholdMs,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error('Operation failed', error as Error, {
        operation,
        durationMs: duration,
      });
      throw error;
    }
  }
}
```

### 4. CI Configuration

**GitHub Actions Workflow:**
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ci": "vitest run --coverage",
    "test:unit": "vitest run --coverage src/**/*.spec.ts",
    "test:integration": "vitest run --coverage src/**/*.integration.spec.ts",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

## Data Models

### Test Data Models

```typescript
// test/types.ts
export interface TestContext {
  userId: string;
  timestamp: number;
  cleanup: () => Promise<void>;
}

export interface MockResponse<T> {
  data: T;
  status: number;
  delay?: number;
}

export interface TestDatabase {
  seed(data: any[]): Promise<void>;
  clear(): Promise<void>;
  query<T>(sql: string, params?: any[]): Promise<T[]>;
}
```

### Log Data Models

```typescript
// logging/types.ts
export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'pretty';
  maskSensitiveData: boolean;
  includeStackTrace: boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogTransport {
  write(entry: LogEntry): void;
  flush(): Promise<void>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Data normalization field completeness
*For any* exchange data input that passes validation, the normalized output should contain all required fields (symbol, exchange, price, timestamp) with correct types.
**Validates: Requirements 1.1**

### Property 2: RSI calculation bounds
*For any* price series with sufficient data points, the calculated RSI value should be between 0 and 100 inclusive.
**Validates: Requirements 1.2**

### Property 3: MACD structure consistency
*For any* price series with sufficient length, the MACD result should have macdLine, signalLine, and histogram arrays all of equal length to the input price series.
**Validates: Requirements 1.2**

### Property 4: Portfolio PnL calculation correctness
*For any* position with entry price and current price, the unrealized PnL should equal (currentPrice - entryPrice) × amount.
**Validates: Requirements 1.3**

### Property 5: Portfolio total value invariant
*For any* portfolio with multiple positions, the total portfolio value should equal the sum of all individual position values.
**Validates: Requirements 1.3**

### Property 6: Error handling graceful degradation
*For any* malformed input to data normalization functions, the system should either throw a typed error or return null, never crashing or returning partially invalid data.
**Validates: Requirements 1.4**

### Property 7: API response structure validity
*For any* API endpoint request (valid or invalid), the response should contain a status code and either data or an error message object.
**Validates: Requirements 2.2**

### Property 8: Alert creation round-trip
*For any* valid alert creation request, creating an alert then retrieving it by ID should return an alert with the same symbol, condition, and threshold values.
**Validates: Requirements 2.4**

### Property 9: Log entry structure consistency
*For any* log event, the output should be valid JSON containing timestamp, level, and message fields.
**Validates: Requirements 3.1**

### Property 10: Sensitive data masking completeness
*For any* log context containing keys matching sensitive patterns (api_key, password, token, secret), those values should be replaced with a mask string in the output.
**Validates: Requirements 3.4**

### Property 11: Data serialization round-trip
*For any* valid ticker, position, or order book object, serializing to JSON then deserializing should produce an equivalent object.
**Validates: Requirements 5.1**

### Property 12: Mathematical invariant preservation
*For any* price series, the moving average at period N should be less than or equal to the maximum price and greater than or equal to the minimum price in that window.
**Validates: Requirements 5.2**

### Property 13: Allocation percentage sum invariant
*For any* portfolio with one or more positions, the sum of allocation percentages should equal 100 (within floating point tolerance of 0.01).
**Validates: Requirements 5.3**

## Error Handling

### Test Error Handling

**Test Failure Reporting:**
- Unit test failures should include actual vs expected values
- Property test failures should include the failing input that triggered the issue
- Integration test failures should include request/response details
- All test failures should include stack traces

**Test Timeout Handling:**
- Individual tests timeout after 5 seconds
- Test suite timeout after 10 seconds
- Async operations should use proper cleanup in finally blocks

### Logging Error Handling

**Logger Resilience:**
- If log transport fails, errors should be caught and not crash the application
- Failed log writes should be queued for retry (up to 3 attempts)
- If masking fails, log the error but continue with unmasked data (security over availability)

**Error Log Format:**
```typescript
{
  "timestamp": "2024-12-01T10:30:00.000Z",
  "level": "error",
  "message": "Failed to fetch ticker from exchange",
  "context": {
    "exchange": "binance",
    "symbol": "BTC-USDT",
    "attemptNumber": 2
  },
  "error": {
    "message": "Network timeout",
    "code": "ETIMEDOUT",
    "stack": "Error: Network timeout\n    at ..."
  }
}
```

### CI Error Handling

**Build Failure Scenarios:**
- Lint errors: Fail fast, report specific file and line
- Type errors: Fail fast, report all type errors
- Test failures: Run all tests, report summary
- Coverage below threshold: Warn but don't fail

**Retry Logic:**
- Network-dependent steps (npm install) retry up to 3 times
- Test failures do not retry (flaky tests should be fixed)

## Testing Strategy

### Unit Testing Approach

**Scope:**
- Pure functions (calculations, transformations, validation)
- Business logic components
- Utility functions
- Error handling paths

**Examples:**
- `calculateMA()` with various period lengths
- `validatePosition()` with invalid inputs
- `maskSensitiveData()` with different data structures
- `normalizeTickerData()` with exchange-specific formats

**Tools:**
- Vitest for test runner
- Built-in matchers for assertions
- Mock functions for dependencies

### Integration Testing Approach

**Scope:**
- API endpoints with mocked external services
- Database operations with test database
- Service layer interactions
- WebSocket connections

**Setup:**
- Test database seeded before each test
- External API calls mocked with realistic responses
- Cleanup after each test to ensure isolation

**Examples:**
- POST /api/portfolio/positions with validation
- GET /api/market-data/ticker/:symbol with aggregation
- WebSocket connection and message handling

### Property-Based Testing Approach

**Library:** fast-check (TypeScript-native PBT library)

**Configuration:**
- Minimum 100 iterations per property (configurable via `fc.assert` options)
- Seed-based reproducibility for debugging failures
- Shrinking enabled to find minimal failing cases

**Property Test Structure:**
```typescript
import fc from 'fast-check';

test('Feature: testing-logging-ci, Property 2: RSI calculation bounds', () => {
  fc.assert(
    fc.property(
      fc.array(fc.double({ min: 1, max: 10000, noNaN: true }), { minLength: 20 }),
      (prices) => {
        const rsi = calculateRSI(prices, 14);
        if (rsi === null) return true; // Not enough data
        return rsi >= 0 && rsi <= 100;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test Tagging:**
Each property-based test MUST include a comment with this exact format:
```typescript
// Feature: testing-logging-ci, Property {number}: {property description}
```

**Coverage Strategy:**
- Property tests verify universal correctness across input space
- Unit tests verify specific examples and edge cases
- Integration tests verify component interactions
- Together they provide comprehensive coverage

### Test Organization

**File Structure:**
```
backend/src/
├── modules/
│   ├── market-data/
│   │   ├── aggregator.service.ts
│   │   ├── aggregator.spec.ts          # Unit + property tests
│   │   └── aggregator.integration.spec.ts  # Integration tests
│   ├── portfolio/
│   │   ├── calculation-engine.ts
│   │   ├── calculation-engine.spec.ts
│   │   └── portfolio.integration.spec.ts
│   └── signals/
│       ├── indicators.ts
│       ├── indicators.spec.ts
│       └── signals.integration.spec.ts
└── test/
    ├── setup.ts                        # Global test setup
    ├── factories.ts                    # Test data factories
    ├── generators.ts                   # Property test generators
    ├── mocks.ts                        # Mock implementations
    └── utils.ts                        # Test utilities
```

**Naming Conventions:**
- Unit tests: `*.spec.ts`
- Integration tests: `*.integration.spec.ts`
- Property tests: Included in `*.spec.ts` with special comment tags
- Test utilities: `test/*.ts`

### Coverage Goals

**Targets:**
- Overall coverage: 70% minimum (warning, not failure)
- Critical paths (calculations, normalization): 90%+
- Error handling: 80%+
- UI components: 60%+ (lower priority)

**Exclusions:**
- Test files themselves
- Configuration files
- Type definition files
- node_modules

## Implementation Notes

### Testing Best Practices

1. **Test Independence**: Each test should be runnable in isolation
2. **Fast Execution**: Unit tests should complete in milliseconds
3. **Clear Assertions**: Use descriptive test names and assertion messages
4. **Minimal Mocking**: Mock only external dependencies, not internal logic
5. **Property Test Generators**: Create smart generators that produce valid domain objects

### Logging Best Practices

1. **Structured Format**: Always use JSON for machine parsing
2. **Consistent Fields**: Every log entry has timestamp, level, message
3. **Context Over Concatenation**: Use context objects instead of string interpolation
4. **Appropriate Levels**: DEBUG for verbose, INFO for normal, WARN for issues, ERROR for failures
5. **Performance Awareness**: Avoid logging in tight loops

### CI Best Practices

1. **Fast Feedback**: Fail fast on lint/type errors before running tests
2. **Parallel Execution**: Run independent checks in parallel
3. **Caching**: Cache node_modules to speed up builds
4. **Clear Output**: Provide actionable error messages
5. **Consistent Environment**: Use same Node version as production

## Security Considerations

### Sensitive Data Protection

**Patterns to Mask:**
- API keys (long alphanumeric strings)
- Passwords (any field with "password" in name)
- Tokens (Bearer tokens, JWT)
- Authorization headers
- Secret keys

**Masking Strategy:**
- Replace entire value with `***MASKED***`
- Never log raw sensitive data
- Mask before serialization to prevent leaks

### Test Data Security

**Guidelines:**
- Never use real API keys in tests
- Use fake/mock credentials
- Don't commit .env files with real secrets
- Use separate test accounts for external services

## Performance Considerations

### Test Performance

**Targets:**
- Unit test suite: < 5 seconds
- Integration test suite: < 10 seconds
- Property tests: < 30 seconds (100 iterations each)
- Total CI pipeline: < 5 minutes

**Optimization Strategies:**
- Run tests in parallel where possible
- Use in-memory database for integration tests
- Cache test fixtures
- Skip slow tests in watch mode

### Logging Performance

**Considerations:**
- Async log writes to avoid blocking
- Batch log entries when possible
- Use appropriate log levels (avoid DEBUG in production)
- Implement log sampling for high-frequency events

### CI Performance

**Optimization:**
- Cache node_modules between runs
- Use matrix builds for parallel execution
- Skip redundant checks (e.g., lint only changed files)
- Fail fast on critical errors

## Deployment Considerations

### Test Environment Setup

**Requirements:**
- Node.js 18+
- npm or yarn
- Test database (SQLite for simplicity)
- Environment variables for test configuration

**Configuration:**
```bash
# .env.test
NODE_ENV=test
LOG_LEVEL=error
DATABASE_URL=:memory:
CACHE_TTL_MS=1000
```

### CI Environment Setup

**GitHub Actions Requirements:**
- Ubuntu latest runner
- Node.js 18
- npm ci for reproducible installs
- Secrets for external service credentials (if needed)

### Production Logging Setup

**Configuration:**
```typescript
// production logger config
{
  level: 'info',
  format: 'json',
  maskSensitiveData: true,
  includeStackTrace: true,
  transports: [
    new ConsoleTransport(),
    new FileTransport({ path: '/var/log/app.log' }),
  ],
}
```

**Log Rotation:**
- Rotate logs daily
- Keep 7 days of logs
- Compress old logs
- Monitor disk usage

## Future Enhancements

### Testing Enhancements

- Visual regression testing for UI components
- Performance benchmarking tests
- Mutation testing for test quality assessment
- Contract testing for external API integrations

### Logging Enhancements

- Distributed tracing with correlation IDs
- Log aggregation service integration (e.g., ELK stack)
- Real-time alerting on error patterns
- Log analytics and visualization

### CI Enhancements

- Automated dependency updates
- Security vulnerability scanning
- Performance regression detection
- Automated deployment on successful builds
