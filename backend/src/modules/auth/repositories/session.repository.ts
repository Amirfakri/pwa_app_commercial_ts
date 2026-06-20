
import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';
import crypto from 'crypto';

export interface ISession {
  id: number;
  user_id: number;
  session_token: string;
  refresh_token: string | null;
  device_id: string | null;
  expires_at: Date;
  ip_address: string | null;
  is_active: boolean;
  created_at: Date;
  last_activity: Date;
}

export interface ICreateSessionInput {
  user_id: number;
  session_token: string;
  expires_at: Date;
  ip_address?: string;
  device_id?: string;
  is_admin?: boolean;
}

export class SessionRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  generateDeviceId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async create(data: ICreateSessionInput): Promise<ISession> {
    const refreshToken = this.generateRefreshToken();
    const deviceId = data.device_id || this.generateDeviceId();
    
    const { rows } = await this.pool.query(
      `INSERT INTO sessions (
        user_id, session_token, refresh_token, device_id, expires_at, ip_address, is_active, created_at, last_activity
      ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      RETURNING *`,
      [
        data.user_id,
        data.session_token,
        refreshToken,
        deviceId,
        data.expires_at,
        data.ip_address || null
      ]
    );
    return rows[0];
  }

  async findByToken(sessionToken: string): Promise<ISession | null> {
    const { rows } = await this.pool.query(
      `SELECT * FROM sessions WHERE session_token = $1 AND is_active = true AND expires_at > NOW()`,
      [sessionToken]
    );
    return rows[0] || null;
  }

  async updateExpiry(sessionId: number, newExpiry: Date): Promise<void> {
    await this.pool.query(
      `UPDATE sessions SET expires_at = $1, last_activity = NOW() WHERE id = $2`,
      [newExpiry, sessionId]
    );
  }

  async revokeByToken(sessionToken: string): Promise<void> {
    await this.pool.query(`UPDATE sessions SET is_active = false WHERE session_token = $1`, [sessionToken]);
  }

  async revokeById(sessionId: number): Promise<void> {
    await this.pool.query(`UPDATE sessions SET is_active = false WHERE id = $1`, [sessionId]);
  }

  async revokeAllUserSessions(userId: number): Promise<number> {
    const { rowCount } = await this.pool.query(
      `UPDATE sessions SET is_active = false WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    return rowCount || 0;
  }

  async revokeAllUserSessionsExceptCurrent(userId: number, currentSessionId: number): Promise<number> {
    const { rowCount } = await this.pool.query(
      `UPDATE sessions SET is_active = false WHERE user_id = $1 AND is_active = true AND id != $2`,
      [userId, currentSessionId]
    );
    return rowCount || 0;
  }



  async getActiveSessionsCount(userId: number): Promise<number> {
    const { rows } = await this.pool.query(
      `SELECT COUNT(*) as count FROM sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > NOW()`,
      [userId]
    );
    return parseInt(rows[0].count);
  }

  async findByUserId(userId: number): Promise<ISession[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM sessions WHERE user_id = $1 AND is_active = true ORDER BY last_activity DESC`,
      [userId]
    );
    return rows;
  }
}

export const sessionRepository = new SessionRepository();
