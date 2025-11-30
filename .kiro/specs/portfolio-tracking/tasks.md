# Implementation Plan

- [x] 1. Set up backend module structure and database schema
  - Create portfolio module directory structure (controller, service, repository)
  - Define TypeScript interfaces for Position, PositionWithMetrics, PortfolioSummary, and related types
  - Create database migration for positions table with constraints and indexes
  - Set up database connection and repository base class
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [-] 2. Implement Position repository with CRUD operations
  - Create PositionRepository class with create, findAll, findById, update, and delete methods
  - Implement user-scoped queries to ensure data isolation
  - Add database error handling and constraint validation
  - _Requirements: 1.1, 3.1, 4.1, 9.4_

- [ ]* 2.1 Write property test for position creation round-trip
  - **Property 1: Position creation round-trip**
  - **Validates: Requirements 1.1, 1.5**

- [ ]* 2.2 Write property test for invalid position rejection
  - **Property 2: Invalid position rejection**
  - **Validates: Requirements 1.2, 1.3, 1.4**

- [ ]* 2.3 Write property test for position deletion
  - **Property 9: Position deletion removes record**
  - **Validates: Requirements 4.1**

- [ ]* 2.4 Write property test for user data isolation
  - **Property 17: User data isolation**
  - **Validates: Requirements 9.4**

- [ ] 3. Implement Calculation Engine for portfolio metrics
  - Create CalculationEngine class with methods for current value, unrealized PnL, and PnL percentage
  - Implement portfolio summary calculations (total value, total PnL, total PnL percentage)
  - Implement allocation calculations with percentage distribution
  - Integrate with Market Data Aggregator to fetch current prices
  - Add price caching mechanism (30 second TTL)
  - _Requirements: 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 6.2_

- [ ]* 3.1 Write property test for current value calculation
  - **Property 4: Current value calculation correctness**
  - **Validates: Requirements 2.2**

- [ ]* 3.2 Write property test for unrealized PnL calculation
  - **Property 5: Unrealized PnL calculation correctness**
  - **Validates: Requirements 2.3**

- [ ]* 3.3 Write property test for PnL percentage calculation
  - **Property 6: PnL percentage calculation correctness**
  - **Validates: Requirements 2.4**

- [ ]* 3.4 Write property test for total portfolio value
  - **Property 10: Total portfolio value is sum of positions**
  - **Validates: Requirements 5.1**

- [ ]* 3.5 Write property test for total unrealized PnL
  - **Property 11: Total unrealized PnL is sum of position PnLs**
  - **Validates: Requirements 5.2**

- [ ]* 3.6 Write property test for total PnL percentage
  - **Property 12: Total PnL percentage calculation correctness**
  - **Validates: Requirements 5.3**

- [ ]* 3.7 Write property test for allocation percentages sum
  - **Property 13: Allocation percentages sum to 100**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 3.8 Write property test for allocation calculation
  - **Property 14: Allocation calculation correctness**
  - **Validates: Requirements 6.2**

- [ ] 4. Implement Portfolio Service with business logic
  - Create PortfolioService class that orchestrates repository and calculation engine
  - Implement getPositionsWithMetrics method that enriches positions with current prices and calculations
  - Implement getPortfolioSummary method
  - Implement getPortfolioAllocation method
  - Add error handling for Market Data Aggregator unavailability
  - Implement fallback to cached prices when aggregator is down
  - _Requirements: 2.1, 2.5, 5.1, 5.2, 5.3, 6.1, 6.2_

- [ ]* 4.1 Write property test for position display completeness
  - **Property 3: Position display completeness**
  - **Validates: Requirements 2.1**

- [ ]* 4.2 Write property test for allocation completeness
  - **Property 15: Allocation completeness**
  - **Validates: Requirements 6.3**

- [ ] 5. Implement Portfolio API Controller with REST endpoints
  - Create PortfolioController with routes for all CRUD operations
  - Implement POST /api/portfolio/positions (create position)
  - Implement GET /api/portfolio/positions (get all positions with metrics)
  - Implement GET /api/portfolio/positions/:id (get single position)
  - Implement PUT /api/portfolio/positions/:id (update position)
  - Implement DELETE /api/portfolio/positions/:id (delete position)
  - Implement GET /api/portfolio/summary (get portfolio summary)
  - Implement GET /api/portfolio/allocation (get allocation data)
  - Add input validation middleware for all endpoints
  - Add authentication middleware to extract user ID
  - Add error handling middleware with appropriate HTTP status codes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.1, 3.2, 4.1, 5.1, 6.1, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ]* 5.1 Write property test for position update preserves identity
  - **Property 7: Position update preserves identity**
  - **Validates: Requirements 3.3**

