import { CacheConfig, CacheService, CacheStats } from './types';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  lastAccess: number;
}

const DEFAULT_CACHE_CONFIG: Required<CacheConfig> = {
  defaultTtlMs: 5000,
  maxEntries: 500,
  cleanupIntervalMs: 30000,
};

export class InMemoryCacheService implements CacheService {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private config: Required<CacheConfig>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: CacheConfig) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.cleanupTimer = setInterval(() => this.cleanupExpired(), this.config.cleanupIntervalMs);
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    entry.lastAccess = Date.now();
    this.hits++;
    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlMs?: number): void {
    const expiresAt = typeof ttlMs === 'number' ? Date.now() + ttlMs : Date.now() + this.config.defaultTtlMs;
    this.store.set(key, { value, expiresAt, lastAccess: Date.now() });
    this.evictIfNeeded();
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public stats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.store.size,
    };
  }

  public dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }

  private evictIfNeeded(): void {
    if (this.store.size <= this.config.maxEntries) return;

    const entries = Array.from(this.store.entries());
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    const excess = this.store.size - this.config.maxEntries;
    for (let i = 0; i < excess; i++) {
      const [key] = entries[i];
      this.store.delete(key);
      this.evictions++;
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    });
  }
}

export class FailingCacheService implements CacheService {
  public get<T>(_key: string): T | null {
    throw new Error('Cache unavailable');
  }

  public set<T>(_key: string, _value: T): void {
    throw new Error('Cache unavailable');
  }

  public delete(_key: string): void {
    throw new Error('Cache unavailable');
  }

  public clear(): void {
    throw new Error('Cache unavailable');
  }

  public stats(): CacheStats {
    return { hits: 0, misses: 0, evictions: 0, size: 0 };
  }
}
