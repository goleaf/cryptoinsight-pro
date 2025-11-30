# Implementation Plan

- [ ] 1. Set up Risk Dashboard module structure and core interfaces
  - Create backend module directory structure for risk metrics
  - Define TypeScript interfaces for all risk data types (MarketRiskSummary, PortfolioRiskSummary, VolatileCoin, CorrelationMatrix, etc.)
  - Set up module exports and dependency injection
  - _Requirements: 7.1, 7.2_

- [ ] 2. Implement Historical Data Service
  - Create HistoricalDataService class with methods for retrieving time-series price data
  - Implement getHourlyPrices method to fetch hourly price data for volatility calculations
  - Implement getDailyPrices method to fetch daily price data for correlation calculations
  - Implement getLatestPrices method for current price retrieval
  - Add database queries with TimescaleDB optimizations
  - _Requirements: 1.2, 2.2, 3.2_

- [ ] 3. Implement Volatility Calculator
  - Create VolatilityCalculator class with statistical calculation methods
  - Implement calculate24hVolatility method using standard deviation of percentage returns
  - Implement calculateMarketVolatility method for market-wide volatility
  - Implement rankByVolatility method to rank coins by volatility
  - Handle edge cases (constant prices, insufficient data)
  - _Requirements: 1.2, 2.2, 2.5_

- [ ]* 3.1 Write property test for volatility calculation
  - **Property 1: Volatility calculation correctness**
  - **Validates: Requirements 1.2, 2.2**

- [ ] 4. Implement Correlation Calculator
  - Create CorrelationCalculator class with Pearson correlation methods
  - Implement calculateCorrelationMatrix method for top N cryptocurrencies
  - Implement calculatePairwiseCorrelation method for two price series
  - Ensure correlation coefficients are bounded between -1 and 1
  - Handle edge cases (mismatched lengths, insufficient data)
  - _Requirements: 3.2_

- [ ]* 4.1 Write property test for correlation calculation
  - **Property 4: Pearson correlation calculation correctness**
  - **Validates: Requirements 3.2**

- [ ] 5. Implement Diversification Calculator
  - Create DiversificationCalculator class with portfolio analysis methods
  - Implement calculateDiversificationIndex method using Herfindahl-Hirschman Index
  - Implement calculateConcentrationRisk method for top 3 holdings analysis
  - Implement HHI normalization to 0-100 scale
  - Handle edge cases (empty portfolio, single holding, fewer than 3 holdings)
  - _Requirements: 4.2, 5.2_

- [ ]* 5.1 Write property test for concentration risk calculation
  - **Property 6: Concentration risk calculation correctness**
  - **Validates: Requirements 4.2**

- [ ]* 5.2 Write property test for diversification index calculation
  - **Property 7: Diversification index calculation correctness**
  - **Validates: Requirements 5.2**

- [ ]* 5.3 Write property test for diversification score bounds
  - **Property 8: Diversification score bounds**
  - **Validates: Requirements 5.2**

- [ ] 6. Implement Risk Metrics Service
  - Create RiskMetricsService class to orchestrate all risk calculations
  - Implement getMarketRiskSummary method aggregating market volatility, volatile coins, and correlation matrix
  - Implement getPortfolioRiskSummary method for authenticated users
  - Integrate with VolatilityCalculator, CorrelationCalculator, and DiversificationCalculator
  - Integrate with Market Data Aggregator and Portfolio Service
  - Implement caching strategy with 5-minute TTL
  - Add data quality indicators for partial/insufficient data
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 7.3_

- [ ]* 6.1 Write property test for missing data exclusion
  - **Property 3: Missing data exclusion**
  - **Validates: Requirements 2.5**

- [ ]* 6.2 Write property test for insufficient data handling
  - **Property 9: Insufficient data handling**
  - **Validates: Requirements 7.3**

