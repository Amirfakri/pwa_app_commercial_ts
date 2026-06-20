
import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';

export class SessionRepositoryForAdmin {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async revokeAllUserSessions(userId: number): Promise<number> {
    const { rowCount } = await this.pool.query(
      `UPDATE sessions SET is_active = false WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    return rowCount || 0;
  }

  async getUserSessions(userId: number): Promise<any[]> {
    const { rows } = await this.pool.query(
      `SELECT id, user_id, session_token, device_id, ip_address, created_at, last_activity, expires_at
       FROM sessions WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  async revokeSession(sessionId: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `UPDATE sessions SET is_active = false WHERE id = $1`,
      [sessionId]
    );
    return (rowCount || 0) > 0;
  }
}

export const sessionRepositoryForAdmin = new SessionRepositoryForAdmin();
