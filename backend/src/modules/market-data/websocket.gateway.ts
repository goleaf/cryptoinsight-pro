
import { WebSocket, WebSocketServer } from 'ws'; // NOTE: Requires 'ws' package
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid'; // NOTE: Requires 'uuid' package
import { ClientMetadata, WSRequest, WSResponse } from './websocket.types';
import { InvalidSymbolError } from './types';
import { MarketDataAggregator } from './aggregator.service';

const RATE_LIMIT_WINDOW = 1000; // 1 second
const RATE_LIMIT_MAX_MSGS = 10; // Max 10 messages per second per client

export class MarketDataGateway {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientMetadata> = new Map();
  private aggregator: MarketDataAggregator;

  constructor(server: any, aggregator: MarketDataAggregator) {
    this.aggregator = aggregator;
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.init();
  }

  private init() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const metadata: ClientMetadata = {
        id: uuidv4(),
        ip: req.socket.remoteAddress || 'unknown',
        connectedAt: Date.now(),
        subscriptions: {
          ticker: new Set(),
          orderbook: new Set()
        },
        msgCount: 0,
        lastMsgTime: Date.now()
      };

      this.clients.set(ws, metadata);
      console.log(`Client connected: ${metadata.id}`);

      ws.on('message', (message: string) => this.handleMessage(ws, message));
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`Client disconnected: ${metadata.id}`);
      });

      ws.on('error', (err) => {
        console.error(`Client error ${metadata.id}:`, err);
      });
    });

    // Start Broadcast Loop (In real app, trigger this via EventBus)
    setInterval(() => this.broadcastLoop(), 1000); // 1s tick for demo
  }

  private handleMessage(ws: WebSocket, message: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    // Rate Limiting Logic
    const now = Date.now();
    if (now - client.lastMsgTime > RATE_LIMIT_WINDOW) {
      client.msgCount = 0;
      client.lastMsgTime = now;
    }
    client.msgCount++;

    if (client.msgCount > RATE_LIMIT_MAX_MSGS) {
      this.send(ws, { event: 'error', message: 'Rate limit exceeded' });
      return;
    }

    try {
      const request: WSRequest = JSON.parse(message.toString());

      switch (request.event) {
        case 'ping':
          this.send(ws, { event: 'pong' });
          break;
        case 'subscribe':
          this.handleSubscribe(ws, client, request);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, client, request);
          break;
        default:
          this.send(ws, { event: 'error', message: 'Unknown event' });
      }
    } catch (e) {
      this.send(ws, { event: 'error', message: 'Invalid JSON' });
    }
  }

  private handleSubscribe(ws: WebSocket, client: ClientMetadata, req: WSRequest) {
    if (!req.channel || !req.symbols) return;

    if (req.channel === 'ticker') {
      req.symbols.forEach(s => client.subscriptions.ticker.add(s));
      // Send immediate snapshot
      req.symbols.forEach(s => {
        try {
          const data = this.aggregator.getCurrentTicker(s);
          if (data) this.send(ws, { channel: 'ticker', symbol: s, data });
        } catch (err) {
          if (err instanceof InvalidSymbolError) {
            this.send(ws, { event: 'error', message: err.message });
          }
        }
      });
    } else if (req.channel === 'orderbook') {
      req.symbols.forEach(s => client.subscriptions.orderbook.add(s));
    }

    this.send(ws, { event: 'subscribed', channel: req.channel, data: req.symbols });
  }

  private handleUnsubscribe(ws: WebSocket, client: ClientMetadata, req: WSRequest) {
    if (!req.channel || !req.symbols) return;

    if (req.channel === 'ticker') {
      req.symbols.forEach(s => client.subscriptions.ticker.delete(s));
    } else if (req.channel === 'orderbook') {
      req.symbols.forEach(s => client.subscriptions.orderbook.delete(s));
    }

    this.send(ws, { event: 'unsubscribed', channel: req.channel, data: req.symbols });
  }

  /**
   * BROADCAST LOOP
   * Iterates through clients and sends updates for subscribed symbols.
   * In a production app, the Aggregator should emit events that the Gateway listens to.
   */
  private broadcastLoop() {
    this.clients.forEach((client, ws) => {
      if (ws.readyState !== WebSocket.OPEN) return;

      // 1. Ticker Updates
      client.subscriptions.ticker.forEach(symbol => {
        try {
          const data = this.aggregator.getCurrentTicker(symbol);
          if (data) {
            this.send(ws, { channel: 'ticker', symbol, data });
          }
        } catch (err) {
          if (err instanceof InvalidSymbolError) {
            this.send(ws, { event: 'error', message: err.message });
          }
        }
      });

      // 2. OrderBook Updates
      client.subscriptions.orderbook.forEach(symbol => {
         try {
           const data = this.aggregator.getOrderBook(symbol);
           if (data) {
             this.send(ws, { channel: 'orderbook', symbol, data });
           }
         } catch (err) {
           if (err instanceof InvalidSymbolError) {
             this.send(ws, { event: 'error', message: err.message });
           }
         }
      });
    });
  }

  private send(ws: WebSocket, payload: WSResponse) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }
}