- [ ] 7. Implement Risk Metrics Controller and API endpoints
  - Create RiskMetricsController with REST endpoints
  - Implement GET /api/v1/risk/market-summary endpoint
  - Implement GET /api/v1/risk/portfolio-summary endpoint (authenticated)
  - Implement GET /api/v1/risk/volatile-coins endpoint with limit parameter
  - Implement GET /api/v1/risk/correlation-matrix endpoint with optional symbols and period
  - Add input validation for all query parameters
  - Add authentication middleware for portfolio endpoints
  - Implement error handling for all endpoints
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [ ]* 7.1 Write property test for error response structure
  - **Property 10: Error response structure**
  - **Validates: Requirements 7.5**

- [ ] 8. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Create frontend Risk Dashboard page structure
  - Create RiskDashboardPage component as main container
  - Set up component directory structure
  - Create DisclaimerBanner component with prominent warning text
  - Implement responsive layout with market metrics and portfolio metrics sections
  - Add loading states and error handling
  - _Requirements: 1.1, 6.1, 6.2, 6.4, 8.2, 8.4_

- [ ] 10. Implement Market Volatility Card component
  - Create MarketVolatilityCard component displaying 24h market volatility
  - Add tooltip explaining volatility metric
  - Implement color coding based on volatility level (low/medium/high/extreme)
  - Add warning indicator when volatility exceeds 10%
  - Display timestamp of last update
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 11. Implement Volatile Coins Card component
  - Create VolatileCoinsCard component displaying top 10 volatile coins
  - Implement table with columns: rank, coin name/symbol, price, volatility, 24h change
  - Add tooltips for volatile coin entries
  - Implement color coding for positive/negative price changes
  - _Requirements: 2.1, 2.3, 2.4_

- [ ]* 11.1 Write property test for volatile coin display completeness
  - **Property 2: Volatile coin display completeness**
  - **Validates: Requirements 2.3**

- [ ] 12. Implement Correlation Matrix Card component
  - Create CorrelationMatrixCard component with heat map visualization
  - Implement color mapping function for correlation values (warm for positive, cool for negative)
  - Add tooltips explaining correlation values
  - Display correlation matrix as table with color-coded cells
  - Add legend showing color scale
  - Include disclaimer about historical correlation
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ]* 12.1 Write property test for correlation color mapping
  - **Property 5: Correlation color mapping consistency**
  - **Validates: Requirements 3.3**

- [ ] 13. Implement Portfolio Risk Card component
  - Create PortfolioRiskCard component for concentration risk
  - Display top 3 holdings percentage with risk level indicator
  - Show list of top 3 holdings with percentages and values
  - Add tooltip explaining concentration risk
  - Display warning when concentration exceeds 70%
  - Handle empty portfolio state with appropriate message
  - Add disclaimer about diversification not eliminating risk
  - _Requirements: 4.1, 4.3, 4.4, 4.5, 6.4_

- [ ] 14. Implement Diversification Card component
  - Create DiversificationCard component for diversification index
  - Display score out of 100 with level indicator (poor/fair/good/excellent)
  - Add visual score bar showing diversification level
  - Add tooltip explaining diversification index
  - Display warning when score is below 40
  - Handle portfolios with fewer than 3 holdings with appropriate message
  - Show holdings count and raw HHI value
  - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [ ] 15. Create custom hooks for data fetching
  - Create useMarketRisk hook for fetching market risk summary
  - Create usePortfolioRisk hook for fetching portfolio risk summary (authenticated)
  - Implement auto-refresh every 60 seconds
  - Add loading states and error handling
  - Integrate with authentication context
  - _Requirements: 1.5, 8.2_

- [ ] 16. Implement shared components
  - Create MetricTooltip component for reusable tooltips
  - Create LoadingCard component for loading states
  - Add styling with Tailwind CSS for all components
  - Ensure responsive design for mobile and desktop viewports
  - _Requirements: 8.2, 8.3_

- [ ] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
