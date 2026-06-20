"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transaction = exports.getPoolStats = exports.closePool = exports.testDatabaseConnection = exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const winston_1 = require("../logger/winston");
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'khoda123@',
    database: process.env.DB_DATABASE || 'pwa-app1',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});
exports.pool = pool;
const query = async (text, params) => {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
        winston_1.logger.warn(`⚠️ Slow query (${duration}ms): ${text.substring(0, 200)}`);
    }
    return result;
};
exports.query = query;
const testDatabaseConnection = async () => {
    try {
        await pool.query('SELECT 1');
        winston_1.logger.info('✅ PostgreSQL connected successfully');
        return true;
    }
    catch (error) {
        winston_1.logger.error('❌ PostgreSQL connection failed:', error.message);
        return false;
    }
};
exports.testDatabaseConnection = testDatabaseConnection;
const closePool = async () => {
    await pool.end();
    winston_1.logger.info('📊 PostgreSQL pool closed');
};
exports.closePool = closePool;
const getPoolStats = () => {
    return {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
        active: pool.totalCount - pool.idleCount,
    };
};
exports.getPoolStats = getPoolStats;
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.transaction = transaction;
