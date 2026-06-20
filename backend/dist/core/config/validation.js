"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configValidationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.configValidationSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').required(),
    PORT: joi_1.default.number().default(3000),
    DB_HOST: joi_1.default.string().required(),
    DB_USER: joi_1.default.string().required(),
    DB_PASSWORD: joi_1.default.string().required(),
    DB_DATABASE: joi_1.default.string().required(),
    REDIS_HOST: joi_1.default.string().required(),
    JWT_SECRET: joi_1.default.string().min(32).required(),
    JWT_REFRESH_SECRET: joi_1.default.string().min(32).required(),
    CORS_ORIGIN: joi_1.default.string().optional(),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
}).unknown(true);
