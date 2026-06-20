// backend/src/core/cache/cacheManager.ts

import { redis, redisGet, redisSet, redisDel, redisDeletePattern, redisKeys } from '../database/redis';
import { logger } from '../logger/winston';

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 1800,          // 30 minutes
  EXTRA_LONG: 86400,   // 24 hours
  PERMANENT: 0,        // No expiry
};

export class CacheManager {
  private defaultTtl: number;

  constructor(defaultTtl: number = CACHE_TTL.MEDIUM) {
    this.defaultTtl = defaultTtl;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisGet<T>(key);
      if (data) {
        logger.debug(`✅ Cache hit: ${key}`);
      } else {
        logger.debug(`❌ Cache miss: ${key}`);
      }
      return data;
    } catch (error) {
      logger.error(`❌ Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      await redisSet(key, value, ttlSeconds || this.defaultTtl);
      logger.debug(`📦 Cache set: ${key} (TTL: ${ttlSeconds || this.defaultTtl}s)`);
      return true;
    } catch (error) {
      logger.error(`❌ Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async setShort(key: string, value: any, ttlSeconds: number = CACHE_TTL.SHORT): Promise<boolean> {
    return this.set(key, value, ttlSeconds);
  }

  async setMedium(key: string, value: any, ttlSeconds: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    return this.set(key, value, ttlSeconds);
  }

  async setLong(key: string, value: any, ttlSeconds: number = CACHE_TTL.LONG): Promise<boolean> {
    return this.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<boolean> {
    try {
      await redisDel(key);
      logger.debug(`🗑️ Cache delete: ${key}`);
      return true;
    } catch (error) {
      logger.error(`❌ Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redisKeys(pattern);
      if (keys.length === 0) return 0;
      
      const deleted = await redisDeletePattern(pattern);
      logger.debug(`🗑️ Cache delete pattern: ${pattern} (${deleted} keys)`);
      return deleted;
    } catch (error) {
      logger.error(`❌ Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  async flushAll(): Promise<boolean> {
    try {
      await redis.flushall();
      logger.warn('🗑️ Cache flushed all keys');
      return true;
    } catch (error) {
      logger.error('❌ Cache flush error:', error);
      return false;
    }
  }

  async getStats(): Promise<{ totalKeys: number; memoryInfo: string }> {
    try {
      const keys = await redisKeys('*');
      const memory = await redis.info('memory');
      const memoryLine = memory.split('\r\n').find(line => line.startsWith('used_memory_human'));
      
      return {
        totalKeys: keys.length,
        memoryInfo: memoryLine || 'Unknown',
      };
    } catch (error) {
      logger.error('❌ Cache stats error:', error);
      return { totalKeys: 0, memoryInfo: 'Error' };
    }
  }
}

export const cacheManager = new CacheManager();

// Token cache helper
export const tokenCache = {
  async invalidateUser(userId: number): Promise<void> {
    await cacheManager.deletePattern(`user:${userId}:*`);
    await cacheManager.del(`user:${userId}`);
  },

  async invalidateProducts(): Promise<void> {
    await cacheManager.deletePattern('products:*');
    await cacheManager.deletePattern('prices:*');
  },

  async invalidatePrices(): Promise<void> {
    await cacheManager.deletePattern('prices:*');
  },
};