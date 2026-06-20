"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupRepository = exports.BackupRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class BackupRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async createBackupLog(adminId, tables, recordCount, fileName) {
        const { rows } = await this.pool.query(`INSERT INTO backup_logs (admin_id, tables, record_count, file_name, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, admin_id, tables, record_count, file_name, created_at`, [adminId, tables, recordCount, fileName]);
        return rows[0];
    }
    async getBackupHistory(page, limit) {
        const offset = (page - 1) * limit;
        const { rows } = await this.pool.query(`SELECT id, admin_id, tables, record_count, file_name, created_at
       FROM backup_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`, [limit, offset]);
        const { rows: countRows } = await this.pool.query('SELECT COUNT(*) as total FROM backup_logs');
        return {
            logs: rows,
            total: parseInt(countRows[0]?.total || '0'),
        };
    }
    async getAdminName(adminId) {
        const { rows } = await this.pool.query(`SELECT first_name, last_name FROM admins WHERE id = $1`, [adminId]);
        if (rows.length > 0) {
            return `${rows[0].first_name || ''} ${rows[0].last_name || ''}`.trim() || 'ادمین';
        }
        return 'سیستم';
    }
    async getOldBackups(days) {
        const { rows } = await this.pool.query(`SELECT id, file_name FROM backup_logs 
       WHERE created_at < NOW() - INTERVAL '${days} days'`);
        return rows;
    }
    async deleteBackupLog(id) {
        await this.pool.query('DELETE FROM backup_logs WHERE id = $1', [id]);
    }
}
exports.BackupRepository = BackupRepository;
exports.backupRepository = new BackupRepository();
