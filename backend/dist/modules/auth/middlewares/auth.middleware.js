"use strict";
// backend/src/modules/auth/middlewares/auth.middleware.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateSession = void 0;
const session_service_1 = require("../services/session.service");
// لیست مسیرهای عمومی که نیاز به احراز هویت ندارند
const publicPaths = [
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/api/auth/check-session',
    '/api/auth/logout',
    '/api/support/terms',
    '/api/support/terms/',
    '/api/support/terms/public',
    '/api/support/terms/public/latest',
    '/api/support/terms/test',
    '/api/support/descriptions',
    '/health',
    '/health/ready',
    '/health/live',
    '/api/test',
    '/api/prices/products'
];
const authenticateSession = async (req, res, next) => {
    try {
        // بررسی مسیرهای عمومی
        const isPublicPath = publicPaths.some(path => {
            return req.path === path || req.path.startsWith(path);
        });
        if (isPublicPath) {
            return next();
        }
        const sessionToken = req.cookies?.session_token;
        if (!sessionToken) {
            return res.status(401).json({ error: 'لطفاً ابتدا وارد شوید', code: 'NO_SESSION' });
        }
        const sessionData = await session_service_1.sessionService.validateSession(sessionToken);
        if (!sessionData) {
            res.clearCookie('session_token', { path: '/', httpOnly: true });
            return res.status(401).json({ error: 'نشست معتبر نیست', code: 'INVALID_SESSION' });
        }
        req.user = {
            id: sessionData.user.id,
            isAdmin: sessionData.user.isAdmin || false,
            code: sessionData.user.code,
            mobile_number: sessionData.user.mobile_number,
            first_name: sessionData.user.first_name,
            last_name: sessionData.user.last_name,
        };
        next();
    }
    catch (err) {
        console.error('Session auth error:', err);
        res.status(500).json({ error: 'خطای سرور' });
    }
};
exports.authenticateSession = authenticateSession;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'لطفاً ابتدا وارد شوید' });
    }
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