- [ ]* 5.2 Write property test for invalid update rejection
  - **Property 8: Invalid update rejection**
  - **Validates: Requirements 3.2**

- [ ]* 5.3 Write property test for API error responses
  - **Property 18: API error responses include status and message**
  - **Validates: Requirements 10.7**

- [ ]* 5.4 Write unit tests for API endpoints
  - Test each endpoint with valid requests returns correct status codes
  - Test validation errors return 400 with error messages
  - Test authentication errors return 401
  - Test not found errors return 404
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 6. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement historical portfolio value calculation
  - Create HistoricalValueService to calculate portfolio value over time
  - Implement method to fetch historical prices for all position symbols
  - Calculate portfolio value at each time point using historical prices
  - Implement GET /api/portfolio/history endpoint with date range and interval parameters
  - Handle missing historical data gracefully
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 7.1 Write property test for historical value calculation
  - **Property 16: Historical value calculation correctness**
  - **Validates: Requirements 7.2**

- [ ] 8. Create frontend Portfolio page structure
  - Create PortfolioPage component as main container
  - Create DisclaimerBanner component with required disclaimer text
  - Add disclaimer text: "This is a tracking tool only", "No automatic trading is performed", "No profit guarantees are provided"
  - Set up routing to portfolio page
  - Add basic styling and layout structure
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 9. Implement PortfolioSummary component
  - Create PortfolioSummary component to display summary cards
  - Display total portfolio value, total unrealized PnL, PnL percentage, and position count
  - Add color coding for positive (green) and negative (red) PnL values
  - Format currency values with proper locale formatting
  - Add loading state handling
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 10. Implement PositionsTable component
  - Create PositionsTable component to display all positions in a table
  - Display columns: symbol, amount, entry price, current price, current value, unrealized PnL, PnL %, entry date, actions
  - Add color coding for positive/negative PnL values
  - Implement edit and delete action buttons
  - Add empty state message when no positions exist
  - Format numbers with appropriate decimal places
  - _Requirements: 2.1, 4.1_

- [ ] 11. Implement AddPositionForm component
  - Create form with fields: symbol, entry price, amount, entry date
  - Add client-side validation for positive amounts and prices
  - Add validation for non-future dates
  - Implement form submission to POST /api/portfolio/positions
  - Display success/error messages
  - Clear form after successful submission
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 12. Implement EditPositionModal component
  - Create modal dialog for editing positions
  - Pre-populate form with existing position data
  - Implement form submission to PUT /api/portfolio/positions/:id
  - Add same validation as AddPositionForm
  - Display success/error messages
  - Close modal after successful update
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 13. Implement AllocationChart component
  - Create AllocationChart component using recharts library
  - Display pie chart showing allocation by cryptocurrency
  - Label each segment with symbol and percentage
  - Use distinct colors for each segment
  - Add tooltip showing dollar value on hover
  - Display empty state message when no positions exist
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 14. Implement HistoricalChart component
  - Create HistoricalChart component using recharts library
  - Display line chart showing portfolio value over time
  - Add date range selector (1 week, 1 month, 3 months, 1 year)
  - Fetch data from GET /api/portfolio/history endpoint
  - Format x-axis with dates and y-axis with currency
  - Display empty state message when no positions exist
  - Handle missing data gracefully
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 15. Implement custom hooks for data fetching
  - Create usePositions hook for fetching and managing positions
  - Create usePortfolioSummary hook for fetching summary data
  - Create useAllocation hook for fetching allocation data
  - Implement loading and error states in all hooks
  - Add refresh functionality to hooks
  - Implement optimistic updates for create/update/delete operations
  - _Requirements: 2.1, 5.1, 6.1_

- [ ] 16. Add styling and responsive design
  - Create CSS/styled-components for all portfolio components
  - Implement responsive grid layout for desktop and mobile
  - Style summary cards with appropriate spacing and colors
  - Style table with alternating row colors and hover effects
  - Style charts with consistent color scheme
  - Add loading spinners and skeleton screens
  - Ensure accessibility (ARIA labels, keyboard navigation)
  - _Requirements: 2.1, 5.1, 6.1_

- [ ] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
