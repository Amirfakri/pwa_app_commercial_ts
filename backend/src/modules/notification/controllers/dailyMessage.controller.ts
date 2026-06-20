import { Response } from 'express';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';
import { dailyMessageService } from '../services/dailyMessage.service';

export class DailyMessageController {
  // دریافت پیام روزانه فعال (برای کاربر عادی)
  async getActiveMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const message = await dailyMessageService.getActiveMessage();
      res.json({ success: true, data: message });
    } catch (err: any) {
      console.error('خطا در دریافت پیام فعال:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // دریافت همه پیام‌ها (برای ادمین)
  async getAllMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { is_active, page = 1, limit = 50 } = req.query;
      
      const result = await dailyMessageService.getAllMessages({
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.json({
        success: true,
        data: result.messages,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string))
        }
      });
    } catch (err: any) {
      console.error('خطا در دریافت پیام‌ها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const message = await dailyMessageService.createMessage(req.body, adminId);
      
      // ارسال از طریق Socket.IO به همه کاربران آنلاین
      const io = req.app.get('io');
      if (io) {
        io.emit('daily_message_updated', message);
      }
      
      res.status(201).json({
        success: true,
        message: 'پیام روزانه با موفقیت ایجاد شد',
        data: message
      });
    } catch (err: any) {
      console.error('خطا در ایجاد پیام:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const message = await dailyMessageService.updateMessage(parseInt(id), req.body);
      
      if (!message) {
        res.status(404).json({ success: false, error: 'پیام یافت نشد' });
        return;
      }
      
      // ارسال از طریق Socket.IO به همه کاربران آنلاین
      const io = req.app.get('io');
      if (io) {
        io.emit('daily_message_updated', message);
      }
      
      res.json({
        success: true,
        message: 'پیام روزانه با موفقیت به‌روزرسانی شد',
        data: message
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی پیام:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await dailyMessageService.deleteMessage(parseInt(id));
      
      if (!deleted) {
        res.status(404).json({ success: false, error: 'پیام یافت نشد' });
        return;
      }
      
      res.json({ success: true, message: 'پیام روزانه با موفقیت حذف شد' });
    } catch (err: any) {
      console.error('خطا در حذف پیام:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const dailyMessageController = new DailyMessageController();