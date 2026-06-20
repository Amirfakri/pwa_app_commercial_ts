// backend/src/modules/timer/controllers/timer.controller.ts
import { Response } from 'express';
import { timerService } from '../services/timer.service';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';
import { pool } from '../../../core/database/postgres';

export class TimerController {
  async getTimerByTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'احراز هویت نشده' });
        return;
      }

      const timer = await timerService.getTimerByTransactionId(parseInt(transactionId));
      
      if (!timer) {
        res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
        return;
      }

      if (timer.user_id !== userId && !req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز' });
        return;
      }

      const response = await timerService.getTimerResponse(timer);
      
      res.json({
        success: true,
        data: response
      });
    } catch (err: any) {
      console.error('خطا در دریافت تایمر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getUserTimers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'احراز هویت نشده' });
        return;
      }

      const timers = await timerService.getUserActiveTimers(userId);
      const responses = await Promise.all(timers.map(t => timerService.getTimerResponse(t)));
      
      res.json({
        success: true,
        data: responses
      });
    } catch (err: any) {
      console.error('خطا در دریافت تایمرهای کاربر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAllTimers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;

      const result = await timerService.getAllTimers(page, limit, status);
      
      // دریافت اطلاعات کاربران برای هر تایمر
      const formattedTimers = await Promise.all(
        result.timers.map(async (timer: any) => {
          // دریافت اطلاعات کاربر از دیتابیس
          const userResult = await pool.query(
            `SELECT first_name, last_name, code FROM users WHERE id = $1`,
            [timer.user_id]
          );
          const user = userResult.rows[0];
          
          const response = await timerService.getTimerResponse(timer);
          return {
            ...response,
            user_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code || 'کاربر' : 'کاربر',
            user_code: user?.code || '-'
          };
        })
      );
      
      res.json({
        success: true,
        data: formattedTimers,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit)
        }
      });
    } catch (err: any) {
      console.error('خطا در دریافت لیست تایمرها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getTimerStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const stats = await timerService.getTimerStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (err: any) {
      console.error('خطا در دریافت آمار تایمرها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createTimer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { transaction_id, initial_seconds } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'احراز هویت نشده' });
        return;
      }

      if (!transaction_id) {
        res.status(400).json({ success: false, error: 'شناسه تراکنش الزامی است' });
        return;
      }

      const timer = await timerService.createTimer(
        transaction_id,
        userId,
        initial_seconds || 30
      );

      const response = await timerService.getTimerResponse(timer);
      
      res.status(201).json({
        success: true,
        message: 'تایمر با موفقیت ایجاد شد',
        data: response
      });
    } catch (err: any) {
      console.error('خطا در ایجاد تایمر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async decrementTimer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { seconds = 1 } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'احراز هویت نشده' });
        return;
      }

      const timer = await timerService.getTimerById(parseInt(id));
      
      if (!timer) {
        res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
        return;
      }

      if (timer.user_id !== userId && !req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز' });
        return;
      }

      const updatedTimer = await timerService.decrementTimer(parseInt(id), seconds);
      
      if (!updatedTimer) {
        res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
        return;
      }

      const response = await timerService.getTimerResponse(updatedTimer);
      
      res.json({
        success: true,
        data: response
      });
    } catch (err: any) {
      console.error('خطا در کاهش تایمر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async expireTimer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const timer = await timerService.expireTimer(parseInt(id));
      
      if (!timer) {
        res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
        return;
      }

      const response = await timerService.getTimerResponse(timer);
      
      res.json({
        success: true,
        message: 'تایمر با موفقیت منقضی شد',
        data: response
      });
    } catch (err: any) {
      console.error('خطا در انقضای تایمر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteTimer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const deleted = await timerService.deleteTimer(parseInt(id));
      
      if (!deleted) {
        res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
        return;
      }

      res.json({
        success: true,
        message: 'تایمر با موفقیت حذف شد'
      });
    } catch (err: any) {
      console.error('خطا در حذف تایمر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteTimerByTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const deleted = await timerService.deleteTimerByTransactionId(parseInt(transactionId));
      
      if (!deleted) {
        res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
        return;
      }

      res.json({
        success: true,
        message: 'تایمر با موفقیت حذف شد'
      });
    } catch (err: any) {
      console.error('خطا در حذف تایمر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const timerController = new TimerController();