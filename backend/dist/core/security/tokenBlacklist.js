"use strict";
// backend/src/core/security/tokenBlacklist.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenBlacklist = exports.TokenBlacklist = void 0;
const crypto_1 = __importDefault(require("crypto"));
const postgres_1 = require("../database/postgres");
const redis_1 = require("../database/redis");
const winston_1 = require("../logger/winston");
class TokenBlacklist {
    async addToBlacklist(token, userId, reason = 'logout', revokedBy) {
        const client = await postgres_1.pool.connect();
        try {
            const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            // Decode token to get expiration
            let expiresAt;
            try {
                const decoded = this.decodeToken(token);
                expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            }
            catch {
                expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            }
            await client.query('BEGIN');
            // Insert into database
            await client.query(`INSERT INTO token_blacklist (token_hash, user_id, token_type, reason, revoked_by, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (token_hash) DO NOTHING`, [tokenHash, userId, 'access', reason, revokedBy, expiresAt]);
            // Cache in Redis
            const ttl = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
            await (0, redis_1.redisSet)(`blacklist:${tokenHash}`, 'blocked', ttl);
            await client.query('COMMIT');
            winston_1.logger.info(`✅ Token added to blacklist: userId=${userId}, reason=${reason}`);
            return true;
        }
        catch (error) {
            await client.query('ROLLBACK');
            winston_1.logger.error('❌ Failed to add token to blacklist:', error);
            return false;
        }
        finally {
            client.release();
        }
    }
    async isTokenBlacklisted(token) {
        try {
            const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            const cacheKey = `blacklist:${tokenHash}`;
            // Check Redis first
            const cached = await (0, redis_1.redisGet)(cacheKey);
            if (cached !== null) {
                return cached === 'blocked';
            }
            // Check database
            const result = await (0, postgres_1.query)('SELECT id FROM token_blacklist WHERE token_hash = $1 AND expires_at > NOW() LIMIT 1', [tokenHash]);
            const isBlocked = result.rows.length > 0;
            // Cache result (5 minutes)
            await (0, redis_1.redisSet)(cacheKey, isBlocked ? 'blocked' : 'valid', 300);
            return isBlocked;
        }
        catch (error) {
            winston_1.logger.error('❌ Error checking token blacklist:', error);
            return false; // fail-open strategy
        }
    }
    async revokeAllUserTokens(userId, reason = 'admin_revoked', revokedBy) {
        const result = await (0, postgres_1.query)(`UPDATE user_tokens 
       SET is_revoked = true, revoked_at = NOW(), revoked_by = $1, revocation_reason = $2
       WHERE user_id = $3 AND is_revoked = false
       RETURNING token`, [revokedBy, reason, userId]);
        // Add each token to blacklist
        for (const row of result.rows) {
            if (row.token) {
                await this.addToBlacklist(row.token, userId, reason, revokedBy);
            }
        }
        winston_1.logger.info(`✅ Revoked ${result.rowCount} tokens for user ${userId}`);
        return result.rowCount || 0;
    }
    async cleanupExpiredTokens() {
        const result = await (0, postgres_1.query)('DELETE FROM token_blacklist WHERE expires_at < NOW() RETURNING id');
        if (result.rowCount && result.rowCount > 0) {
            winston_1.logger.info(`🧹 Cleaned up ${result.rowCount} expired tokens from blacklist`);
        }
        return result.rowCount || 0;
    }
    decodeToken(token) {
        const parts = token.split('.');
        if (parts.length !== 3)
            throw new Error('Invalid token format');
        const payload = parts[1];
        const decoded = Buffer.from(payload, 'base64').toString();
        return JSON.parse(decoded);
    }
}
exports.TokenBlacklist = TokenBlacklist;
exports.tokenBlacklist = new TokenBlacklist();
