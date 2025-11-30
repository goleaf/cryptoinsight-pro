# Implementation Plan

- [ ] 1. Set up project structure and dependencies
  - Create backend NestJS project with TypeScript configuration
  - Create frontend React project with Vite and TypeScript
  - Install core dependencies: PostgreSQL client, Socket.IO, Recharts, Zustand, fast-check
  - Configure ESLint, Prettier, and Jest/Vitest
  - Set up .env files and .gitignore for secrets
  - _Requirements: 7.3_

- [ ] 2. Set up database schema and TimescaleDB
  - Create PostgreSQL database with TimescaleDB extension
  - Implement migration scripts for tickers, trades, order_books tables as hypertables
  - Create signals, tracked_symbols, and exchange_configs tables
  - Add indexes for optimized time-series queries
  - Configure data retention and compression policies
  - _Requirements: 12.1, 12.2, 12.4_

- [ ] 3. Implement core data models and interfaces
  - Define TypeScript interfaces for NormalizedTicker, NormalizedOrderBook, NormalizedTrade
  - Define MarketSignal interface with trend, momentum, and risk level types
  - Create DTOs for API requests and responses
  - Define ExchangeCollectorInterface for exchange integrations
  - _Requirements: 6.2_

- [ ] 4. Implement secure credential management
  - Create configuration service that loads API keys from environment variables
  - Implement credential validation on startup
  - Add error handling for missing credentials
  - _Requirements: 7.1, 7.4_

- [ ]* 4.1 Write property test for secure credential storage
  - **Property 12: Secure credential storage**
  - **Validates: Requirements 7.1, 7.4**

- [ ] 5. Implement log sanitization utility
  - Create sanitization function that removes API keys, passwords, and secrets from strings
  - Add sanitization to all logging calls
  - _Requirements: 7.2, 7.5_

- [ ]* 5.1 Write property test for log sanitization
  - **Property 13: Log sanitization**
  - **Validates: Requirements 7.2**

- [ ]* 5.2 Write property test for error message sanitization
  - **Property 14: Error message sanitization**
  - **Validates: Requirements 7.5**

- [ ] 6. Implement exchange data collectors
  - Create abstract ExchangeCollector base class
  - Implement BinanceCollector with WebSocket connection for tickers, trades, order books
  - Implement CoinbaseCollector with WebSocket connection
  - Add rate limiting logic to prevent exceeding API limits
  - Add connection retry logic with exponential backoff
  - _Requirements: 3.1, 3.2, 3.4_

- [ ]* 6.1 Write property test for collector initialization
  - **Property 23: Collector initialization**
  - **Validates: Requirements 3.1**

- [ ]* 6.2 Write property test for rate limit compliance
  - **Property 24: Rate limit compliance**
  - **Validates: Requirements 3.4**

- [ ] 7. Implement data normalization service
  - Create NormalizerService with methods for each data type (ticker, trade, orderbook)
  - Implement transformation logic from Binance format to unified format
  - Implement transformation logic from Coinbase format to unified format
  - Add validation to ensure all required fields are present
  - _Requirements: 3.3, 3.5_

- [ ]* 7.1 Write property test for exchange data normalization
  - **Property 3: Exchange data normalization**
  - **Validates: Requirements 3.3, 3.5**

- [ ]* 7.2 Write property test for invalid data rejection
  - **Property 6: Invalid data rejection**
  - **Validates: Requirements 11.2**

- [ ] 8. Implement market data repository
  - Create MarketDataRepository with methods to insert tickers, trades, order books
  - Implement query methods with time range filtering
  - Add support for aggregation by interval (1m, 5m, 1h, 1d)
  - Implement data retention cleanup job
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [ ]* 8.1 Write property test for data persistence completeness
  - **Property 4: Data persistence completeness**
  - **Validates: Requirements 12.1, 12.2**

- [ ]* 8.2 Write property test for historical query support
  - **Property 25: Historical query support**
  - **Validates: Requirements 12.3**

- [ ]* 8.3 Write property test for data retention enforcement
  - **Property 26: Data retention enforcement**
  - **Validates: Requirements 12.5**

