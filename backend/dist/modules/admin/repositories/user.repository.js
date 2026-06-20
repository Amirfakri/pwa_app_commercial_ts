"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class UserRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async getAllUsers(filters) {
        const { search, is_blocked, page = 1, limit = 50 } = filters;
        const offset = (page - 1) * limit;
        let query = `
      SELECT id, mobile_number, first_name, last_name, code, is_blocked,
             device_limit, melted_price_offset, coin_price_offset, created_at
      FROM users WHERE 1=1
    `;
        const params = [];
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
        const countQuery = query.replace('SELECT', 'SELECT COUNT(*) as total');
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
    async getUserById(id) {
        const { rows } = await this.pool.query(`SELECT id, mobile_number, first_name, last_name, code, is_blocked,
              device_limit, melted_price_offset, coin_price_offset, created_at
       FROM users WHERE id = $1`, [id]);
        return rows[0] || null;
    }
    async updateUser(id, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.first_name !== undefined) {
            updates.push(`first_name = $${paramIndex++}`);
            values.push(data.first_name);
        }
        if (data.last_name !== undefined) {
            updates.push(`last_name = $${paramIndex++}`);
            values.push(data.last_name);
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
        if (updates.length === 0)
            return null;
        updates.push(`updated_at = NOW()`);
        values.push(id);
        const { rows } = await this.pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        return rows[0] || null;
    }
    async blockUser(id, blocked) {
        const { rowCount } = await this.pool.query('UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2', [blocked, id]);
        return (rowCount || 0) > 0;
    }
    async getPendingRegistrations() {
        const { rows } = await this.pool.query(`
      SELECT id, mobile_number, first_name, last_name, national_code, status, created_at
      FROM user_registrations 
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `);
        return rows;
    }
    async approveRegistration(registrationId, adminId) {
        const { rows } = await this.pool.query(`UPDATE user_registrations 
       SET status = 'approved', approved_by = $1, approved_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING *`, [adminId, registrationId]);
        return rows[0] || null;
    }
    async createUserFromRegistration(registration) {
        // تولید کد کاربری
        const userCode = `USER${Math.floor(1000 + Math.random() * 9000)}`;
        const { rows } = await this.pool.query(`INSERT INTO users (mobile_number, first_name, last_name, code, device_limit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [registration.mobile_number, registration.first_name, registration.last_name, userCode, 1]);
        return rows[0];
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
