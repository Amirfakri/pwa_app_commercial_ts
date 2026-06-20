"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateSession = void 0;
const session_service_1 = require("../services/session.service");
const authenticateSession = async (req, res, next) => {
    try {
        console.log('🔐 authenticateSession - START');
        console.log('🔐 authenticateSession - cookies:', req.cookies);
        const sessionToken = req.cookies?.session_token;
        console.log('🔐 authenticateSession - sessionToken:', sessionToken ? sessionToken.substring(0, 20) + '...' : 'MISSING');
        if (!sessionToken) {
            console.log('🔐 authenticateSession - NO SESSION TOKEN');
            return res.status(401).json({ error: 'لطفاً ابتدا وارد شوید', code: 'NO_SESSION' });
        }
        const sessionData = await session_service_1.sessionService.validateSession(sessionToken);
        console.log('🔐 authenticateSession - sessionData:', sessionData ? 'FOUND' : 'NOT FOUND');
        if (!sessionData) {
            console.log('🔐 authenticateSession - INVALID SESSION');
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
        console.log('🔐 authenticateSession - req.user set:', req.user);
        console.log('🔐 authenticateSession - SUCCESS');
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
