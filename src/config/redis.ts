/**
 * @file redis.ts
 * @description Optional Redis cache. Uses Upstash when REDIS_URL + REDIS_TOKEN
 *              are configured; otherwise falls back to an in-process Map with
 *              TTL support so dev/test environments run without Redis.
 * @module Config
 * @author VehicleMarket Backend
 */

import logger from '../logger/index';

interface CacheBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/** In-memory fallback with per-key expiry. */
class MemoryCache implements CacheBackend {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }
}

let backend: CacheBackend = new MemoryCache();
let usingUpstash = false;

/** Attempt to initialise Upstash; silently keeps the memory fallback on failure. */
export async function initCache(): Promise<void> {
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;
  if (!url || !token) {
    logger.warn('Redis not configured — using in-memory cache fallback');
    return;
  }
  try {
    const { Redis } = await import('@upstash/redis');
    const client = new Redis({ url, token });
    await client.ping();
    backend = {
      get: async (key) => {
        const v = await client.get<string | null>(key);
        return v === null || v === undefined ? null : String(v);
      },
      set: async (key, value, ttl) => {
        if (ttl) await client.set(key, value, { ex: ttl });
        else await client.set(key, value);
      },
      del: async (key) => {
        await client.del(key);
      },
      exists: async (key) => (await client.exists(key)) === 1,
    };
    usingUpstash = true;
    logger.info('Upstash Redis connected');
  } catch (err: any) {
    logger.warn(`Upstash Redis connection failed — continuing with in-memory cache: ${err.message}`);
  }
}

export const redisClient = {
  get: (key: string) => backend.get(key),
  set: (key: string, value: string, ttlSeconds?: number) => backend.set(key, value, ttlSeconds),
  del: (key: string) => backend.del(key),
  exists: (key: string) => backend.exists(key),
};

export async function checkRedisConnection(): Promise<boolean> {
  if (!usingUpstash) return false;
  try {
    await redisClient.set('healthcheck', '1', 10);
    const v = await redisClient.get('healthcheck');
    return v === '1';
  } catch {
    return false;
  }
}

export default { redisClient, initCache, checkRedisConnection };
