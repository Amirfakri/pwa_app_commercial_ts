"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsRepository = exports.SmsRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
const crypto_1 = __importDefault(require("crypto"));
class SmsRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async logSms(data) {
        const id = crypto_1.default.randomBytes(8).toString('hex');
        const { rows } = await this.pool.query(`INSERT INTO sms_logs (
        id, admin_id, receptor, message, status, sms_id, provider, batch_id, error, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`, [
            id,
            data.adminId,
            data.receptor,
            data.message,
            data.status,
            data.smsId,
            data.provider,
            data.batchId || null,
            data.error || null,
        ]);
        return rows[0];
    }
    async logBatch(batchId, adminId, totalCount, successCount, failCount, message) {
        await this.pool.query(`INSERT INTO sms_batches (id, admin_id, total_count, success_count, fail_count, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [batchId, adminId, totalCount, successCount, failCount, message]);
    }
    async getLogs(filters) {
        const { page = 1, limit = 50, status } = filters;
        const offset = (page - 1) * limit;
        let query = `
      SELECT id, admin_id, receptor, message, status, sms_id, provider, batch_id, error, created_at
      FROM sms_logs WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }
        const countQuery = query.replace('SELECT id, admin_id, receptor, message, status, sms_id, provider, batch_id, error, created_at', 'SELECT COUNT(*) as total');
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);
        const [dataResult, countResult] = await Promise.all([
            this.pool.query(query, params),
            this.pool.query(countQuery, params.slice(0, params.length - 2))
        ]);
        return {
            logs: dataResult.rows,
            total: parseInt(countResult.rows[0]?.total || '0')
        };
    }
    async searchCustomers(query, limit = 50) {
        const { rows } = await this.pool.query(`SELECT id, code, first_name, last_name, mobile_number, created_at
       FROM users 
       WHERE mobile_number ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR code ILIKE $1
       ORDER BY 
         CASE WHEN mobile_number ILIKE $1 THEN 1
              WHEN first_name ILIKE $1 THEN 2
              WHEN last_name ILIKE $1 THEN 3
              ELSE 4 END
       LIMIT $2`, [`%${query}%`, limit]);
        return rows;
    }
    async getCustomerBalance(userId) {
        const { rows: userRows } = await this.pool.query('SELECT id, code, first_name, last_name, mobile_number FROM users WHERE id = $1', [userId]);
        if (userRows.length === 0)
            return null;
        const user = userRows[0];
        const { rows: lastTransaction } = await this.pool.query(`SELECT balance_weight, balance_amount, date, document_no
       FROM riz 
       WHERE user_code = $1 AND description NOT LIKE '%نقل از قبل%'
       ORDER BY date DESC, created_at DESC LIMIT 1`, [user.code]);
        const lastTx = lastTransaction[0] || {};
        const finalRialBalance = parseInt(lastTx.balance_amount) || 0;
        const finalGoldBalance = parseFloat(lastTx.balance_weight) || 0;
        return {
            user: {
                id: user.id,
                code: user.code,
                full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code,
                mobile_number: user.mobile_number,
            },
            balance: {
                rial: finalRialBalance,
                gold: finalGoldBalance,
                status: finalRialBalance > 0 ? 'بستانکار' : finalRialBalance < 0 ? 'بدهکار' : 'صفر',
                last_update: lastTx.date || 'بدون تراکنش',
                last_document: lastTx.document_no || '-',
            },
        };
    }
}
exports.SmsRepository = SmsRepository;
exports.smsRepository = new SmsRepository();
