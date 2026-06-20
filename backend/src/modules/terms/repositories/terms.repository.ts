import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';

export interface ITermsAndConditions {
  id: number;
  content: string;
  version: string;
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface IUserTermsAcceptance {
  user_id: number;
  terms_version: string;
  accepted_at: Date;
}

export class TermsRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async getActiveTerms(): Promise<ITermsAndConditions | null> {
    const { rows } = await this.pool.query(
      `SELECT id, content, version, is_active, created_by, created_at, updated_at
       FROM terms_and_conditions 
       WHERE is_active = true 
       ORDER BY created_at DESC 
       LIMIT 1`
    );
    return rows[0] || null;
  }

  async getAllVersions(page: number = 1, limit: number = 10): Promise<{ terms: ITermsAndConditions[]; total: number }> {
    const offset = (page - 1) * limit;

    const { rows } = await this.pool.query(
      `SELECT id, content, version, is_active, created_by, created_at, updated_at
       FROM terms_and_conditions 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const { rows: countRows } = await this.pool.query(
      'SELECT COUNT(*) as total FROM terms_and_conditions'
    );

    return {
      terms: rows,
      total: parseInt(countRows[0]?.total || '0'),
    };
  }

  async getLatestVersion(): Promise<string> {
    const { rows } = await this.pool.query(
      `SELECT version FROM terms_and_conditions 
       ORDER BY created_at DESC LIMIT 1`
    );
    
    if (rows.length === 0) {
      return '1.0';
    }
    
    return rows[0].version;
  }

  async create(content: string, adminId: number): Promise<ITermsAndConditions> {
    // دریافت آخرین نسخه و افزایش آن
    const latestVersion = await this.getLatestVersion();
    const versionParts = latestVersion.split('.');
    const major = parseInt(versionParts[0]) || 1;
    const minor = parseInt(versionParts[1]) || 0;
    const newVersion = `${major}.${minor + 1}`;

    // غیرفعال کردن نسخه قبلی فعال
    await this.pool.query(
      'UPDATE terms_and_conditions SET is_active = false WHERE is_active = true'
    );

    // ایجاد نسخه جدید
    const { rows } = await this.pool.query(
      `INSERT INTO terms_and_conditions (content, version, is_active, created_by, created_at, updated_at)
       VALUES ($1, $2, true, $3, NOW(), NOW())
       RETURNING id, content, version, is_active, created_by, created_at, updated_at`,
      [content, newVersion, adminId]
    );

    return rows[0];
  }

  async acceptTerms(userId: number, termsVersion: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_terms_acceptance (user_id, terms_version, accepted_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET terms_version = $2, accepted_at = NOW()`,
      [userId, termsVersion]
    );
  }

  async getUserAcceptance(userId: number): Promise<IUserTermsAcceptance | null> {
    const { rows } = await this.pool.query(
      `SELECT user_id, terms_version, accepted_at 
       FROM user_terms_acceptance 
       WHERE user_id = $1`,
      [userId]
    );
    return rows[0] || null;
  }

  async getAdminName(adminId: number): Promise<string> {
    const { rows } = await this.pool.query(
      `SELECT first_name, last_name FROM admins WHERE id = $1`,
      [adminId]
    );
    
    if (rows.length === 0) return 'سیستم';
    return `${rows[0].first_name || ''} ${rows[0].last_name || ''}`.trim() || 'ادمین';
  }
}

export const termsRepository = new TermsRepository();