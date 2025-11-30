# Design Document

## Overview

The Signals & Predictions module provides technical analysis capabilities for cryptocurrency trading by computing trend scores, momentum indicators, and risk assessments from historical price and volume data. The system uses established technical indicators (MA, EMA, RSI, MACD) combined with statistical volatility measures to generate comprehensive signal objects. All outputs include explicit disclaimers emphasizing their speculative nature and the absence of profit guarantees.

The module consists of a backend Signal Service that fetches historical data, computes indicators, and exposes a REST API endpoint, along with frontend components that display signal information with prominent safety disclaimers.

## Architecture

### System Components

```
┌─────────────────┐
│   Frontend UI   │
│  (React/TS)     │
└────────┬────────┘
         │ HTTP GET /api/signals/:symbol
         ▼
┌─────────────────┐
│  Signal Service │
│   (Backend)     │
└────────┬────────┘
         │
         ├──► Historical Data Fetcher
         │
         ├──► Technical Indicator Calculator
         │    ├─ MA/EMA Computer
         │    ├─ RSI Computer
         │    └─ MACD Computer
         │
         ├──► Volatility Analyzer
         │
         └──► Signal Aggregator
```

### Data Flow

1. Frontend requests signal data for a symbol via GET /api/signals/:symbol
2. Signal Service fetches historical price/volume data for the symbol
3. Technical Indicator Calculator computes MA, EMA, RSI, and MACD values
4. Volatility Analyzer calculates standard deviation and risk classification
5. Signal Aggregator combines indicators into trend/momentum scores with explanations
6. Signal Service returns SignalResult object with disclaimers
7. Frontend renders signal information with prominent safety warnings

## Components and Interfaces

### Signal Service (Backend)

**Responsibilities:**
- Fetch historical price and volume data for cryptocurrency symbols
- Compute technical indicators (MA, EMA, RSI, MACD)
- Calculate volatility metrics and risk classifications
- Aggregate indicators into trend and momentum scores
- Generate explanatory text for signal components
- Expose REST API endpoint for signal retrieval

**Interface:**

```typescript
interface SignalService {
  /**
   * Compute and return signal data for a given symbol
   * @param symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
   * @returns Promise resolving to SignalResult
   * @throws Error if symbol is invalid or data unavailable
   */
  getSignals(symbol: string): Promise<SignalResult>;
}
```

### Historical Data Fetcher

**Responsibilities:**
- Retrieve historical price and volume data from external APIs or database
- Validate data completeness and quality
- Transform data into standardized format for analysis

**Interface:**

```typescript
interface HistoricalDataFetcher {
  /**
   * Fetch historical OHLCV data for a symbol
   * @param symbol - Cryptocurrency symbol
   * @param days - Number of days of historical data to fetch
   * @returns Promise resolving to array of price data points
   */
  fetchHistoricalData(symbol: string, days: number): Promise<PriceDataPoint[]>;
}

interface PriceDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### Technical Indicator Calculator

**Responsibilities:**
- Compute moving averages (simple and exponential)
- Calculate RSI (Relative Strength Index)
- Calculate MACD (Moving Average Convergence Divergence)
- Apply standard formulas with configurable parameters

**Interface:**

```typescript
interface TechnicalIndicatorCalculator {
  /**
   * Calculate Simple Moving Average
   * @param prices - Array of closing prices
   * @param period - Number of periods for MA calculation
   * @returns Moving average value
   */
  calculateMA(prices: number[], period: number): number;

  /**
   * Calculate Exponential Moving Average
   * @param prices - Array of closing prices
   * @param period - Number of periods for EMA calculation
   * @returns Exponential moving average value
   */
  calculateEMA(prices: number[], period: number): number;

  /**
   * Calculate Relative Strength Index
   * @param prices - Array of closing prices
   * @param period - Number of periods for RSI calculation (typically 14)
   * @returns RSI value between 0 and 100
   */
  calculateRSI(prices: number[], period: number): number;

  /**
   * Calculate MACD indicator
   * @param prices - Array of closing prices
   * @returns MACD object with line, signal, and histogram values
   */
  calculateMACD(prices: number[]): MACDResult;
}

interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
}
```

### Volatility Analyzer

**Responsibilities:**
- Calculate price volatility using standard deviation
- Classify risk level based on volatility thresholds
- Generate risk explanations

**Interface:**

```typescript
interface VolatilityAnalyzer {
  /**
   * Calculate volatility and classify risk level
   * @param prices - Array of closing prices
   * @returns Volatility analysis result
   */
  analyzeVolatility(prices: number[]): VolatilityResult;
}

interface VolatilityResult {
  volatility: number; // Standard deviation of returns
  riskLevel: 'Low' | 'Medium' | 'High';
  explanation: string;
}
```

### Signal Aggregator

**Responsibilities:**
- Combine technical indicators into trend classification
- Compute momentum score from multiple indicators
- Generate comprehensive explanations
- Ensure all outputs include appropriate disclaimers

**Interface:**

```typescript
interface SignalAggregator {
  /**
   * Aggregate indicators into a complete signal result
   * @param indicators - Computed technical indicators
   * @param volatility - Volatility analysis result
   * @param symbol - Cryptocurrency symbol
   * @returns Complete signal result with disclaimers
   */
  aggregateSignals(
    indicators: TechnicalIndicators,
    volatility: VolatilityResult,
    symbol: string
  ): SignalResult;
}

interface TechnicalIndicators {
  ma7: number;
  ma30: number;
  ema7: number;
  ema30: number;
  rsi: number;
  macd: MACDResult;
  currentPrice: number;
}
```

### API Endpoint

**Route:** `GET /api/signals/:symbol`

**Parameters:**
- `symbol` (path parameter): Cryptocurrency symbol (e.g., 'BTC', 'ETH')

**Response (200 OK):**
```json
{
  "symbol": "BTC",
  "timestamp": 1701388800000,
  "trend": {
    "score": "bullish",
    "explanation": "Price is above both 7-day and 30-day moving averages. EMA shows upward momentum. (Speculative analysis)"
  },
  "momentum": {
    "score": 72.5,
    "explanation": "RSI at 65 indicates strong momentum without overbought conditions. MACD histogram positive. (Experimental indicator)"
  },
  "risk": {
    "level": "Medium",
    "volatility": 0.045,
    "explanation": "Moderate volatility with 4.5% standard deviation over 30 days. (Risk assessment is speculative)"
  },
  "disclaimer": "Speculative, experimental, no guarantees, not financial advice. Past performance does not indicate future results."
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid symbol",
  "message": "Symbol must be a valid cryptocurrency identifier"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Data unavailable",
  "message": "Historical data not available for the specified symbol"
}
```

### Frontend Components

**SignalDisplay Component:**

Displays signal information for a cryptocurrency symbol with prominent disclaimers.

```typescript
interface SignalDisplayProps {
  symbol: string;
  signalData: SignalResult | null;
  loading: boolean;
  error: string | null;
}
```

**Rendering Requirements:**
- Show trend indicator with color coding (green=bullish, yellow=neutral, red=bearish)
- Display risk level badge (Low/Medium/High)
- Render explanation text for each signal component
- Show disclaimer prominently at top and bottom of signal section
- Use neutral, non-promotional language throughout

## Data Models

### SignalResult

The primary data structure returned by the Signal Service and consumed by the frontend.

```typescript
interface SignalResult {
  symbol: string;
  timestamp: number; // Unix timestamp in milliseconds
  trend: TrendSignal;
  momentum: MomentumSignal;
  risk: RiskSignal;
  disclaimer: string;
}

interface TrendSignal {
  score: 'bullish' | 'neutral' | 'bearish';
  explanation: string;
}

interface MomentumSignal {
  score: number; // 0-100 scale
  explanation: string;
}

