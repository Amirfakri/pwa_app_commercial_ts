"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyMessageRepository = exports.DailyMessageRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class DailyMessageRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async findActive() {
        const now = new Date().toISOString();
        const { rows } = await this.pool.query(`SELECT id, message_text, is_active, start_date, end_date, created_by, created_at, updated_at
       FROM daily_messages 
       WHERE is_active = true 
         AND (start_date IS NULL OR start_date <= $1)
         AND (end_date IS NULL OR end_date >= $1)
       ORDER BY created_at DESC
       LIMIT 1`, [now]);
        return rows[0] || null;
    }
    async findAll(filters) {
        const { is_active, page = 1, limit = 50 } = filters;
        const offset = (page - 1) * limit;
        let query = `
      SELECT id, message_text, is_active, start_date, end_date, created_by, created_at, updated_at
      FROM daily_messages WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (is_active !== undefined) {
            query += ` AND is_active = $${paramIndex++}`;
            params.push(is_active);
        }
        const countQuery = query.replace('SELECT id, message_text, is_active, start_date, end_date, created_by, created_at, updated_at', 'SELECT COUNT(*) as total');
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);
        const [dataResult, countResult] = await Promise.all([
            this.pool.query(query, params),
            this.pool.query(countQuery, params.slice(0, params.length - 2))
        ]);
        return {
            messages: dataResult.rows,
            total: parseInt(countResult.rows[0]?.total || '0')
        };
    }
    async findById(id) {
        const { rows } = await this.pool.query('SELECT * FROM daily_messages WHERE id = $1', [id]);
        return rows[0] || null;
    }
    async create(data, adminId) {
        const { rows } = await this.pool.query(`INSERT INTO daily_messages (
        message_text, is_active, start_date, end_date, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *`, [
            data.message_text,
            data.is_active !== undefined ? data.is_active : true,
            data.start_date || null,
            data.end_date || null,
            adminId
        ]);
        return rows[0];
    }
    async update(id, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.message_text !== undefined) {
            updates.push(`message_text = $${paramIndex++}`);
            values.push(data.message_text);
        }
        if (data.is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(data.is_active);
        }
        if (data.start_date !== undefined) {
            updates.push(`start_date = $${paramIndex++}`);
            values.push(data.start_date);
        }
        if (data.end_date !== undefined) {
            updates.push(`end_date = $${paramIndex++}`);
            values.push(data.end_date);
        }
        if (updates.length === 0)
            return null;
        updates.push(`updated_at = NOW()`);
        values.push(id);
        const { rows } = await this.pool.query(`UPDATE daily_messages SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        return rows[0] || null;
    }
    async delete(id) {
        const { rowCount } = await this.pool.query('DELETE FROM daily_messages WHERE id = $1', [id]);
        return (rowCount || 0) > 0;
    }
}
exports.DailyMessageRepository = DailyMessageRepository;
exports.dailyMessageRepository = new DailyMessageRepository();
