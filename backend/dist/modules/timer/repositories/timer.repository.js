"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timerRepository = exports.TimerRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class TimerRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async create(data) {
        const expiresAt = new Date(Date.now() + data.remaining_seconds * 1000);
        const { rows } = await this.pool.query(`INSERT INTO timers (
        transaction_id, user_id, remaining_seconds, initial_seconds, 
        status, started_at, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW(), NOW())
      RETURNING *`, [
            data.transaction_id,
            data.user_id,
            data.remaining_seconds,
            data.initial_seconds,
            data.status || 'active',
            expiresAt
        ]);
        return rows[0];
    }
    async findByTransactionId(transactionId) {
        const { rows } = await this.pool.query(`SELECT * FROM timers WHERE transaction_id = $1 ORDER BY created_at DESC LIMIT 1`, [transactionId]);
        return rows[0] || null;
    }
    async findById(id) {
        const { rows } = await this.pool.query(`SELECT * FROM timers WHERE id = $1`, [id]);
        return rows[0] || null;
    }
    async findByUserId(userId, limit = 100, offset = 0) {
        const { rows } = await this.pool.query(`SELECT * FROM timers 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        return rows;
    }
    async getAllTimers(page = 1, limit = 50, status) {
        const offset = (page - 1) * limit;
        let query = `
      SELECT t.*, u.first_name, u.last_name, u.code as user_code
      FROM timers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (status) {
            query += ` AND t.status = $${paramIndex++}`;
            params.push(status);
        }
        query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);
        const { rows } = await this.pool.query(query, params);
        let countQuery = `SELECT COUNT(*) as total FROM timers t WHERE 1=1`;
        const countParams = [];
        let countIndex = 1;
        if (status) {
            countQuery += ` AND t.status = $${countIndex++}`;
            countParams.push(status);
        }
        const countResult = await this.pool.query(countQuery, countParams);
        return {
            timers: rows,
            total: parseInt(countResult.rows[0]?.total || '0')
        };
    }
    async update(id, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.remaining_seconds !== undefined) {
            updates.push(`remaining_seconds = $${paramIndex++}`);
            values.push(data.remaining_seconds);
        }
        if (data.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(data.status);
        }
        updates.push(`updated_at = NOW()`);
        values.push(id);
        const { rows } = await this.pool.query(`UPDATE timers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        return rows[0] || null;
    }
    async decrementRemainingSeconds(id, seconds = 1) {
        const { rows } = await this.pool.query(`UPDATE timers 
       SET remaining_seconds = remaining_seconds - $1, updated_at = NOW()
       WHERE id = $2 AND status = 'active' AND remaining_seconds > 0
       RETURNING *`, [seconds, id]);
        return rows[0] || null;
    }
    async expireTimer(id) {
        const { rows } = await this.pool.query(`UPDATE timers 
       SET status = 'expired', updated_at = NOW()
       WHERE id = $1 AND status = 'active'
       RETURNING *`, [id]);
        return rows[0] || null;
    }
    async getActiveTimers() {
        const { rows } = await this.pool.query(`SELECT * FROM timers 
       WHERE status = 'active' AND remaining_seconds > 0
       ORDER BY expires_at ASC`);
        return rows;
    }
    async getExpiredTimers() {
        const { rows } = await this.pool.query(`SELECT * FROM timers 
       WHERE status = 'expired' OR remaining_seconds <= 0
       ORDER BY created_at DESC`);
        return rows;
    }
    async getTotalCount() {
        const { rows } = await this.pool.query(`SELECT COUNT(*) as total FROM timers`);
        return parseInt(rows[0]?.total || '0');
    }
    async getCountByUser() {
        const { rows } = await this.pool.query(`SELECT user_id, COUNT(*) as count 
       FROM timers 
       GROUP BY user_id 
       ORDER BY count DESC 
       LIMIT 10`);
        return rows;
    }
    async delete(id) {
        const { rowCount } = await this.pool.query(`DELETE FROM timers WHERE id = $1`, [id]);
        return (rowCount || 0) > 0;
    }
    async deleteByTransactionId(transactionId) {
        const { rowCount } = await this.pool.query(`DELETE FROM timers WHERE transaction_id = $1`, [transactionId]);
        return (rowCount || 0) > 0;
    }
}
exports.TimerRepository = TimerRepository;
exports.timerRepository = new TimerRepository();
