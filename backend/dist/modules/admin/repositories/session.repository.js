"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRepositoryForAdmin = exports.SessionRepositoryForAdmin = void 0;
const postgres_1 = require("../../../core/database/postgres");
class SessionRepositoryForAdmin {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async revokeAllUserSessions(userId) {
        const { rowCount } = await this.pool.query(`UPDATE sessions SET is_active = false WHERE user_id = $1 AND is_active = true`, [userId]);
        return rowCount || 0;
    }
    async getUserSessions(userId) {
        const { rows } = await this.pool.query(`SELECT id, user_id, session_token, device_id, ip_address, created_at, last_activity, expires_at
       FROM sessions WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`, [userId]);
        return rows;
    }
    async revokeSession(sessionId) {
        const { rowCount } = await this.pool.query(`UPDATE sessions SET is_active = false WHERE id = $1`, [sessionId]);
        return (rowCount || 0) > 0;
    }
}
exports.SessionRepositoryForAdmin = SessionRepositoryForAdmin;
exports.sessionRepositoryForAdmin = new SessionRepositoryForAdmin();
