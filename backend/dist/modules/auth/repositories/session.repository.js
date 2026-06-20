"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRepository = exports.SessionRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
const crypto_1 = __importDefault(require("crypto"));
class SessionRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    generateRefreshToken() {
        return crypto_1.default.randomBytes(64).toString('hex');
    }
    generateDeviceId() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    async create(data) {
        const refreshToken = this.generateRefreshToken();
        const deviceId = data.device_id || this.generateDeviceId();
        const { rows } = await this.pool.query(`INSERT INTO sessions (
        user_id, session_token, refresh_token, device_id, expires_at, ip_address, is_active, created_at, last_activity
      ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      RETURNING *`, [
            data.user_id,
            data.session_token,
            refreshToken,
            deviceId,
            data.expires_at,
            data.ip_address || null
        ]);
        return rows[0];
    }
    async findByToken(sessionToken) {
        const { rows } = await this.pool.query(`SELECT * FROM sessions WHERE session_token = $1 AND is_active = true AND expires_at > NOW()`, [sessionToken]);
        return rows[0] || null;
    }
    async updateExpiry(sessionId, newExpiry) {
        await this.pool.query(`UPDATE sessions SET expires_at = $1, last_activity = NOW() WHERE id = $2`, [newExpiry, sessionId]);
    }
    async revokeByToken(sessionToken) {
        await this.pool.query(`UPDATE sessions SET is_active = false WHERE session_token = $1`, [sessionToken]);
    }
    async revokeById(sessionId) {
        await this.pool.query(`UPDATE sessions SET is_active = false WHERE id = $1`, [sessionId]);
    }
    async revokeAllUserSessions(userId) {
        const { rowCount } = await this.pool.query(`UPDATE sessions SET is_active = false WHERE user_id = $1 AND is_active = true`, [userId]);
        return rowCount || 0;
    }
    async revokeAllUserSessionsExceptCurrent(userId, currentSessionId) {
        const { rowCount } = await this.pool.query(`UPDATE sessions SET is_active = false WHERE user_id = $1 AND is_active = true AND id != $2`, [userId, currentSessionId]);
        return rowCount || 0;
    }
    async getActiveSessionsCount(userId) {
        const { rows } = await this.pool.query(`SELECT COUNT(*) as count FROM sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > NOW()`, [userId]);
        return parseInt(rows[0].count);
    }
    async findByUserId(userId) {
        const { rows } = await this.pool.query(`SELECT * FROM sessions WHERE user_id = $1 AND is_active = true ORDER BY last_activity DESC`, [userId]);
        return rows;
    }
}
exports.SessionRepository = SessionRepository;
exports.sessionRepository = new SessionRepository();
