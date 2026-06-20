import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';

export interface IRizRecord {
  id: number;
  user_code: string;
  document_no: string;
  invoice_no: string | null;
  date: Date | null;
  description: string | null;
  weight: number | null;
  weight_debit: number;
  weight_credit: number;
  rate: number | null;
  wage: number;
  balance_weight: number;
  debit_amount: number;
  credit_amount: number;
  balance_amount: number;
  sort_order: number;
  raw_json: any;
  created_at: Date;
}

export class RizRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // دریافت خلاصه همه مشتریان (با مانده صحیح)
  async getCustomerSummaries(): Promise<any[]> {
    const query = `
      WITH latest_transactions AS (
        SELECT DISTINCT ON (user_code) 
          user_code,
          document_no,
          date,
          balance_weight,
          balance_amount,
          created_at,
          sort_order
        FROM riz 
        ORDER BY user_code, sort_order DESC NULLS LAST, date DESC NULLS LAST, created_at DESC
      ),
      transaction_counts AS (
        SELECT 
          user_code,
          COUNT(*) as transaction_count
        FROM riz 
        GROUP BY user_code
      )
      SELECT 
        u.code as user_code,
        u.first_name,
        u.last_name,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as full_name,
        u.mobile_number,
        lt.document_no as last_document_no,
        lt.date as last_transaction_date,
        COALESCE(lt.balance_weight, 0) as final_weight_balance,
        COALESCE(lt.balance_amount, 0) as final_amount_balance,
        COALESCE(tc.transaction_count, 0) as total_transactions,
        CASE 
          WHEN COALESCE(lt.balance_weight, 0) > 0 THEN 'بستانکار'
          WHEN COALESCE(lt.balance_weight, 0) < 0 THEN 'بدهکار'
          ELSE 'صفر'
        END as weight_type,
        CASE 
          WHEN COALESCE(lt.balance_amount, 0) > 0 THEN 'بستانکار'
          WHEN COALESCE(lt.balance_amount, 0) < 0 THEN 'بدهکار'
          ELSE 'صفر'
        END as amount_type,
        COALESCE(u.is_blocked, false) as is_blocked
      FROM users u
      LEFT JOIN latest_transactions lt ON u.code = lt.user_code
      LEFT JOIN transaction_counts tc ON u.code = tc.user_code
      WHERE u.code IS NOT NULL AND u.code != 'ADMIN1'
      ORDER BY u.created_at DESC
    `;

    const { rows } = await this.pool.query(query);
    return rows;
  }

  // دریافت لیست کاربران برای جستجو
  async getAllUsersForSearch(): Promise<any[]> {
    const { rows } = await this.pool.query(`
      SELECT 
        code as user_code,
        first_name,
        last_name,
        CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as full_name,
        mobile_number,
        is_blocked,
        created_at
      FROM users
      WHERE code != 'ADMIN1'
      ORDER BY created_at DESC
    `);
    return rows;
  }

  // دریافت مانده حساب یک کاربر (از آخرین تراکنش)
  async getUserBalance(userCode: string): Promise<{
    rial: number;
    gold: number;
    last_update: string;
    last_document: string;
  }> {
    const { rows } = await this.pool.query(`
      SELECT balance_weight, balance_amount, date, document_no
      FROM riz 
      WHERE user_code = $1
      ORDER BY sort_order DESC NULLS LAST, date DESC NULLS LAST, created_at DESC LIMIT 1
    `, [userCode]);

    if (rows.length === 0) {
      return {
        rial: 0,
        gold: 0,
        last_update: '',
        last_document: ''
      };
    }

    return {
      rial: parseInt(rows[0].balance_amount) || 0,
      gold: parseFloat(rows[0].balance_weight) || 0,
      last_update: rows[0].date || '',
      last_document: rows[0].document_no || ''
    };
  }

  // دریافت اطلاعات کاربر
  async getUserInfo(userCode: string): Promise<any | null> {
    const { rows } = await this.pool.query(
      'SELECT code, first_name, last_name, mobile_number FROM users WHERE code = $1',
      [userCode]
    );
    return rows[0] || null;
  }

  // آپلود ریزحساب با پشتیبانی از sort_order
  async uploadRizData(records: any[], userCode: string): Promise<number> {
    if (records.length === 0) return 0;

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // حذف رکوردهای قبلی کاربر
      await client.query('DELETE FROM riz WHERE user_code = $1', [userCode]);

      // ساخت placeholderها برای 16 فیلد
      const placeholders = records.map((_, i) => {
        const base = i * 16 + 1;
        return `($${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15})`;
      }).join(', ');

      const query = `
        INSERT INTO riz (
          user_code, document_no, invoice_no, date, description,
          weight, weight_debit, weight_credit, rate, wage, balance_weight,
          debit_amount, credit_amount, balance_amount, sort_order, raw_json
        ) VALUES ${placeholders}
      `;

      const values = records.flatMap(r => [
        userCode,
        r.document_no,
        r.invoice_no,
        r.date,
        r.description,
        r.weight,
        r.weight_debit,
        r.weight_credit,
        r.rate,
        r.wage,
        r.balance_weight,
        r.debit_amount,
        r.credit_amount,
        r.balance_amount,
        r.sort_order,
        JSON.stringify(r.raw_json || r)
      ]);

      const result = await client.query(query, values);
      await client.query('COMMIT');
      
      return result.rowCount || 0;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // دریافت تراکنش‌های یک کاربر (از آخر به اول)
  async getUserTransactions(
    userCode: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<IRizRecord[]> {
    const { rows } = await this.pool.query(`
      SELECT 
        id, user_code, document_no, invoice_no, date, description,
        weight, weight_debit, weight_credit, rate, wage, balance_weight,
        debit_amount, credit_amount, balance_amount, raw_json, created_at,
        sort_order
      FROM riz 
      WHERE user_code = $1
      ORDER BY sort_order DESC NULLS LAST, date DESC NULLS LAST, created_at DESC
      LIMIT $2 OFFSET $3
    `, [userCode, limit, offset]);
    return rows;
  }

  // تعداد کل تراکنش‌های یک کاربر
  async getTotalTransactionsCount(userCode: string): Promise<number> {
    const { rows } = await this.pool.query(
      'SELECT COUNT(*) as total FROM riz WHERE user_code = $1',
      [userCode]
    );
    return parseInt(rows[0]?.total) || 0;
  }

  // حذف یک رکورد
  async deleteRecord(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM riz WHERE id = $1', [id]);
    return (rowCount || 0) > 0;
  }

  // حذف همه تراکنش‌های یک کاربر
  async deleteAllUserRecords(userCode: string): Promise<number> {
    const { rowCount } = await this.pool.query('DELETE FROM riz WHERE user_code = $1', [userCode]);
    return rowCount || 0;
  }

  // پیدا کردن رکورد با ID
  async findRecordById(id: number): Promise<IRizRecord | null> {
    const { rows } = await this.pool.query('SELECT * FROM riz WHERE id = $1', [id]);
    return rows[0] || null;
  }
}

export const rizRepository = new RizRepository();