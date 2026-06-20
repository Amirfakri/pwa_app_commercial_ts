import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config/index';

// ✅ بررسی وجود config و مقدار پیش‌فرض
const logConfig = config?.log || { level: 'info', filePath: 'logs/app.log' };
const logFilePath = logConfig.filePath || 'logs/app.log';
const logDir = path.dirname(logFilePath);

// ✅ ایجاد دایرکتوری لاگ با هندل خطا
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (error) {
  console.error(`Failed to create log directory: ${logDir}`, error);
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0 && meta.stack !== undefined) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ✅ ایجاد transporterها فقط اگر دایرکتوری ساخته شده باشد
const transports: winston.transport[] = [];

// اضافه کردن فایل لاگ فقط در محیط production یا اگر دایرکتوری ساخته شده
if (config?.nodeEnv === 'production' && fs.existsSync(logDir)) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: logFilePath,
      maxsize: 10485760,
      maxFiles: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: logConfig.level,
  format: jsonFormat,
  defaultMeta: { service: 'pwa-backend' },
  transports,
  exceptionHandlers: config?.nodeEnv === 'production' ? [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ] : [],
  rejectionHandlers: config?.nodeEnv === 'production' ? [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ] : [],
});

// Add console transport in development (یا همیشه برای دیباگ)
if (config?.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Create a stream object for Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper functions for different log levels
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any, meta?: any) => {
  if (error instanceof Error) {
    logger.error(message, { error: error.message, stack: error.stack, ...meta });
  } else {
    logger.error(message, { error, ...meta });
  }
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export default logger;