interface RiskSignal {
  level: 'Low' | 'Medium' | 'High';
  volatility: number; // Standard deviation of returns
  explanation: string;
}
```

### Algorithm Descriptions

#### Trend Score Computation

The trend score is determined by analyzing the relationship between current price and moving averages:

**Algorithm:**
1. Calculate 7-day and 30-day simple moving averages (MA7, MA30)
2. Calculate 7-day and 30-day exponential moving averages (EMA7, EMA30)
3. Get current price (most recent closing price)
4. Apply classification logic:
   - **Bullish**: Current price > MA7 AND Current price > MA30 AND EMA7 > EMA30
   - **Bearish**: Current price < MA7 AND Current price < MA30 AND EMA7 < EMA30
   - **Neutral**: All other conditions
5. Generate explanation describing which conditions were met

**Parameters:**
- MA7 period: 7 days
- MA30 period: 30 days
- EMA7 period: 7 days
- EMA30 period: 30 days

#### Momentum Score Computation

The momentum score combines RSI and MACD indicators into a 0-100 scale:

**Algorithm:**
1. Calculate RSI with 14-period standard formula
2. Calculate MACD using standard parameters (12, 26, 9)
3. Normalize MACD histogram to 0-100 scale:
   - Find max absolute MACD histogram value in recent history
   - Scale current histogram: `(histogram / maxHistogram) * 50 + 50`
4. Compute weighted average: `momentum = (RSI * 0.6) + (normalizedMACD * 0.4)`
5. Clamp result to 0-100 range
6. Generate explanation based on RSI zones and MACD direction

**RSI Interpretation:**
- 0-30: Oversold territory
- 30-50: Weak momentum
- 50-70: Strong momentum
- 70-100: Overbought territory

**MACD Interpretation:**
- Positive histogram: Bullish momentum
- Negative histogram: Bearish momentum
- Histogram magnitude: Momentum strength

#### Risk Level Classification

Risk level is determined by calculating volatility and applying threshold-based classification:

**Algorithm:**
1. Calculate daily returns: `return[i] = (price[i] - price[i-1]) / price[i-1]`
2. Calculate standard deviation of returns over 30-day period
3. Annualize volatility: `annualizedVol = stdDev * sqrt(365)`
4. Apply classification thresholds:
   - **Low**: annualizedVol < 0.30 (30%)
   - **Medium**: 0.30 <= annualizedVol < 0.60 (60%)
   - **High**: annualizedVol >= 0.60 (60%)
5. Generate explanation including volatility percentage and recent price behavior

**Note:** Thresholds are calibrated for cryptocurrency markets, which typically exhibit higher volatility than traditional assets.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Signal result completeness

*For any* valid cryptocurrency symbol with available historical data, the generated SignalResult should contain all required fields: symbol, timestamp, trend (with score and explanation), momentum (with score and explanation), risk (with level, volatility, and explanation), and disclaimer text.

**Validates: Requirements 1.2, 2.1, 2.3, 3.1, 3.2, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 2: Trend classification validity

*For any* historical price data, the computed trend score should be exactly one of the three valid classifications: 'bullish', 'neutral', or 'bearish', and should include a non-empty explanation string.

**Validates: Requirements 1.2, 1.4**

### Property 3: Risk classification validity

*For any* historical price data, the computed risk level should be exactly one of the three valid classifications: 'Low', 'Medium', or 'High', and should include a non-empty explanation string describing volatility factors.

**Validates: Requirements 3.2, 3.4**

### Property 4: Momentum score bounds

*For any* historical price data, the computed momentum score should be a number within the range [0, 100] inclusive.

**Validates: Requirements 2.1**

### Property 5: Disclaimer presence

*For any* generated SignalResult, the output should contain the exact disclaimer text "Speculative, experimental, no guarantees, not financial advice" and all trend, momentum, and risk explanations should include speculative language markers.

**Validates: Requirements 1.3, 2.4, 7.1, 7.2**

### Property 6: Prohibited language exclusion

*For any* generated signal text (including trend explanations, momentum explanations, risk explanations, and disclaimers), the text should not contain any of the following prohibited phrases: "get rich quickly", "sure profit", "guaranteed returns", "certain gains", or any variations suggesting guaranteed profits or certain outcomes.

**Validates: Requirements 1.5, 3.5, 7.3, 7.4**

### Property 7: RSI value bounds

*For any* historical price data with sufficient length (at least 15 data points), the computed RSI value should be a number within the range [0, 100] inclusive, following the standard RSI formula.

**Validates: Requirements 4.3**

### Property 8: MACD structure completeness

*For any* historical price data with sufficient length (at least 35 data points), the computed MACD result should contain three numeric fields: macdLine, signalLine, and histogram, where histogram equals (macdLine - signalLine).

**Validates: Requirements 4.4**

### Property 9: API endpoint response structure

*For any* valid cryptocurrency symbol, a GET request to /api/signals/:symbol should return a response with status 200 and a JSON body matching the SignalResult structure with all required fields present.

**Validates: Requirements 5.2, 5.4**

### Property 10: API error handling

*For any* invalid cryptocurrency symbol (empty string, special characters, or non-existent symbol), a GET request to /api/signals/:symbol should return an error response with status 4xx and an error message.

**Validates: Requirements 5.3**

### Property 11: Frontend signal display completeness

*For any* SignalResult data, the rendered frontend output should display the trend classification, risk level classification, explanation text for signals, and disclaimer text.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 12: JSON serialization round trip

*For any* valid SignalResult object, serializing to JSON and then deserializing should produce an equivalent SignalResult with all field values preserved.

**Validates: Requirements 8.7**

### Property 13: Volatility calculation correctness

*For any* historical price data, the computed volatility should equal the standard deviation of daily returns, calculated as: stdDev([(price[i] - price[i-1]) / price[i-1] for all i]).

**Validates: Requirements 10.3**

### Property 14: Multiple timeframe analysis

*For any* historical price data, the trend computation should analyze both 7-day and 30-day periods, and the resulting signal should combine both timeframe results into a single coherent trend classification.

**Validates: Requirements 10.1, 10.2, 10.4**

### Property 15: Timeframe divergence notification

*For any* historical price data where 7-day and 30-day trend indicators point in opposite directions (e.g., 7-day bullish but 30-day bearish), the explanation text should explicitly mention the divergence or conflicting signals.

**Validates: Requirements 10.5**



## Error Handling

### Data Availability Errors

**Scenario:** Historical data is unavailable for the requested symbol

**Handling:**
- Signal Service should catch data fetching errors
- Return HTTP 404 with descriptive error message
- Log the error for monitoring purposes
- Frontend should display user-friendly message: "Signal data unavailable for this symbol"

### Insufficient Data Errors

**Scenario:** Historical data exists but is insufficient for indicator calculations (e.g., less than 35 days for MACD)

**Handling:**
- Signal Service should validate data length before computation
- Return HTTP 400 with message indicating insufficient data
- Specify minimum data requirements in error response
- Frontend should inform user that more historical data is needed

### Invalid Symbol Errors

**Scenario:** User requests signals for an invalid or malformed symbol

**Handling:**
- API endpoint should validate symbol format
- Return HTTP 400 with error message: "Invalid symbol format"
- Frontend should validate symbol input before making API request
- Provide suggestions for valid symbol formats

### Computation Errors

**Scenario:** Technical indicator calculation fails due to edge cases (e.g., division by zero, NaN values)

**Handling:**
- Wrap all mathematical operations in try-catch blocks
- Validate intermediate results for NaN or Infinity
- Return HTTP 500 with generic error message (don't expose internal details)
- Log detailed error information for debugging
- Frontend should display: "Unable to compute signals at this time"

### API Timeout Errors

**Scenario:** Signal computation takes longer than acceptable time limit

**Handling:**
- Implement timeout mechanism in Signal Service (e.g., 10 seconds)
- Return HTTP 504 Gateway Timeout if computation exceeds limit
- Frontend should display: "Signal computation timed out, please try again"
- Consider caching computed signals to reduce computation time

### Rate Limiting

**Scenario:** Too many requests from a single client

**Handling:**
- Implement rate limiting middleware (e.g., 60 requests per minute per IP)
- Return HTTP 429 Too Many Requests with Retry-After header
- Frontend should respect rate limits and implement exponential backoff
- Display message: "Too many requests, please wait before trying again"

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples, edge cases, and component behavior:

**Technical Indicator Calculations:**
- Test MA calculation with known input/output examples
- Test EMA calculation with known input/output examples
- Test RSI calculation with known values (e.g., all gains should yield RSI=100)
- Test MACD calculation with standard test cases
- Test edge cases: empty arrays, single values, all identical values

**Volatility Analysis:**
- Test volatility calculation with known price sequences
- Test risk classification at boundary thresholds (29.9%, 30.1%, 59.9%, 60.1%)
- Test with zero volatility (flat prices)
- Test with extreme volatility

**Signal Aggregation:**
- Test trend classification with specific MA/EMA configurations
- Test momentum score calculation with known RSI/MACD values
- Test explanation text generation for each classification
- Test disclaimer inclusion in all outputs

**API Endpoint:**
- Test successful response with valid symbol
- Test error responses with invalid symbols
- Test response structure matches SignalResult schema
- Test endpoint path and HTTP method

**Frontend Components:**
- Test SignalDisplay renders all signal components
- Test disclaimer visibility in rendered output
- Test color coding for trend indicators
- Test loading and error states

### Property-Based Testing

Property-based tests will verify universal properties across randomly generated inputs. The testing framework for TypeScript will be **fast-check**, which provides comprehensive property-based testing capabilities.

**Configuration:**
- Each property test should run a minimum of 100 iterations
- Use appropriate generators for price data, symbols, and date ranges
- Configure shrinking to find minimal failing examples

**Property Test Requirements:**
- Each property-based test MUST be tagged with a comment referencing the correctness property
- Tag format: `// Feature: signals-predictions, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests should use smart generators that constrain inputs to valid ranges

