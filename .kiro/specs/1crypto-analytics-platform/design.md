# Design Document

## Overview

The Crypto Analytics Platform is a full-stack web application built with modern technologies to provide real-time cryptocurrency market analysis and educational signals. The system follows a modular, event-driven architecture with clear separation between data collection, processing, storage, and presentation layers.

### Technology Stack

**Backend:**
- Runtime: Node.js (v18+)
- Framework: NestJS (modular, TypeScript-first framework)
- Database: PostgreSQL (with TimescaleDB extension for time-series optimization)
- Real-time: WebSocket (Socket.IO)
- Testing: Jest, Supertest
- Property Testing: fast-check

**Frontend:**
- Framework: React 18 with TypeScript
- State Management: Zustand (lightweight, modern)
- Charts: Recharts or TradingView Lightweight Charts
- Real-time: Socket.IO Client
- Styling: Tailwind CSS
- Testing: Vitest, React Testing Library

**Infrastructure:**
- API Documentation: Swagger/OpenAPI
- Environment Management: dotenv
- Linting: ESLint, Prettier
- Version Control: Git

### Design Principles

1. **Modularity**: Each functional area (data collection, analytics, API) is a separate module
2. **Security First**: No secrets in code, secure credential storage, sanitized logging
3. **Fail-Safe**: Graceful degradation when exchanges fail, clear error messaging
4. **Legal Compliance**: Prominent disclaimers, no auto-trading, educational focus
5. **Performance**: Efficient time-series queries, WebSocket for real-time updates
6. **Testability**: Dependency injection, interface-based design, comprehensive test coverage

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Charts     │  │  Coin List   │      │
│  │  Component   │  │  Component   │  │  Component   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  State Manager  │                        │
│                   │   (Zustand)     │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│              ┌─────────────┴─────────────┐                   │
│              │                           │                   │
│      ┌───────▼────────┐         ┌───────▼────────┐          │
│      │  HTTP Client   │         │ WebSocket      │          │
│      │  (REST API)    │         │ Client         │          │
│      └───────┬────────┘         └───────┬────────┘          │
└──────────────┼──────────────────────────┼──────────────────┘
               │                          │
               │         Internet         │
               │                          │
┌──────────────▼──────────────────────────▼──────────────────┐
│                      Backend (NestJS)                       │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │              API Gateway Module                     │   │
│  │  ┌──────────────┐         ┌──────────────┐         │   │
│  │  │ REST API     │         │ WebSocket    │         │   │
│  │  │ Controller   │         │ Gateway      │         │   │
│  │  └──────┬───────┘         └──────┬───────┘         │   │
│  └─────────┼────────────────────────┼─────────────────┘   │
│            │                        │                      │
│  ┌─────────▼────────────────────────▼─────────────────┐   │
│  │           Market Data Module                        │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ Aggregator   │  │ Normalizer   │                │   │
│  │  │ Service      │  │ Service      │                │   │
│  │  └──────┬───────┘  └──────┬───────┘                │   │
│  └─────────┼────────────────┼─────────────────────────┘   │
│            │                │                              │
│  ┌─────────▼────────────────▼─────────────────────────┐   │
│  │         Data Collection Module                      │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │  Binance     │  │  Coinbase    │  [More...]     │   │
│  │  │  Collector   │  │  Collector   │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Analytics Module                           │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ Signal       │  │ Risk         │                │   │
│  │  │ Generator    │  │ Analyzer     │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Storage Module                             │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ Repository   │  │ Time-Series  │                │   │
│  │  │ Service      │  │ Optimizer    │                │   │
│  │  └──────┬───────┘  └──────────────┘                │   │
│  └─────────┼─────────────────────────────────────────┘   │
└────────────┼───────────────────────────────────────────────┘
             │
      ┌──────▼──────┐
      │ PostgreSQL  │
      │ (TimescaleDB)│
      └─────────────┘

External:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Binance    │  │  Coinbase    │  │   Kraken     │
│   API        │  │  API         │  │   API        │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow

1. **Data Collection Flow:**
   - Exchange collectors poll or subscribe to exchange APIs
   - Raw data is normalized into unified format
   - Normalized data is stored in PostgreSQL
   - Aggregator service broadcasts updates via WebSocket

2. **Analytics Flow:**
   - Analytics module subscribes to normalized data events
   - Signal generator calculates trend, momentum indicators
   - Risk analyzer assesses volatility and risk levels
   - Results are stored and broadcast to connected clients

3. **User Interaction Flow:**
   - User requests historical data via REST API
   - User receives real-time updates via WebSocket
   - Frontend updates charts and displays with new data
   - All predictions shown with prominent disclaimers

## Components and Interfaces

### Backend Modules

#### 1. Data Collection Module

**Purpose:** Fetch market data from multiple cryptocurrency exchanges

**Key Components:**
- `ExchangeCollectorInterface`: Abstract interface for exchange-specific collectors
- `BinanceCollector`: Implements Binance API integration
- `CoinbaseCollector`: Implements Coinbase API integration
- `CollectorScheduler`: Manages polling intervals and rate limiting

**Interfaces:**

```typescript
interface ExchangeCollectorInterface {
  exchangeName: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribeToTicker(symbol: string): void;
  subscribeToOrderBook(symbol: string): void;
  subscribeToTrades(symbol: string): void;
}

interface RawMarketData {
  exchange: string;
  symbol: string;
  timestamp: Date;
  data: unknown; // Exchange-specific format
}
```

#### 2. Market Data Module

**Purpose:** Normalize and aggregate data from multiple sources

**Key Components:**
- `NormalizerService`: Transforms exchange-specific data to unified format
- `AggregatorService`: Combines data from multiple exchanges with caching
- `CacheService`: Manages in-memory or Redis-based caching with TTL
- `MarketDataGateway`: WebSocket gateway for real-time broadcasting

**Interfaces:**

```typescript
interface NormalizedTicker {
  exchange: string;
  symbol: string;
  timestamp: Date;
  price: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
}

interface NormalizedOrderBook {
  exchange: string;
  symbol: string;
  timestamp: Date;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
}

interface NormalizedTrade {
  exchange: string;
  symbol: string;
  timestamp: Date;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  tradeId: string;
}

interface AggregatedTicker {
  symbol: string;
  price: number;              // VWAP or other strategy
  volume24h: number;          // Total volume
  bestBid: number;
  bestAsk: number;
  sources: number;            // Number of exchanges
  timestamp: Date;
  exchangePrices?: Array<{    // Optional per-exchange breakdown
    exchange: string;
    price: number;
    volume: number;
  }>;
}

interface CacheConfig {
  type: 'memory' | 'redis';
  ttl: {
    ticker: number;           // TTL in seconds
    orderBook: number;
    trades: number;
  };
  maxSize?: number;           // For memory cache
  redisUrl?: string;          // For Redis cache
}

interface ConflictResolutionStrategy {
  type: 'vwap' | 'per-exchange' | 'median' | 'best-bid-ask';
  stalenessThreshold: number; // Milliseconds
  outlierDetection: boolean;
}
```

#### 3. Analytics Module

**Purpose:** Generate educational signals and risk assessments

**Key Components:**
- `SignalGeneratorService`: Calculates trend and momentum indicators
- `RiskAnalyzerService`: Assesses market volatility and risk levels
- `IndicatorCalculator`: Implements technical indicators (RSI, MACD, etc.)

**Interfaces:**

