// backend/src/core/database/redis.ts

import Redis from 'ioredis';
import config from '../config/index';
import { logger } from '../logger/winston';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`🔄 Redis reconnecting... attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      logger.info('🔴 Redis connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis connection ready');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('🔴 Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('🔄 Redis reconnecting...');
    });
  }
  return redisClient;
};

export const connectRedis = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
    await client.connect();
    await client.ping();
    logger.info('✅ Redis connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    return false;
  }
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('🔴 Redis connection closed gracefully');
    redisClient = null;
  }
};

export const redis = getRedisClient();

// Redis helper functions
export const redisGet = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return data as unknown as T;
  }
};

export const redisSet = async (
  key: string,
  value: any,
  ttlSeconds?: number
): Promise<void> => {
  const data = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, data);
  } else {
    await redis.set(key, data);
  }
};

export const redisDel = async (key: string): Promise<void> => {
  await redis.del(key);
};

export const redisExists = async (key: string): Promise<boolean> => {
  const result = await redis.exists(key);
  return result === 1;
};

export const redisKeys = async (pattern: string): Promise<string[]> => {
  return redis.keys(pattern);
};

export const redisDeletePattern = async (pattern: string): Promise<number> => {
  const keys = await redis.keys(pattern);
  if (keys.length === 0) return 0;
  return redis.del(...keys);
};