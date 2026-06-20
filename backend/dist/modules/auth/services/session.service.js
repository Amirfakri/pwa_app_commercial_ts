"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const session_repository_1 = require("../repositories/session.repository");
const user_repository_1 = require("../repositories/user.repository");
class SessionService {
    SESSION_DURATION_DAYS = 90;
    generateSecureToken() {
        return crypto_1.default.randomBytes(64).toString('hex');
    }
    getClientInfo(req) {
        const ip = req.ip ||
            req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.connection?.remoteAddress ||
            'unknown';
        return { ip };
    }
    async createSession(userId, req, isAdmin = false) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new Error('کاربر یافت نشد');
        }
        // بررسی محدودیت دستگاه (فقط برای کاربران عادی - غیر ادمین)
        if (!isAdmin && !user.is_admin) {
            const activeSessions = await session_repository_1.sessionRepository.getActiveSessionsCount(userId);
            const deviceLimit = user.device_limit || 1;
            if (activeSessions >= deviceLimit) {
                throw new Error(`محدودیت تعداد دستگاه‌ها (${deviceLimit}) پر شده است. لطفاً از دستگاه دیگر خارج شوید.`);
            }
        }
        const sessionToken = this.generateSecureToken();
        const expiresAt = new Date(Date.now() + this.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
        const { ip } = this.getClientInfo(req);
        await session_repository_1.sessionRepository.create({
            user_id: userId,
            session_token: sessionToken,
            expires_at: expiresAt,
            ip_address: ip
        });
        return sessionToken;
    }
    async validateSession(sessionToken) {
        const session = await session_repository_1.sessionRepository.findByToken(sessionToken);
        if (!session) {
            return null;
        }
        if (new Date(session.expires_at) < new Date()) {
            return null;
        }
        const user = await user_repository_1.userRepository.findById(session.user_id);
        if (!user || user.is_blocked) {
            return null;
        }
        return {
            user: {
                id: user.id,
                mobile_number: user.mobile_number,
                full_name: user.full_name,
                code: user.code,
                isAdmin: user.is_admin || false
            },
            session: {
                id: session.id,
                expires_at: session.expires_at,
                ip_address: session.ip_address,
                last_activity: session.last_activity
            }
        };
    }
    async refreshSession(sessionToken) {
        const session = await session_repository_1.sessionRepository.findByToken(sessionToken);
        if (!session)
            return null;
        const newExpiry = new Date(Date.now() + this.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
        await session_repository_1.sessionRepository.updateExpiry(session.id, newExpiry);
        return sessionToken;
    }
    async revokeSession(sessionToken) {
        await session_repository_1.sessionRepository.revokeByToken(sessionToken);
    }
    async revokeSessionById(sessionId) {
        await session_repository_1.sessionRepository.revokeById(sessionId);
    }
    async revokeAllUserSessions(userId) {
        return session_repository_1.sessionRepository.revokeAllUserSessions(userId);
    }
    async revokeAllUserSessionsExceptCurrent(userId, currentSessionToken) {
        const currentSession = await session_repository_1.sessionRepository.findByToken(currentSessionToken);
        if (!currentSession)
            return 0;
        const { rowCount } = await session_repository_1.sessionRepository['pool'].query(`UPDATE sessions SET is_active = false 
       WHERE user_id = $1 AND is_active = true AND id != $2`, [userId, currentSession.id]);
        return rowCount || 0;
    }
    async getUserSessions(userId) {
        const sessions = await session_repository_1.sessionRepository.findByUserId(userId);
        return sessions;
    }
    getSessionDurationDays() {
        return this.SESSION_DURATION_DAYS;
    }
}
exports.SessionService = SessionService;
exports.sessionService = new SessionService();