```typescript
interface MarketSignal {
  symbol: string;
  timestamp: Date;
  trend: 'bullish' | 'bearish' | 'neutral';
  momentum: number; // -100 to 100
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  indicators: {
    rsi?: number;
    macd?: { value: number; signal: number; histogram: number };
    movingAverages?: { ma20: number; ma50: number; ma200: number };
  };
  disclaimer: string;
}
```

#### 4. Storage Module

**Purpose:** Persist and retrieve market data efficiently

**Key Components:**
- `MarketDataRepository`: CRUD operations for market data
- `TimeSeriesOptimizer`: Manages TimescaleDB hypertables and compression
- `QueryBuilder`: Constructs optimized time-series queries

**Interfaces:**

```typescript
interface TimeSeriesQuery {
  symbol: string;
  startTime: Date;
  endTime: Date;
  interval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  exchanges?: string[];
}

interface AggregatedData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

#### 5. API Module

**Purpose:** Expose REST endpoints for frontend consumption

**Key Components:**
- `MarketDataController`: Endpoints for historical and current data
- `SignalsController`: Endpoints for analytics and signals
- `HealthController`: System health and status endpoints

**REST Endpoints:**

```
GET  /api/v1/market-data/tickers          - Get current tickers
GET  /api/v1/market-data/history/:symbol  - Get historical data
GET  /api/v1/market-data/orderbook/:symbol - Get order book
GET  /api/v1/signals/:symbol              - Get signals for symbol
GET  /api/v1/signals/list                 - Get signals for all tracked symbols
GET  /api/v1/health                       - Health check
```

#### 6. WebSocket Module

**Purpose:** Provide real-time bidirectional communication for live market data updates

**Key Components:**
- `WebSocketGateway`: Socket.IO gateway handling connections and message routing
- `SubscriptionManager`: Manages per-client subscriptions and broadcasts
- `MessageValidator`: Validates incoming message structure and content
- `RateLimiter`: Enforces rate limits and abuse protection
- `BroadcastService`: Transforms and broadcasts updates to subscribed clients

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Gateway                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Connection Handler                          │    │
│  │  - Accept connections                               │    │
│  │  - Authenticate (optional)                          │    │
│  │  - Initialize client state                          │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │         Message Router                              │    │
│  │  - Route subscribe/unsubscribe/ping messages        │    │
│  │  - Validate message structure                       │    │
│  │  - Apply rate limiting                              │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │      Subscription Manager                           │    │
│  │  - Track per-client subscriptions                   │    │
│  │  - Add/remove subscriptions                         │    │
│  │  - Clean up on disconnect                           │    │
│  │  - Query subscribed clients for symbol              │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │      Broadcast Service                              │    │
│  │  - Listen to Aggregator events                      │    │
│  │  - Transform data to message format                 │    │
│  │  - Broadcast to subscribed clients                  │    │
│  │  - Handle broadcast errors                          │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                           │
                           │ Events
                           │
              ┌────────────▼────────────┐
              │  Market Data Aggregator │
              │  - Ticker updates       │
              │  - Order book updates   │
              │  - Trade updates        │
              └─────────────────────────┘
```

**Message Protocol:**

All messages use JSON format with the following structure:

```typescript
// Base message structure
interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'error' | 'ticker' | 'orderbook';
  timestamp: string; // ISO 8601
  payload: unknown;  // Type-specific payload
}

// Client -> Server: Subscribe to ticker updates
interface SubscribeTickerMessage {
  type: 'subscribe';
  timestamp: string;
  payload: {
    channel: 'ticker';
    symbols: string[];  // e.g., ["BTC-USDT", "ETH-USDT"]
  };
}

// Client -> Server: Subscribe to order book updates
interface SubscribeOrderBookMessage {
  type: 'subscribe';
  timestamp: string;
  payload: {
    channel: 'orderbook';
    symbol: string;  // e.g., "BTC-USDT"
  };
}

// Client -> Server: Unsubscribe
interface UnsubscribeMessage {
  type: 'unsubscribe';
  timestamp: string;
  payload: {
    channel: 'ticker' | 'orderbook';
    symbols?: string[];  // If omitted, unsubscribe from all
  };
}

// Client <-> Server: Heartbeat
interface PingMessage {
  type: 'ping';
  timestamp: string;
  payload: {};
}

interface PongMessage {
  type: 'pong';
  timestamp: string;
  payload: {};
}

// Server -> Client: Error
interface ErrorMessage {
  type: 'error';
  timestamp: string;
  payload: {
    code: string;  // e.g., "RATE_LIMIT_EXCEEDED", "INVALID_SYMBOL"
    message: string;
    details?: unknown;
  };
}

// Server -> Client: Ticker update
interface TickerUpdateMessage {
  type: 'ticker';
  timestamp: string;
  payload: {
    symbol: string;
    price: number;
    volume24h: number;
    high24h: number;
    low24h: number;
    change24h: number;
    bestBid: number;
    bestAsk: number;
    sources: number;  // Number of exchanges
    exchangePrices?: Array<{
      exchange: string;
      price: number;
      volume: number;
    }>;
  };
}

// Server -> Client: Order book update
interface OrderBookUpdateMessage {
  type: 'orderbook';
  timestamp: string;
  payload: {
    symbol: string;
    bids: Array<{
      price: number;
      quantity: number;
      exchange?: string;  // Optional per-exchange breakdown
    }>;
    asks: Array<{
      price: number;
      quantity: number;
      exchange?: string;
    }>;
    sources: number;  // Number of exchanges
  };
}
```

**Subscription Management:**

```typescript
interface ClientSubscription {
  clientId: string;
  socketId: string;
  subscriptions: {
    ticker: Set<string>;      // Set of symbols
    orderbook: Set<string>;   // Set of symbols
  };
  messageCount: number;       // For rate limiting
  lastMessageTime: Date;
  violationCount: number;     // Rate limit violations
}

interface SubscriptionManager {
  // Add subscription for a client
  subscribe(clientId: string, channel: 'ticker' | 'orderbook', symbols: string[]): void;
  
  // Remove subscription for a client
  unsubscribe(clientId: string, channel: 'ticker' | 'orderbook', symbols?: string[]): void;
  
  // Get all clients subscribed to a symbol
  getSubscribedClients(channel: 'ticker' | 'orderbook', symbol: string): string[];
  
  // Remove all subscriptions for a client (on disconnect)
  removeClient(clientId: string): void;
  
  // Get subscription stats
  getStats(): {
    totalClients: number;
    totalSubscriptions: number;
    subscriptionsBySymbol: Map<string, number>;
  };
}
```

**Rate Limiting:**

```typescript
interface RateLimitConfig {
  maxSubscriptionsPerClient: number;    // Default: 10
  maxMessagesPerMinute: number;         // Default: 100
  maxViolationsBeforeDisconnect: number; // Default: 3
}

interface RateLimiter {
  // Check if client can send message
  checkRateLimit(clientId: string): {
    allowed: boolean;
    reason?: string;
  };
  
  // Record message from client
  recordMessage(clientId: string): void;
  
  // Check if client can add subscription
  checkSubscriptionLimit(clientId: string, additionalCount: number): {
    allowed: boolean;
    reason?: string;
  };
  
  // Record rate limit violation
  recordViolation(clientId: string): boolean; // Returns true if should disconnect
}
```

**Broadcast Strategy:**

```typescript
interface BroadcastService {
  // Broadcast ticker update to subscribed clients
  broadcastTicker(ticker: AggregatedTicker): Promise<void>;
  
  // Broadcast order book update to subscribed clients
  broadcastOrderBook(orderBook: NormalizedOrderBook): Promise<void>;
  
  // Get broadcast metrics
  getMetrics(): {
    messagesPerSecond: number;
    averageBroadcastLatency: number;
    failedBroadcasts: number;
  };
}
```

