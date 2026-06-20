"use strict";
// backend/src/core/middleware/requestLogger.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detailedRequestLogger = exports.requestLogger = void 0;
const morgan_1 = __importDefault(require("morgan"));
const winston_1 = require("../logger/winston");
const winston_2 = require("../logger/winston");
exports.requestLogger = (0, morgan_1.default)('combined', { stream: winston_1.stream });
// Detailed request logger for development
const detailedRequestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        winston_2.logger[logLevel](`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
    });
    next();
};
exports.detailedRequestLogger = detailedRequestLogger;
