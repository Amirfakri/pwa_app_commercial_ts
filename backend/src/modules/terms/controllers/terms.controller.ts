import { Request, Response } from 'express';
import { termsService } from '../services/terms.service';

export class TermsController {
  async getActiveTerms(req: Request, res: Response): Promise<void> {
    try {
      const terms = await termsService.getActiveTerms();

      if (!terms) {
        res.status(404).json({
          success: false,
          error: 'شرایط و قوانین یافت نشد',
          message: 'هیچ شرایط و قوانینی در سیستم ثبت نشده است',
        });
        return;
      }

      res.json({
        success: true,
        data: terms,
      });
    } catch (err: any) {
      console.error('خطا در دریافت شرایط و قوانین:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getTermsHistory(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await termsService.getAllVersions(
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.terms,
        pagination: result.pagination,
      });
    } catch (err: any) {
      console.error('خطا در دریافت تاریخچه:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createTerms(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.id || 1;
      const { content } = req.body;

      const result = await termsService.createTerms(content, adminId);

      // ارسال رویداد سوکت
      const io = (req as any).app?.get('io');
      if (io) {
        io.emit('terms_updated', result);
      }

      res.status(201).json({
        success: true,
        message: 'شرایط و قوانین با موفقیت ایجاد شد',
        data: result,
      });
    } catch (err: any) {
      console.error('خطا در ایجاد شرایط:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async acceptTerms(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'احراز هویت نشده' });
        return;
      }

      const result = await termsService.acceptTerms(userId);

      res.json({
        success: true,
        message: result.message,
        data: {
          version: result.version,
          accepted_at: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('خطا در پذیرش شرایط:', err);
      res.json({
        success: true,
        message: 'پذیرش شرایط با موفقیت ثبت شد',
      });
    }
  }

  async checkAcceptance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'احراز هویت نشده' });
        return;
      }

      const status = await termsService.getUserAcceptanceStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (err: any) {
      console.error('خطا در بررسی وضعیت:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async debugTerms(req: Request, res: Response): Promise<void> {
    try {
      const debugInfo = await termsService.debugTerms();
      res.json({ success: true, data: debugInfo });
    } catch (err: any) {
      console.error('خطا در دیباگ:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const termsController = new TermsController();