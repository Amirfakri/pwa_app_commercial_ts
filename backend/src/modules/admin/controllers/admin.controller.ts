// backend/src/modules/admin/controllers/admin.controller.ts

import { Request, Response } from 'express';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';
import { adminService } from '../services/admin.service';
import { pool } from '../../../core/database/postgres';

export class AdminController {
  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search, is_blocked, page = 1, limit = 50 } = req.query;
      
      console.log('📋 دریافت لیست کاربران توسط ادمین:', req.user?.id);
      
      const result = await adminService.getAllUsers({
        search: search as string,
        is_blocked: is_blocked === 'true' ? true : is_blocked === 'false' ? false : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      const adminUsers = result.users.filter(u => u.is_admin === true);
      if (adminUsers.length > 0) {
        console.log('⚠️ اخطار: ادمین‌ها در لیست کاربران وجود دارند:', adminUsers.map(u => ({ id: u.id, code: u.code, is_admin: u.is_admin })));
      }
      
      console.log(`✅ ${result.users.length} کاربر یافت شد (ادمین‌ها: ${adminUsers.length})`);
      
      const formattedUsers = result.users.map((user: any) => ({
        id: user.id,
        mobile_number: user.mobile_number,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        code: user.code,
        is_admin: user.is_admin,
        is_blocked: user.is_blocked,
        device_limit: user.device_limit,
        melted_price_offset: user.melted_price_offset,
        coin_price_offset: user.coin_price_offset,
        created_at: user.created_at
      }));
      
      res.json({
        success: true,
        data: formattedUsers,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string))
        }
      });
    } catch (err: any) {
      console.error('خطا در دریافت کاربران:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { mobile_number, first_name, last_name } = req.body;
      
      if (!mobile_number) {
        res.status(400).json({ success: false, error: 'شماره موبایل الزامی است' });
        return;
      }
      
      const user = await adminService.createUser({
        mobile_number,
        first_name: first_name || 'کاربر',
        last_name: last_name || 'جدید'
      });
      
      res.status(201).json({
        success: true,
        message: 'کاربر با موفقیت ایجاد شد',
        data: user
      });
    } catch (err: any) {
      console.error('خطا در ایجاد کاربر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        code,
        is_blocked, 
        first_name, 
        last_name, 
        device_limit, 
        melted_price_offset, 
        coin_price_offset 
      } = req.body;
      
      // بررسی اینکه کاربر وجود دارد
      const currentUser = await adminService.getUserById(parseInt(id));
      if (!currentUser) {
        res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
        return;
      }
      
      // اگر کد کاربر تغییر کرده، بررسی یکتایی
      if (code && code !== currentUser.code) {
        const existingUser = await adminService.getUserByCode(code);
        if (existingUser) {
          res.status(400).json({ 
            success: false, 
            error: 'کد کاربر قبلاً ثبت شده است' 
          });
          return;
        }
      }
      
      const updated = await adminService.updateUser(parseInt(id), {
        code,
        first_name,
        last_name,
        device_limit,
        melted_price_offset,
        coin_price_offset,
        is_blocked
      });
      
      if (!updated) {
        res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
        return;
      }
      
      res.json({
        success: true,
        message: 'کاربر با موفقیت به‌روزرسانی شد',
        data: updated
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی کاربر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await adminService.deleteUser(parseInt(id));
      if (!deleted) {
        res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
        return;
      }
      res.json({ success: true, message: 'کاربر با موفقیت حذف شد' });
    } catch (err: any) {
      console.error('خطا در حذف کاربر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAdmins(req: AuthRequest, res: Response): Promise<void> {
    try {
      const admins = await adminService.getAllAdmins();
      res.json({ success: true, data: admins });
    } catch (err: any) {
      console.error('خطا در دریافت ادمین‌ها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { mobile_number, first_name, last_name } = req.body;
      
      if (!mobile_number || !first_name || !last_name) {
        res.status(400).json({ success: false, error: 'شماره موبایل، نام و نام خانوادگی الزامی است' });
        return;
      }
      
      const admin = await adminService.createAdmin({ mobile_number, first_name, last_name });
      res.status(201).json({ success: true, message: 'ادمین با موفقیت ایجاد شد', data: admin });
    } catch (err: any) {
      console.error('خطا در ایجاد ادمین:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const updated = await adminService.updateAdmin(parseInt(id), is_active);
      if (!updated) {
        res.status(404).json({ success: false, error: 'ادمین یافت نشد' });
        return;
      }
      res.json({ success: true, message: 'ادمین با موفقیت به‌روزرسانی شد', data: updated });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی ادمین:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await adminService.deleteAdmin(parseInt(id));
      if (!deleted) {
        res.status(404).json({ success: false, error: 'ادمین یافت نشد' });
        return;
      }
      res.json({ success: true, message: 'ادمین با موفقیت حذف شد' });
    } catch (err: any) {
      console.error('خطا در حذف ادمین:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getPendingRegistrations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const registrations = await adminService.getPendingRegistrations();
      res.json({ success: true, data: registrations });
    } catch (err: any) {
      console.error('خطا در دریافت درخواست‌ها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async approveRegistration(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await adminService.approveRegistration(parseInt(id), req.user!.id);
      res.json({ success: true, message: 'ثبت‌نام با موفقیت تایید شد' });
    } catch (err: any) {
      console.error('خطا در تایید ثبت‌نام:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async rejectRegistration(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await adminService.rejectRegistration(parseInt(id), req.user!.id);
      res.json({ success: true, message: 'ثبت‌نام رد شد' });
    } catch (err: any) {
      console.error('خطا در رد ثبت‌نام:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getUserSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sessions = await adminService.getUserSessions(parseInt(id));
      res.json({ success: true, data: sessions });
    } catch (err: any) {
      console.error('خطا در دریافت نشست‌ها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async revokeUserSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const revoked = await adminService.revokeUserSession(parseInt(sessionId));
      if (!revoked) {
        res.status(404).json({ success: false, error: 'نشست یافت نشد' });
        return;
      }
      res.json({ success: true, message: 'نشست با موفقیت باطل شد' });
    } catch (err: any) {
      console.error('خطا در باطل کردن نشست:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async revokeAllUserSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const count = await adminService.revokeAllUserSessions(parseInt(id));
      res.json({ success: true, message: `${count} نشست با موفقیت باطل شد` });
    } catch (err: any) {
      console.error('خطا در باطل کردن نشست‌ها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==================== مدیریت محصولات آبشده (Melted Products) ====================
  async getMeltedProducts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      let query = `
        SELECT id, name, code, min_weight, max_weight, default_display_name, 
               is_active, display_order, created_at
        FROM melted_products WHERE 1=1
      `;
      const params: any[] = [];
      
      if (search) {
        query += ` AND (name ILIKE $1 OR code ILIKE $1)`;
        params.push(`%${search}%`);
      }
      
      query += ` ORDER BY display_order ASC, id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit as string), offset);
      
      const result = await pool.query(query, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (err: any) {
      console.error('خطا در دریافت محصولات آبشده:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createMeltedProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code, name, default_display_name, min_weight, max_weight, display_order, is_active } = req.body;
      
      if (!code || !name) {
        res.status(400).json({ success: false, error: 'کد و نام محصول الزامی است' });
        return;
      }
      
      const result = await pool.query(
        `INSERT INTO melted_products (code, name, default_display_name, min_weight, max_weight, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [code, name, default_display_name, min_weight || 0.001, max_weight || 100, display_order || 0, is_active !== undefined ? is_active : true]
      );
      
      res.status(201).json({
        success: true,
        message: 'محصول با موفقیت ایجاد شد',
        data: result.rows[0]
      });
    } catch (err: any) {
      console.error('خطا در ایجاد محصول:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateMeltedProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, default_display_name, min_weight, max_weight, display_order, is_active } = req.body;
      
      const result = await pool.query(
        `UPDATE melted_products 
         SET name = COALESCE($1, name),
             default_display_name = COALESCE($2, default_display_name),
             min_weight = COALESCE($3, min_weight),
             max_weight = COALESCE($4, max_weight),
             display_order = COALESCE($5, display_order),
             is_active = COALESCE($6, is_active),
             updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [name, default_display_name, min_weight, max_weight, display_order, is_active, id]
      );
      
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'محصول یافت نشد' });
        return;
      }
      
      res.json({
        success: true,
        message: 'محصول با موفقیت به‌روزرسانی شد',
        data: result.rows[0]
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی محصول:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteMeltedProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM melted_products WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'محصول یافت نشد' });
        return;
      }
      
      res.json({ success: true, message: 'محصول با موفقیت حذف شد' });
    } catch (err: any) {
      console.error('خطا در حذف محصول:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==================== مدیریت سکه‌ها (Coins) ====================
  async getCoins(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      let query = `
        SELECT id, name, code, min_count, max_count, is_active, display_order, created_at
        FROM coins WHERE 1=1
      `;
      const params: any[] = [];
      
      if (search) {
        query += ` AND (name ILIKE $1 OR code ILIKE $1)`;
        params.push(`%${search}%`);
      }
      
      query += ` ORDER BY display_order ASC, id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit as string), offset);
      
      const result = await pool.query(query, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (err: any) {
      console.error('خطا در دریافت سکه‌ها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createCoin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code, name, min_count, max_count, display_order, is_active } = req.body;
      
      if (!code || !name) {
        res.status(400).json({ success: false, error: 'کد و نام سکه الزامی است' });
        return;
      }
      
      const result = await pool.query(
        `INSERT INTO coins (code, name, min_count, max_count, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [code, name, min_count || 1, max_count || 50, display_order || 0, is_active !== undefined ? is_active : true]
      );
      
      res.status(201).json({
        success: true,
        message: 'سکه با موفقیت ایجاد شد',
        data: result.rows[0]
      });
    } catch (err: any) {
      console.error('خطا در ایجاد سکه:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateCoin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, min_count, max_count, display_order, is_active } = req.body;
      
      const result = await pool.query(
        `UPDATE coins 
         SET name = COALESCE($1, name),
             min_count = COALESCE($2, min_count),
             max_count = COALESCE($3, max_count),
             display_order = COALESCE($4, display_order),
             is_active = COALESCE($5, is_active),
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [name, min_count, max_count, display_order, is_active, id]
      );
      
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'سکه یافت نشد' });
        return;
      }
      
      res.json({
        success: true,
        message: 'سکه با موفقیت به‌روزرسانی شد',
        data: result.rows[0]
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی سکه:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteCoin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM coins WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'سکه یافت نشد' });
        return;
      }
      
      res.json({ success: true, message: 'سکه با موفقیت حذف شد' });
    } catch (err: any) {
      console.error('خطا در حذف سکه:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==================== مدیریت تایمر تراکنش ====================
  async getTimer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await pool.query('SELECT value, updated_at FROM timer WHERE id = 1');
      
      let timerValue = 30;
      let updatedAt = null;
      
      if (result.rows.length > 0) {
        timerValue = parseInt(result.rows[0].value);
        if (isNaN(timerValue) || timerValue < 5 || timerValue > 300) {
          timerValue = 30;
        }
        updatedAt = result.rows[0].updated_at;
      }
      
      res.json({
        success: true,
        data: {
          value: timerValue,
          updated_at: updatedAt,
          unit: 'seconds'
        }
      });
    } catch (err: any) {
      console.error('خطا در دریافت تایمر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateTimer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { value } = req.body;
      
      if (value === undefined || value === null) {
        res.status(400).json({ success: false, error: 'مقدار تایمر الزامی است' });
        return;
      }
      
      const timerValue = parseInt(value);
      if (isNaN(timerValue) || timerValue < 5 || timerValue > 300) {
        res.status(400).json({ success: false, error: 'تایمر باید بین ۵ تا ۳۰۰ ثانیه باشد' });
        return;
      }
      
      await pool.query(
        `INSERT INTO timer (id, value, updated_at) VALUES (1, $1, NOW())
         ON CONFLICT (id) DO UPDATE SET value = $1, updated_at = NOW()`,
        [timerValue]
      );
      
      // به‌روزرسانی تایمر در transaction service
      const { transactionService } = await import('../../transaction/services/transaction.service');
      await transactionService.updateTimer(timerValue);
      
      // ارسال رویداد Socket.IO برای به‌روزرسانی تایمر
      const io = req.app.get('io');
      if (io) {
        io.emit('timer_updated', {
          value: timerValue,
          updated_at: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        message: `تایمر با موفقیت به ${timerValue} ثانیه تغییر کرد`,
        data: { value: timerValue }
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی تایمر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const adminController = new AdminController();