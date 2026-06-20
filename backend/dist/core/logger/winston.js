"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDebug = exports.logWarn = exports.logError = exports.logInfo = exports.stream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const index_1 = __importDefault(require("../config/index"));
// ✅ بررسی وجود config و مقدار پیش‌فرض
const logConfig = index_1.default?.log || { level: 'info', filePath: 'logs/app.log' };
const logFilePath = logConfig.filePath || 'logs/app.log';
const logDir = path_1.default.dirname(logFilePath);
// ✅ ایجاد دایرکتوری لاگ با هندل خطا
try {
    if (!fs_1.default.existsSync(logDir)) {
        fs_1.default.mkdirSync(logDir, { recursive: true });
    }
}
catch (error) {
    console.error(`Failed to create log directory: ${logDir}`, error);
}
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0 && meta.stack !== undefined) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
const jsonFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// ✅ ایجاد transporterها فقط اگر دایرکتوری ساخته شده باشد
const transports = [];
// اضافه کردن فایل لاگ فقط در محیط production یا اگر دایرکتوری ساخته شده
if (index_1.default?.nodeEnv === 'production' && fs_1.default.existsSync(logDir)) {
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
    }), new winston_1.default.transports.File({
        filename: logFilePath,
        maxsize: 10485760,
        maxFiles: 5,
    }));
}
exports.logger = winston_1.default.createLogger({
    level: logConfig.level,
    format: jsonFormat,
    defaultMeta: { service: 'pwa-backend' },
    transports,
    exceptionHandlers: index_1.default?.nodeEnv === 'production' ? [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'exceptions.log'),
            maxsize: 10485760,
            maxFiles: 5,
        }),
    ] : [],
    rejectionHandlers: index_1.default?.nodeEnv === 'production' ? [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'rejections.log'),
            maxsize: 10485760,
            maxFiles: 5,
        }),
    ] : [],
});
// Add console transport in development (یا همیشه برای دیباگ)
if (index_1.default?.nodeEnv !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }));
}
// Create a stream object for Morgan
exports.stream = {
    write: (message) => {
        exports.logger.info(message.trim());
    },
};
// Helper functions for different log levels
const logInfo = (message, meta) => {
    exports.logger.info(message, meta);
};
exports.logInfo = logInfo;
const logError = (message, error, meta) => {
    if (error instanceof Error) {
        exports.logger.error(message, { error: error.message, stack: error.stack, ...meta });
    }
    else {
        exports.logger.error(message, { error, ...meta });
    }
};
exports.logError = logError;
const logWarn = (message, meta) => {
    exports.logger.warn(message, meta);
};
exports.logWarn = logWarn;
const logDebug = (message, meta) => {
    exports.logger.debug(message, meta);
};
exports.logDebug = logDebug;
exports.default = exports.logger;
