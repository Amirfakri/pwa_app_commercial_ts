"use strict";
// backend/src/core/database/redis.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisDeletePattern = exports.redisKeys = exports.redisExists = exports.redisDel = exports.redisSet = exports.redisGet = exports.redis = exports.closeRedis = exports.connectRedis = exports.getRedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const index_1 = __importDefault(require("../config/index"));
const winston_1 = require("../logger/winston");
let redisClient = null;
const getRedisClient = () => {
    if (!redisClient) {
        redisClient = new ioredis_1.default({
            host: index_1.default.redis.host,
            port: index_1.default.redis.port,
            password: index_1.default.redis.password,
            db: index_1.default.redis.db,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                winston_1.logger.warn(`🔄 Redis reconnecting... attempt ${times}, delay: ${delay}ms`);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true,
        });
        redisClient.on('connect', () => {
            winston_1.logger.info('🔴 Redis connecting...');
        });
        redisClient.on('ready', () => {
            winston_1.logger.info('✅ Redis connection ready');
        });
        redisClient.on('error', (err) => {
            winston_1.logger.error('❌ Redis error:', err);
        });
        redisClient.on('close', () => {
            winston_1.logger.warn('🔴 Redis connection closed');
        });
        redisClient.on('reconnecting', () => {
            winston_1.logger.warn('🔄 Redis reconnecting...');
        });
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const connectRedis = async () => {
    try {
        const client = (0, exports.getRedisClient)();
        await client.connect();
        await client.ping();
        winston_1.logger.info('✅ Redis connection successful');
        return true;
    }
    catch (error) {
        winston_1.logger.error('❌ Redis connection failed:', error);
        return false;
    }
};
exports.connectRedis = connectRedis;
const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        winston_1.logger.info('🔴 Redis connection closed gracefully');
        redisClient = null;
    }
};
exports.closeRedis = closeRedis;
exports.redis = (0, exports.getRedisClient)();
// Redis helper functions
const redisGet = async (key) => {
    const data = await exports.redis.get(key);
    if (!data)
        return null;
    try {
        return JSON.parse(data);
    }
    catch {
        return data;
    }
};
exports.redisGet = redisGet;
const redisSet = async (key, value, ttlSeconds) => {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
        await exports.redis.setex(key, ttlSeconds, data);
    }
    else {
        await exports.redis.set(key, data);
    }
};
exports.redisSet = redisSet;
const redisDel = async (key) => {
    await exports.redis.del(key);
};
exports.redisDel = redisDel;
const redisExists = async (key) => {
    const result = await exports.redis.exists(key);
    return result === 1;
};
exports.redisExists = redisExists;
const redisKeys = async (pattern) => {
    return exports.redis.keys(pattern);
};
exports.redisKeys = redisKeys;
const redisDeletePattern = async (pattern) => {
    const keys = await exports.redis.keys(pattern);
    if (keys.length === 0)
        return 0;
    return exports.redis.del(...keys);
};
exports.redisDeletePattern = redisDeletePattern;