**Property Tests to Implement:**

1. **Signal Result Completeness** (Property 1)
   - Generate random valid symbols and historical data
   - Verify all required fields are present in SignalResult
   - Verify all nested objects have required fields

2. **Trend Classification Validity** (Property 2)
   - Generate random price data sequences
   - Verify trend score is always 'bullish', 'neutral', or 'bearish'
   - Verify explanation is non-empty string

3. **Risk Classification Validity** (Property 3)
   - Generate random price data sequences
   - Verify risk level is always 'Low', 'Medium', or 'High'
   - Verify explanation is non-empty string

4. **Momentum Score Bounds** (Property 4)
   - Generate random price data sequences
   - Verify momentum score is always between 0 and 100 inclusive

5. **Disclaimer Presence** (Property 5)
   - Generate random signal results
   - Verify disclaimer text contains required phrases
   - Verify explanations contain speculative language

6. **Prohibited Language Exclusion** (Property 6)
   - Generate random signal results
   - Verify no prohibited phrases appear in any text fields
   - Test case-insensitive matching

7. **RSI Value Bounds** (Property 7)
   - Generate random price sequences (length >= 15)
   - Verify RSI is always between 0 and 100 inclusive

8. **MACD Structure Completeness** (Property 8)
   - Generate random price sequences (length >= 35)
   - Verify MACD has all three components
   - Verify histogram = macdLine - signalLine