- [ ] 9. Implement database error handling and reconnection
  - Add database connection health checks
  - Implement automatic reconnection logic with exponential backoff
  - Add operation queuing during connection failures
  - _Requirements: 11.4_

- [ ]* 9.1 Write property test for database reconnection
  - **Property 27: Database reconnection**
  - **Validates: Requirements 11.4**

- [ ] 10. Implement cache service with TTL support
  - Create CacheService interface with get, set, delete, clear methods
  - Implement InMemoryCacheService with Map-based storage and TTL tracking
  - Implement RedisCacheService with Redis client integration
  - Add automatic cleanup interval for expired entries in memory cache
  - Add LRU eviction logic for memory cache when size limit is reached
  - Add fallback logic to handle cache failures gracefully
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 10.1 Write property test for cache TTL enforcement
  - **Property 29: Cache TTL enforcement**
  - **Validates: Requirements 13.1, 13.2**

- [ ]* 10.2 Write property test for cache fallback resilience
  - **Property 30: Cache fallback resilience**
  - **Validates: Requirements 13.4**

- [ ]* 10.3 Write property test for cache eviction under pressure
  - **Property 31: Cache eviction under pressure**
  - **Validates: Requirements 13.5**

- [ ] 11. Implement market data aggregator service with caching
  - Create AggregatorService that subscribes to all exchange collectors
  - Integrate CacheService for storing tickers, order books, and trades
  - Implement getCurrentTicker function with cache-first lookup
  - Implement getAllTickers function returning all cached aggregated tickers
  - Implement getOrderBook function with merged order book from cache
  - Implement getRecentTrades function returning recent trades from all exchanges
  - Emit aggregated data events for WebSocket broadcasting
  - Handle exchange failures gracefully (continue with other exchanges)
  - _Requirements: 1.3, 1.4, 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]* 11.1 Write property test for multi-exchange data display
  - **Property 2: Multi-exchange data display**
  - **Validates: Requirements 1.3**

- [ ]* 11.2 Write property test for exchange failure isolation
  - **Property 5: Exchange failure isolation**
  - **Validates: Requirements 1.4**

- [ ]* 11.3 Write property test for exchange error resilience
  - **Property 8: Exchange error resilience**
  - **Validates: Requirements 11.1**

- [ ]* 11.4 Write property test for getCurrentTicker function validity
  - **Property 36: getCurrentTicker function validity**
  - **Validates: Requirements 15.1**

- [ ]* 11.5 Write property test for getAllTickers completeness
  - **Property 37: getAllTickers completeness**
  - **Validates: Requirements 15.2**

- [ ]* 11.6 Write property test for getOrderBook merge correctness
  - **Property 38: getOrderBook merge correctness**
  - **Validates: Requirements 15.3**

- [ ]* 11.7 Write property test for getRecentTrades aggregation
  - **Property 39: getRecentTrades aggregation**
  - **Validates: Requirements 15.4**

- [ ]* 11.8 Write property test for invalid symbol handling
  - **Property 40: Invalid symbol handling**
  - **Validates: Requirements 15.5**

- [ ] 12. Implement conflict resolution strategies
  - Create ConflictResolver service with strategy pattern
  - Implement VWAP strategy (volume-weighted average price)
  - Implement per-exchange strategy (return all exchange prices)
  - Implement median strategy (outlier-resistant)
  - Implement best-bid-ask strategy
  - Add staleness detection to exclude old data
  - Add outlier detection using standard deviation
  - Make strategy configurable via environment variables
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ]* 12.1 Write property test for VWAP calculation correctness
  - **Property 32: VWAP calculation correctness**
  - **Validates: Requirements 14.1**

- [ ]* 12.2 Write property test for per-exchange price preservation
  - **Property 33: Per-exchange price preservation**
  - **Validates: Requirements 14.2**

- [ ]* 12.3 Write property test for stale data exclusion
  - **Property 34: Stale data exclusion**
  - **Validates: Requirements 14.3**

- [ ]* 12.4 Write property test for outlier flagging
  - **Property 35: Outlier flagging**
  - **Validates: Requirements 14.4**

