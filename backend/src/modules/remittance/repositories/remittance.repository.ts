import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';

export interface IRemittance {
  id: number;
  user_id: number;
  type: 'وزنی' | 'ریالی' | 'سکه';
  weight: number | null;
  amount: number | null;
  coin_count: number | null;
  recipient: string;
  description: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface IRemittanceWithUser extends IRemittance {
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  code?: string;
}

export interface ICreateRemittanceInput {
  user_id: number;
  type: 'وزنی' | 'ریالی' | 'سکه';
  weight?: number;
  amount?: number;
  coin_count?: number;
  recipient: string;
  description?: string;
  status?: string;
}

export class RemittanceRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async create(data: ICreateRemittanceInput): Promise<IRemittance> {
    const { rows } = await this.pool.query(
      `INSERT INTO remittances (
        user_id, type, weight, amount, coin_count, recipient, description, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [
        data.user_id,
        data.type,
        data.weight || null,
        data.amount || null,
        data.coin_count || null,
        data.recipient,
        data.description || null,
        data.status || 'در حال بررسی'
      ]
    );
    return rows[0];
  }

  async findByUserId(userId: number, limit: number = 100, offset: number = 0): Promise<IRemittance[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM remittances 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  }

  async countByUserId(userId: number): Promise<number> {
    const { rows } = await this.pool.query(
      `SELECT COUNT(*) as total FROM remittances WHERE user_id = $1`,
      [userId]
    );
    return parseInt(rows[0]?.total || '0');
  }

  async findAll(filters: { status?: string; page?: number; limit?: number; search?: string }): Promise<{ remittances: IRemittanceWithUser[]; total: number; stats: any }> {
    const { status, page = 1, limit = 50, search } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.first_name, u.last_name, u.mobile_number, u.code
      FROM remittances r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }

    if (search) {
      query += ` AND (u.first_name ILIKE $${paramIndex++} OR u.last_name ILIKE $${paramIndex++} OR u.code ILIKE $${paramIndex++} OR r.recipient ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const dataResult = await this.pool.query(query, params);
    
    // Get stats
    const stats = await this.getStats();
    
    // Count query
    let countQuery = `SELECT COUNT(*) as total FROM remittances r WHERE 1=1`;
    const countParams: any[] = [];
    let countIndex = 1;
    
    if (status) {
      countQuery += ` AND r.status = $${countIndex++}`;
      countParams.push(status);
    }
    
    if (search) {
      countQuery += ` AND r.user_id IN (SELECT id FROM users WHERE first_name ILIKE $${countIndex++} OR last_name ILIKE $${countIndex++} OR code ILIKE $${countIndex++})`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const countResult = await this.pool.query(countQuery, countParams);

    return {
      remittances: dataResult.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      stats
    };
  }

  async getStats(): Promise<any> {
    const { rows } = await this.pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'در حال بررسی' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'تأییدشده' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'ردشده' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'تحویل شده' THEN 1 END) as delivered,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today
      FROM remittances
    `);
    return rows[0];
  }

  async findById(id: number): Promise<IRemittance | null> {
    const { rows } = await this.pool.query(
      `SELECT * FROM remittances WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async updateStatus(id: number, status: string): Promise<IRemittance | null> {
    const { rows } = await this.pool.query(
      `UPDATE remittances 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    return rows[0] || null;
  }

  async getRecentPending(limit: number = 50): Promise<IRemittanceWithUser[]> {
    const { rows } = await this.pool.query(
      `SELECT r.*, u.first_name, u.last_name, u.mobile_number, u.code
       FROM remittances r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.status = 'در حال بررسی'
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }

  async getTodayRemittances(status?: string, page: number = 1, limit: number = 50): Promise<{ remittances: IRemittanceWithUser[]; total: number }> {
    const today = new Date().toISOString().split('T')[0];
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.first_name, u.last_name, u.mobile_number, u.code
      FROM remittances r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE DATE(r.created_at) = $1
    `;
    const params: any[] = [today];
    let paramIndex = 2;

    if (status) {
      query += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const dataResult = await this.pool.query(query, params);
    
    let countQuery = `SELECT COUNT(*) as total FROM remittances r WHERE DATE(r.created_at) = $1`;
    const countParams: any[] = [today];
    let countIndex = 2;
    
    if (status) {
      countQuery += ` AND r.status = $${countIndex++}`;
      countParams.push(status);
    }
    
    const countResult = await this.pool.query(countQuery, countParams);

    return {
      remittances: dataResult.rows,
      total: parseInt(countResult.rows[0]?.total || '0')
    };
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `DELETE FROM remittances WHERE id = $1`,
      [id]
    );
    return (rowCount || 0) > 0;
  }

  // متد جدید: دریافت اطلاعات کاربر
  async getUserInfo(userId: number): Promise<any | null> {
    const { rows } = await this.pool.query(
      `SELECT id, code, first_name, last_name, mobile_number 
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    return rows[0] || null;
  }

  // متد جدید: دریافت اطلاعات کاربر با کد
  async getUserByCode(userCode: string): Promise<any | null> {
    const { rows } = await this.pool.query(
      `SELECT id, code, first_name, last_name, mobile_number 
       FROM users 
       WHERE code = $1`,
      [userCode]
    );
    return rows[0] || null;
  }
}

export const remittanceRepository = new RemittanceRepository();