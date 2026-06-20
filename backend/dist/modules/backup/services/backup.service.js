"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupService = exports.BackupService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const postgres_1 = require("../../../core/database/postgres");
const backup_repository_1 = require("../repositories/backup.repository");
const dateFormatter_1 = require("../utils/dateFormatter");
class BackupService {
    pool;
    backupDir;
    constructor() {
        this.pool = postgres_1.pool;
        this.backupDir = path_1.default.join(process.cwd(), 'backups');
        if (!fs_1.default.existsSync(this.backupDir)) {
            fs_1.default.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    async generateSqlBackup(filters, adminId) {
        const { start_date, end_date, tables } = filters;
        let totalRecords = 0;
        const backupData = [];
        backupData.push('-- ============================================');
        backupData.push('-- PWA Gold System Database Backup');
        backupData.push(`-- Generated: ${(0, dateFormatter_1.formatPersianDate)(new Date())}`);
        backupData.push(`-- Tables: ${tables.join(', ')}`);
        backupData.push(`-- Date Range: ${start_date} to ${end_date}`);
        backupData.push('-- ============================================\n');
        for (const table of tables) {
            const records = await this.exportTableData(table, start_date, end_date);
            totalRecords += records.count;
            if (records.sql.length > 0) {
                backupData.push(`-- ========== Table: ${table} (${records.count} records) ==========`);
                backupData.push(records.sql);
                backupData.push('');
            }
        }
        const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
        const filePath = path_1.default.join(this.backupDir, fileName);
        fs_1.default.writeFileSync(filePath, backupData.join('\n'), 'utf8');
        await backup_repository_1.backupRepository.createBackupLog(adminId, tables, totalRecords, fileName);
        return { filePath, fileName, totalRecords };
    }
    async exportTableData(tableName, startDate, endDate) {
        let query = '';
        let hasDateColumn = false;
        const dateColumns = ['created_at', 'updated_at', 'accepted_at', 'deleted_at'];
        for (const col of dateColumns) {
            const { rows } = await this.pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [tableName, col]);
            if (rows.length > 0) {
                hasDateColumn = true;
                query = `SELECT * FROM ${tableName} WHERE ${col}::date BETWEEN $1 AND $2 ORDER BY ${col}`;
                break;
            }
        }
        if (!hasDateColumn) {
            query = `SELECT * FROM ${tableName}`;
        }
        const result = await this.pool.query(query, hasDateColumn ? [startDate, endDate] : []);
        if (result.rows.length === 0) {
            return { sql: '', count: 0 };
        }
        const insertStatements = [];
        for (const row of result.rows) {
            const columns = Object.keys(row);
            const values = columns.map(col => this.escapeSqlValue(row[col]));
            const insertSql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
            insertStatements.push(insertSql);
        }
        return { sql: insertStatements.join('\n'), count: result.rows.length };
    }
    escapeSqlValue(value) {
        if (value === null || value === undefined)
            return 'NULL';
        if (typeof value === 'number')
            return value.toString();
        if (value instanceof Date)
            return `'${value.toISOString()}'`;
        if (typeof value === 'object')
            return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        return `'${String(value).replace(/'/g, "''")}'`;
    }
    async getBackupHistory(page, limit) {
        const result = await backup_repository_1.backupRepository.getBackupHistory(page, limit);
        const logsWithAdmin = await Promise.all(result.logs.map(async (log) => {
            const adminName = await backup_repository_1.backupRepository.getAdminName(log.admin_id);
            return {
                ...log,
                admin_name: adminName,
                tables: Array.isArray(log.tables) ? log.tables : [log.tables],
                created_at_fa: (0, dateFormatter_1.formatPersianDate)(log.created_at),
            };
        }));
        return { logs: logsWithAdmin, total: result.total };
    }
    async cleanupOldBackups(days) {
        const oldBackups = await backup_repository_1.backupRepository.getOldBackups(days);
        let deletedCount = 0;
        for (const backup of oldBackups) {
            const filePath = path_1.default.join(this.backupDir, backup.file_name);
            try {
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
                await backup_repository_1.backupRepository.deleteBackupLog(backup.id);
                deletedCount++;
            }
            catch (error) {
                console.error(`Error deleting backup ${backup.file_name}:`, error);
            }
        }
        return deletedCount;
    }
    async cleanupTempFile(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        catch (error) {
            console.error('Error cleaning up temp file:', error);
        }
    }
}
exports.BackupService = BackupService;
exports.backupService = new BackupService();
