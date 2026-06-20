import { Pool } from 'pg';
import { logger } from '../logger/winston';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'khoda123@',
  database: process.env.DB_DATABASE || 'pwa-app1',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export { pool };

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    logger.warn(`⚠️ Slow query (${duration}ms): ${text.substring(0, 200)}`);
  }
  
  return result;
};

export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    logger.info('✅ PostgreSQL connected successfully');
    return true;
  } catch (error: any) {
    logger.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
};

export const closePool = async (): Promise<void> => {
  await pool.end();
  logger.info('📊 PostgreSQL pool closed');
};

export const getPoolStats = () => {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    active: pool.totalCount - pool.idleCount,
  };
};

export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};