# Implementation Plan

- [ ] 1. Set up backend service structure and data models
  - [ ] 1.1 Create SignalResult and related TypeScript interfaces
    - Define SignalResult, TrendSignal, MomentumSignal, RiskSignal interfaces
    - Define PriceDataPoint, MACDResult, TechnicalIndicators, VolatilityResult interfaces
    - Ensure all interfaces match the design document specifications
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 1.2 Write property test for SignalResult structure
    - **Property 1: Signal result completeness**
    - **Validates: Requirements 1.2, 2.1, 2.3, 3.1, 3.2, 8.2, 8.3, 8.4, 8.5, 8.6**

  - [ ]* 1.3 Write property test for JSON serialization
    - **Property 12: JSON serialization round trip**
    - **Validates: Requirements 8.7**

- [ ] 2. Implement technical indicator calculator
  - [ ] 2.1 Implement Moving Average (MA) calculation
    - Write calculateMA function using standard simple moving average formula
    - Handle edge cases: empty arrays, insufficient data
    - _Requirements: 4.1, 4.5_

  - [ ] 2.2 Implement Exponential Moving Average (EMA) calculation
    - Write calculateEMA function using standard EMA formula with smoothing factor
    - Handle edge cases: empty arrays, insufficient data
    - _Requirements: 4.2, 4.5_

  - [ ] 2.3 Implement Relative Strength Index (RSI) calculation
    - Write calculateRSI function using standard 14-period RSI formula
    - Calculate average gains and losses over the period
    - Return value in 0-100 range
    - _Requirements: 4.3, 4.5_

  - [ ]* 2.4 Write property test for RSI bounds
    - **Property 7: RSI value bounds**
    - **Validates: Requirements 4.3**

  - [ ] 2.5 Implement MACD calculation
    - Write calculateMACD function using standard parameters (12, 26, 9)
    - Calculate MACD line, signal line, and histogram
    - Return MACDResult with all three components
    - _Requirements: 4.4, 4.5_

  - [ ]* 2.6 Write property test for MACD structure
    - **Property 8: MACD structure completeness**
    - **Validates: Requirements 4.4**

  - [ ]* 2.7 Write unit tests for technical indicators
    - Test MA with known input/output examples
    - Test EMA with known input/output examples
    - Test RSI with edge cases (all gains = 100, all losses = 0)
    - Test MACD with standard test cases
    - Test all indicators with empty arrays and single values
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3. Implement volatility analyzer
  - [ ] 3.1 Implement volatility calculation
    - Calculate daily returns from price data
    - Compute standard deviation of returns
    - Annualize volatility using sqrt(365) factor
    - _Requirements: 10.3_

  - [ ]* 3.2 Write property test for volatility calculation
    - **Property 13: Volatility calculation correctness**
    - **Validates: Requirements 10.3**

  - [ ] 3.3 Implement risk level classification
    - Apply thresholds: Low (<30%), Medium (30-60%), High (>=60%)
    - Generate explanation text describing volatility factors
    - Ensure explanation avoids prohibited language
    - _Requirements: 3.2, 3.4, 3.5_

  - [ ]* 3.4 Write property test for risk classification
    - **Property 3: Risk classification validity**
    - **Validates: Requirements 3.2, 3.4**

  - [ ]* 3.5 Write unit tests for volatility analyzer
    - Test volatility calculation with known price sequences
    - Test risk classification at boundary thresholds
    - Test with zero volatility (flat prices)
    - Test with extreme volatility
    - _Requirements: 3.1, 3.2, 10.3_

