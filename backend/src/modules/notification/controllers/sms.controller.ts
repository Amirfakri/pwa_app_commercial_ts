import { Response } from 'express';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';
import { smsService } from '../services/sms.service';

export class SmsController {
  async sendSms(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const result = await smsService.sendSms(req.body, adminId);
      res.json(result);
    } catch (err: any) {
      console.error('خطا در ارسال پیامک:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async sendBulkSms(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const result = await smsService.sendBulkSms(req.body, adminId);
      res.json(result);
    } catch (err: any) {
      console.error('خطا در ارسال گروهی:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getSmsLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 50, status } = req.query;
      const result = await smsService.getSmsLogs({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
      });

      res.json({
        success: true,
        data: result.logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string)),
        },
      });
    } catch (err: any) {
      console.error('خطا در دریافت لاگ‌ها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async searchCustomers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { q, limit = 50 } = req.query;
      
      if (!q || (q as string).length < 2) {
        res.json({ success: true, data: [] });
        return;
      }

      const customers = await smsService.searchCustomers(q as string, parseInt(limit as string));
      
      const formattedCustomers = customers.map(c => ({
        id: c.id,
        code: c.code,
        full_name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.code,
        mobile_number: c.mobile_number,
      }));

      res.json({ success: true, data: formattedCustomers });
    } catch (err: any) {
      console.error('خطا در جستجوی مشتریان:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getCustomerBalance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const balance = await smsService.getCustomerBalance(parseInt(id));

      if (!balance) {
        res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
        return;
      }

      res.json({ success: true, data: balance });
    } catch (err: any) {
      console.error('خطا در دریافت مانده حساب:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const smsController = new SmsController();