9. **API Endpoint Response Structure** (Property 9)
   - Generate random valid symbols
   - Verify response status is 200
   - Verify response body matches SignalResult structure

10. **API Error Handling** (Property 10)
    - Generate random invalid symbols
    - Verify response status is 4xx
    - Verify error message is present

11. **Frontend Signal Display Completeness** (Property 11)
    - Generate random SignalResult objects
    - Verify rendered output contains all required elements
    - Verify disclaimer is visible in rendered HTML

12. **JSON Serialization Round Trip** (Property 12)
    - Generate random SignalResult objects
    - Serialize to JSON and deserialize
    - Verify all fields are preserved

13. **Volatility Calculation Correctness** (Property 13)
    - Generate random price sequences
    - Compute volatility independently
    - Verify Signal Service volatility matches expected value

14. **Multiple Timeframe Analysis** (Property 14)
    - Generate random price sequences (length >= 30)
    - Verify trend uses both 7-day and 30-day data
    - Verify single coherent result is produced

15. **Timeframe Divergence Notification** (Property 15)
    - Generate price sequences with divergent trends
    - Verify explanation mentions divergence or conflicting signals

### Integration Testing

Integration tests will verify end-to-end functionality:

**Backend Integration:**
- Test complete flow from API request to response
- Test integration with historical data source
- Test error propagation through service layers
- Test caching behavior (if implemented)

