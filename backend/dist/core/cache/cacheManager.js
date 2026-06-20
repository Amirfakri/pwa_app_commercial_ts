"use strict";
// backend/src/core/cache/cacheManager.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenCache = exports.cacheManager = exports.CacheManager = exports.CACHE_TTL = void 0;
const redis_1 = require("../database/redis");
const winston_1 = require("../logger/winston");
// Cache TTL constants (in seconds)
exports.CACHE_TTL = {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 1800, // 30 minutes
    EXTRA_LONG: 86400, // 24 hours
    PERMANENT: 0, // No expiry
};
class CacheManager {
    defaultTtl;
    constructor(defaultTtl = exports.CACHE_TTL.MEDIUM) {
        this.defaultTtl = defaultTtl;
    }
    async get(key) {
        try {
            const data = await (0, redis_1.redisGet)(key);
            if (data) {
                winston_1.logger.debug(`✅ Cache hit: ${key}`);
            }
            else {
                winston_1.logger.debug(`❌ Cache miss: ${key}`);
            }
            return data;
        }
        catch (error) {
            winston_1.logger.error(`❌ Cache get error for key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            await (0, redis_1.redisSet)(key, value, ttlSeconds || this.defaultTtl);
            winston_1.logger.debug(`📦 Cache set: ${key} (TTL: ${ttlSeconds || this.defaultTtl}s)`);
            return true;
        }
        catch (error) {
            winston_1.logger.error(`❌ Cache set error for key ${key}:`, error);
            return false;
        }
    }
    async setShort(key, value, ttlSeconds = exports.CACHE_TTL.SHORT) {
        return this.set(key, value, ttlSeconds);
    }
    async setMedium(key, value, ttlSeconds = exports.CACHE_TTL.MEDIUM) {
        return this.set(key, value, ttlSeconds);
    }
    async setLong(key, value, ttlSeconds = exports.CACHE_TTL.LONG) {
        return this.set(key, value, ttlSeconds);
    }
    async del(key) {
        try {
            await (0, redis_1.redisDel)(key);
            winston_1.logger.debug(`🗑️ Cache delete: ${key}`);
            return true;
        }
        catch (error) {
            winston_1.logger.error(`❌ Cache delete error for key ${key}:`, error);
            return false;
        }
    }
    async deletePattern(pattern) {
        try {
            const keys = await (0, redis_1.redisKeys)(pattern);
            if (keys.length === 0)
                return 0;
            const deleted = await (0, redis_1.redisDeletePattern)(pattern);
            winston_1.logger.debug(`🗑️ Cache delete pattern: ${pattern} (${deleted} keys)`);
            return deleted;
        }
        catch (error) {
            winston_1.logger.error(`❌ Cache delete pattern error for ${pattern}:`, error);
            return 0;
        }
    }
    async exists(key) {
        try {
            const result = await redis_1.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            winston_1.logger.error(`❌ Cache exists error for key ${key}:`, error);
            return false;
        }
    }
    async getOrSet(key, fetcher, ttlSeconds) {
        const cached = await this.get(key);
        if (cached !== null)
            return cached;
        const fresh = await fetcher();
        await this.set(key, fresh, ttlSeconds);
        return fresh;
    }
    async flushAll() {
        try {
            await redis_1.redis.flushall();
            winston_1.logger.warn('🗑️ Cache flushed all keys');
            return true;
        }
        catch (error) {
            winston_1.logger.error('❌ Cache flush error:', error);
            return false;
        }
    }
    async getStats() {
        try {
            const keys = await (0, redis_1.redisKeys)('*');
            const memory = await redis_1.redis.info('memory');
            const memoryLine = memory.split('\r\n').find(line => line.startsWith('used_memory_human'));
            return {
                totalKeys: keys.length,
                memoryInfo: memoryLine || 'Unknown',
            };
        }
        catch (error) {
            winston_1.logger.error('❌ Cache stats error:', error);
            return { totalKeys: 0, memoryInfo: 'Error' };
        }
    }
}
exports.CacheManager = CacheManager;
exports.cacheManager = new CacheManager();
// Token cache helper
exports.tokenCache = {
    async invalidateUser(userId) {
        await exports.cacheManager.deletePattern(`user:${userId}:*`);
        await exports.cacheManager.del(`user:${userId}`);
    },
    async invalidateProducts() {
        await exports.cacheManager.deletePattern('products:*');
        await exports.cacheManager.deletePattern('prices:*');
    },
    async invalidatePrices() {
        await exports.cacheManager.deletePattern('prices:*');
    },
};
