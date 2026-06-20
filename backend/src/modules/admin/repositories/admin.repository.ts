import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';

export interface IAdmin {
  id: number;
  mobile_number: string;
  first_name: string;
  last_name: string;
  is_main_admin: boolean;
  is_active: boolean;
  created_at: Date;
}

export class AdminRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async getAllAdmins(): Promise<IAdmin[]> {
    const { rows } = await this.pool.query(`
      SELECT id, mobile_number, first_name, last_name, is_main_admin, is_active, created_at
      FROM admins 
      ORDER BY created_at DESC
    `);
    return rows;
  }

  async getAdminById(id: number): Promise<IAdmin | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM admins WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async createAdmin(data: { mobile_number: string; first_name: string; last_name: string }): Promise<IAdmin> {
    const { rows } = await this.pool.query(
      `INSERT INTO admins (mobile_number, first_name, last_name, is_main_admin, is_active)
       VALUES ($1, $2, $3, FALSE, TRUE)
       RETURNING *`,
      [data.mobile_number, data.first_name, data.last_name]
    );
    return rows[0];
  }

  async updateAdmin(id: number, is_active: boolean): Promise<IAdmin | null> {
    const { rows } = await this.pool.query(
      `UPDATE admins SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [is_active, id]
    );
    return rows[0] || null;
  }

  async deleteAdmin(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM admins WHERE id = $1 AND is_main_admin = FALSE',
      [id]
    );
    return (rowCount || 0) > 0;
  }

  async isMainAdmin(id: number): Promise<boolean> {
    const { rows } = await this.pool.query(
      'SELECT is_main_admin FROM admins WHERE id = $1',
      [id]
    );
    return rows[0]?.is_main_admin === true;
  }
}

export const adminRepository = new AdminRepository();