- [ ] 13. Implement analytics signal generator
  - Create SignalGeneratorService with methods to calculate RSI, MACD, moving averages
  - Implement trend detection logic (bullish/bearish/neutral)
  - Implement momentum calculation (-100 to 100 scale)
  - Implement risk level assessment (low/medium/high/extreme)
  - Store generated signals in database
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 13.1 Write property test for signal generation validity
  - **Property 9: Signal generation validity**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 14. Implement WebSocket message validation service
  - Create MessageValidator service with validation methods for each message type
  - Implement validation for subscribe, unsubscribe, ping message structures
  - Validate required fields (type, timestamp, payload)
  - Validate channel and symbol fields in subscription payloads
  - Return validation errors with specific error codes
  - _Requirements: 16.2, 16.3, 16.4_

- [ ]* 14.1 Write property test for message type validation
  - **Property 41: Message type validation**
  - **Validates: Requirements 16.2**

- [ ]* 14.2 Write property test for subscription payload validation
  - **Property 42: Subscription payload validation**
  - **Validates: Requirements 16.3, 16.4**

- [ ] 15. Implement rate limiter service
  - Create RateLimiter service with per-client tracking
  - Implement subscription limit check (max 10 per client)
  - Implement message rate limit check (max 100 per minute)
  - Track rate limit violations per client
  - Implement automatic disconnect after 3 violations
  - _Requirements: 22.1, 22.2, 22.3, 22.4_

- [ ]* 15.1 Write property test for subscription limit enforcement
  - **Property 59: Subscription limit enforcement**
  - **Validates: Requirements 22.1**

- [ ]* 15.2 Write property test for message rate limit enforcement
  - **Property 60: Message rate limit enforcement**
  - **Validates: Requirements 22.2**

- [ ]* 15.3 Write property test for rate limit violation handling
  - **Property 61: Rate limit violation handling**
  - **Validates: Requirements 22.4**

- [ ]* 15.4 Write property test for rate limit violation logging
  - **Property 62: Rate limit violation logging**
  - **Validates: Requirements 22.5**

- [ ] 16. Implement subscription manager service
  - Create SubscriptionManager service with Map-based storage
  - Implement subscribe method to add client subscriptions
  - Implement unsubscribe method to remove specific subscriptions
  - Implement getSubscribedClients method to query subscribers for a symbol
  - Implement removeClient method for disconnect cleanup
  - Track subscriptions per channel (ticker, orderbook)
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 19.1_

- [ ]* 16.1 Write property test for subscription storage correctness
  - **Property 47: Subscription storage correctness**
  - **Validates: Requirements 18.1**

- [ ]* 16.2 Write property test for unsubscribe correctness
  - **Property 48: Unsubscribe correctness**
  - **Validates: Requirements 18.2**

- [ ]* 16.3 Write property test for multiple subscription tracking
  - **Property 49: Multiple subscription tracking**
  - **Validates: Requirements 18.3**

- [ ]* 16.4 Write property test for subscription cleanup on disconnect
  - **Property 51: Subscription cleanup on disconnect**
  - **Validates: Requirements 19.1**

- [ ] 17. Implement broadcast service
  - Create BroadcastService that listens to Aggregator events
  - Implement broadcastTicker method to transform and send ticker updates
  - Implement broadcastOrderBook method to transform and send order book updates
  - Query SubscriptionManager to get subscribed clients for each symbol
  - Only broadcast when clients are subscribed to the symbol
  - Track broadcast latency metrics
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ]* 17.1 Write property test for ticker broadcast latency
  - **Property 54: Ticker broadcast latency**
  - **Validates: Requirements 20.3**

- [ ]* 17.2 Write property test for conditional broadcast
  - **Property 55: Conditional broadcast**
  - **Validates: Requirements 20.4**

- [ ]* 17.3 Write property test for message format transformation
  - **Property 56: Message format transformation**
  - **Validates: Requirements 20.5**

- [ ]* 17.4 Write property test for targeted broadcast correctness
  - **Property 50: Targeted broadcast correctness**
  - **Validates: Requirements 18.5**

