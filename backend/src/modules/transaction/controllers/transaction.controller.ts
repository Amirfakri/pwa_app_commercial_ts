// backend/src/modules/transaction/controllers/transaction.controller.ts

import { Request, Response } from 'express';
import moment from 'moment-timezone';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';
import { transactionService } from '../services/transaction.service';
import { pool } from '../../../core/database/postgres';

export class TransactionController {
  
  // ==================== برای کاربر عادی ====================
  
  async createTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;
      const { product_code, type, coin_quantity, melted_weight, amount } = req.body;
      
      const transaction = await transactionService.createTransaction(
        userId,
        isAdmin,
        { product_code, type, coin_quantity, melted_weight, amount }
      );
      
      // دریافت اطلاعات کاربر برای ارسال در Socket.IO
      const userResult = await pool.query(
        'SELECT first_name, last_name, code, mobile_number FROM users WHERE id = $1',
        [userId]
      );
      const user = userResult.rows[0] || {};
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code || 'کاربر';
      
      // ایجاد payload کامل با اطلاعات کاربر
      const payload = {
        ...transaction,
        user_name: fullName,
        user: {
          id: userId,
          full_name: fullName,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          code: user.code || '',
          mobile_number: user.mobile_number || ''
        }
      };
      
      const io = req.app.get('io');
      if (io) {
        io.emit('new_transaction', payload);
        io.to('admin_room').emit('new_transaction', payload);
        io.to(`user_${userId}`).emit('new_transaction', payload);
      }
      
