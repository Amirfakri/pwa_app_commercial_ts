// backend/src/core/security/tokenBlacklist.ts

import crypto from 'crypto';
import { pool, query } from '../database/postgres';
import { redis, redisSet, redisGet } from '../database/redis';
import { logger } from '../logger/winston';

export class TokenBlacklist {
  async addToBlacklist(
    token: string,
    userId: number,
    reason: string = 'logout',
    revokedBy?: number | null
  ): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Decode token to get expiration
      let expiresAt: Date;
      try {
        const decoded = this.decodeToken(token);
        expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } catch {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      await client.query('BEGIN');

      // Insert into database
      await client.query(
        `INSERT INTO token_blacklist (token_hash, user_id, token_type, reason, revoked_by, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (token_hash) DO NOTHING`,
        [tokenHash, userId, 'access', reason, revokedBy, expiresAt]
      );

      // Cache in Redis
      const ttl = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      await redisSet(`blacklist:${tokenHash}`, 'blocked', ttl);

      await client.query('COMMIT');
      
      logger.info(`✅ Token added to blacklist: userId=${userId}, reason=${reason}`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('❌ Failed to add token to blacklist:', error);
      return false;
    } finally {
      client.release();
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const cacheKey = `blacklist:${tokenHash}`;
      
      // Check Redis first
      const cached = await redisGet<string>(cacheKey);
      if (cached !== null) {
        return cached === 'blocked';
      }

      // Check database
      const result = await query(
        'SELECT id FROM token_blacklist WHERE token_hash = $1 AND expires_at > NOW() LIMIT 1',
        [tokenHash]
      );

      const isBlocked = result.rows.length > 0;
      
      // Cache result (5 minutes)
      await redisSet(cacheKey, isBlocked ? 'blocked' : 'valid', 300);
      
      return isBlocked;
    } catch (error) {
      logger.error('❌ Error checking token blacklist:', error);
      return false; // fail-open strategy
    }
  }

  async revokeAllUserTokens(userId: number, reason: string = 'admin_revoked', revokedBy?: number): Promise<number> {
    const result = await query(
      `UPDATE user_tokens 
       SET is_revoked = true, revoked_at = NOW(), revoked_by = $1, revocation_reason = $2
       WHERE user_id = $3 AND is_revoked = false
       RETURNING token`,
      [revokedBy, reason, userId]
    );

    // Add each token to blacklist
    for (const row of result.rows) {
      if (row.token) {
        await this.addToBlacklist(row.token, userId, reason, revokedBy);
      }
    }

    logger.info(`✅ Revoked ${result.rowCount} tokens for user ${userId}`);
    return result.rowCount || 0;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await query(
      'DELETE FROM token_blacklist WHERE expires_at < NOW() RETURNING id'
    );
    
    if (result.rowCount && result.rowCount > 0) {
      logger.info(`🧹 Cleaned up ${result.rowCount} expired tokens from blacklist`);
    }
    
    return result.rowCount || 0;
  }

  private decodeToken(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString();
    return JSON.parse(decoded);
  }
}

export const tokenBlacklist = new TokenBlacklist();