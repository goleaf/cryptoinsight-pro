# Design Document: Watchlist & Search

## Overview

The Watchlist & Search feature provides users with the ability to discover cryptocurrencies through a search interface and maintain a personalized collection of symbols for monitoring. The system consists of three main layers: a React-based frontend with search and watchlist components, a RESTful API layer for data operations, and a backend service layer that manages user watchlist data and integrates with existing market data services.

The design emphasizes real-time data updates, responsive user interactions through debounced search, and efficient data management through proper indexing and caching strategies. Authentication is handled at the API gateway level, ensuring that all watchlist operations are scoped to the authenticated user.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Search Interface │         │ Watchlist        │         │
│  │                  │         │ Component        │         │
│  │ - Input field    │         │ - Table view     │         │
│  │ - Results list   │         │ - Sort controls  │         │
│  │ - Debounce logic │         │ - Add/Remove     │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Authentication Middleware                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │ Search Endpoint  │         │ Watchlist        │        │
│  │ /api/markets/    │         │ Endpoints        │        │
│  │ search           │         │ /api/watchlist   │        │
│  └──────────────────┘         └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Market Data      │         │ Watchlist        │         │
│  │ Aggregator       │◄────────│ Service          │         │
│  │ (existing)       │         │                  │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Market Data      │         │ Watchlist        │         │
│  │ Cache/Store      │         │ Repository       │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Search Flow**: User types → Debounce (300ms) → API request → Market data query → Filter results → Return to frontend → Display
2. **Add to Watchlist**: User clicks add → API request with symbol → Validate symbol → Check duplicates → Persist to DB → Return updated list
3. **Load Watchlist**: Page load → API request → Query user's symbols → Enrich with market data → Return to frontend → Display with sort
4. **Remove from Watchlist**: User clicks remove → API request → Delete association → Return updated count → Update frontend

## Components and Interfaces

### Frontend Components

#### SearchInterface Component

**Props:**
- `onSymbolSelect: (symbol: string) => void` - Callback when user selects a symbol to add

**State:**
- `query: string` - Current search input
- `results: SearchResult[]` - Array of search results
- `loading: boolean` - Loading state indicator
- `error: string | null` - Error message if search fails

**Behavior:**
- Implements 300ms debounce on input changes
- Displays loading spinner during API calls
- Shows empty state when no results found
- Handles keyboard navigation for accessibility

#### WatchlistComponent Component

**Props:**
- `userId: string` - Authenticated user identifier
- `refreshInterval?: number` - Market data refresh interval (default: 5000ms)

**State:**
- `watchlist: WatchlistEntry[]` - Array of watchlist entries with market data
- `sortColumn: string | null` - Currently sorted column
- `sortDirection: 'asc' | 'desc'` - Sort direction
- `loading: boolean` - Loading state
- `error: string | null` - Error message

**Behavior:**
- Fetches watchlist on mount
- Polls for market data updates every 5 seconds
- Implements client-side sorting with maintained state
- Handles add/remove operations with optimistic updates

### Backend Services

#### WatchlistService

**Responsibilities:**
- Manage CRUD operations for user watchlists
- Validate symbols against available market data
- Enforce business rules (max 100 symbols per user)
- Coordinate with MarketDataAggregator for enrichment

**Methods:**
```typescript
interface WatchlistService {
  getUserWatchlist(userId: string): Promise<WatchlistEntry[]>
  addSymbol(userId: string, symbol: string): Promise<WatchlistEntry>
  removeSymbol(userId: string, symbol: string): Promise<void>
  getWatchlistCount(userId: string): Promise<number>
}
```

#### SearchService

**Responsibilities:**
- Query available cryptocurrencies by symbol or name
- Return matching results with basic market data
- Implement efficient search with indexing

**Methods:**
```typescript
interface SearchService {
  searchCryptocurrencies(query: string): Promise<SearchResult[]>
}
```

### API Endpoints

#### GET /api/markets/search

**Query Parameters:**
- `q: string` (required) - Search query

**Response:**
```typescript
{
  results: Array<{
    symbol: string
    name: string
    price: number
  }>
}
```

**Status Codes:**
- 200: Success
- 400: Invalid query parameter
- 401: Unauthorized

