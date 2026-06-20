"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiters = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.rateLimiters = {
    general: (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 100,
        message: 'Too many requests',
        standardHeaders: true,
        legacyHeaders: false,
    }),
    auth: (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 50,
        message: 'Too many auth requests',
    }),
    otp: (0, express_rate_limit_1.default)({
        windowMs: 10 * 60 * 1000,
        max: 10,
        message: 'Too many OTP requests',
    }),
    transactions: (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 100,
        message: 'Too many transaction requests',
    }),
    reports: (0, express_rate_limit_1.default)({
        windowMs: 5 * 60 * 1000,
        max: 20,
        message: 'Too many report requests',
    }),
    upload: (0, express_rate_limit_1.default)({
        windowMs: 10 * 60 * 1000,
        max: 10,
        message: 'Too many upload requests',
    }),
};
