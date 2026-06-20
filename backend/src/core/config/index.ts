import dotenv from 'dotenv';
import path from 'path';

// بارگذاری env اولویت‌دار
dotenv.config();

// مقادیر پیش‌فرض برای جلوگیری از undefined
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  
  app: {
    name: process.env.APP_NAME || 'PWA_App',
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'pwa_app',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT || '5001', 10),
    path: process.env.WEBSOCKET_PATH || '/ws',
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs', 'app.log'),
    format: process.env.LOG_FORMAT || 'json',
  },
  
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  },
  
  security: {
    csrfEnabled: process.env.CSRF_ENABLED === 'true',
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
  },
  
  features: {
    enableWebsocket: process.env.ENABLE_WEBSOCKET !== 'false',
    enablePricePolling: process.env.ENABLE_PRICE_POLLING !== 'false',
  },
};

export default config;