**Scalability Design:**

For horizontal scaling, the WebSocket module supports Redis pub/sub:

```typescript
interface ScalableWebSocketConfig {
  mode: 'standalone' | 'distributed';
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
}

// In distributed mode:
// 1. Each server instance maintains its own client connections
// 2. Subscription state is local to each instance
// 3. When Aggregator emits update, it publishes to Redis
// 4. All server instances receive Redis message
// 5. Each instance broadcasts to its own subscribed clients
```

**Connection Lifecycle:**

```
1. Client connects
   ↓
2. Server accepts connection, assigns clientId
   ↓
3. Client sends subscribe messages
   ↓
4. Server validates and stores subscriptions
   ↓
5. Server broadcasts updates to client
   ↓
6. Client sends ping periodically (optional)
   ↓
7. Client disconnects (graceful or unexpected)
   ↓
8. Server detects disconnect, removes subscriptions, releases resources
```

**Error Codes:**

```typescript
enum WebSocketErrorCode {
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  INVALID_SYMBOL = 'INVALID_SYMBOL',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUBSCRIPTION_LIMIT_EXCEEDED = 'SUBSCRIPTION_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
}
```

### WebSocket Client Integration

#### Example Client-Side Code

**1. Connecting to WebSocket Server:**

```typescript
import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(url: string): void {
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
```

**2. Subscribing to Ticker Updates:**

```typescript
interface TickerUpdate {
  symbol: string;
  price: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
  bestBid: number;
  bestAsk: number;
  sources: number;
  exchangePrices?: Array<{
    exchange: string;
    price: number;
    volume: number;
  }>;
}

class WebSocketClient {
  // ... previous code ...

  subscribeToTickers(symbols: string[], callback: (update: TickerUpdate) => void): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    // Send subscribe message
    const message = {
      type: 'subscribe',
      timestamp: new Date().toISOString(),
      payload: {
        channel: 'ticker',
        symbols: symbols,
      },
    };

    this.socket.emit('message', message);

    // Listen for ticker updates
    this.socket.on('ticker', (data) => {
      if (data.type === 'ticker') {
        callback(data.payload);
      }
    });
  }

  unsubscribeFromTickers(symbols?: string[]): void {
    if (!this.socket) return;

    const message = {
      type: 'unsubscribe',
      timestamp: new Date().toISOString(),
      payload: {
        channel: 'ticker',
        symbols: symbols,
      },
    };

    this.socket.emit('message', message);
  }
}
```

**3. Subscribing to Order Book Updates:**

```typescript
interface OrderBookUpdate {
  symbol: string;
  bids: Array<{ price: number; quantity: number; exchange?: string }>;
  asks: Array<{ price: number; quantity: number; exchange?: string }>;
  sources: number;
}

class WebSocketClient {
  // ... previous code ...

  subscribeToOrderBook(symbol: string, callback: (update: OrderBookUpdate) => void): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    const message = {
      type: 'subscribe',
      timestamp: new Date().toISOString(),
      payload: {
        channel: 'orderbook',
        symbol: symbol,
      },
    };

    this.socket.emit('message', message);

    this.socket.on('orderbook', (data) => {
      if (data.type === 'orderbook' && data.payload.symbol === symbol) {
        callback(data.payload);
      }
    });
  }

  unsubscribeFromOrderBook(symbol: string): void {
    if (!this.socket) return;

    const message = {
      type: 'unsubscribe',
      timestamp: new Date().toISOString(),
      payload: {
        channel: 'orderbook',
        symbols: [symbol],
      },
    };

    this.socket.emit('message', message);
  }
}
```

**4. Handling Incoming Messages:**

```typescript
class WebSocketClient {
  // ... previous code ...

  setupMessageHandlers(): void {
    if (!this.socket) return;

    // Handle all message types
    this.socket.on('message', (data) => {
      switch (data.type) {
        case 'ticker':
          this.handleTickerUpdate(data);
          break;
        case 'orderbook':
          this.handleOrderBookUpdate(data);
          break;
        case 'error':
          this.handleError(data);
          break;
        case 'pong':
          this.handlePong(data);
          break;
        default:
          console.warn('Unknown message type:', data.type);
      }
    });
  }

  private handleTickerUpdate(data: any): void {
    console.log('Ticker update:', data.payload);
    // Update UI or state management
  }

  private handleOrderBookUpdate(data: any): void {
    console.log('Order book update:', data.payload);
    // Update UI or state management
  }

  private handleError(data: any): void {
    console.error('WebSocket error:', data.payload);
    // Show error to user or handle specific error codes
    switch (data.payload.code) {
      case 'RATE_LIMIT_EXCEEDED':
        console.warn('Rate limit exceeded, slowing down requests');
        break;
      case 'INVALID_SYMBOL':
        console.error('Invalid symbol:', data.payload.details);
        break;
      default:
        console.error('Unknown error:', data.payload.message);
    }
  }

  private handlePong(data: any): void {
    console.log('Pong received at:', data.timestamp);
  }
}
```

**5. Error Handling and Reconnection Logic:**

```typescript
class WebSocketClient {
  // ... previous code ...

  private setupReconnectionLogic(): void {
    if (!this.socket) return;

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.error(`Connection error (attempt ${this.reconnectAttempts}):`, error);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.socket?.disconnect();
        // Notify user or trigger fallback behavior
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
      // Re-establish subscriptions
      this.resubscribeAll();
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      // Notify user or trigger fallback behavior
    });
  }

  private resubscribeAll(): void {
    // Store subscriptions and re-establish them after reconnection
    // This should be implemented based on your state management
    console.log('Re-establishing subscriptions after reconnection');
  }
}
```

**6. Heartbeat/Ping Implementation:**

```typescript
class WebSocketClient {
  private pingInterval: NodeJS.Timeout | null = null;

  // ... previous code ...

  startHeartbeat(intervalMs: number = 30000): void {
    this.stopHeartbeat();

    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        const message = {
          type: 'ping',
          timestamp: new Date().toISOString(),
          payload: {},
        };
        this.socket.emit('message', message);
      }
    }, intervalMs);
  }

  stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
```

**7. Complete Usage Example:**

```typescript
// Initialize client
const wsClient = new WebSocketClient();

// Connect to server
wsClient.connect('ws://localhost:3000');

// Subscribe to multiple tickers
wsClient.subscribeToTickers(['BTC-USDT', 'ETH-USDT'], (update) => {
  console.log(`${update.symbol}: $${update.price}`);
  // Update your UI or state
  updateTickerDisplay(update);
});

// Subscribe to order book
wsClient.subscribeToOrderBook('BTC-USDT', (update) => {
  console.log(`Order book for ${update.symbol}:`, update);
  // Update order book visualization
  updateOrderBookDisplay(update);
});

// Start heartbeat
wsClient.startHeartbeat();

// Setup message handlers
wsClient.setupMessageHandlers();

// Cleanup on unmount/exit
window.addEventListener('beforeunload', () => {
  wsClient.stopHeartbeat();
  wsClient.disconnect();
});
```

**8. React Hook Example:**