#### GET /api/watchlist

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```typescript
{
  watchlist: Array<{
    symbol: string
    name: string
    price: number
    change24h: number
    volume24h: number
    exchange?: string
    addedAt: string
  }>
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

#### POST /api/watchlist

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```typescript
{
  symbol: string
}
```

**Response:**
```typescript
{
  entry: {
    symbol: string
    name: string
    price: number
    change24h: number
    volume24h: number
    exchange?: string
    addedAt: string
  }
}
```

**Status Codes:**
- 201: Created
- 400: Invalid symbol or duplicate
- 401: Unauthorized
- 409: Watchlist limit exceeded

#### DELETE /api/watchlist/:symbol

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `symbol: string` - Symbol to remove

**Response:**
```typescript
{
  count: number
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: Symbol not in watchlist

## Data Models

### Database Schema

#### Watchlist Table

```sql
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_symbol ON watchlist(symbol);
```

### TypeScript Interfaces

```typescript
// Core domain models
interface WatchlistEntry {
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h: number
  exchange?: string
  addedAt: string
}

interface SearchResult {
  symbol: string
  name: string
  price: number
}

// DTOs
interface AddToWatchlistDto {
  symbol: string
}

interface WatchlistResponseDto {
  watchlist: WatchlistEntry[]
}

interface SearchResponseDto {
  results: SearchResult[]
}

interface ErrorResponseDto {
  error: string
  message: string
  statusCode: number
}

// Repository models
interface WatchlistRecord {
  id: string
  userId: string
  symbol: string
  addedAt: Date
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Search debounce timing

*For any* sequence of keystrokes in the search input, the system should wait exactly 300 milliseconds after the last keystroke before sending a search request, and should not send requests for intermediate keystrokes.

**Validates: Requirements 1.1**

### Property 2: Search query matching

*For any* non-empty search query and any cryptocurrency dataset, all returned results should have either the symbol or name field containing the query string (case-insensitive).

**Validates: Requirements 1.2**

### Property 3: Search loading state

*For any* search query, the loading indicator should be true when the request starts and false when the request completes (either success or failure).

**Validates: Requirements 1.4**

### Property 4: Search result rendering completeness

*For any* search result, the rendered output should contain the symbol, name, and price fields for that cryptocurrency.

**Validates: Requirements 1.5**

### Property 5: Add symbol with persistence

*For any* user and any valid symbol not currently in their watchlist, adding the symbol should result in the symbol appearing in both the in-memory watchlist and the database, and a subsequent query should return that symbol.

**Validates: Requirements 2.1, 2.4**

### Property 6: Duplicate symbol rejection

*For any* user and any symbol already in their watchlist, attempting to add the same symbol again should return a validation error and the watchlist should remain unchanged in size and content.

**Validates: Requirements 2.2**

### Property 7: UI reflects add operation

*For any* successful add operation, the watchlist component should immediately display an entry for the newly added symbol with market data.

**Validates: Requirements 2.3**

### Property 8: Remove symbol operation

*For any* user and any symbol currently in their watchlist, removing the symbol should result in the symbol no longer appearing in the watchlist, and the database should no longer contain that user-symbol association.

**Validates: Requirements 3.1**

### Property 9: UI reflects remove operation

*For any* successful remove operation, the watchlist component should immediately remove the entry from the displayed list.

**Validates: Requirements 3.2**

### Property 10: Remove non-existent symbol error

*For any* user and any symbol not in their watchlist, attempting to remove that symbol should return a not found error and the watchlist should remain unchanged.

**Validates: Requirements 3.3**

### Property 11: Removal count accuracy

*For any* successful removal operation, the returned count should equal the actual number of symbols remaining in the user's watchlist.

**Validates: Requirements 3.4**

### Property 12: Watchlist retrieval completeness

*For any* user with symbols in their watchlist, loading the watchlist should return exactly those symbols (no more, no less) with current market data attached.

**Validates: Requirements 4.1**

### Property 13: Watchlist entry rendering completeness

*For any* watchlist entry, the rendered output should contain the symbol, price, 24-hour change percentage, and 24-hour volume fields.

**Validates: Requirements 4.2**

### Property 14: Conditional exchange display

*For any* watchlist entry, if exchange information is present in the data, it should be displayed in the rendered output; if absent, the rendering should handle it gracefully without errors.

**Validates: Requirements 4.3**

### Property 15: Sort order correctness

*For any* watchlist and any column, clicking the column header should sort entries by that column in ascending order, and clicking again should reverse to descending order.

**Validates: Requirements 5.1, 5.2**

### Property 16: Numerical sort comparison

*For any* watchlist sorted by price or volume columns, entries should be ordered using numerical comparison (e.g., 2 < 10, not lexicographic where "10" < "2").

**Validates: Requirements 5.3**

### Property 17: Alphabetical sort comparison

*For any* watchlist sorted by symbol or name columns, entries should be ordered using alphabetical comparison.

**Validates: Requirements 5.4**

### Property 18: Sort persistence during updates

*For any* sorted watchlist, when market data updates are received, the sort order and column should remain the same, with entries re-sorted by the current sort criteria.

**Validates: Requirements 5.5**

### Property 19: Authentication verification

*For any* request to watchlist endpoints, the authentication token should be verified before processing, and requests without valid tokens should be rejected with an authentication error.

**Validates: Requirements 6.1, 6.2**

### Property 20: Data isolation

*For any* authenticated user, all watchlist operations (read and write) should only access or modify that user's watchlist data, never affecting or exposing other users' data.

**Validates: Requirements 6.3, 6.4**

### Property 21: Search response structure

*For any* search query, the API response should be a valid JSON array where each element contains symbol, name, and price fields.

**Validates: Requirements 7.1**

### Property 22: Watchlist response structure

*For any* GET watchlist request, the API response should be a valid JSON array where each element contains symbol, price, change24h, volume24h, and optionally exchange fields.

**Validates: Requirements 7.2**

### Property 23: Symbol validation before add

*For any* POST watchlist request with a symbol, the symbol should be validated against available market data, and only valid symbols should be added to the watchlist.

**Validates: Requirements 7.3**

### Property 24: Error response consistency

*For any* error condition across all endpoints, the response should include an appropriate HTTP status code and a JSON body with error and message fields in a consistent format.

**Validates: Requirements 7.5**

## Error Handling

### Frontend Error Handling

**Search Interface:**
- Network errors: Display user-friendly message "Unable to search. Please check your connection."
- Empty results: Show "No cryptocurrencies found matching your search."
- API errors: Display error message from server response
- Timeout: Cancel request after 10 seconds and show timeout message

**Watchlist Component:**
- Load failures: Display "Unable to load watchlist. Please refresh the page."
- Add failures: Show inline error message near add button with specific reason (duplicate, limit exceeded, invalid symbol)
- Remove failures: Show confirmation dialog with error details
- Network errors during updates: Maintain last known good state and show warning banner

### Backend Error Handling

**Error Response Format:**
```typescript
{
  error: string        // Error type (e.g., "ValidationError", "NotFoundError")
  message: string      // Human-readable error message
  statusCode: number   // HTTP status code
}
```

**Error Types and Status Codes:**
- 400 Bad Request: Invalid input (empty symbol, malformed request)
- 401 Unauthorized: Missing or invalid authentication token
- 404 Not Found: Symbol not in watchlist (for DELETE)
- 409 Conflict: Duplicate symbol or watchlist limit exceeded
- 500 Internal Server Error: Database errors, unexpected failures

**Error Handling Strategy:**
- Validate all inputs at API boundary
- Use try-catch blocks around database operations
- Log all errors with context (userId, operation, timestamp)
- Never expose internal error details to clients
- Implement circuit breaker for external market data service calls
- Return partial results when possible (e.g., watchlist with stale data if market service is down)

### Database Error Handling

- Unique constraint violations: Map to 409 Conflict for duplicate symbols
- Connection failures: Retry up to 3 times with exponential backoff
- Query timeouts: Set 5-second timeout, return 503 Service Unavailable
- Transaction failures: Rollback and return appropriate error to client

## Testing Strategy

### Unit Testing

The testing approach combines unit tests for specific scenarios and property-based tests for universal correctness guarantees.

**Unit Test Coverage:**
- Empty search query returns empty results (edge case for 1.3)
- Watchlist at exactly 100 symbols prevents additions (edge case for 2.5)
- Empty watchlist displays appropriate empty state message (edge case for 4.5)
- API endpoint integration with authentication middleware
- Error response formatting for various error types
- Database connection retry logic

**Test Organization:**
- Frontend: Co-locate tests with components using `.test.tsx` suffix
- Backend: Co-locate tests with services using `.spec.ts` suffix
- Use Jest as the testing framework for both frontend and backend
- Mock external dependencies (market data service, database) in unit tests

### Property-Based Testing

Property-based testing will verify that universal properties hold across a wide range of inputs, providing stronger correctness guarantees than example-based tests alone.

**Framework:** Use `fast-check` library for TypeScript property-based testing

**Configuration:** Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space

**Property Test Requirements:**
- Each property-based test MUST be tagged with a comment referencing the correctness property from this design document
- Tag format: `// Feature: watchlist-search, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests should generate random but valid inputs (user IDs, symbols, watchlist states)
- Tests should verify the property holds for all generated inputs

**Property Test Coverage:**
- Debounce timing behavior (Property 1)
- Search query matching (Property 2)
- Add/remove operations with persistence (Properties 5, 8)
- Duplicate detection (Property 6)
- Sort operations (Properties 15, 16, 17, 18)
- Data isolation between users (Property 20)
- API response structure validation (Properties 21, 22, 24)

**Generator Strategies:**
- User IDs: Random UUIDs or alphanumeric strings
- Symbols: Random 3-5 character uppercase strings
- Watchlists: Arrays of 0-100 random symbols
- Market data: Random price/volume values within realistic ranges
- Search queries: Random substrings of valid symbol/name combinations

### Integration Testing

- End-to-end tests for complete user flows (search → add → view → remove)
- API endpoint tests with real database (using test database)
- WebSocket integration for real-time market data updates
- Authentication flow testing with mock auth service

### Performance Testing

- Search response time under load (target: < 200ms for 95th percentile)
- Watchlist load time with 100 symbols (target: < 500ms)
- Concurrent user operations (target: 100 concurrent users)
- Database query performance with indexes

## Implementation Notes

### Frontend Implementation

**Technology Stack:**
- React 18 with TypeScript
- React Query for data fetching and caching
- Lodash for debounce utility
- Tailwind CSS for styling

**State Management:**
- Use React Query for server state (watchlist data, search results)
- Use local component state for UI state (sort column, loading indicators)
- Implement optimistic updates for add/remove operations

**Performance Optimizations:**
- Memoize sort functions to avoid unnecessary re-renders
- Use virtual scrolling for watchlists with many symbols
- Implement request cancellation for abandoned searches
- Cache search results for 30 seconds

### Backend Implementation

**Technology Stack:**
- Node.js with NestJS framework
- TypeScript for type safety
- PostgreSQL for persistent storage
- Redis for caching market data

**Service Architecture:**
- WatchlistService: Business logic for watchlist operations
- WatchlistRepository: Database access layer
- MarketDataAggregator: Integration with existing market data service
- AuthGuard: Authentication middleware

**Performance Optimizations:**
- Index on (user_id, symbol) for fast lookups
- Cache user watchlists in Redis with 60-second TTL
- Batch market data enrichment queries
- Use database connection pooling

**Security Considerations:**
- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement rate limiting (100 requests per minute per user)
- Audit log for all watchlist modifications

### Database Migrations

**Initial Migration:**
```sql
-- Create watchlist table
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_symbol UNIQUE(user_id, symbol)
);

-- Create indexes
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_symbol ON watchlist(symbol);

-- Add check constraint for symbol format
ALTER TABLE watchlist ADD CONSTRAINT check_symbol_format 
  CHECK (symbol ~ '^[A-Z0-9]{1,20}$');
```

### Monitoring and Observability

**Metrics to Track:**
- Search request rate and latency
- Watchlist operation success/failure rates
- Database query performance
- Cache hit/miss rates
- API endpoint response times

**Logging:**
- Log all watchlist modifications with user ID and timestamp
- Log authentication failures
- Log external service failures (market data)
- Use structured logging (JSON format) for easy parsing

**Alerts:**
- Alert on API error rate > 5%
- Alert on database connection failures
- Alert on search latency > 1 second
- Alert on authentication service unavailability
