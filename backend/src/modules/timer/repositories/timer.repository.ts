// backend/src/modules/timer/repositories/timer.repository.ts
import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';
import { ITimer, ICreateTimerInput, IUpdateTimerInput } from '../types/timer.types';

export class TimerRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async create(data: ICreateTimerInput): Promise<ITimer> {
    const expiresAt = new Date(Date.now() + data.remaining_seconds * 1000);
    
    const { rows } = await this.pool.query(
      `INSERT INTO timers (
        transaction_id, user_id, remaining_seconds, initial_seconds, 
        status, started_at, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW(), NOW())
      RETURNING *`,
      [
        data.transaction_id,
        data.user_id,
        data.remaining_seconds,
        data.initial_seconds,
        data.status || 'active',
        expiresAt
      ]
    );
    return rows[0];
  }

  async findByTransactionId(transactionId: number): Promise<ITimer | null> {
    const { rows } = await this.pool.query(
      `SELECT * FROM timers WHERE transaction_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [transactionId]
    );
    return rows[0] || null;
  }

  async findById(id: number): Promise<ITimer | null> {
    const { rows } = await this.pool.query(
      `SELECT * FROM timers WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByUserId(userId: number, limit: number = 100, offset: number = 0): Promise<ITimer[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM timers 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  }

  async getAllTimers(page: number = 1, limit: number = 50, status?: string): Promise<{ timers: ITimer[]; total: number }> {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT t.*, u.first_name, u.last_name, u.code as user_code
      FROM timers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await this.pool.query(query, params);
    
    let countQuery = `SELECT COUNT(*) as total FROM timers t WHERE 1=1`;
    const countParams: any[] = [];
    let countIndex = 1;
    
    if (status) {
      countQuery += ` AND t.status = $${countIndex++}`;
      countParams.push(status);
    }
    
    const countResult = await this.pool.query(countQuery, countParams);

    return {
      timers: rows,
      total: parseInt(countResult.rows[0]?.total || '0')
    };
  }

  async update(id: number, data: IUpdateTimerInput): Promise<ITimer | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.remaining_seconds !== undefined) {
      updates.push(`remaining_seconds = $${paramIndex++}`);
      values.push(data.remaining_seconds);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    
    updates.push(`updated_at = NOW()`);
    
    values.push(id);
    
    const { rows } = await this.pool.query(
      `UPDATE timers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async decrementRemainingSeconds(id: number, seconds: number = 1): Promise<ITimer | null> {
    const { rows } = await this.pool.query(
      `UPDATE timers 
       SET remaining_seconds = remaining_seconds - $1, updated_at = NOW()
       WHERE id = $2 AND status = 'active' AND remaining_seconds > 0
       RETURNING *`,
      [seconds, id]
    );
    return rows[0] || null;
  }

  async expireTimer(id: number): Promise<ITimer | null> {
    const { rows } = await this.pool.query(
      `UPDATE timers 
       SET status = 'expired', updated_at = NOW()
       WHERE id = $1 AND status = 'active'
       RETURNING *`,
      [id]
    );
    return rows[0] || null;
  }

  async getActiveTimers(): Promise<ITimer[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM timers 
       WHERE status = 'active' AND remaining_seconds > 0
       ORDER BY expires_at ASC`
    );
    return rows;
  }

  async getExpiredTimers(): Promise<ITimer[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM timers 
       WHERE status = 'expired' OR remaining_seconds <= 0
       ORDER BY created_at DESC`
    );
    return rows;
  }

  async getTotalCount(): Promise<number> {
    const { rows } = await this.pool.query(`SELECT COUNT(*) as total FROM timers`);
    return parseInt(rows[0]?.total || '0');
  }

  async getCountByUser(): Promise<any[]> {
    const { rows } = await this.pool.query(
      `SELECT user_id, COUNT(*) as count 
       FROM timers 
       GROUP BY user_id 
       ORDER BY count DESC 
       LIMIT 10`
    );
    return rows;
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(`DELETE FROM timers WHERE id = $1`, [id]);
    return (rowCount || 0) > 0;
  }

  async deleteByTransactionId(transactionId: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `DELETE FROM timers WHERE transaction_id = $1`,
      [transactionId]
    );
    return (rowCount || 0) > 0;
  }
}

export const timerRepository = new TimerRepository();