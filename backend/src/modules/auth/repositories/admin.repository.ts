
import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';

export interface IAdmin {
  id: number;
  mobile_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_main_admin: boolean;
  is_active: boolean;
  created_at: Date;
}

export class AdminRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async findAll(): Promise<IAdmin[]> {
    // از جدول users فقط ادمین‌ها را برمی‌گرداند
    const { rows } = await this.pool.query(
      `SELECT id, mobile_number, first_name, last_name, is_admin as is_main_admin, 
              NOT is_blocked as is_active, created_at
       FROM users WHERE is_admin = true ORDER BY created_at DESC`
    );
    return rows.map((admin: any) => ({
      ...admin,
      full_name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'ادمین',
      is_main_admin: admin.is_main_admin || false,
      is_active: admin.is_active !== false
    }));
  }

  async findById(id: number): Promise<IAdmin | null> {
    const { rows } = await this.pool.query(
      `SELECT id, mobile_number, first_name, last_name, is_admin as is_main_admin, 
              NOT is_blocked as is_active, created_at
       FROM users WHERE id = $1 AND is_admin = true`,
      [id]
    );
    if (rows.length === 0) return null;
    const admin = rows[0];
    admin.full_name = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'ادمین';
    admin.is_main_admin = admin.is_main_admin || false;
    return admin;
  }

  async findByMobile(mobile: string): Promise<IAdmin | null> {
    const { rows } = await this.pool.query(
      `SELECT id, mobile_number, first_name, last_name, is_admin as is_main_admin, 
              NOT is_blocked as is_active, created_at
       FROM users WHERE mobile_number = $1 AND is_admin = true`,
      [mobile]
    );
    if (rows.length === 0) return null;
    const admin = rows[0];
    admin.full_name = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'ادمین';
    admin.is_main_admin = admin.is_main_admin || false;
    return admin;
  }

  async create(data: { mobile_number: string; first_name: string; last_name: string }): Promise<IAdmin> {
    // ایجاد کاربر جدید با is_admin = true
    const code = `ADMIN${Math.floor(1000 + Math.random() * 9000)}`;
    const { rows } = await this.pool.query(
      `INSERT INTO users (mobile_number, first_name, last_name, code, is_admin, device_limit)
       VALUES ($1, $2, $3, $4, true, $5)
       RETURNING id, mobile_number, first_name, last_name, is_admin as is_main_admin, 
                 false as is_blocked, created_at`,
      [data.mobile_number, data.first_name, data.last_name, code, 5]
    );
    const admin = rows[0];
    admin.full_name = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'ادمین';
    admin.is_active = true;
    admin.is_main_admin = false;
    return admin;
  }

  async update(id: number, is_active: boolean): Promise<IAdmin | null> {
    // فعال/غیرفعال کردن ادمین
    const { rows } = await this.pool.query(
      `UPDATE users SET is_blocked = $1, updated_at = NOW() 
       WHERE id = $2 AND is_admin = true RETURNING *`,
      [!is_active, id]
    );
    if (rows.length === 0) return null;
    const admin = rows[0];
    admin.full_name = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'ادمین';
    admin.is_main_admin = admin.is_admin;
    admin.is_active = !admin.is_blocked;
    return admin;
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM users WHERE id = $1 AND is_admin = true AND is_admin = false',
      [id]
    );
    return (rowCount || 0) > 0;
  }

  async isMainAdmin(id: number): Promise<boolean> {
    const { rows } = await this.pool.query(
      'SELECT is_admin as is_main_admin FROM users WHERE id = $1 AND is_admin = true',
      [id]
    );
    return rows[0]?.is_main_admin === true;
  }
}

export const adminRepository = new AdminRepository();