- [ ] 18. Implement WebSocket gateway with Socket.IO
  - Create WebSocketGateway using @nestjs/websockets and Socket.IO
  - Implement connection handler with client ID assignment
  - Implement message router to handle subscribe, unsubscribe, ping messages
  - Integrate MessageValidator for incoming message validation
  - Integrate RateLimiter for rate limit enforcement
  - Integrate SubscriptionManager for subscription tracking
  - Implement disconnect handler with cleanup
  - Send pong responses to ping messages
  - Send error messages for validation failures and rate limit violations
  - _Requirements: 8.1, 16.1, 16.5, 19.2, 19.3, 19.4, 19.5_

- [ ]* 18.1 Write property test for error message structure
  - **Property 43: Error message structure**
  - **Validates: Requirements 16.5**

- [ ]* 18.2 Write property test for resource cleanup on disconnect
  - **Property 52: Resource cleanup on disconnect**
  - **Validates: Requirements 19.2**

- [ ]* 18.3 Write property test for disconnect isolation
  - **Property 53: Disconnect isolation**
  - **Validates: Requirements 19.5**

- [ ]* 18.4 Write property test for WebSocket reconnection
  - **Property 18: WebSocket reconnection**
  - **Validates: Requirements 8.3**

- [ ]* 18.5 Write property test for reconnection data continuity
  - **Property 19: Reconnection data continuity**
  - **Validates: Requirements 8.4**

- [ ]* 18.6 Write property test for connection cleanup
  - **Property 20: Connection cleanup**
  - **Validates: Requirements 8.5**

- [ ] 19. Implement WebSocket message format serialization
  - Create message builder utilities for ticker, orderbook, error, pong messages
  - Ensure consistent JSON field naming (camelCase)
  - Validate all required fields are included in each message type
  - Add timestamp to all outgoing messages
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ]* 19.1 Write property test for ticker update payload completeness
  - **Property 44: Ticker update payload completeness**
  - **Validates: Requirements 17.1, 17.4**

- [ ]* 19.2 Write property test for order book update payload structure
  - **Property 45: Order book update payload structure**
  - **Validates: Requirements 17.2, 17.3**

- [ ]* 19.3 Write property test for JSON serialization consistency
  - **Property 46: JSON serialization consistency**
  - **Validates: Requirements 17.5**

- [ ] 20. Add Redis pub/sub support for horizontal scaling (optional)
  - Create RedisAdapter for Socket.IO
  - Configure Redis connection from environment variables
  - Enable distributed broadcasting across server instances
  - Add fallback to standalone mode if Redis is unavailable
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [ ]* 20.1 Write property test for stateless reconnection support
  - **Property 57: Stateless reconnection support**
  - **Validates: Requirements 21.3**

- [ ]* 20.2 Write property test for minimal state storage
  - **Property 58: Minimal state storage**
  - **Validates: Requirements 21.4**

- [ ] 21. Create WebSocket message format documentation
  - Document all message types with JSON examples
  - Document field descriptions for ticker and order book payloads
  - Document error codes and their meanings
  - Document rate limits and best practices
  - Add wscat testing examples
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5**

- [ ] 22. Implement REST API controllers
  - Create MarketDataController with endpoints: GET /tickers, GET /history/:symbol, GET /orderbook/:symbol, GET /trades/:symbol
  - Create SignalsController with endpoints: GET /signals/:symbol, GET /signals/list
  - Create HealthController with endpoint: GET /health
  - Add input validation for all endpoints
  - Implement error handling with appropriate HTTP status codes
  - _Requirements: 11.3, 15.1, 15.2, 15.3, 15.4_

- [ ]* 22.1 Write property test for error response consistency
  - **Property 7: Error response consistency**
  - **Validates: Requirements 11.3**

- [ ] 23. Implement alerting service for critical errors
  - Create AlertingService with methods to send alerts
  - Implement console logging for development
  - Add hooks for email/Slack notifications (configurable)
  - Trigger alerts on critical errors (all exchanges down, database failure)
  - _Requirements: 11.5_

- [ ]* 23.1 Write property test for critical error alerting
  - **Property 28: Critical error alerting**
  - **Validates: Requirements 11.5**

- [ ] 24. Set up Swagger/OpenAPI documentation
  - Install and configure @nestjs/swagger
  - Add decorators to all API endpoints
  - Generate OpenAPI specification
  - Serve Swagger UI at /api/docs
  - _Requirements: 6.2_

