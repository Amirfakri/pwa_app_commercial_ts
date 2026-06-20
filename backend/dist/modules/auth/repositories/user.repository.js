"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class UserRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async findAll(filters) {
        const { search, is_blocked, page = 1, limit = 50 } = filters;
        const offset = (page - 1) * limit;
        // فقط کاربرانی که ادمین نیستند (is_admin = false)
        let query = `
      SELECT id, mobile_number, first_name, last_name, code, is_admin, is_blocked,
             device_limit, melted_price_offset, coin_price_offset, created_at
      FROM users 
      WHERE is_admin = false
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
        let countQuery = `SELECT COUNT(*) as total FROM users WHERE is_admin = false`;
        const countParams = [];
        let countIndex = 1;
        if (search) {
            countQuery += ` AND (mobile_number ILIKE $${countIndex} OR first_name ILIKE $${countIndex} 
                    OR last_name ILIKE $${countIndex} OR code ILIKE $${countIndex})`;
            countParams.push(`%${search}%`);
            countIndex++;
        }
        if (is_blocked !== undefined) {
            countQuery += ` AND is_blocked = $${countIndex}`;
            countParams.push(is_blocked);
            countIndex++;
        }
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        const [dataResult, countResult] = await Promise.all([
            this.pool.query(query, params),
            this.pool.query(countQuery, countParams)
        ]);
        const users = dataResult.rows.map((user) => ({
            ...user,
            full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code
        }));
        return {
            users,
            total: parseInt(countResult.rows[0]?.total || '0')
        };
    }
    async findById(id) {
        const { rows } = await this.pool.query(`SELECT id, mobile_number, first_name, last_name, code, is_admin, is_blocked,
              device_limit, melted_price_offset, coin_price_offset, created_at
       FROM users WHERE id = $1`, [id]);
        if (rows.length === 0)
            return null;
        const user = rows[0];
        user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code;
        return user;
    }
    async findByMobile(mobile) {
        const { rows } = await this.pool.query(`SELECT id, mobile_number, first_name, last_name, code, is_admin, is_blocked,
              device_limit, melted_price_offset, coin_price_offset, created_at
       FROM users WHERE mobile_number = $1`, [mobile]);
        if (rows.length === 0)
            return null;
        const user = rows[0];
        user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code;
        return user;
    }
    async create(data) {
        const code = data.code || await this.generateUniqueCode();
        const isAdmin = data.is_admin || false;
        const deviceLimit = isAdmin ? 999 : 1; // ادمین‌ها محدودیت ندارند
        const { rows } = await this.pool.query(`INSERT INTO users (mobile_number, first_name, last_name, code, is_admin, device_limit)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, mobile_number, first_name, last_name, code, is_admin, is_blocked,
                 device_limit, melted_price_offset, coin_price_offset, created_at`, [data.mobile_number, data.first_name || 'کاربر', data.last_name || 'جدید', code, isAdmin, deviceLimit]);
        const user = rows[0];
        user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code;
        return user;
    }
    async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;
        if (data.first_name !== undefined) {
            fields.push(`first_name = $${idx++}`);
            values.push(data.first_name);
        }
        if (data.last_name !== undefined) {
            fields.push(`last_name = $${idx++}`);
            values.push(data.last_name);
        }
        if (data.is_blocked !== undefined) {
            fields.push(`is_blocked = $${idx++}`);
            values.push(data.is_blocked);
        }
        if (data.device_limit !== undefined) {
            fields.push(`device_limit = $${idx++}`);
            values.push(data.device_limit);
        }
        if (data.melted_price_offset !== undefined) {
            fields.push(`melted_price_offset = $${idx++}`);
            values.push(data.melted_price_offset);
        }
        if (data.coin_price_offset !== undefined) {
            fields.push(`coin_price_offset = $${idx++}`);
            values.push(data.coin_price_offset);
        }
        if (fields.length === 0)
            return null;
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const { rows } = await this.pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
        if (rows.length === 0)
            return null;
        const user = rows[0];
        user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code;
        return user;
    }
    async delete(id) {
        const { rowCount } = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
        return (rowCount || 0) > 0;
    }
    async block(id, blocked) {
        const { rowCount } = await this.pool.query('UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2', [blocked, id]);
        return (rowCount || 0) > 0;
    }
    async updateOffsets(id, meltedOffset, coinOffset) {
        const { rows } = await this.pool.query(`UPDATE users SET melted_price_offset = $1, coin_price_offset = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`, [meltedOffset, coinOffset, id]);
        if (rows.length === 0)
            return null;
        const user = rows[0];
        user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code;
        return user;
    }
    async generateUniqueCode() {
        let code;
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            code = `USER${Math.floor(1000 + Math.random() * 9000)}`;
            const { rows } = await this.pool.query('SELECT id FROM users WHERE code = $1', [code]);
            if (rows.length === 0) {
                isUnique = true;
                return code;
            }
            attempts++;
        }
        throw new Error('Unable to generate unique user code');
    }
    async createUserFromRegistration(registration) {
        const userCode = await this.generateUniqueCode();
        return this.create({
            mobile_number: registration.mobile_number,
            first_name: registration.first_name,
            last_name: registration.last_name,
            code: userCode,
            is_admin: false
        });
    }
    async getPendingRegistrations() {
        const { rows } = await this.pool.query(`SELECT id, mobile_number, first_name, last_name, national_code, created_at
       FROM user_registrations WHERE status = 'pending' ORDER BY created_at DESC`);
        return rows;
    }
    async approveRegistration(id, adminId) {
        const { rows } = await this.pool.query(`UPDATE user_registrations SET status = 'approved', approved_by = $1, approved_at = NOW()
       WHERE id = $2 AND status = 'pending' RETURNING *`, [adminId, id]);
        return rows[0] || null;
    }
    async rejectRegistration(id, adminId) {
        const { rows } = await this.pool.query(`UPDATE user_registrations SET status = 'rejected', approved_by = $1, approved_at = NOW()
       WHERE id = $2 AND status = 'pending' RETURNING *`, [adminId, id]);
        return rows[0] || null;
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
