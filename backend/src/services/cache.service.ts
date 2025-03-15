import { createClient, RedisClientType } from 'redis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  private static instance: CacheService;
  private client: RedisClientType | null = null;
  private readonly defaultTTL = 3600; // 1 hour in seconds
  private inMemoryCache: Map<string, { value: any, expiry: number }> = new Map();
  private isRedisAvailable = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    // If memory:// protocol is specified, use in-memory cache only
    if (redisUrl === 'memory://') {
      console.log('Using in-memory cache as specified by REDIS_URL=memory://');
      this.isRedisAvailable = false;
      this.client = null;
      
      // Set instance for backward compatibility
      if (!CacheService.instance) {
        CacheService.instance = this;
      }
      return;
    }
    
    // Try to connect to Redis
    try {
      // Validate Redis URL protocol
      const url = new URL(redisUrl);
      if (!['redis:', 'rediss:'].includes(url.protocol)) {
        throw new Error(`Invalid Redis protocol: ${url.protocol}. Only redis: and rediss: are supported.`);
      }
      
      this.client = createClient({
        url: redisUrl
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isRedisAvailable = false;
        console.log('Falling back to in-memory cache');
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isRedisAvailable = true;
      });

      this.client.connect().catch(err => {
        console.error('Redis Connection Failed:', err);
        this.isRedisAvailable = false;
        console.log('Using in-memory cache instead');
      });
    } catch (error) {
      console.error('Redis initialization failed:', error);
      this.client = null;
      this.isRedisAvailable = false;
      console.log('Using in-memory cache');
    }

    // Set instance for backward compatibility
    if (!CacheService.instance) {
      CacheService.instance = this;
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      throw new Error('CacheService not initialized. Use dependency injection instead of getInstance().');
    }
    return CacheService.instance;
  }

  /**
   * Get value from cache
   */
  public async get<T>(key: string): Promise<T | null> {
    if (this.isRedisAvailable && this.client) {
      try {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error(`Error getting key ${key} from Redis:`, error);
      }
    }
    
    // Fallback to in-memory cache
    const item = this.inMemoryCache.get(key);
    if (!item) return null;
    
    // Check if item has expired
    if (item.expiry !== 0 && item.expiry < Date.now()) {
      this.inMemoryCache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Set value in cache
   */
  public async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    if (this.isRedisAvailable && this.client) {
      try {
        await this.client.set(key, JSON.stringify(value), { EX: ttl });
        return;
      } catch (error) {
        console.error(`Error setting key ${key} in Redis:`, error);
      }
    }
    
    // Fallback to in-memory cache
    const expiry = ttl === 0 ? 0 : Date.now() + (ttl * 1000);
    this.inMemoryCache.set(key, { value, expiry });
  }

  /**
   * Delete value from cache
   */
  public async del(key: string): Promise<void> {
    if (this.isRedisAvailable && this.client) {
      try {
        await this.client.del(key);
      } catch (error) {
        console.error(`Error deleting key ${key} from Redis:`, error);
      }
    }
    
    // Also delete from in-memory cache
    this.inMemoryCache.delete(key);
  }

  /**
   * Clear all cache
   */
  public async clear(): Promise<void> {
    if (this.isRedisAvailable && this.client) {
      try {
        await this.client.flushAll();
      } catch (error) {
        console.error('Error clearing Redis cache:', error);
      }
    }
    
    // Clear in-memory cache
    this.inMemoryCache.clear();
  }

  /**
   * Get or set cache with callback
   */
  public async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T | null> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const fresh = await callback();
      await this.set(key, fresh, ttl);
      return fresh;
    } catch (error) {
      console.error(`Error in getOrSet for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get multiple values from cache
   */
  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (this.isRedisAvailable && this.client) {
      try {
        const values = await this.client.mGet(keys);
        return values.map(v => v ? JSON.parse(v) : null);
      } catch (error) {
        console.error(`Error getting multiple keys from Redis:`, error);
      }
    }
    
    // Fallback to in-memory cache
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  /**
   * Set multiple values in cache
   */
  public async mset(keyValues: Record<string, any>, ttl: number = this.defaultTTL): Promise<void> {
    const entries = Object.entries(keyValues);
    
    if (this.isRedisAvailable && this.client) {
      try {
        const pipeline = this.client.multi();
        for (const [key, value] of entries) {
          pipeline.set(key, JSON.stringify(value), { EX: ttl });
        }
        await pipeline.exec();
        return;
      } catch (error) {
        console.error(`Error setting multiple keys in Redis:`, error);
      }
    }
    
    // Fallback to in-memory cache
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  /**
   * Delete multiple values from cache
   */
  public async mdel(keys: string[]): Promise<void> {
    if (this.isRedisAvailable && this.client) {
      try {
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } catch (error) {
        console.error(`Error deleting multiple keys from Redis:`, error);
      }
    }
    
    // Also delete from in-memory cache
    for (const key of keys) {
      this.inMemoryCache.delete(key);
    }
  }

  /**
   * Get cache keys by pattern
   */
  public async keys(pattern: string): Promise<string[]> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.keys(pattern);
      } catch (error) {
        console.error(`Error getting keys with pattern ${pattern} from Redis:`, error);
      }
    }
    
    // Fallback implementation for in-memory cache (simple implementation)
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.inMemoryCache.keys()).filter(key => regex.test(key));
  }

  /**
   * Check if key exists in cache
   */
  public async exists(key: string): Promise<boolean> {
    if (this.isRedisAvailable && this.client) {
      try {
        return (await this.client.exists(key)) === 1;
      } catch (error) {
        console.error(`Error checking if key ${key} exists in Redis:`, error);
      }
    }
    
    // Fallback to in-memory cache
    return this.inMemoryCache.has(key);
  }

  /**
   * Get remaining TTL for key
   */
  public async ttl(key: string): Promise<number> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.ttl(key);
      } catch (error) {
        console.error(`Error getting TTL for key ${key} from Redis:`, error);
      }
    }
    
    // Fallback for in-memory cache
    const item = this.inMemoryCache.get(key);
    if (!item) return -2; // Key doesn't exist
    if (item.expiry === 0) return -1; // No expiry
    
    const ttlMs = item.expiry - Date.now();
    return ttlMs > 0 ? Math.ceil(ttlMs / 1000) : -2;
  }

  /**
   * Update TTL for key
   */
  public async expire(key: string, ttl: number): Promise<void> {
    if (this.isRedisAvailable && this.client) {
      try {
        await this.client.expire(key, ttl);
        return;
      } catch (error) {
        console.error(`Error setting expiry for key ${key} in Redis:`, error);
      }
    }
    
    // Fallback for in-memory cache
    const item = this.inMemoryCache.get(key);
    if (item) {
      item.expiry = ttl === 0 ? 0 : Date.now() + (ttl * 1000);
      this.inMemoryCache.set(key, item);
    }
  }
} 