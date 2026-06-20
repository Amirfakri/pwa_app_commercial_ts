import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';
import { backupRepository } from '../repositories/backup.repository';
import { IBackupFilters } from '../types/backup.types';
import { formatPersianDate } from '../utils/dateFormatter';

export class BackupService {
  private pool: Pool;
  private backupDir: string;

  constructor() {
    this.pool = pool;
    this.backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async generateSqlBackup(
    filters: IBackupFilters,
    adminId: number
  ): Promise<{ filePath: string; fileName: string; totalRecords: number }> {
    const { start_date, end_date, tables } = filters;
    let totalRecords = 0;
    const backupData: string[] = [];

    backupData.push('-- ============================================');
    backupData.push('-- PWA Gold System Database Backup');
    backupData.push(`-- Generated: ${formatPersianDate(new Date())}`);
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
    const filePath = path.join(this.backupDir, fileName);
    
    fs.writeFileSync(filePath, backupData.join('\n'), 'utf8');

    await backupRepository.createBackupLog(adminId, tables, totalRecords, fileName);

    return { filePath, fileName, totalRecords };
  }

  private async exportTableData(
    tableName: string,
    startDate: string,
    endDate: string
  ): Promise<{ sql: string; count: number }> {
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

    const insertStatements: string[] = [];
    for (const row of result.rows) {
      const columns = Object.keys(row);
      const values = columns.map(col => this.escapeSqlValue(row[col]));
      const insertSql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
      insertStatements.push(insertSql);
    }

    return { sql: insertStatements.join('\n'), count: result.rows.length };
  }

  private escapeSqlValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value.toString();
    if (value instanceof Date) return `'${value.toISOString()}'`;
    if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  async getBackupHistory(page: number, limit: number): Promise<{ logs: any[]; total: number }> {
    const result = await backupRepository.getBackupHistory(page, limit);
    
    const logsWithAdmin = await Promise.all(
      result.logs.map(async (log) => {
        const adminName = await backupRepository.getAdminName(log.admin_id);
        return {
          ...log,
          admin_name: adminName,
          tables: Array.isArray(log.tables) ? log.tables : [log.tables],
          created_at_fa: formatPersianDate(log.created_at),
        };
      })
    );

    return { logs: logsWithAdmin, total: result.total };
  }

  async cleanupOldBackups(days: number): Promise<number> {
    const oldBackups = await backupRepository.getOldBackups(days);
    let deletedCount = 0;

    for (const backup of oldBackups) {
      const filePath = path.join(this.backupDir, backup.file_name);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await backupRepository.deleteBackupLog(backup.id);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting backup ${backup.file_name}:`, error);
      }
    }

    return deletedCount;
  }

  async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }
}

export const backupService = new BackupService();