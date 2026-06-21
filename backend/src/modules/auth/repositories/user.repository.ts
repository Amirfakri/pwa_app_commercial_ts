// backend/src/modules/auth/repositories/user.repository.ts

import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';

export interface IUser {
  id: number;
  mobile_number: string;
  first_name: string | null;
  last_name: string | null;
  code: string;
  is_blocked: boolean;
  is_admin: boolean;
  device_limit: number;
  melted_price_offset: number;
  coin_price_offset: number;
  created_at: Date;
  updated_at: Date;
}

export interface IUserRegistration {
  id: number;
  mobile_number: string;
  first_name: string;
  last_name: string;
  national_code: string;
  status: string;
  created_at: Date;
}

export class UserRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // ==================== متد کمکی برای ساخت full_name ====================
  
  private buildFullName(user: any): string {
    if (!user) return 'کاربر';
    
    if (user.full_name && user.full_name.trim()) {
      return user.full_name.trim();
    }
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (fullName) {
      return fullName;
    }
    
    if (user.mobile_number) {
      return user.mobile_number;
    }
    
    if (user.code) {
      return user.code;
    }
    
    return 'کاربر';
  }

  // ==================== متدهای اصلی ====================

  async findAll(filters: { 
    search?: string; 
    is_blocked?: boolean; 
    page?: number; 
    limit?: number 
  }): Promise<{ users: IUser[]; total: number }> {
    const { search, is_blocked, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, mobile_number, first_name, last_name, code, is_blocked, is_admin,
             device_limit, melted_price_offset, coin_price_offset, created_at, updated_at
      FROM users WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (mobile_number ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} 
                OR last_name ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (is_blocked !== undefined) {
      query += ` AND is_blocked = $${paramIndex}`;
      params.push(is_blocked);
      paramIndex++;
    }

    query += ` AND is_admin = false`;

    const countQuery = query.replace(
      'SELECT id, mobile_number, first_name, last_name, code, is_blocked, is_admin, device_limit, melted_price_offset, coin_price_offset, created_at, updated_at',
      'SELECT COUNT(*) as total'
    );
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [dataResult, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, params.length - 2))
    ]);

    return {
      users: dataResult.rows,
      total: parseInt(countResult.rows[0]?.total || '0')
    };
  }

  async findById(id: number): Promise<IUser | null> {
    const { rows } = await this.pool.query(
      `SELECT id, mobile_number, first_name, last_name, code, is_blocked, is_admin,
              device_limit, melted_price_offset, coin_price_offset, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByIdWithFullName(id: number): Promise<any | null> {
    const user = await this.findById(id);
    if (!user) return null;
    return {
      ...user,
      full_name: this.buildFullName(user)
    };
  }

  async findByMobile(mobile_number: string): Promise<IUser | null> {
    const { rows } = await this.pool.query(
      `SELECT id, mobile_number, first_name, last_name, code, is_blocked, is_admin,
              device_limit, melted_price_offset, coin_price_offset, created_at, updated_at
       FROM users WHERE mobile_number = $1`,
      [mobile_number]
    );
    return rows[0] || null;
  }

  async findByMobileWithFullName(mobile_number: string): Promise<any | null> {
    const user = await this.findByMobile(mobile_number);
    if (!user) return null;
    return {
      ...user,
      full_name: this.buildFullName(user)
    };
  }

  // ==================== متدهای مدیریت کد کاربر ====================

  async findByCode(code: string): Promise<IUser | null> {
    const { rows } = await this.pool.query(
      `SELECT id, mobile_number, first_name, last_name, code, is_blocked, is_admin,
              device_limit, melted_price_offset, coin_price_offset, created_at, updated_at
       FROM users WHERE code = $1`,
      [code]
    );
    return rows[0] || null;
  }

  async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (exists && attempts < maxAttempts) {
      const random = Math.floor(1000 + Math.random() * 9000);
      code = `USER${random}`;
      const existing = await this.findByCode(code);
      if (!existing) {
        exists = false;
        return code;
      }
      attempts++;
    }
    
    const timestamp = Date.now().toString().slice(-6);
    return `USER${timestamp}`;
  }

  // ==================== متدهای ایجاد و به‌روزرسانی ====================

  async create(data: { 
    mobile_number: string; 
    first_name: string; 
    last_name: string; 
    code: string;
    is_admin?: boolean;
  }): Promise<IUser> {
    const { rows } = await this.pool.query(
      `INSERT INTO users (mobile_number, first_name, last_name, code, is_admin, device_limit, melted_price_offset, coin_price_offset)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, mobile_number, first_name, last_name, code, is_blocked, is_admin,
                 device_limit, melted_price_offset, coin_price_offset, created_at, updated_at`,
      [data.mobile_number, data.first_name, data.last_name, data.code, data.is_admin || false, 1, 0, 0]
    );
    return rows[0];
  }

  async update(id: number, data: any): Promise<IUser | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.code !== undefined) {
      updates.push(`code = $${paramIndex++}`);
      values.push(data.code);
    }
    if (data.first_name !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(data.first_name);
    }
    if (data.last_name !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(data.last_name);
    }
    if (data.mobile_number !== undefined) {
      updates.push(`mobile_number = $${paramIndex++}`);
      values.push(data.mobile_number);
    }
    if (data.device_limit !== undefined) {
      updates.push(`device_limit = $${paramIndex++}`);
      values.push(data.device_limit);
    }
    if (data.melted_price_offset !== undefined) {
      updates.push(`melted_price_offset = $${paramIndex++}`);
      values.push(data.melted_price_offset);
    }
    if (data.coin_price_offset !== undefined) {
      updates.push(`coin_price_offset = $${paramIndex++}`);
      values.push(data.coin_price_offset);
    }
    if (data.is_blocked !== undefined) {
      updates.push(`is_blocked = $${paramIndex++}`);
      values.push(data.is_blocked);
    }
    if (data.is_admin !== undefined) {
      updates.push(`is_admin = $${paramIndex++}`);
      values.push(data.is_admin);
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, mobile_number, first_name, last_name, code, is_blocked, is_admin,
                 device_limit, melted_price_offset, coin_price_offset, created_at, updated_at`,
      values
    );
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM users WHERE id = $1 AND is_admin = false',
      [id]
    );
    return (rowCount || 0) > 0;
  }

  async block(id: number, blocked: boolean): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2 AND is_admin = false',
      [blocked, id]
    );
    return (rowCount || 0) > 0;
  }

  // ==================== متدهای مدیریت ثبت‌نام ====================

  async getPendingRegistrations(): Promise<IUserRegistration[]> {
    const { rows } = await this.pool.query(`
      SELECT id, mobile_number, first_name, last_name, national_code, status, created_at
      FROM user_registrations 
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `);
    return rows;
  }

  async approveRegistration(registrationId: number, adminId: number): Promise<IUserRegistration | null> {
    const { rows } = await this.pool.query(
      `UPDATE user_registrations 
       SET status = 'approved', approved_by = $1, approved_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING id, mobile_number, first_name, last_name, national_code, status, created_at`,
      [adminId, registrationId]
    );
    return rows[0] || null;
  }

  async rejectRegistration(registrationId: number, adminId: number): Promise<IUserRegistration | null> {
    const { rows } = await this.pool.query(
      `UPDATE user_registrations 
       SET status = 'rejected', approved_by = $1, approved_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING id, mobile_number, first_name, last_name, national_code, status, created_at`,
      [adminId, registrationId]
    );
    return rows[0] || null;
  }

  async createUserFromRegistration(registration: IUserRegistration): Promise<IUser> {
    const userCode = await this.generateUniqueCode();
    const { rows } = await this.pool.query(
      `INSERT INTO users (mobile_number, first_name, last_name, code, device_limit, melted_price_offset, coin_price_offset)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, mobile_number, first_name, last_name, code, is_blocked, is_admin,
                 device_limit, melted_price_offset, coin_price_offset, created_at, updated_at`,
      [registration.mobile_number, registration.first_name, registration.last_name, userCode, 1, 0, 0]
    );
    return rows[0];
  }

  // ==================== متدهای کمکی ====================

  async countUsers(): Promise<number> {
    const { rows } = await this.pool.query(
      'SELECT COUNT(*) as total FROM users WHERE is_admin = false'
    );
    return parseInt(rows[0]?.total || '0');
  }

  async countBlockedUsers(): Promise<number> {
    const { rows } = await this.pool.query(
      'SELECT COUNT(*) as total FROM users WHERE is_blocked = true AND is_admin = false'
    );
    return parseInt(rows[0]?.total || '0');
  }

  async findByMobileOrCode(search: string): Promise<IUser[]> {
    const { rows } = await this.pool.query(
      `SELECT id, mobile_number, first_name, last_name, code, is_blocked, is_admin,
              device_limit, melted_price_offset, coin_price_offset, created_at, updated_at
       FROM users 
       WHERE (mobile_number ILIKE $1 OR code ILIKE $1) AND is_admin = false
       ORDER BY created_at DESC
       LIMIT 20`,
      [`%${search}%`]
    );
    return rows;
  }

  async updateOffsets(id: number, meltedOffset: number, coinOffset: number): Promise<IUser | null> {
    const { rows } = await this.pool.query(
      `UPDATE users 
       SET melted_price_offset = $1, coin_price_offset = $2, updated_at = NOW()
       WHERE id = $3 AND is_admin = false
       RETURNING id, mobile_number, first_name, last_name, code, is_blocked, is_admin,
                 device_limit, melted_price_offset, coin_price_offset, created_at, updated_at`,
      [meltedOffset, coinOffset, id]
    );
    return rows[0] || null;
  }
}

export const userRepository = new UserRepository();