- [ ] 25. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 26. Implement frontend state management with Zustand
  - Create Zustand store with state for tickers, signals, selected symbol, connection status
  - Implement actions: setSelectedSymbol, updateTicker, updateSignal, acknowledgeDisclaimer
  - Add persistence for disclaimerAcknowledged to localStorage
  - _Requirements: 5.5_

- [ ] 27. Implement WebSocket client service
  - Create WebSocket service using Socket.IO client
  - Connect to backend WebSocket on component mount
  - Subscribe to ticker and signal events
  - Update Zustand store when data is received
  - Handle connection errors and reconnection
  - _Requirements: 8.1, 8.3_

- [ ] 28. Implement REST API client service
  - Create API service with methods for fetching historical data, order books, recent trades, signals
  - Use fetch or axios for HTTP requests
  - Handle errors and return appropriate error messages
  - _Requirements: 11.3, 15.4_

- [ ] 29. Implement disclaimer modal component
  - Create DisclaimerModal component with full disclaimer text
  - Show modal on first visit (check localStorage)
  - Require user acknowledgment before closing
  - Store acknowledgment in Zustand and localStorage
  - _Requirements: 5.1, 5.5_

- [ ] 30. Implement disclaimer text component
  - Create InlineDisclaimer component with warning icon and text
  - Include phrases: "Not financial advice", "No guarantees", "High risk"
  - Make it visually prominent with warning colors
  - _Requirements: 4.4, 5.2, 5.3, 5.4_

- [ ]* 30.1 Write property test for signal disclaimer presence
  - **Property 15: Signal disclaimer presence**
  - **Validates: Requirements 4.4, 5.2**

- [ ]* 30.2 Write property test for analysis page disclaimers
  - **Property 16: Analysis page disclaimers**
  - **Validates: Requirements 5.3, 5.4**

- [ ] 31. Implement coin list component
  - Create CoinList component displaying tracked cryptocurrencies
  - Show current price, 24h change, volume for each coin
  - Add search input with filtering by name or symbol
  - Add sorting by price, volume, change percentage
  - Enable multi-select for comparison
  - Update prices in real-time from WebSocket
  - _Requirements: 10.1, 10.2, 10.4_

- [ ]* 31.1 Write property test for search filtering correctness
  - **Property 22: Search filtering correctness**
  - **Validates: Requirements 10.4**

- [ ]* 31.2 Write property test for data completeness with timestamps
  - **Property 1: Data completeness with timestamps**
  - **Validates: Requirements 1.5, 10.5**

- [ ] 32. Implement crypto chart component
  - Create CryptoChart component using Recharts or TradingView Lightweight Charts
  - Display price history as line or candlestick chart
  - Add volume bars as secondary visualization
  - Implement time range selector (1h, 24h, 7d, 30d, 1y)
  - Fetch historical data from API when symbol or time range changes
  - Handle loading and error states
  - _Requirements: 2.1, 2.2, 2.5_

- [ ]* 32.1 Write property test for chart data completeness
  - **Property 10: Chart data completeness**
  - **Validates: Requirements 2.2**

- [ ] 33. Implement order book visualization component
  - Create OrderBookDepth component displaying bid and ask levels
  - Show price and quantity for each level
  - Use color coding (green for bids, red for asks)
  - Update in real-time from WebSocket
  - _Requirements: 2.3_

- [ ]* 33.1 Write property test for order book structure
  - **Property 11: Order book structure**
  - **Validates: Requirements 2.3**

- [ ] 34. Implement prediction panel component
  - Create PredictionPanel component displaying signals
  - Show trend indicator with icon (↑ bullish, ↓ bearish, → neutral)
  - Show momentum gauge or progress bar
  - Show risk level badge with color coding
  - Display technical indicator values (RSI, MACD, MAs)
  - Include prominent InlineDisclaimer component
  - Block access if disclaimer not acknowledged
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.5_

- [ ]* 34.1 Write property test for prediction access control
  - **Property 17: Prediction access control**
  - **Validates: Requirements 5.5**