- [ ] 4. Implement signal aggregator
  - [ ] 4.1 Implement trend score computation
    - Calculate 7-day and 30-day MA and EMA
    - Apply classification logic (bullish/neutral/bearish)
    - Generate explanation describing MA/EMA relationships
    - Include speculative disclaimer in explanation
    - _Requirements: 1.2, 1.3, 1.4, 10.1, 10.2, 10.4_

  - [ ]* 4.2 Write property test for trend classification
    - **Property 2: Trend classification validity**
    - **Validates: Requirements 1.2, 1.4**

  - [ ]* 4.3 Write property test for multiple timeframe analysis
    - **Property 14: Multiple timeframe analysis**
    - **Validates: Requirements 10.1, 10.2, 10.4**

  - [ ]* 4.4 Write property test for timeframe divergence
    - **Property 15: Timeframe divergence notification**
    - **Validates: Requirements 10.5**

  - [ ] 4.5 Implement momentum score computation
    - Calculate RSI and MACD for price data
    - Normalize MACD histogram to 0-100 scale
    - Compute weighted average: RSI (60%) + normalized MACD (40%)
    - Generate explanation based on RSI zones and MACD direction
    - Include experimental disclaimer in explanation
    - _Requirements: 2.1, 2.3, 2.4_

  - [ ]* 4.6 Write property test for momentum bounds
    - **Property 4: Momentum score bounds**
    - **Validates: Requirements 2.1**

  - [ ] 4.7 Implement signal aggregation
    - Combine trend, momentum, and risk into SignalResult
    - Add timestamp and symbol to result
    - Include main disclaimer text
    - Ensure all explanations use neutral, analytical language
    - _Requirements: 1.3, 2.4, 7.1_

  - [ ]* 4.8 Write property test for disclaimer presence
    - **Property 5: Disclaimer presence**
    - **Validates: Requirements 1.3, 2.4, 7.1, 7.2**

  - [ ]* 4.9 Write property test for prohibited language
    - **Property 6: Prohibited language exclusion**
    - **Validates: Requirements 1.5, 3.5, 7.3, 7.4**

  - [ ]* 4.10 Write unit tests for signal aggregator
    - Test trend classification with specific MA/EMA configurations
    - Test momentum score with known RSI/MACD values
    - Test explanation text generation for each classification
    - Test disclaimer inclusion in all outputs
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.3, 2.4, 7.1_

- [ ] 5. Implement historical data fetcher
  - [ ] 5.1 Create historical data fetcher service
    - Implement fetchHistoricalData function
    - Integrate with existing crypto data source or API
    - Transform data into PriceDataPoint array format
    - Validate data completeness and quality
    - _Requirements: 1.1_

  - [ ] 5.2 Implement error handling for data fetching
    - Handle unavailable data (throw appropriate error)
    - Handle insufficient data (validate minimum length)
    - Handle invalid symbols (validate format)
    - _Requirements: 1.1, 5.3_

  - [ ]* 5.3 Write unit tests for data fetcher
    - Test successful data fetch with valid symbol
    - Test error handling for invalid symbols
    - Test error handling for unavailable data
    - Test data transformation to PriceDataPoint format
    - _Requirements: 1.1, 5.3_

- [ ] 6. Implement Signal Service and API endpoint
  - [ ] 6.1 Create Signal Service class
    - Implement getSignals method
    - Orchestrate data fetching, indicator calculation, and aggregation
    - Handle errors and edge cases
    - Add appropriate logging
    - _Requirements: 1.1, 1.2, 2.1, 3.1_

  - [ ] 6.2 Implement API endpoint GET /api/signals/:symbol
    - Create Express/NestJS route handler
    - Validate symbol parameter
    - Call Signal Service to compute signals
    - Return SignalResult as JSON response
    - Handle errors with appropriate HTTP status codes
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 6.3 Write property test for API response structure
    - **Property 9: API endpoint response structure**
    - **Validates: Requirements 5.2, 5.4**

  - [ ]* 6.4 Write property test for API error handling
    - **Property 10: API error handling**
    - **Validates: Requirements 5.3**

  - [ ]* 6.5 Write unit tests for API endpoint
    - Test successful response with valid symbol
    - Test 400 error with invalid symbol
    - Test 404 error with unavailable data
    - Test response structure matches SignalResult schema
    - Test endpoint path and HTTP method
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement frontend signal display component
  - [ ] 8.1 Create SignalDisplay React component
    - Accept SignalDisplayProps (symbol, signalData, loading, error)
    - Render trend indicator with color coding (green/yellow/red)
    - Display risk level badge (Low/Medium/High)
    - Show explanation text for each signal component
    - Display disclaimers prominently at top and bottom
    - Handle loading and error states
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.2_

  - [ ]* 8.2 Write property test for frontend display completeness
    - **Property 11: Frontend signal display completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]* 8.3 Write unit tests for SignalDisplay component
    - Test rendering with complete signal data
    - Test trend color coding for each classification
    - Test risk level badge rendering
    - Test disclaimer visibility
    - Test loading state rendering
    - Test error state rendering
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.2_

- [ ] 9. Integrate signal display into existing UI
  - [ ] 9.1 Add signal display to coin detail view
    - Import and use SignalDisplay component
    - Fetch signal data from API when symbol is selected
    - Handle API errors gracefully
    - Show loading indicator during fetch
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 9.2 Add disclaimer to main page
    - Display prominent disclaimer about speculative nature of signals
    - Position near signal information
    - Use clear, visible styling
    - _Requirements: 7.2_

  - [ ]* 9.3 Write integration tests for signal display
    - Test complete flow from user action to signal display
    - Test API error handling in UI
    - Test loading states during API calls
    - Test disclaimer visibility in complete page context
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.2_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
