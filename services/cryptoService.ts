import { CoinData, KlineData, TickerData } from '../types';

const BASE_WS_URL = 'wss://stream.binance.com:9443/ws';
const BASE_API_URL = 'https://api.binance.com/api/v3';

export const POPULAR_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'TRXUSDT', 'DOTUSDT',
  'LINKUSDT', 'MATICUSDT', 'LTCUSDT', 'SHIBUSDT'
];

export class CryptoService {
  private ws: WebSocket | null = null;
  private subscribers: ((data: CoinData[]) => void)[] = [];
  private klineWs: WebSocket | null = null;
  private klineSubscribers: ((data: KlineData) => void)[] = [];

  // Store latest data to merge updates
  private tickerMap: Map<string, CoinData> = new Map();

  constructor() {
    this.initializeTickerMap();
  }

  private initializeTickerMap() {
    POPULAR_PAIRS.forEach(pair => {
      this.tickerMap.set(pair, {
        symbol: pair.replace('USDT', ''),
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0
      });
    });
  }

  public async getHistoricalKlines(symbol: string, interval: string = '1m', limit: number = 200): Promise<KlineData[]> {
    const url = `${BASE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      // Binance API returns array of arrays: [time, open, high, low, close, volume, ...]
      return data.map((k: any) => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }));
    } catch (e) {
      console.error('Error fetching historical klines', e);
      return [];
    }
  }

  public connectTickerStream() {
    // Subscribe to all ticker updates for the popular pairs
    const streamName = '!ticker@arr'; 
    this.ws = new WebSocket(`${BASE_WS_URL}/${streamName}`);

    this.ws.onopen = () => {
      console.log('Ticker Stream Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data: TickerData[] = JSON.parse(event.data);
        let hasUpdates = false;

        data.forEach(ticker => {
          if (this.tickerMap.has(ticker.s)) {
            const current = this.tickerMap.get(ticker.s)!;
            const newPrice = parseFloat(ticker.c);
            const newChange = parseFloat(ticker.p);
            const newChangePercent = parseFloat(ticker.P);
            const newVolume = parseFloat(ticker.q); // Quote volume is usually more readable as "Volume in USDT"

            // Only trigger update if significant change to reduce render thrashing (optional, but good practice)
            // For now, we update on every message for "real-time" feel
            this.tickerMap.set(ticker.s, {
              symbol: ticker.s.replace('USDT', ''),
              price: newPrice,
              change: newChange,
              changePercent: newChangePercent,
              volume: newVolume
            });
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          const sortedData = Array.from(this.tickerMap.values());
          this.subscribers.forEach(cb => cb(sortedData));
        }
      } catch (e) {
        console.error('Error parsing ticker data', e);
      }
    };

    this.ws.onerror = (e) => console.error('WS Error', e);
    this.ws.onclose = () => console.log('Ticker Stream Closed');
  }

  public subscribeTickers(callback: (data: CoinData[]) => void) {
    this.subscribers.push(callback);
    // Send initial cached data immediately
    callback(Array.from(this.tickerMap.values()));
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
       // If not connected, try to connect (idempotent-ish check)
       // In a real app we'd manage connection state better
    }
  }

  public unsubscribeTickers(callback: (data: CoinData[]) => void) {
    this.subscribers = this.subscribers.filter(cb => cb !== callback);
  }

  public connectKlineStream(symbol: string, interval: string = '1m') {
    if (this.klineWs) {
      this.klineWs.close();
    }

    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    this.klineWs = new WebSocket(`${BASE_WS_URL}/${streamName}`);

    this.klineWs.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.e === 'kline') {
        const k = msg.k;
        const klineData: KlineData = {
          time: k.t,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v)
        };
        this.klineSubscribers.forEach(cb => cb(klineData));
      }
    };
  }

  public subscribeKline(callback: (data: KlineData) => void) {
    this.klineSubscribers.push(callback);
  }

  public unsubscribeKline(callback: (data: KlineData) => void) {
    this.klineSubscribers = this.klineSubscribers.filter(cb => cb !== callback);
  }

  public disconnectAll() {
    this.ws?.close();
    this.klineWs?.close();
  }
}

export const cryptoService = new CryptoService();