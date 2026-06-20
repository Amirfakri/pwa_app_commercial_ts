"use strict";
// backend/src/core/security/cors.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureCors = void 0;
const cors_1 = __importDefault(require("cors"));
const index_1 = __importDefault(require("../config/index"));
const winston_1 = require("../logger/winston");
const configureCors = (app) => {
    const corsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, etc.)
            if (!origin) {
                return callback(null, true);
            }
            // In development, allow all localhost origins
            if (index_1.default.nodeEnv === 'development') {
                if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
                    return callback(null, true);
                }
            }
            // Check against allowed origins
            if (index_1.default.security.corsOrigins.includes(origin)) {
                return callback(null, true);
            }
            winston_1.logger.warn(`🚫 CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
            'Origin',
            'X-Requested-With',
            'Cache-Control',
            'x-csrf-token',
            'x-session-token',
            'x-device-id',
            'x-user-id',
            'Expires',
            'Pragma',
        ],
        exposedHeaders: ['Set-Cookie', 'Content-Length', 'Authorization', 'X-Session-Expires', 'X-Device-Id'],
        optionsSuccessStatus: 204,
        preflightContinue: false,
        maxAge: 86400, // 24 hours
    };
    app.use((0, cors_1.default)(corsOptions));
    // Handle preflight requests explicitly
    app.options('*', (0, cors_1.default)(corsOptions));
    winston_1.logger.info('✅ CORS configured');
};
exports.configureCors = configureCors;
