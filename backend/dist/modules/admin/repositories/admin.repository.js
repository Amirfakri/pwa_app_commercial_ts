"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRepository = exports.AdminRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class AdminRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async getAllAdmins() {
        const { rows } = await this.pool.query(`
      SELECT id, mobile_number, first_name, last_name, is_main_admin, is_active, created_at
      FROM admins 
      ORDER BY created_at DESC
    `);
        return rows;
    }
    async getAdminById(id) {
        const { rows } = await this.pool.query('SELECT * FROM admins WHERE id = $1', [id]);
        return rows[0] || null;
    }
    async createAdmin(data) {
        const { rows } = await this.pool.query(`INSERT INTO admins (mobile_number, first_name, last_name, is_main_admin, is_active)
       VALUES ($1, $2, $3, FALSE, TRUE)
       RETURNING *`, [data.mobile_number, data.first_name, data.last_name]);
        return rows[0];
    }
    async updateAdmin(id, is_active) {
        const { rows } = await this.pool.query(`UPDATE admins SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [is_active, id]);
        return rows[0] || null;
    }
    async deleteAdmin(id) {
        const { rowCount } = await this.pool.query('DELETE FROM admins WHERE id = $1 AND is_main_admin = FALSE', [id]);
        return (rowCount || 0) > 0;
    }
    async isMainAdmin(id) {
        const { rows } = await this.pool.query('SELECT is_main_admin FROM admins WHERE id = $1', [id]);
        return rows[0]?.is_main_admin === true;
    }
}
exports.AdminRepository = AdminRepository;
exports.adminRepository = new AdminRepository();