```typescript
import { useEffect, useState } from 'react';

function useWebSocketTicker(symbols: string[]) {
  const [tickers, setTickers] = useState<Map<string, TickerUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wsClient = new WebSocketClient();

    wsClient.connect('ws://localhost:3000');

    wsClient.socket?.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    wsClient.socket?.on('disconnect', () => {
      setIsConnected(false);
    });

    wsClient.socket?.on('error', (err) => {
      setError(err.message);
    });

    wsClient.subscribeToTickers(symbols, (update) => {
      setTickers((prev) => {
        const next = new Map(prev);
        next.set(update.symbol, update);
        return next;
      });
    });

    wsClient.startHeartbeat();

    return () => {
      wsClient.stopHeartbeat();
      wsClient.unsubscribeFromTickers(symbols);
      wsClient.disconnect();
    };
  }, [symbols]);

  return { tickers, isConnected, error };
}

// Usage in component
function TickerDisplay() {
  const { tickers, isConnected, error } = useWebSocketTicker(['BTC-USDT', 'ETH-USDT']);

  if (error) return <div>Error: {error}</div>;
  if (!isConnected) return <div>Connecting...</div>;

  return (
    <div>
      {Array.from(tickers.values()).map((ticker) => (
        <div key={ticker.symbol}>
          {ticker.symbol}: ${ticker.price.toFixed(2)}
        </div>
      ))}
    </div>
  );
}
```

### Frontend Components

#### 1. Dashboard Component

**Purpose:** Main landing page with overview of tracked cryptocurrencies

**Features:**
- Disclaimer modal on first visit
- Grid of cryptocurrency cards with current prices
- Quick access to detailed views
- Real-time price updates

#### 2. Chart Component

**Purpose:** Interactive price and volume charts

**Features:**
- Time range selector (1h, 24h, 7d, 30d, 1y)
- Multiple chart types (candlestick, line, area)
- Volume overlay
- Order book depth visualization
- Responsive and performant rendering

#### 3. Coin List Component

**Purpose:** Searchable, sortable list of cryptocurrencies

**Features:**
- Search by name or symbol
- Sort by price, volume, change percentage
- Multi-select for comparison
- Real-time price updates

#### 4. Prediction Panel Component

**Purpose:** Display educational signals with prominent disclaimers

**Features:**
- Trend indicator (bullish/bearish/neutral)
- Momentum gauge
- Risk level badge
- Technical indicator values
- Large, clear disclaimer text

#### 5. State Management

**Zustand Store Structure:**

```typescript
interface AppState {
  // Market data
  tickers: Map<string, NormalizedTicker>;
  selectedSymbol: string | null;
  historicalData: AggregatedData[];
  
  // Signals
  signals: Map<string, MarketSignal>;
  
  // UI state
  disclaimerAcknowledged: boolean;
  isConnected: boolean;
  error: string | null;
  
  // Actions
  setSelectedSymbol: (symbol: string) => void;
  updateTicker: (ticker: NormalizedTicker) => void;
  updateSignal: (signal: MarketSignal) => void;
  acknowledgeDisclaimer: () => void;
}
```

## Data Models

### Database Schema

#### 1. Market Data Tables

**tickers** (TimescaleDB hypertable)
```sql
CREATE TABLE tickers (
  id BIGSERIAL,
  exchange VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  volume_24h DECIMAL(20, 8),
  high_24h DECIMAL(20, 8),
  low_24h DECIMAL(20, 8),
  change_24h DECIMAL(10, 4),
  PRIMARY KEY (timestamp, exchange, symbol)
);

SELECT create_hypertable('tickers', 'timestamp');
CREATE INDEX idx_tickers_symbol ON tickers (symbol, timestamp DESC);
CREATE INDEX idx_tickers_exchange ON tickers (exchange, timestamp DESC);
```

**trades** (TimescaleDB hypertable)
```sql
CREATE TABLE trades (
  id BIGSERIAL,
  exchange VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  PRIMARY KEY (timestamp, exchange, symbol, id)
);

SELECT create_hypertable('trades', 'timestamp');
CREATE INDEX idx_trades_symbol ON trades (symbol, timestamp DESC);
```

**order_books** (TimescaleDB hypertable)
```sql
CREATE TABLE order_books (
  id BIGSERIAL,
  exchange VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  side VARCHAR(3) NOT NULL CHECK (side IN ('bid', 'ask')),
  price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  PRIMARY KEY (timestamp, exchange, symbol, side, price)
);

SELECT create_hypertable('order_books', 'timestamp');
CREATE INDEX idx_orderbooks_symbol ON order_books (symbol, timestamp DESC);
```

#### 2. Analytics Tables

**signals**
```sql
CREATE TABLE signals (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  trend VARCHAR(10) NOT NULL CHECK (trend IN ('bullish', 'bearish', 'neutral')),
  momentum DECIMAL(6, 2) NOT NULL CHECK (momentum >= -100 AND momentum <= 100),
  risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'extreme')),
  rsi DECIMAL(6, 2),
  macd_value DECIMAL(20, 8),
  macd_signal DECIMAL(20, 8),
  macd_histogram DECIMAL(20, 8),
  ma_20 DECIMAL(20, 8),
  ma_50 DECIMAL(20, 8),
  ma_200 DECIMAL(20, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signals_symbol_timestamp ON signals (symbol, timestamp DESC);
```

#### 3. Configuration Tables