- [ ] 35. Implement comparison view component
  - Create ComparisonView component for side-by-side cryptocurrency comparison
  - Display price, volume, market cap, and signals for each selected coin
  - Use table or card layout for easy comparison
  - _Requirements: 10.2, 10.3_

- [ ]* 35.1 Write property test for comparison data completeness
  - **Property 21: Comparison data completeness**
  - **Validates: Requirements 10.3**

- [ ] 36. Implement main dashboard component
  - Create Dashboard component as main landing page
  - Include CoinList, CryptoChart, PredictionPanel components
  - Show DisclaimerModal on first visit
  - Handle symbol selection and pass to child components
  - Display connection status indicator
  - _Requirements: 1.1, 1.2_

- [ ] 37. Add responsive styling with Tailwind CSS
  - Configure Tailwind CSS with custom theme colors
  - Style all components with responsive design (mobile, tablet, desktop)
  - Add dark mode support (optional)
  - Ensure disclaimer text is always visible and prominent
  - _Requirements: 5.3_

- [ ] 38. Implement error boundary and error handling
  - Create ErrorBoundary component to catch React errors
  - Display user-friendly error messages
  - Add retry mechanisms for failed API calls
  - Show connection status and reconnection attempts
  - _Requirements: 11.1, 11.3_

- [ ] 39. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 40. Create seed data and initial configuration
  - Add seed data for tracked_symbols (BTC/USD, ETH/USD, etc.)
  - Add seed data for exchange_configs (Binance, Coinbase)
  - Create database seeding script
  - Add cache configuration to environment variables
  - _Requirements: 3.1, 13.3_

- [ ] 41. Set up environment configuration
  - Create .env.example files for backend and frontend
  - Document all required environment variables including cache settings
  - Add validation for required environment variables on startup
  - Document conflict resolution strategy configuration
  - _Requirements: 7.1, 13.3, 14.5_

- [ ] 42. Write integration tests for API endpoints
  - Test GET /api/v1/market-data/tickers returns current tickers
  - Test GET /api/v1/market-data/history/:symbol with time range filters
  - Test GET /api/v1/market-data/trades/:symbol returns recent trades
  - Test GET /api/v1/signals/:symbol returns valid signals
  - Test error responses for invalid requests
  - Test cache hit/miss scenarios
  - _Requirements: 9.4, 15.4_

- [ ] 43. Write integration tests for WebSocket communication
  - Test WebSocket connection establishment
  - Test ticker update broadcasting
  - Test signal update broadcasting
  - Test reconnection behavior
  - _Requirements: 8.1, 8.3, 8.4_

- [ ] 44. Write integration tests for caching layer
  - Test cache TTL expiration
  - Test cache fallback on Redis failure
  - Test LRU eviction in memory cache
  - Test data consistency between cache and database
  - _Requirements: 13.1, 13.2, 13.4, 13.5_

- [ ] 45. Set up CI/CD pipeline configuration
  - Create GitHub Actions or GitLab CI configuration
  - Add lint step (ESLint, Prettier)
  - Add test step (run all unit, property, and integration tests)
  - Add build step (compile TypeScript, bundle frontend)
  - _Requirements: 9.1_

- [ ] 46. Create Docker configuration
  - Create Dockerfile for backend
  - Create Dockerfile for frontend (nginx serving static build)
  - Create docker-compose.yml for local development (backend, frontend, PostgreSQL, Redis)
  - _Requirements: 6.1_

- [ ] 47. Write README documentation
  - Document project overview and architecture
  - Add setup instructions (dependencies, database, cache, environment variables)
  - Add development instructions (running locally, testing)
  - Add deployment instructions
  - Document caching strategy and configuration options
  - Document conflict resolution strategies
  - Include disclaimer and legal information
  - _Requirements: 5.1_

- [ ] 48. Final checkpoint - Full system integration test
  - Ensure all tests pass, ask the user if questions arise.
  - Start all services (database, cache, backend, frontend)
  - Verify data collection from exchanges
  - Verify caching is working (check cache hit rates)
  - Verify real-time updates via WebSocket
  - Verify historical data queries
  - Verify recent trades endpoint
  - Verify signal generation
  - Verify all disclaimers are displayed
  - Test error scenarios (exchange down, database failure, cache failure)
  - Test different conflict resolution strategies
