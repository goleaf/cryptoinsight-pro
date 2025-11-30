# CryptoInsight Pro

A comprehensive cryptocurrency analytics platform with real-time market data, portfolio tracking, and AI-powered predictions.

## Features

- **Real-time Market Data**: Live ticker updates and order book data from multiple exchanges
- **Interactive Charts**: Historical and live candlestick charts with multiple time intervals
- **Portfolio Management**: Track positions, calculate PnL, and view portfolio allocations
- **AI Predictions**: Gemini-powered market analysis and predictions
- **WebSocket Gateway**: Real-time data streaming via WebSocket connections
- **Market Data Aggregation**: Multi-exchange data aggregation with conflict resolution strategies

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- Recharts for data visualization
- Lucide React for icons

### Backend
- Node.js with TypeScript
- WebSocket server for real-time updates
- Market data aggregator with caching
- Portfolio calculation engine

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Gemini API key (for AI predictions)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/cryptoinsight-pro.git
cd cryptoinsight-pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
cryptoinsight-pro/
├── backend/                 # Backend modules
│   ├── src/
│   │   └── modules/
│   │       ├── market-data/ # Market data aggregator and WebSocket gateway
│   │       └── portfolio/   # Portfolio management module
│   └── README.md
├── components/              # React components
│   ├── CoinList.tsx
│   ├── CryptoChart.tsx
│   └── PredictionPanel.tsx
├── services/               # Service layer
│   ├── cryptoService.ts
│   └── geminiService.ts
├── App.tsx                 # Main application component
├── index.tsx              # Application entry point
└── package.json           # Dependencies and scripts
```

## Backend Modules

### Market Data Aggregator

Located in `backend/src/modules/market-data`.

**Features:**
- Conflict resolution strategies: VWAP (default), median, per-exchange transparency, or best-bid-ask
- Outlier and staleness filtering
- Cache-aware responses with TTLs and LRU eviction

**Usage:**
```typescript
import { MarketDataAggregator } from './modules/market-data/aggregator.service';

// Ingest data
aggregator.ingestTicker(exchange, symbol, tickerData);
aggregator.ingestOrderBook(exchange, symbol, orderBook);
aggregator.ingestTrade(exchange, symbol, trade);

// Query aggregated data
const ticker = aggregator.getCurrentTicker(symbol);
const allTickers = aggregator.getAllTickers();
const orderBook = aggregator.getOrderBook(symbol);
const trades = aggregator.getRecentTrades(symbol);
```

### WebSocket Gateway

Path: `/ws`

**Subscribe to ticker updates:**
```json
{
  "event": "subscribe",
  "channel": "ticker",
  "symbols": ["BTC-USDT"]
}
```

**Receive messages:**
```json
{
  "channel": "ticker",
  "symbol": "BTC-USDT",
  "data": { "price": 50000, ... }
}
```

### Portfolio Module

Located in `backend/src/modules/portfolio`.

**Components:**
- `PositionRepository`: In-memory persistence with user scoping
- `CalculationEngine`: Computes current values, unrealized PnL, and allocations
- `PortfolioService`: Orchestrates repository and pricing
- `PortfolioController`: REST API wrapper

## Testing

Run tests for the market data aggregator:
```bash
cd backend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue on GitHub.
# cryptoinsight-pro
