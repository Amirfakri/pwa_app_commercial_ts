import { Response } from 'express';
import { rizService } from '../services/riz.service';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';

export class RizController {
  // دریافت مانده حساب کاربر جاری
  async getMyBalance(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📨 getMyBalance - req.user:', req.user);
      
      const userCode = req.user?.code;
      
      if (!userCode) {
        res.status(401).json({ success: false, error: 'احراز هویت نشده' });
        return;
      }

      const balance = await rizService.getUserBalance(userCode);

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

  // دریافت تراکنش‌های کاربر جاری
  async getMyTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userCode = req.user?.code;
      
      if (!userCode) {
        res.status(401).json({ success: false, error: 'احراز هویت نشده' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await rizService.getUserTransactions(userCode, page, limit);

      const formattedTransactions = result.transactions.map(tx => ({
        id: tx.id,
        document_no: tx.document_no,
        invoice_no: tx.invoice_no,
        date: tx.date ? new Date(tx.date).toLocaleDateString('fa-IR') : null,
        description: tx.description,
        weight: tx.weight,
        weight_debit: tx.weight_debit,
        weight_credit: tx.weight_credit,
        rate: tx.rate,
        wage: tx.wage,
        balance_weight: tx.balance_weight,
        debit_amount: tx.debit_amount,
        credit_amount: tx.credit_amount,
        balance_amount: tx.balance_amount,
      }));

      res.json({
        success: true,
        data: formattedTransactions,
        pagination: result.pagination
      });
    } catch (err: any) {
      console.error('خطا در دریافت تراکنش‌های کاربر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // دریافت خلاصه همه مشتریان (برای ادمین)
  async getCustomerSummaries(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const summaries = await rizService.getCustomerSummaries();
      
      res.json({
        success: true,
        data: summaries,
        total: summaries.length,
        overall_stats: {
          total_customers: summaries.length,
          total_positive_rial: summaries.filter(s => s.final_amount_balance > 0).length,
          total_negative_rial: summaries.filter(s => s.final_amount_balance < 0).length,
          total_zero_rial: summaries.filter(s => s.final_amount_balance === 0).length,
          total_positive_gold: summaries.filter(s => s.final_weight_balance > 0).length,
          total_negative_gold: summaries.filter(s => s.final_weight_balance < 0).length,
          total_zero_gold: summaries.filter(s => s.final_weight_balance === 0).length
        }
      });
    } catch (err: any) {
      console.error('خطا در دریافت خلاصه مشتریان:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // دریافت لیست کاربران برای جستجو (برای ادمین)
  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const users = await rizService.getAllUsers();
      res.json({
        success: true,
        data: users,
        total: users.length
      });
    } catch (err: any) {
      console.error('خطا در دریافت لیست کاربران:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // دریافت تراکنش‌های یک کاربر خاص (برای ادمین)
  async getUserTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const { user_code } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!user_code) {
        res.status(400).json({ success: false, error: 'کد کاربر الزامی است' });
        return;
      }

      const result = await rizService.getUserTransactions(user_code, page, limit);
      
      const formattedTransactions = result.transactions.map(tx => ({
        id: tx.id,
        document_no: tx.document_no,
        invoice_no: tx.invoice_no,
        date: tx.date ? new Date(tx.date).toLocaleDateString('fa-IR') : null,
        description: tx.description,
        weight: tx.weight,
        weight_debit: tx.weight_debit,
        weight_credit: tx.weight_credit,
        rate: tx.rate,
        wage: tx.wage,
        balance_weight: tx.balance_weight,
        debit_amount: tx.debit_amount,
        credit_amount: tx.credit_amount,
        balance_amount: tx.balance_amount,
      }));
      
      res.json({ 
        success: true, 
        data: formattedTransactions, 
        pagination: result.pagination 
      });
    } catch (err: any) {
      console.error('خطا در دریافت تراکنش‌ها:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // آپلود ریزحساب (برای ادمین)
  async uploadRiz(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const { rizData, user_code } = req.body;

      if (!rizData || !Array.isArray(rizData)) {
        res.status(400).json({ success: false, error: 'داده‌های ریزحساب نامعتبر است' });
        return;
      }

      if (!user_code) {
        res.status(400).json({ success: false, error: 'کد کاربر الزامی است' });
        return;
      }

      const result = await rizService.uploadRizData(rizData, user_code);
      res.json({ success: true, message: `✅ ${result.inserted} رکورد با موفقیت آپلود شد` });
    } catch (err: any) {
      console.error('خطا در آپلود ریزحساب:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // حذف یک رکورد (برای ادمین)
  async deleteRecord(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const { id } = req.params;
      const deleted = await rizService.deleteRecord(parseInt(id));

      if (!deleted) {
        res.status(404).json({ success: false, error: 'رکورد یافت نشد' });
        return;
      }

      res.json({ success: true, message: 'رکورد با موفقیت حذف شد' });
    } catch (err: any) {
      console.error('خطا در حذف رکورد:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // حذف همه تراکنش‌های یک کاربر (برای ادمین)
  async deleteAllUserRecords(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
        return;
      }

      const { user_code } = req.params;
      
      if (!user_code) {
        res.status(400).json({ success: false, error: 'کد کاربر الزامی است' });
        return;
      }

      const deletedCount = await rizService.deleteAllUserRecords(user_code);
      res.json({ success: true, message: `${deletedCount} تراکنش حذف شد` });
    } catch (err: any) {
      console.error('خطا در حذف تراکنش‌های کاربر:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const rizController = new RizController();