      res.status(201).json({
        success: true,
        message: 'تراکنش با موفقیت ایجاد شد',
        transaction,
        timer: transaction.timer_total,
        remaining_seconds: transaction.remaining_seconds
      });
    } catch (err: any) {
      console.error('خطا در ایجاد تراکنش:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getUserTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status, start_date, end_date, date, page = 1, limit = 50 } = req.query;
      
      let result;
      
      // تبدیل تاریخ‌ها به منطقه زمانی ایران
      let startDateIran = start_date as string;
      let endDateIran = end_date as string;
      
      if (start_date) {
        try {
          const startMoment = moment.tz(start_date as string, 'Asia/Tehran');
          startDateIran = startMoment.format('YYYY-MM-DD');
        } catch (e) {
          startDateIran = start_date as string;
        }
      }
      
      if (end_date) {
        try {
          const endMoment = moment.tz(end_date as string, 'Asia/Tehran');
          endDateIran = endMoment.format('YYYY-MM-DD');
        } catch (e) {
          endDateIran = end_date as string;
        }
      }
      
      // اگر بازه تاریخ مشخص شده باشد (start_date و end_date)
      if (startDateIran && endDateIran) {
        result = await transactionService.getUserTransactionsByDateRange(
          userId,
          startDateIran,
          endDateIran,
          status as string,
          parseInt(page as string),
          parseInt(limit as string)
        );
      } 
      // اگر فقط start_date داشته باشیم (تاریخ شروع)
      else if (startDateIran && !endDateIran) {
        result = await transactionService.getUserTransactionsByDateRange(
          userId,
          startDateIran,
          startDateIran,
          status as string,
          parseInt(page as string),
          parseInt(limit as string)
        );
      }
      // اگر فقط end_date داشته باشیم (تاریخ پایان)
      else if (!startDateIran && endDateIran) {
        result = await transactionService.getUserTransactionsByDateRange(
          userId,
          endDateIran,
          endDateIran,
          status as string,
          parseInt(page as string),
          parseInt(limit as string)
        );
      }
      // اگر تاریخ مشخص شده باشد (برای سازگاری با نسخه قبلی)
      else if (date) {
        let dateIran = date as string;
        try {
          const dateMoment = moment.tz(date as string, 'Asia/Tehran');
          dateIran = dateMoment.format('YYYY-MM-DD');
        } catch (e) {
          dateIran = date as string;
        }
        result = await transactionService.getUserTransactionsByDate(
          userId,
          dateIran,
          status as string,
          parseInt(page as string),
          parseInt(limit as string)
        );
      } 
      // بدون فیلتر تاریخ
      else {
        result = await transactionService.getUserTransactions(
          userId,
          status as string,
          parseInt(page as string),
          parseInt(limit as string)
        );
      }
      
      res.json({
        success: true,
        data: result.transactions,
        pagination: result.pagination
      });
    } catch (err: any) {
      console.error('خطا در دریافت تراکنش‌های کاربر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // دریافت تراکنش‌های در انتظار کاربر (برای بررسی انقضا)
  async getUserPendingTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const transactions = await transactionService.getUserPendingTransactions(userId);
      
      res.json({
        success: true,
        data: transactions
      });
    } catch (err: any) {
      console.error('خطا در دریافت تراکنش‌های در انتظار کاربر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getTimer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const timer = await transactionService.getTimer();
      res.json({ success: true, timer });
    } catch (err: any) {
      console.error('خطا در دریافت تایمر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==================== برای ادمین ====================
  
  async getPendingCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const count = await transactionService.getPendingCount();
      
      res.json({
        success: true,
        data: { count }
      });
    } catch (err: any) {
      console.error('خطا در دریافت تعداد تراکنش‌های در انتظار:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAllTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { start_date, end_date, user_id, status, product_code, page = 1, limit = 50 } = req.query;
      
      let query = `
        SELECT 
          t.id,
          t.user_id,
          t.product_code,
          t.display_name,
          t.type,
          t.coin_quantity,
          t.melted_weight,
          t.amount,
          t.transaction_price,
          t.base_price,
          t.applied_offset,
          t.status,
          t.created_at,
          t.updated_at,
          u.first_name,
          u.last_name,
          u.mobile_number,
          u.code as user_code
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (start_date && end_date) {
        query += ` AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tehran') BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(start_date, end_date);
        paramIndex += 2;
      } else if (start_date) {
        query += ` AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tehran') >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      } else if (end_date) {
        query += ` AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tehran') <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      if (user_id) {
        query += ` AND t.user_id = $${paramIndex}`;
        params.push(parseInt(user_id as string));
        paramIndex++;
      }

      if (status) {
        query += ` AND t.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (product_code) {
        query += ` AND t.product_code LIKE $${paramIndex}`;
        params.push(`${product_code}%`);
        paramIndex++;
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), offset);

      const result = await pool.query(query, params);
      
      let countQuery = `SELECT COUNT(*) as total FROM transactions t WHERE 1=1`;
      const countParams: any[] = [];
      let countIndex = 1;

      if (start_date && end_date) {
        countQuery += ` AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tehran') BETWEEN $${countIndex} AND $${countIndex + 1}`;
        countParams.push(start_date, end_date);
        countIndex += 2;
      } else if (start_date) {
        countQuery += ` AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tehran') >= $${countIndex}`;
        countParams.push(start_date);
        countIndex++;
      } else if (end_date) {
        countQuery += ` AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tehran') <= $${countIndex}`;
        countParams.push(end_date);
        countIndex++;
      }

      if (user_id) {
        countQuery += ` AND t.user_id = $${countIndex}`;
        countParams.push(parseInt(user_id as string));
        countIndex++;
      }

      if (status) {
        countQuery += ` AND t.status = $${countIndex}`;
        countParams.push(status);
        countIndex++;
      }

      if (product_code) {
        countQuery += ` AND t.product_code LIKE $${countIndex}`;
        countParams.push(`${product_code}%`);
        countIndex++;
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0]?.total || '0');

      const formattedTransactions = result.rows.map((tx: any) => ({
        id: tx.id,
        user_id: tx.user_id,
        product_code: tx.product_code,
        display_name: tx.display_name,
        type: tx.type === 'خرید' ? 'خرید' : 'فروش',
        coin_quantity: tx.coin_quantity ? parseInt(tx.coin_quantity) : null,
        melted_weight: tx.melted_weight ? parseFloat(tx.melted_weight) : null,
        amount: parseInt(tx.amount) || 0,
        transaction_price: tx.transaction_price ? parseFloat(tx.transaction_price) : null,
        status: tx.status,
        created_at: tx.created_at,
        user_info: {
          first_name: tx.first_name,
          last_name: tx.last_name,
          mobile_number: tx.mobile_number,
          full_name: `${tx.first_name || ''} ${tx.last_name || ''}`.trim() || 'کاربر',
          code: tx.user_code
        }
      }));

      res.json({
        success: true,
        data: formattedTransactions,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (err: any) {
      console.error('خطا در دریافت تراکنش‌ها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateTransactionStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (status !== 'approved' && status !== 'rejected') {
        res.status(400).json({ success: false, error: 'وضعیت نامعتبر است' });
        return;
      }
      
      const transaction = await transactionService.updateTransactionStatus(parseInt(id), status);
      
      if (!transaction) {
        res.status(404).json({ success: false, error: 'تراکنش یافت نشد یا قبلاً پردازش شده است' });
        return;
      }
      
      // دریافت اطلاعات کاربر برای ارسال در Socket.IO
      const userResult = await pool.query(
        'SELECT first_name, last_name, code, mobile_number FROM users WHERE id = $1',
        [transaction.user_id]
      );
      const user = userResult.rows[0] || {};
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code || 'کاربر';
      
      // ایجاد payload کامل با اطلاعات کاربر
      const payload = {
        ...transaction,
        user_name: fullName,
        user: {
          id: transaction.user_id,
          full_name: fullName,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          code: user.code || '',
          mobile_number: user.mobile_number || ''
        }
      };
      
      const io = req.app.get('io');
      if (io) {
        io.emit('transaction_update', payload);
        io.to(`user_${transaction.user_id}`).emit('transaction_update', payload);
        io.to('admin_room').emit('transaction_update', payload);
      }
      
      res.json({
        success: true,
        message: `وضعیت تراکنش به ${status} تغییر یافت`,
        data: transaction
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی وضعیت تراکنش:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        type, 
        status, 
        amount, 
        transaction_price, 
        coin_quantity, 
        melted_weight,
        product_code,
        display_name 
      } = req.body;
      
      console.log('✏️ ویرایش تراکنش توسط ادمین:', { 
        id, 
        type, 
        status, 
        amount, 
        transaction_price, 
        coin_quantity, 
        melted_weight,
        product_code,
        display_name 
      });
      
      // دریافت تراکنش فعلی
      const currentTx = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
      if (currentTx.rows.length === 0) {
        res.status(404).json({ success: false, error: 'تراکنش یافت نشد' });
        return;
      }
      
      const tx = currentTx.rows[0];
      
      // ساخت کوئری به‌روزرسانی
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (type !== undefined && type !== tx.type) {
        updates.push(`type = $${paramIndex++}`);
        values.push(type);
      }
      if (status !== undefined && status !== tx.status) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (amount !== undefined && amount !== tx.amount && amount > 0) {
        updates.push(`amount = $${paramIndex++}`);
        values.push(Math.floor(amount));
      }
      if (transaction_price !== undefined && transaction_price !== tx.transaction_price && transaction_price > 0) {
        updates.push(`transaction_price = $${paramIndex++}`);
        values.push(Math.floor(transaction_price));
      }
      if (coin_quantity !== undefined && coin_quantity !== tx.coin_quantity) {
        const parsedCoin = parseInt(coin_quantity);
        if (!isNaN(parsedCoin) && parsedCoin > 0) {
          updates.push(`coin_quantity = $${paramIndex++}`);
          values.push(parsedCoin);
        } else {
          console.warn(`مقدار نامعتبر برای coin_quantity: ${coin_quantity}`);
        }
      }
      if (melted_weight !== undefined && melted_weight !== tx.melted_weight && melted_weight > 0) {
        updates.push(`melted_weight = $${paramIndex++}`);
        values.push(parseFloat(melted_weight));
      }
      if (product_code !== undefined && product_code !== tx.product_code) {
        updates.push(`product_code = $${paramIndex++}`);
        values.push(product_code);
      }
      if (display_name !== undefined && display_name !== tx.display_name) {
        updates.push(`display_name = $${paramIndex++}`);
        values.push(display_name);
      }
      
      if (updates.length === 0) {
        res.json({ success: true, message: 'تغییری اعمال نشد', data: tx });
        return;
      }
      
      updates.push(`updated_at = NOW()`);
      values.push(id);
      
      const query = `
        UPDATE transactions 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      const updatedTransaction = result.rows[0];
      
      // دریافت اطلاعات کاربر برای پاسخ
      const userInfo = await pool.query(
        'SELECT first_name, last_name, mobile_number, code FROM users WHERE id = $1',
        [updatedTransaction.user_id]
      );
      const user = userInfo.rows[0] || {};
      
      // فرمت کردن پاسخ
      const formattedTransaction = {
        id: updatedTransaction.id,
        user_id: updatedTransaction.user_id,
        product_code: updatedTransaction.product_code,
        display_name: updatedTransaction.display_name,
        type: updatedTransaction.type,
        coin_quantity: updatedTransaction.coin_quantity ? parseInt(updatedTransaction.coin_quantity) : null,
        melted_weight: updatedTransaction.melted_weight ? parseFloat(updatedTransaction.melted_weight) : null,
        amount: parseInt(updatedTransaction.amount) || 0,
        transaction_price: updatedTransaction.transaction_price ? parseFloat(updatedTransaction.transaction_price) : null,
        status: updatedTransaction.status,
        created_at: updatedTransaction.created_at,
        updated_at: updatedTransaction.updated_at,
        user_info: {
          first_name: user.first_name,
          last_name: user.last_name,
          mobile_number: user.mobile_number,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'کاربر',
          code: user.code
        }
      };
      
      // ارسال از طریق Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.emit('transaction_updated', formattedTransaction);
        io.to(`user_${updatedTransaction.user_id}`).emit('transaction_updated', formattedTransaction);
        io.to('admin_room').emit('transaction_updated', formattedTransaction);
      }
      
      res.json({
        success: true,
        message: 'تراکنش با موفقیت به‌روزرسانی شد',
        data: formattedTransaction
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی تراکنش:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateTimer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { timer } = req.body;
      
      if (!timer || timer < 5 || timer > 300) {
        res.status(400).json({ success: false, error: 'تایمر باید بین ۵ تا ۳۰۰ ثانیه باشد' });
        return;
      }
      
      await transactionService.updateTimer(timer);
      
      const io = req.app.get('io');
      if (io) {
        io.emit('timer_update', { timer, updated_at: new Date().toISOString() });
      }
      
      res.json({
        success: true,
        message: 'تایمر با موفقیت به‌روزرسانی شد',
        timer
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی تایمر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==================== معامله دستی (ادمین) ====================
  async createManualTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const {
        user_id,
        product_code,
        type,
        amount,
        transaction_price,
        coin_quantity,
        melted_weight,
        status = 'approved'
      } = req.body;

      // بررسی صحت داده‌های ورودی
      if (!user_id || !product_code || !type || !amount || amount <= 0) {
        res.status(400).json({ 
          success: false, 
          error: 'داده‌های الزامی: user_id، product_code، type، amount' 
        });
        return;
      }

      // بررسی نوع معامله
      if (!['buy', 'sell', 'خرید', 'فروش'].includes(type)) {
        res.status(400).json({ 
          success: false, 
          error: 'نوع معامله باید "خرید" یا "فروش" باشد' 
        });
        return;
      }

      // بررسی کد محصول
      if (!product_code.startsWith('AB_') && !product_code.startsWith('COIN_')) {
        res.status(400).json({ 
          success: false, 
          error: 'کد محصول باید با AB_ (آبشده) یا COIN_ (سکه) شروع شود' 
        });
        return;
      }

      // بررسی وجود کاربر
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
      if (userCheck.rows.length === 0) {
        res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
        return;
      }

      // بررسی وجود محصول (بر اساس جدول مختص)
      let productTable = '';
      if (product_code.startsWith('AB_')) {
        productTable = 'melted_products';
      } else if (product_code.startsWith('COIN_')) {
        productTable = 'coins';
      }

      const productCheck = await pool.query(`SELECT code FROM ${productTable} WHERE code = $1`, [product_code]);
      if (productCheck.rows.length === 0) {
        res.status(404).json({ success: false, error: 'محصول یافت نشد' });
        return;
      }

      // تبدیل نوع به فارسی
      let persianType: 'خرید' | 'فروش';
      if (type === 'buy' || type === 'خرید') {
        persianType = 'خرید';
      } else {
        persianType = 'فروش';
      }

      // دریافت نام محصول
      let displayNameColumn = 'name';
      if (productTable === 'melted_products') {
        displayNameColumn = 'COALESCE(default_display_name, name)';
      }
      
      const productResult = await pool.query(
        `SELECT ${displayNameColumn} as display_name FROM ${productTable} WHERE code = $1`,
        [product_code]
      );
      const displayName = productResult.rows[0]?.display_name || product_code;

      // دریافت وقت ایران برای ذخیره‌سازی
      const iranTime = moment().tz('Asia/Tehran').format('YYYY-MM-DD HH:mm:ss');

      // ایجاد تراکنش دستی
      const insertQuery = `
        INSERT INTO transactions (
          user_id,
          product_code,
          display_name,
          type,
          coin_quantity,
          melted_weight,
          amount,
          transaction_price,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
        RETURNING *
      `;

      const values = [
        user_id,
        product_code,
        displayName,
        persianType,
        coin_quantity || null,
        melted_weight || null,
        Math.floor(amount),
        transaction_price ? Math.floor(transaction_price) : null,
        status,
        iranTime
      ];

      const result = await pool.query(insertQuery, values);
      const transaction = result.rows[0];

      // دریافت اطلاعات کاربر
      const userInfo = await pool.query(
        'SELECT first_name, last_name, mobile_number, code FROM users WHERE id = $1',
        [user_id]
      );
      const user = userInfo.rows[0] || {};

      // فرمت کردن پاسخ
      const formattedTransaction = {
        id: transaction.id,
        user_id: transaction.user_id,
        product_code: transaction.product_code,
        display_name: transaction.display_name,
        type: transaction.type,
        coin_quantity: transaction.coin_quantity ? parseInt(transaction.coin_quantity) : null,
        melted_weight: transaction.melted_weight ? parseFloat(transaction.melted_weight) : null,
        amount: parseInt(transaction.amount) || 0,
        transaction_price: transaction.transaction_price ? parseFloat(transaction.transaction_price) : null,
        status: transaction.status,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
        is_manual: true,
        user_info: {
          first_name: user.first_name,
          last_name: user.last_name,
          mobile_number: user.mobile_number,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'کاربر',
          code: user.code
        }
      };

      // دریافت اطلاعات کاربر برای ارسال در Socket.IO
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code || 'کاربر';
      
      // ایجاد payload کامل با اطلاعات کاربر
      const payload = {
        ...formattedTransaction,
        user_name: fullName,
        user: {
          id: user_id,
          full_name: fullName,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          code: user.code || '',
          mobile_number: user.mobile_number || ''
        }
      };

      // ارسال از طریق Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.emit('new_transaction', payload);
        io.to('admin_room').emit('new_transaction', payload);
        io.to(`user_${user_id}`).emit('new_transaction', payload);
      }

      res.status(201).json({
        success: true,
        message: 'معامله دستی با موفقیت ثبت شد',
        data: formattedTransaction
      });
    } catch (err: any) {
      console.error('خطا در ایجاد معامله دستی:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const transactionController = new TransactionController();