**Frontend Integration:**
- Test complete flow from user action to signal display
- Test API error handling in UI
- Test loading states during API calls
- Test disclaimer visibility in complete page context

### Test Data Generation

**Price Data Generators:**
- Random walk generator for realistic price movements
- Trending data generator (upward/downward trends)
- Volatile data generator (high standard deviation)
- Flat data generator (minimal price changes)
- Divergent trend generator (short-term vs long-term differences)

**Symbol Generators:**
- Valid symbol generator (uppercase letters, 2-5 characters)
- Invalid symbol generator (special characters, numbers, empty strings)

**Edge Case Generators:**
- Minimum length sequences (exactly 7, 14, 30, 35 days)
- Maximum length sequences (365+ days)
- Sequences with missing data points
- Sequences with extreme outliers

### Testing Best Practices

- **Implementation-First Development:** Implement features before writing corresponding tests
- **Complementary Testing:** Use both unit tests (specific examples) and property tests (universal properties)
- **Smart Generators:** Constrain random inputs to valid ranges to avoid spurious failures
- **Minimal Mocking:** Test real functionality without mocks whenever possible
- **Clear Test Names:** Use descriptive names that explain what is being tested
- **Fast Execution:** Keep tests fast to encourage frequent execution
- **Deterministic Tests:** Ensure tests produce consistent results (use seeded randomness for property tests)

## Example API Response

```json
{
  "symbol": "BTC",
  "timestamp": 1701388800000,
  "trend": {
    "score": "bullish",
    "explanation": "Price is above both 7-day MA ($42,150) and 30-day MA ($40,200). Short-term EMA ($42,300) is above long-term EMA ($40,500), indicating upward momentum. (Speculative analysis)"
  },
  "momentum": {
    "score": 68.5,
    "explanation": "RSI at 65 indicates strong momentum without overbought conditions. MACD histogram is positive at 0.8, showing bullish momentum. (Experimental indicator)"
  },
  "risk": {
    "level": "Medium",
    "volatility": 0.045,
    "explanation": "Moderate volatility with 4.5% daily standard deviation over 30 days. Annualized volatility of 45% is typical for cryptocurrency markets. (Risk assessment is speculative)"
  },
  "disclaimer": "Speculative, experimental, no guarantees, not financial advice. Past performance does not indicate future results."
}
```

## Example UI Rendering

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  DISCLAIMER: All signals are speculative, experimental,  │
│    no guarantees, not financial advice.                     │
└─────────────────────────────────────────────────────────────┘

Bitcoin (BTC) - Signals

┌─────────────────────────────────────────────────────────────┐
│ Trend: 🟢 Bullish (Speculative)                             │
│                                                              │
│ Price is above both 7-day MA ($42,150) and 30-day MA       │
│ ($40,200). Short-term EMA ($42,300) is above long-term     │
│ EMA ($40,500), indicating upward momentum.                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Momentum: 68.5 / 100 (Experimental)                         │
│                                                              │
│ RSI at 65 indicates strong momentum without overbought     │
│ conditions. MACD histogram is positive at 0.8, showing     │
│ bullish momentum.                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Risk Level: 🟡 Medium                                        │
│ Volatility: 4.5% (daily std dev)                           │
│                                                              │
│ Moderate volatility with 4.5% daily standard deviation     │
│ over 30 days. Annualized volatility of 45% is typical      │
│ for cryptocurrency markets.                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Remember: Past performance does not indicate future     │
│    results. This analysis is for informational purposes    │
│    only and should not be considered investment advice.    │
└─────────────────────────────────────────────────────────────┘
```
