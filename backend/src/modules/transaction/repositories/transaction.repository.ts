// backend/src/modules/transaction/repositories/transaction.repository.ts

import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';

export interface ITransaction {
  id: number;
  user_id: number;
  price_id: number | null;
  product_code: string;
  display_name: string | null;
  type: 'خرید' | 'فروش';
  coin_quantity: number | null;
  melted_weight: number | null;
  amount: number;
  transaction_price: number | null;
  base_price: number | null;
  applied_offset: number;
  user_melted_offset: number;
  user_coin_offset: number;
  offset_type: 'melted' | 'coin' | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: Date;
  updated_at: Date;
}

export interface ICreateTransactionInput {
  user_id: number;
  price_id: number | null;
  product_code: string;
  display_name: string;
  type: 'خرید' | 'فروش';
  coin_quantity: number | null;
  melted_weight: number | null;
  amount: number;
  transaction_price: number;
  base_price: number;
  applied_offset: number;
  user_melted_offset: number;
  user_coin_offset: number;
  offset_type: 'melted' | 'coin' | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
}

export class TransactionRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async create(data: ICreateTransactionInput): Promise<ITransaction> {
    const { rows } = await this.pool.query(
      `INSERT INTO transactions (
        user_id, price_id, product_code, display_name, type,
        coin_quantity, melted_weight, amount, transaction_price,
        base_price, applied_offset, user_melted_offset, user_coin_offset,
        offset_type, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
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
      ]
    );
    return rows[0];
  }

  async findById(id: number): Promise<ITransaction | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async findPendingById(id: number): Promise<ITransaction | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND status = $2',
      [id, 'pending']
    );
    return rows[0] || null;
  }

  async updateStatus(id: number, status: string, updatedAt: string): Promise<ITransaction | null> {
    const { rows } = await this.pool.query(
      `UPDATE transactions 
       SET status = $1, updated_at = $2 
       WHERE id = $3 
       RETURNING *`,
      [status, updatedAt, id]
    );
    return rows[0] || null;
  }

  async getUserTransactions(
    userId: number,
    status?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ITransaction[]> {
    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params: any[] = [userId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const { rows } = await this.pool.query(query, params);
    return rows;
  }

  // ==================== متدهای جدید برای فیلتر تاریخ با منطقه زمانی ایران ====================

  async getUserTransactionsByDateRange(
    userId: number,
    startDate: string,
    endDate: string,
    status?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ITransaction[]> {
    // استفاده از AT TIME ZONE برای تبدیل تاریخ به منطقه زمانی ایران
    let query = `
      SELECT * FROM transactions 
      WHERE user_id = $1 
      AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tehran') BETWEEN $2 AND $3
    `;
    const params: any[] = [userId, startDate, endDate];
    let paramIndex = 4;
    
    if (status) {
      query += ' AND status = $' + paramIndex++;
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + paramIndex++ + ' OFFSET $' + paramIndex++;
    params.push(limit, offset);
    
    const { rows } = await this.pool.query(query, params);
    return rows;
  }

  async getUserTransactionsCountByDateRange(
    userId: number,
    startDate: string,
    endDate: string,
    status?: string
  ): Promise<number> {
    let query = `
      SELECT COUNT(*) as total FROM transactions 
      WHERE user_id = $1 
      AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tehran') BETWEEN $2 AND $3
    `;
    const params: any[] = [userId, startDate, endDate];
    let paramIndex = 4;
    
    if (status) {
      query += ' AND status = $' + paramIndex++;
      params.push(status);
    }
    
    const { rows } = await this.pool.query(query, params);
    return parseInt(rows[0]?.total || '0');
  }

  // ==================== متدهای قبلی ====================

  async getUserTransactionsCount(userId: number, status?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = $1';
    const params: any[] = [userId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    const { rows } = await this.pool.query(query, params);
    return parseInt(rows[0]?.total || '0');
  }

  async getAllTransactions(status?: string, limit: number = 100, offset: number = 0): Promise<ITransaction[]> {
    let query = 'SELECT * FROM transactions';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const { rows } = await this.pool.query(query, params);
    return rows;
  }

  async getTotalCount(status?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM transactions';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    const { rows } = await this.pool.query(query, params);
    return parseInt(rows[0]?.total || '0');
  }

  async getPendingTransactions(): Promise<ITransaction[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM transactions WHERE status = 'pending' ORDER BY created_at ASC`
    );
    return rows;
  }

  async getPendingCount(): Promise<number> {
    const { rows } = await this.pool.query(
      `SELECT COUNT(*) as total FROM transactions WHERE status = 'pending'`
    );
    return parseInt(rows[0]?.total || '0');
  }

  async expireOldTransactions(iranNowString: string, timerSeconds: number): Promise<ITransaction[]> {
    const { rows } = await this.pool.query(
      `UPDATE transactions 
       SET status = 'expired', updated_at = $1
       WHERE status = 'pending' 
         AND EXTRACT(EPOCH FROM (NOW() - created_at)) > $2
       RETURNING *`,
      [iranNowString, timerSeconds]
    );
    return rows;
  }

  async expireTransactionById(id: number, iranNowString: string): Promise<ITransaction | null> {
    const { rows } = await this.pool.query(
      `UPDATE transactions 
       SET status = 'expired', updated_at = $1
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [iranNowString, id]
    );
    return rows[0] || null;
  }

  async expireUserPendingTransactions(userId: number, iranNowString: string, timerSeconds: number): Promise<ITransaction[]> {
    const { rows } = await this.pool.query(
      `UPDATE transactions 
       SET status = 'expired', updated_at = $1
       WHERE user_id = $2 
         AND status = 'pending'
         AND EXTRACT(EPOCH FROM (NOW() - created_at)) > $3
       RETURNING *`,
      [iranNowString, userId, timerSeconds]
    );
    return rows;
  }

  async getUserTransactionsWithDetails(
    userId: number,
    status?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    let query = `
      SELECT t.*, u.first_name, u.last_name, u.code as user_code, u.mobile_number
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.user_id = $1
    `;
    const params: any[] = [userId];
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

  async getTransactionStats(): Promise<any> {
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

  async getRecentTransactions(userId: number, limit: number = 10): Promise<ITransaction[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `DELETE FROM transactions WHERE id = $1`,
      [id]
    );
    return (rowCount || 0) > 0;
  }

  async updateTransaction(id: number, data: Partial<ITransaction>): Promise<ITransaction | null> {
    const fields: string[] = [];
    const values: any[] = [];
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

    const { rows } = await this.pool.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async getTimer(): Promise<number> {
    const { rows } = await this.pool.query('SELECT value FROM timer WHERE id = 1');
    if (rows.length === 0) return 30;
    return parseInt(rows[0].value);
  }

  async updateTimer(value: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO timer (id, value, updated_at) VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET value = $1, updated_at = NOW()`,
      [value]
    );
  }
}

export const transactionRepository = new TransactionRepository();