import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';
import { IBackupLog } from '../types/backup.types';

export class BackupRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async createBackupLog(
    adminId: number,
    tables: string[],
    recordCount: number,
    fileName: string
  ): Promise<IBackupLog> {
    const { rows } = await this.pool.query(
      `INSERT INTO backup_logs (admin_id, tables, record_count, file_name, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, admin_id, tables, record_count, file_name, created_at`,
      [adminId, tables, recordCount, fileName]
    );
    return rows[0];
  }

  async getBackupHistory(
    page: number,
    limit: number
  ): Promise<{ logs: IBackupLog[]; total: number }> {
    const offset = (page - 1) * limit;

    const { rows } = await this.pool.query(
      `SELECT id, admin_id, tables, record_count, file_name, created_at
       FROM backup_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const { rows: countRows } = await this.pool.query(
      'SELECT COUNT(*) as total FROM backup_logs'
    );

    return {
      logs: rows,
      total: parseInt(countRows[0]?.total || '0'),
    };
  }

  async getAdminName(adminId: number): Promise<string> {
    const { rows } = await this.pool.query(
      `SELECT first_name, last_name FROM admins WHERE id = $1`,
      [adminId]
    );
    if (rows.length > 0) {
      return `${rows[0].first_name || ''} ${rows[0].last_name || ''}`.trim() || 'ادمین';
    }
    return 'سیستم';
  }

  async getOldBackups(days: number): Promise<{ id: number; file_name: string }[]> {
    const { rows } = await this.pool.query(
      `SELECT id, file_name FROM backup_logs 
       WHERE created_at < NOW() - INTERVAL '${days} days'`
    );
    return rows;
  }

  async deleteBackupLog(id: number): Promise<void> {
    await this.pool.query('DELETE FROM backup_logs WHERE id = $1', [id]);
  }
}

export const backupRepository = new BackupRepository();