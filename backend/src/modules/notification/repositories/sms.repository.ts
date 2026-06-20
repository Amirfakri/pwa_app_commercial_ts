import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';
import crypto from 'crypto';

export interface ISmsLog {
  id: string;
  admin_id: number | null;
  receptor: string;
  message: string | null;
  status: 'sent' | 'failed' | 'pending';
  sms_id: string | null;
  provider: string | null;
  batch_id: string | null;
  error: string | null;
  created_at: Date;
}

export interface ISendSmsInput {
  receptor: string;
  message?: string;
  bodyId?: string;
  from?: string;
}

export class SmsRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async logSms(data: {
    adminId: number | null;
    receptor: string;
    message: string | null;
    status: 'sent' | 'failed' | 'pending';
    smsId: string | null;
    provider: string | null;
    batchId?: string | null;
    error?: string | null;
  }): Promise<ISmsLog> {
    const id = crypto.randomBytes(8).toString('hex');
    const { rows } = await this.pool.query(
      `INSERT INTO sms_logs (
        id, admin_id, receptor, message, status, sms_id, provider, batch_id, error, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [
        id,
        data.adminId,
        data.receptor,
        data.message,
        data.status,
        data.smsId,
        data.provider,
        data.batchId || null,
        data.error || null,
      ]
    );
    return rows[0];
  }

  async logBatch(batchId: string, adminId: number, totalCount: number, successCount: number, failCount: number, message: string | null): Promise<void> {
    await this.pool.query(
      `INSERT INTO sms_batches (id, admin_id, total_count, success_count, fail_count, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [batchId, adminId, totalCount, successCount, failCount, message]
    );
  }

  async getLogs(filters: { page?: number; limit?: number; status?: string }): Promise<{ logs: ISmsLog[]; total: number }> {
    const { page = 1, limit = 50, status } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, admin_id, receptor, message, status, sms_id, provider, batch_id, error, created_at
      FROM sms_logs WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    const countQuery = query.replace(
      'SELECT id, admin_id, receptor, message, status, sms_id, provider, batch_id, error, created_at',
      'SELECT COUNT(*) as total'
    );

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

  async searchCustomers(query: string, limit: number = 50): Promise<any[]> {
    const { rows } = await this.pool.query(
      `SELECT id, code, first_name, last_name, mobile_number, created_at
       FROM users 
       WHERE mobile_number ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR code ILIKE $1
       ORDER BY 
         CASE WHEN mobile_number ILIKE $1 THEN 1
              WHEN first_name ILIKE $1 THEN 2
              WHEN last_name ILIKE $1 THEN 3
              ELSE 4 END
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return rows;
  }

  async getCustomerBalance(userId: number): Promise<any> {
    const { rows: userRows } = await this.pool.query(
      'SELECT id, code, first_name, last_name, mobile_number FROM users WHERE id = $1',
      [userId]
    );
    
    if (userRows.length === 0) return null;
    
    const user = userRows[0];
    
    const { rows: lastTransaction } = await this.pool.query(
      `SELECT balance_weight, balance_amount, date, document_no
       FROM riz 
       WHERE user_code = $1 AND description NOT LIKE '%نقل از قبل%'
       ORDER BY date DESC, created_at DESC LIMIT 1`,
      [user.code]
    );
    
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

export const smsRepository = new SmsRepository();