**tracked_symbols**
```sql
CREATE TABLE tracked_symbols (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  base_currency VARCHAR(10) NOT NULL,
  quote_currency VARCHAR(10) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**exchange_configs**
```sql
CREATE TABLE exchange_configs (
  id SERIAL PRIMARY KEY,
  exchange_name VARCHAR(50) UNIQUE NOT NULL,
  api_endpoint VARCHAR(255) NOT NULL,
  websocket_endpoint VARCHAR(255),
  rate_limit_per_minute INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Entity Relationships

```
tracked_symbols (1) ──< (N) tickers
tracked_symbols (1) ──< (N) trades
tracked_symbols (1) ──< (N) order_books
tracked_symbols (1) ──< (N) signals

exchange_configs (1) ──< (N) tickers
exchange_configs (1) ──< (N) trades
exchange_configs (1) ──< (N) order_books
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 3.3 and 3.5 both test normalization handling of different exchange formats - these are combined into Property 3
- Properties 7.1 and 7.4 both test secure credential retrieval - these are combined into Property 11
- Properties 1.5 and 10.5 both test timestamp inclusion in data - these are combined into Property 1

### Core Data Properties

**Property 1: Data completeness with timestamps**
*For any* market data point displayed to users, the data should include a timestamp and source exchange identification.
**Validates: Requirements 1.5, 10.5**

**Property 2: Multi-exchange data display**
*For any* cryptocurrency with data from multiple exchanges, all exchange sources should be displayed with clear source identification.
**Validates: Requirements 1.3**

**Property 3: Exchange data normalization**
*For any* raw market data received from any exchange, the normalizer should transform it into the unified data format with all required fields (exchange, symbol, timestamp, price, volume).
**Validates: Requirements 3.3, 3.5**

**Property 4: Data persistence completeness**
*For any* market data collected, when stored in the database, the record should include timestamp, exchange source, cryptocurrency pair, price, and volume.
**Validates: Requirements 12.1, 12.2**

### Fault Tolerance Properties

**Property 5: Exchange failure isolation**
*For any* set of configured exchanges, if one exchange connection fails, the system should continue displaying data from all other available exchanges.
**Validates: Requirements 1.4**

**Property 6: Invalid data rejection**
*For any* invalid market data received (missing required fields, out-of-range values, malformed structure), the system should reject it and log a validation error without crashing.
**Validates: Requirements 11.2**

**Property 7: Error response consistency**
*For any* failed user request, the system should return an error response with a clear error message and appropriate HTTP status code (4xx for client errors, 5xx for server errors).
**Validates: Requirements 11.3**

**Property 8: Exchange error resilience**
*For any* exchange API error, the system should log the error and continue operating with other exchanges without interrupting service.
**Validates: Requirements 11.1**

### Analytics Properties

**Property 9: Signal generation validity**
*For any* market data processed by the analytics engine, the generated signal should have a valid trend value (bullish, bearish, or neutral), momentum value between -100 and 100, and risk level (low, medium, high, or extreme).
**Validates: Requirements 4.1, 4.2, 4.3**

**Property 10: Chart data completeness**
*For any* rendered price chart, the visualization should include both price data and volume data as a secondary visualization.
**Validates: Requirements 2.2**

**Property 11: Order book structure**
*For any* order book visualization, the display should include both bid levels and ask levels, each with corresponding price and quantity values.
**Validates: Requirements 2.3**

### Security Properties

**Property 12: Secure credential storage**
*For any* API key or secret used by the system, it should be retrieved from environment variables or secure vault services, never from hardcoded values in the source code.
**Validates: Requirements 7.1, 7.4**

**Property 13: Log sanitization**
*For any* log message generated by the application, it should not contain API keys, passwords, or other sensitive credentials.
**Validates: Requirements 7.2**

**Property 14: Error message sanitization**
*For any* error message returned to users or logged, sensitive information (API keys, internal paths, database credentials) should be sanitized and not exposed.
**Validates: Requirements 7.5**

### Disclaimer Properties

**Property 15: Signal disclaimer presence**
*For any* signal or prediction displayed to users, the rendered output should include disclaimer text containing the phrases "not financial advice", "no guarantees", and "high risk".
**Validates: Requirements 4.4, 5.2**

**Property 16: Analysis page disclaimers**
*For any* page component that displays market analysis or predictions, the rendered output should include visible disclaimer text emphasizing educational purpose.
**Validates: Requirements 5.3, 5.4**

**Property 17: Prediction access control**
*For any* user attempting to access prediction features, if they have not acknowledged the risk disclaimer, the system should block access and prompt for acknowledgment.
**Validates: Requirements 5.5**

### Real-time Communication Properties

**Property 18: WebSocket reconnection**
*For any* interrupted WebSocket connection, the system should automatically attempt reconnection within a reasonable timeframe.
**Validates: Requirements 8.3**

**Property 19: Reconnection data continuity**
*For any* successful WebSocket reconnection, the system should resume real-time updates without losing data that arrived during the disconnection period.
**Validates: Requirements 8.4**

**Property 20: Connection cleanup**
*For any* user disconnection, the system should properly close the WebSocket connection and release associated resources (memory, event listeners).
**Validates: Requirements 8.5**

### User Interface Properties

**Property 21: Comparison data completeness**
*For any* cryptocurrency comparison display, the output should include price, volume, market cap, and signal data for each selected cryptocurrency.
**Validates: Requirements 10.3**

**Property 22: Search filtering correctness**
*For any* search query entered by a user, the filtered cryptocurrency list should only include items where the name or symbol contains the search query (case-insensitive).
**Validates: Requirements 10.4**

### Data Collection Properties

**Property 23: Collector initialization**
*For any* data collector startup, the system should establish connections to all configured exchanges that are marked as enabled.
**Validates: Requirements 3.1**

**Property 24: Rate limit compliance**
*For any* exchange with a configured rate limit, the system should throttle requests to ensure the number of requests per minute does not exceed the configured limit.
**Validates: Requirements 3.4**

**Property 25: Historical query support**
*For any* historical data query with a time range filter, the system should return only data points with timestamps within the specified start and end times.
**Validates: Requirements 12.3**

**Property 26: Data retention enforcement**
*For any* data retention policy with a configured retention period, the system should archive or delete data with timestamps older than the retention period.
**Validates: Requirements 12.5**

### Database Resilience Properties

**Property 27: Database reconnection**
*For any* database connection failure, the system should attempt automatic reconnection and queue pending operations for execution after reconnection succeeds.
**Validates: Requirements 11.4**

**Property 28: Critical error alerting**
*For any* critical error (database failure, all exchanges down, system crash), the system should send an alert notification through configured alerting channels.
**Validates: Requirements 11.5**

### Caching Properties

**Property 29: Cache TTL enforcement**
*For any* cached data item with a configured TTL, the system should automatically remove or mark it as expired after the TTL duration has elapsed.
**Validates: Requirements 13.1, 13.2**

**Property 30: Cache fallback resilience**
*For any* cache operation failure (connection error, timeout, unavailable), the system should fall back to database queries and continue serving requests without interruption.
**Validates: Requirements 13.4**

**Property 31: Cache eviction under pressure**
*For any* in-memory cache approaching its size limit, the system should evict least-recently-used entries to maintain the configured maximum size.
**Validates: Requirements 13.5**

### Aggregation and Conflict Resolution Properties

**Property 32: VWAP calculation correctness**
*For any* set of exchange prices with volumes, the calculated volume-weighted average price should equal the sum of (price × volume) divided by the sum of volumes.
**Validates: Requirements 14.1**

**Property 33: Per-exchange price preservation**
*For any* aggregated ticker with per-exchange data enabled, the response should include individual exchange prices with correct source identification.
**Validates: Requirements 14.2**

**Property 34: Stale data exclusion**
*For any* aggregated price calculation, data points with timestamps older than the configured staleness threshold should be excluded from the calculation.
**Validates: Requirements 14.3**

**Property 35: Outlier flagging**
*For any* exchange price that deviates significantly from the median (beyond configured threshold), the system should flag it as an outlier in the aggregated data.
**Validates: Requirements 14.4**

### Data Access Function Properties

**Property 36: getCurrentTicker function validity**
*For any* valid symbol, the getCurrentTicker function should return either a valid aggregated ticker with all required fields or null if no data is available.
**Validates: Requirements 15.1**

**Property 37: getAllTickers completeness**
*For any* call to getAllTickers, the returned collection should include aggregated tickers for all tracked symbols that have recent data.
**Validates: Requirements 15.2**

**Property 38: getOrderBook merge correctness**
*For any* symbol with order books from multiple exchanges, the getOrderBook function should return a merged order book with bids sorted descending and asks sorted ascending.
**Validates: Requirements 15.3**

**Property 39: getRecentTrades aggregation**
*For any* symbol, the getRecentTrades function should return trades from all exchanges sorted by timestamp in descending order (most recent first).
**Validates: Requirements 15.4**

**Property 40: Invalid symbol handling**
*For any* data access function called with an invalid or non-existent symbol, the function should return null or an empty collection without throwing an exception.
**Validates: Requirements 15.5**

### WebSocket Protocol Properties

**Property 41: Message type validation**
*For any* incoming WebSocket message, the system should validate that it contains a valid message type (subscribe, unsubscribe, ping) and reject messages with invalid types with an error response.
**Validates: Requirements 16.2**

**Property 42: Subscription payload validation**
*For any* subscribe message, the system should validate that the payload contains the required fields (channel and symbols/symbol) and reject invalid payloads with an error response.
**Validates: Requirements 16.3, 16.4**

**Property 43: Error message structure**
*For any* error condition, the error message sent to the client should include an error code, human-readable message, and timestamp in the defined format.
**Validates: Requirements 16.5**

**Property 44: Ticker update payload completeness**
*For any* ticker update broadcast, the message should include type, symbol, price, volume, timestamp, and exchange sources in the defined payload structure.
**Validates: Requirements 17.1, 17.4**

**Property 45: Order book update payload structure**
*For any* order book update broadcast, the message should include type, symbol, bids array, asks array, and timestamp, with each bid/ask containing price and quantity.
**Validates: Requirements 17.2, 17.3**

**Property 46: JSON serialization consistency**
*For any* WebSocket message, the serialized JSON should use consistent field naming (camelCase) and be parseable by standard JSON parsers.
**Validates: Requirements 17.5**

### Subscription Management Properties

**Property 47: Subscription storage correctness**
*For any* client subscription request, the system should store the subscription associated with that client's connection ID and include it in future broadcasts for that symbol.
**Validates: Requirements 18.1**

**Property 48: Unsubscribe correctness**
*For any* client unsubscribe request, the system should remove only that client's subscription for the specified symbols without affecting other clients' subscriptions.
**Validates: Requirements 18.2**

**Property 49: Multiple subscription tracking**
*For any* client with multiple subscriptions, the system should track each subscription independently and broadcast updates for all subscribed symbols.
**Validates: Requirements 18.3**

**Property 50: Targeted broadcast correctness**
*For any* market data update, the system should broadcast the update only to clients that have an active subscription for that symbol.
**Validates: Requirements 18.5**

### Disconnect Handling Properties

**Property 51: Subscription cleanup on disconnect**
*For any* client disconnection, the system should remove all subscriptions associated with that client within 1 second of detecting the disconnect.
**Validates: Requirements 19.1**

**Property 52: Resource cleanup on disconnect**
*For any* client disconnection, the system should release all memory and resources (event listeners, timers) associated with that client.
**Validates: Requirements 19.2**

**Property 53: Disconnect isolation**
*For any* client disconnection, all other connected clients should continue receiving updates without interruption or degradation.
**Validates: Requirements 19.5**

### Real-time Integration Properties

**Property 54: Ticker broadcast latency**
*For any* new ticker data received by the Aggregator, the WebSocket server should broadcast the update to subscribed clients within 100 milliseconds.
**Validates: Requirements 20.3**

**Property 55: Conditional broadcast**
*For any* market data update, if no clients are subscribed to that symbol, the system should not perform any broadcast operations.
**Validates: Requirements 20.4**

**Property 56: Message format transformation**
*For any* aggregator event, the WebSocket server should transform the internal data format into the defined WebSocket message format before broadcasting.
**Validates: Requirements 20.5**

### Scalability Properties

**Property 57: Stateless reconnection support**
*For any* client reconnecting to a different server instance, the client should be able to re-establish subscriptions by sending subscribe messages.
**Validates: Requirements 21.3**

**Property 58: Minimal state storage**
*For any* WebSocket server instance, the stored state should contain only active subscriptions and connection metadata, with no business logic state.
**Validates: Requirements 21.4**

### Rate Limiting Properties

**Property 59: Subscription limit enforcement**
*For any* client attempting to subscribe, if the client already has 10 active subscriptions, the system should reject the new subscription with a rate limit error.
**Validates: Requirements 22.1**

**Property 60: Message rate limit enforcement**
*For any* client sending messages, if the client exceeds 100 messages per minute, the system should reject subsequent messages with a rate limit error.
**Validates: Requirements 22.2**

**Property 61: Rate limit violation handling**
*For any* client that exceeds rate limits 3 times, the system should disconnect the client and log the violation.
**Validates: Requirements 22.4**

**Property 62: Rate limit violation logging**
*For any* rate limit violation, the system should log the event with client identifier, timestamp, and violation type.
**Validates: Requirements 22.5**

## Error Handling

### Error Categories

1. **Exchange API Errors**
   - Connection failures
   - Authentication errors
   - Rate limit exceeded
   - Invalid response format
   - **Handling:** Log error, continue with other exchanges, retry with exponential backoff

2. **Data Validation Errors**
   - Missing required fields
   - Out-of-range values
   - Type mismatches
   - **Handling:** Reject data, log validation details, increment error metrics

3. **Database Errors**
   - Connection failures
   - Query timeouts
   - Constraint violations
   - **Handling:** Retry with backoff, queue operations, alert on persistent failures

4. **User Request Errors**
   - Invalid parameters (400 Bad Request)
   - Unauthorized access (401 Unauthorized)
   - Resource not found (404 Not Found)
   - **Handling:** Return appropriate HTTP status with clear error message

5. **System Errors**
   - Out of memory
   - Unhandled exceptions
   - Service unavailable
   - **Handling:** Log full stack trace, return 500 Internal Server Error, alert administrators

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: unknown;      // Additional context (sanitized)
    timestamp: string;      // ISO 8601 timestamp
    requestId?: string;     // For tracing
  };
}
```

### Logging Strategy

- **Info:** Normal operations, data collection events, user actions
- **Warn:** Recoverable errors, rate limit warnings, missing optional data
- **Error:** Failed operations, validation errors, exchange failures
- **Critical:** System failures, database down, all exchanges unavailable

All logs must be sanitized to remove sensitive information (API keys, passwords, PII).

## Testing Strategy

### Unit Testing

The system will use **Jest** for backend unit tests and **Vitest** for frontend unit tests. Unit tests will focus on:

- **Individual functions and methods:** Test pure functions, utility methods, and business logic in isolation
- **Component rendering:** Test React components render correctly with various props
- **Service methods:** Test service layer methods with mocked dependencies
- **Data transformations:** Test normalizers, formatters, and validators
- **Error conditions:** Test error handling paths and edge cases

**Example unit tests:**
- Normalizer transforms Binance ticker format correctly
- Signal generator calculates RSI correctly for known input
- Chart component renders with empty data
- Error response formatter sanitizes sensitive data

### Property-Based Testing

The system will use **fast-check** for property-based testing. Property-based tests will verify universal properties across many randomly generated inputs.

**Configuration:**
- Each property test will run a minimum of 100 iterations
- Tests will use custom generators for domain-specific types (tickers, order books, signals)
- Each property test will include a comment tag referencing the design document property

**Tag format:** `// Feature: crypto-analytics-platform, Property X: [property description]`

**Example property tests:**
- Property 3: Generate random exchange data formats, verify normalization produces valid unified format
- Property 9: Generate random market data, verify signals have valid trend/momentum/risk values
- Property 13: Generate random log messages with injected secrets, verify secrets are sanitized
- Property 15: Generate random signals, verify rendered output contains required disclaimer phrases
- Property 22: Generate random cryptocurrency lists and search queries, verify filtering correctness

### Integration Testing

Integration tests will verify interactions between modules:

- **API endpoint tests:** Test full request/response cycle with real database
- **WebSocket communication:** Test real-time data flow from collector to frontend
- **Database operations:** Test repository methods with real PostgreSQL
- **Exchange collector integration:** Test data collection with mock exchange APIs

### Test Organization

```
backend/
  src/
    modules/
      market-data/
        aggregator.service.ts
        aggregator.service.spec.ts        # Unit tests
        aggregator.service.pbt.spec.ts    # Property-based tests
      analytics/
        signal-generator.service.ts
        signal-generator.service.spec.ts
        signal-generator.service.pbt.spec.ts
  test/
    integration/
      market-data.integration.spec.ts
      api.integration.spec.ts

frontend/
  src/
    components/
      CryptoChart.tsx
      CryptoChart.test.tsx
      CryptoChart.pbt.test.tsx
    services/
      cryptoService.ts
      cryptoService.test.ts
```

### Test Coverage Goals

- **Critical modules (data collection, normalization, analytics):** 90%+ coverage
- **API controllers and services:** 85%+ coverage
- **UI components:** 80%+ coverage
- **Utility functions:** 95%+ coverage

## Security Considerations

### Credential Management

1. **Environment Variables:** All API keys stored in `.env` files (excluded from git)
2. **Secret Rotation:** Support for updating credentials without redeployment
3. **Least Privilege:** Each exchange connector uses read-only API keys
4. **Encryption at Rest:** Database credentials encrypted in production

### API Security

1. **Rate Limiting:** Prevent abuse with request rate limits per IP
2. **Input Validation:** Validate all user inputs against schemas
3. **CORS Configuration:** Restrict origins in production
4. **HTTPS Only:** Enforce TLS for all communications

### Data Privacy

1. **No PII Collection:** System does not collect personal information
2. **Anonymous Usage:** No user accounts or tracking
3. **Disclaimer Acknowledgment:** Stored locally, not on server

## Performance Considerations

### Database Optimization

1. **TimescaleDB Hypertables:** Automatic partitioning for time-series data
2. **Compression:** Compress data older than 7 days
3. **Retention Policies:** Automatically delete data older than 1 year
4. **Indexes:** Optimized indexes on (symbol, timestamp) for fast queries

### Caching Strategy

The Market Data Aggregator implements a multi-tier caching strategy to minimize latency and database load:

#### Cache Implementation Options

**Option 1: In-Process Memory Cache**
- Uses native JavaScript Map with TTL tracking
- Suitable for single-instance deployments
- Zero network latency
- Automatic cleanup via interval-based eviction
- Memory limit enforcement with LRU eviction

**Option 2: Redis Cache**
- Distributed cache for multi-instance deployments
- Built-in TTL support
- Persistence options for cache warmup
- Pub/sub for cache invalidation across instances
- Higher latency (~1-2ms) but better scalability

#### Cache TTL Configuration

```typescript
const CACHE_TTL = {
  ticker: 1,        // 1 second - high frequency updates
  orderBook: 2,     // 2 seconds - moderate frequency
  trades: 5,        // 5 seconds - historical data
  aggregated: 1,    // 1 second - computed aggregations
};
```

#### Cache Key Structure

```
ticker:{symbol}:{exchange}     // Individual exchange ticker
ticker:agg:{symbol}            // Aggregated ticker
orderbook:{symbol}:{exchange}  // Individual exchange order book
orderbook:agg:{symbol}         // Merged order book
trades:{symbol}                // Recent trades (last 100)
```

#### Cache Eviction Strategy

1. **TTL-based:** Automatic expiration after configured TTL
2. **LRU (Memory only):** Evict least-recently-used when size limit reached
3. **Manual invalidation:** On exchange reconnection or data quality issues

#### Fallback Behavior

When cache operations fail:
1. Log warning with error details
2. Query database directly
3. Continue serving requests (degraded performance)
4. Increment cache failure metrics for monitoring

### Conflict Resolution Strategies

The aggregator supports multiple strategies for handling price differences across exchanges:

#### 1. Volume-Weighted Average Price (VWAP)

```typescript
price = Σ(price_i × volume_i) / Σ(volume_i)
```

- **Use case:** Default strategy for most accurate market price
- **Pros:** Reflects actual market liquidity
- **Cons:** Dominated by high-volume exchanges

#### 2. Per-Exchange Prices

```typescript
{
  symbol: "BTC-USDT",
  exchangePrices: [
    { exchange: "binance", price: 45000, volume: 1000 },
    { exchange: "coinbase", price: 45010, volume: 800 }
  ]
}
```

- **Use case:** Arbitrage detection, exchange comparison
- **Pros:** Full transparency, no data loss
- **Cons:** More data to transmit

#### 3. Median Price

```typescript
price = median([price_1, price_2, ..., price_n])
```

- **Use case:** Outlier-resistant pricing
- **Pros:** Not affected by single exchange anomalies
- **Cons:** Ignores volume information

#### 4. Best Bid/Ask

```typescript
price = (bestBid + bestAsk) / 2
```

- **Use case:** Real-time trading applications
- **Pros:** Reflects actual executable prices
- **Cons:** May differ from last trade price

#### Staleness Detection

Data is considered stale if:
```typescript
(currentTime - dataTimestamp) > STALENESS_THRESHOLD
```

Default thresholds:
- Ticker: 10 seconds
- Order book: 5 seconds
- Trades: 30 seconds

Stale data is excluded from aggregations and flagged in metrics.

#### Outlier Detection

Prices are flagged as outliers if:
```typescript
|price - median| > 2 × standardDeviation
```

Outliers are:
- Logged for investigation
- Excluded from VWAP calculation
- Included in per-exchange view with warning flag

### WebSocket Optimization

1. **Message Batching:** Batch multiple updates into single message
2. **Throttling:** Limit update frequency to 1 per second per client
3. **Compression:** Use WebSocket compression for large payloads

## Deployment Architecture

### Development Environment

```
- Local PostgreSQL with TimescaleDB
- Node.js backend on localhost:3000
- React frontend on localhost:5173 (Vite dev server)
- Environment variables in .env.local
```

### Production Environment

```
- PostgreSQL with TimescaleDB (managed service or self-hosted)
- Backend: Docker container, horizontal scaling with load balancer
- Frontend: Static build served via CDN
- Environment variables via secrets management service
- Monitoring: Application logs, metrics, alerts
```

### CI/CD Pipeline

1. **Lint:** ESLint, Prettier
2. **Test:** Run all unit, property, and integration tests
3. **Build:** Compile TypeScript, bundle frontend
4. **Deploy:** Push to container registry, update production

## Monitoring and Observability

### Metrics

- **Exchange Health:** Connection status, error rates, latency
- **Data Collection:** Messages per second, normalization success rate
- **API Performance:** Request rate, response time, error rate
- **WebSocket:** Active connections, message throughput
- **Database:** Query performance, connection pool usage

### Alerts

- **Critical:** All exchanges down, database unavailable, system crash
- **Warning:** Single exchange down, high error rate, slow queries
- **Info:** New exchange connected, configuration changed

### Logging

- **Structured Logs:** JSON format with consistent fields
- **Log Levels:** Info, Warn, Error, Critical
- **Sanitization:** Remove all sensitive data before logging
- **Retention:** Keep logs for 30 days

## WebSocket Message Format Documentation

### Overview

The WebSocket server uses JSON-formatted messages for all communication. All messages follow a consistent structure with a `type`, `timestamp`, and `payload` field.

### Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `subscribe` | Client → Server | Subscribe to a data channel |
| `unsubscribe` | Client → Server | Unsubscribe from a data channel |
| `ping` | Client → Server | Heartbeat request |
| `pong` | Server → Client | Heartbeat response |
| `ticker` | Server → Client | Real-time ticker update |
| `orderbook` | Server → Client | Real-time order book update |
| `error` | Server → Client | Error notification |

### Client to Server Messages

#### Subscribe Message

Subscribe to ticker updates for one or more symbols:

```json
{
  "type": "subscribe",
  "timestamp": "2025-11-30T12:00:00.000Z",
  "payload": {
    "channel": "ticker",
    "symbols": ["BTC-USDT", "ETH-USDT"]
  }
}
```

Subscribe to order book updates for a symbol:

```json
{
  "type": "subscribe",
  "timestamp": "2025-11-30T12:00:00.000Z",
  "payload": {
    "channel": "orderbook",
    "symbol": "BTC-USDT"
  }
}
```

#### Unsubscribe Message

Unsubscribe from specific symbols:

```json
{
  "type": "unsubscribe",
  "timestamp": "2025-11-30T12:00:00.000Z",
  "payload": {
    "channel": "ticker",
    "symbols": ["BTC-USDT"]
  }
}
```

Unsubscribe from all symbols in a channel (omit `symbols` field):

```json
{
  "type": "unsubscribe",
  "timestamp": "2025-11-30T12:00:00.000Z",
  "payload": {
    "channel": "ticker"
  }
}
```

#### Ping Message

Send heartbeat to keep connection alive:

```json
{
  "type": "ping",
  "timestamp": "2025-11-30T12:00:00.000Z",
  "payload": {}
}
```

### Server to Client Messages

#### Ticker Update Message

Real-time ticker data for a symbol:

```json
{
  "type": "ticker",
  "timestamp": "2025-11-30T12:00:00.123Z",
  "payload": {
    "symbol": "BTC-USDT",
    "price": 45000.50,
    "volume24h": 1234567.89,
    "high24h": 46000.00,
    "low24h": 44000.00,
    "change24h": 2.5,
    "bestBid": 44999.50,
    "bestAsk": 45001.50,
    "sources": 3,
    "exchangePrices": [
      {
        "exchange": "binance",
        "price": 45000.00,
        "volume": 800000.00
      },
      {
        "exchange": "coinbase",
        "price": 45001.00,
        "volume": 434567.89
      }
    ]
  }
}
```

**Field Descriptions:**
- `symbol`: Trading pair identifier (e.g., "BTC-USDT")
- `price`: Aggregated price (VWAP or other strategy)
- `volume24h`: Total 24-hour trading volume across all exchanges
- `high24h`: Highest price in last 24 hours
- `low24h`: Lowest price in last 24 hours
- `change24h`: Percentage change in last 24 hours
- `bestBid`: Highest bid price across all exchanges
- `bestAsk`: Lowest ask price across all exchanges
- `sources`: Number of exchanges providing data
- `exchangePrices`: (Optional) Per-exchange price breakdown

#### Order Book Update Message

Real-time order book data for a symbol:

```json
{
  "type": "orderbook",
  "timestamp": "2025-11-30T12:00:00.123Z",
  "payload": {
    "symbol": "BTC-USDT",
    "bids": [
      { "price": 44999.50, "quantity": 1.5 },
      { "price": 44999.00, "quantity": 2.3 },
      { "price": 44998.50, "quantity": 0.8 }
    ],
    "asks": [
      { "price": 45001.50, "quantity": 1.2 },
      { "price": 45002.00, "quantity": 3.1 },
      { "price": 45002.50, "quantity": 0.5 }
    ],
    "sources": 3
  }
}
```

**Field Descriptions:**
- `symbol`: Trading pair identifier
- `bids`: Array of bid levels, sorted descending by price
- `asks`: Array of ask levels, sorted ascending by price
- `price`: Price level
- `quantity`: Total quantity at this price level across all exchanges
- `sources`: Number of exchanges providing data

#### Pong Message

Heartbeat response:

```json
{
  "type": "pong",
  "timestamp": "2025-11-30T12:00:00.456Z",
  "payload": {}
}
```

#### Error Message

Error notification with details:

```json
{
  "type": "error",
  "timestamp": "2025-11-30T12:00:00.789Z",
  "payload": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded the maximum message rate of 100 messages per minute",
    "details": {
      "currentRate": 120,
      "limit": 100
    }
  }
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `INVALID_MESSAGE` | Message structure is invalid or missing required fields |
| `INVALID_SYMBOL` | Requested symbol is not supported or malformed |
| `RATE_LIMIT_EXCEEDED` | Client has exceeded message rate limit |
| `SUBSCRIPTION_LIMIT_EXCEEDED` | Client has exceeded maximum subscriptions |
| `INTERNAL_ERROR` | Server encountered an internal error |
| `AUTHENTICATION_FAILED` | Authentication credentials are invalid (if auth is enabled) |

### Rate Limits

To ensure fair usage and system stability, the following rate limits are enforced:

- **Maximum subscriptions per client:** 10
- **Maximum messages per minute:** 100
- **Maximum violations before disconnect:** 3

When a rate limit is exceeded, the server will send an error message and may disconnect the client after repeated violations.

### Best Practices

1. **Reconnection:** Implement exponential backoff for reconnection attempts
2. **Heartbeat:** Send ping messages every 30 seconds to keep connection alive
3. **Subscription Management:** Unsubscribe from symbols when no longer needed
4. **Error Handling:** Always handle error messages and implement appropriate fallback behavior
5. **Message Validation:** Validate all incoming messages on the client side
6. **State Management:** Store active subscriptions and re-establish them after reconnection

### Connection URL

**Development:** `ws://localhost:3000`
**Production:** `wss://your-domain.com` (use WSS for secure connections)

### Testing with wscat

You can test the WebSocket server using `wscat`:

```bash
# Install wscat
npm install -g wscat

# Connect to server
wscat -c ws://localhost:3000

# Send subscribe message
{"type":"subscribe","timestamp":"2025-11-30T12:00:00.000Z","payload":{"channel":"ticker","symbols":["BTC-USDT"]}}

# Send ping
{"type":"ping","timestamp":"2025-11-30T12:00:00.000Z","payload":{}}

# Send unsubscribe
{"type":"unsubscribe","timestamp":"2025-11-30T12:00:00.000Z","payload":{"channel":"ticker"}}
```

## Legal and Compliance

### Disclaimers

**Primary Disclaimer (Modal on first visit):**
```
⚠️ IMPORTANT DISCLAIMER ⚠️

This platform provides educational information only and is NOT financial advice.

- NO GUARANTEES: Past performance does not indicate future results
- HIGH RISK: Cryptocurrency trading involves substantial risk of loss
- NOT ADVICE: Do not rely on this information for investment decisions
- DO YOUR RESEARCH: Always conduct your own analysis and consult professionals
- NO LIABILITY: We are not responsible for any trading losses

By continuing, you acknowledge you understand these risks.
```

**Inline Disclaimer (on all prediction/signal displays):**
```
⚠️ Educational information only. Not financial advice. No guarantees. High risk.
```

### Terms of Service

- Platform is for educational and informational purposes only
- No warranties or guarantees of accuracy
- Users are responsible for their own trading decisions
- Platform does not execute trades or hold user funds
- Platform may be unavailable or contain errors

### Data Usage

- No personal data collected
- Market data sourced from public APIs
- Disclaimer acknowledgment stored locally only
- No cookies except for essential functionality

## Future Enhancements

### Phase 2 Features (Not in Initial Release)

1. **User Accounts:** Save watchlists and preferences
2. **Advanced Analytics:** Machine learning models, sentiment analysis
3. **Mobile App:** Native iOS/Android applications
4. **Alerts:** Price alerts, signal notifications
5. **More Exchanges:** Expand beyond initial 2-3 exchanges
6. **Social Features:** Community signals, shared analysis
7. **API Access:** Public API for third-party integrations

### Scalability Improvements

1. **Microservices:** Split into separate services for data collection, analytics, API
2. **Message Queue:** Use RabbitMQ or Kafka for event streaming
3. **Read Replicas:** Database read replicas for query scaling
4. **Geographic Distribution:** Deploy in multiple regions

## Conclusion

This design provides a solid foundation for a production-ready cryptocurrency analytics platform that prioritizes safety, security, and legal compliance. The modular architecture allows for incremental development and future enhancements while maintaining code quality and testability. The prominent disclaimer system ensures users understand the educational nature of the platform and the risks involved in cryptocurrency trading.
