
export type Channel = 'ticker' | 'orderbook';

export interface WSRequest {
  event: 'subscribe' | 'unsubscribe' | 'ping';
  channel?: Channel;
  symbols?: string[];
}

export interface WSResponse<T = any> {
  event?: 'pong' | 'error' | 'subscribed' | 'unsubscribed';
  channel?: Channel;
  symbol?: string;
  data?: T;
  message?: string;
}

export interface ClientMetadata {
  id: string;
  ip: string;
  connectedAt: number;
  subscriptions: {
    ticker: Set<string>;
    orderbook: Set<string>;
  };
  msgCount: number; // For Rate Limiting
  lastMsgTime: number;
}
