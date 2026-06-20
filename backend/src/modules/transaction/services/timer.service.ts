// backend/src/modules/transaction/services/timer.service.ts

import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';
import { ITimer } from '../types/transaction.types';
import moment from 'moment-timezone';

export class TimerService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async getTimer(): Promise<number> {
    const { rows } = await this.pool.query('SELECT value FROM timer WHERE id = 1');
    if (rows.length === 0) {
      return 30; // default timer
    }
    return parseInt(rows[0].value, 10);
  }

  async updateTimer(value: number, adminId: number): Promise<ITimer> {
    const { rows } = await this.pool.query(
      `UPDATE timer SET value = $1, updated_at = NOW() WHERE id = 1 RETURNING *`,
      [value]
    );
    
    if (rows.length === 0) {
      const { rows: inserted } = await this.pool.query(
        `INSERT INTO timer (id, value, updated_at) VALUES (1, $1, NOW()) RETURNING *`,
        [value]
      );
      return inserted[0];
    }
    
    return rows[0];
  }

  calculateRemainingSeconds(createdAt: Date, timerSeconds: number): number {
    const now = moment().tz('Asia/Tehran');
    const created = moment(createdAt).tz('Asia/Tehran');
    const elapsed = now.diff(created, 'seconds');
    return Math.max(0, timerSeconds - elapsed);
  }

  getIranTimeString(): string {
    return moment().tz('Asia/Tehran').format('YYYY-MM-DD HH:mm:ss');
  }
}

export const timerService = new TimerService();