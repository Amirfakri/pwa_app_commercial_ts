"use strict";
// backend/src/modules/transaction/repositories/transaction.repository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRepository = exports.TransactionRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class TransactionRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async create(data) {
        const { rows } = await this.pool.query(`INSERT INTO transactions (
        user_id, price_id, product_code, display_name, type,
        coin_quantity, melted_weight, amount, transaction_price,
        base_price, applied_offset, user_melted_offset, user_coin_offset,
        offset_type, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`, [
            data.user_id,
            data.price_id,
            data.product_code,
            data.display_name,
            data.type,
            data.coin_quantity,
            data.melted_weight,
            data.amount,
            data.transaction_price,
            data.base_price,
            data.applied_offset,
            data.user_melted_offset,
            data.user_coin_offset,
            data.offset_type,
            data.status,
            data.created_at,
        ]);
        return rows[0];
    }
    async findById(id) {
        const { rows } = await this.pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
        return rows[0] || null;
    }
    async findPendingById(id) {
        const { rows } = await this.pool.query('SELECT * FROM transactions WHERE id = $1 AND status = $2', [id, 'pending']);
        return rows[0] || null;
    }
    async updateStatus(id, status, updatedAt) {
        const { rows } = await this.pool.query(`UPDATE transactions 
       SET status = $1, updated_at = $2 
       WHERE id = $3 
       RETURNING *`, [status, updatedAt, id]);
        return rows[0] || null;
    }
    async getUserTransactions(userId, status, limit = 100, offset = 0) {
        let query = 'SELECT * FROM transactions WHERE user_id = $1';
        const params = [userId];
        if (status) {
            query += ' AND status = $2';
            params.push(status);
        }
        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);
        const { rows } = await this.pool.query(query, params);
        return rows;
    }
    async getUserTransactionsCount(userId, status) {
        let query = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = $1';
        const params = [userId];
        if (status) {
            query += ' AND status = $2';
            params.push(status);
        }
        const { rows } = await this.pool.query(query, params);
        return parseInt(rows[0]?.total || '0');
    }
    async getAllTransactions(status, limit = 100, offset = 0) {
        let query = 'SELECT * FROM transactions';
        const params = [];
        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }
        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);
        const { rows } = await this.pool.query(query, params);
        return rows;
    }
    async getTotalCount(status) {
        let query = 'SELECT COUNT(*) as total FROM transactions';
        const params = [];
        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }
        const { rows } = await this.pool.query(query, params);
        return parseInt(rows[0]?.total || '0');
    }
    async getPendingTransactions() {
        const { rows } = await this.pool.query(`SELECT * FROM transactions WHERE status = 'pending' ORDER BY created_at ASC`);
        return rows;
    }
    async getPendingCount() {
        const { rows } = await this.pool.query(`SELECT COUNT(*) as total FROM transactions WHERE status = 'pending'`);
        return parseInt(rows[0]?.total || '0');
    }
    // متد انقضای تراکنش‌های قدیمی با استفاده از تایمر داینامیک
    async expireOldTransactions(iranNowString, timerSeconds) {
        const { rows } = await this.pool.query(`UPDATE transactions 
       SET status = 'expired', updated_at = $1
       WHERE status = 'pending' 
         AND EXTRACT(EPOCH FROM (NOW() - created_at)) > $2
       RETURNING *`, [iranNowString, timerSeconds]);
        return rows;
    }
    // متد برای منقضی کردن یک تراکنش خاص
    async expireTransactionById(id, iranNowString) {
        const { rows } = await this.pool.query(`UPDATE transactions 
       SET status = 'expired', updated_at = $1
       WHERE id = $2 AND status = 'pending'
       RETURNING *`, [iranNowString, id]);
        return rows[0] || null;
    }
    // متد برای بررسی و منقضی کردن تراکنش‌های منقضی شده برای یک کاربر خاص
    async expireUserPendingTransactions(userId, iranNowString, timerSeconds) {
        const { rows } = await this.pool.query(`UPDATE transactions 
       SET status = 'expired', updated_at = $1
       WHERE user_id = $2 
         AND status = 'pending'
         AND EXTRACT(EPOCH FROM (NOW() - created_at)) > $3
       RETURNING *`, [iranNowString, userId, timerSeconds]);
        return rows;
    }
    async getUserTransactionsWithDetails(userId, status, limit = 100, offset = 0) {
        let query = `
      SELECT t.*, u.first_name, u.last_name, u.code as user_code, u.mobile_number
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.user_id = $1
    `;
        const params = [userId];
        let paramIndex = 2;
        if (status) {
            query += ` AND t.status = $${paramIndex++}`;
            params.push(status);
        }
        query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);
        const { rows } = await this.pool.query(query, params);
        return rows;
    }
    async getTransactionStats() {
        const { rows } = await this.pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today,
        COALESCE(SUM(amount), 0) as total_amount
      FROM transactions
    `);
        return rows[0];
    }
    async getRecentTransactions(userId, limit = 10) {
        const { rows } = await this.pool.query(`SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`, [userId, limit]);
        return rows;
    }
    async deleteTransaction(id) {
        const { rowCount } = await this.pool.query(`DELETE FROM transactions WHERE id = $1`, [id]);
        return (rowCount || 0) > 0;
    }
    async updateTransaction(id, data) {
        const fields = [];
        const values = [];
        let paramIndex = 1;
        if (data.status !== undefined) {
            fields.push(`status = $${paramIndex++}`);
            values.push(data.status);
        }
        if (data.amount !== undefined) {
            fields.push(`amount = $${paramIndex++}`);
            values.push(data.amount);
        }
        if (data.transaction_price !== undefined) {
            fields.push(`transaction_price = $${paramIndex++}`);
            values.push(data.transaction_price);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const { rows } = await this.pool.query(`UPDATE transactions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        return rows[0] || null;
    }
    async getTimer() {
        const { rows } = await this.pool.query('SELECT value FROM timer WHERE id = 1');
        if (rows.length === 0)
            return 30;
        return parseInt(rows[0].value);
    }
    async updateTimer(value) {
        await this.pool.query(`INSERT INTO timer (id, value, updated_at) VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET value = $1, updated_at = NOW()`, [value]);
    }
}
exports.TransactionRepository = TransactionRepository;
exports.transactionRepository = new TransactionRepository();
