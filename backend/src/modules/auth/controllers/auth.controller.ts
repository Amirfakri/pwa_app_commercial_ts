// backend/src/modules/auth/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sessionService } from '../services/session.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AuthController {
  
  async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { mobile } = req.body;

      if (!mobile) {
        res.status(400).json({ error: 'شماره موبایل الزامی است' });
        return;
      }

      const result = await authService.sendOtp(mobile);

      console.log(`📱 OTP برای ${mobile}: ${result.otp} (${result.userInfo?.isAdmin ? 'ادمین' : 'کاربر'})`);

      res.json({
        success: true,
        message: 'کد تأیید با موفقیت ارسال شد',
        ...(process.env.NODE_ENV !== 'production' && { otp: result.otp }),
        isNewUser: result.isNewUser,
        isAdmin: result.userInfo?.isAdmin || false,
        user: result.userInfo
      });
    } catch (err: any) {
      console.error('خطا در ارسال OTP:', err);
      res.status(500).json({ error: err.message || 'خطا در ارسال کد تأیید' });
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { mobile, otp } = req.body;

      if (!mobile || !otp) {
        res.status(400).json({ error: 'شماره موبایل و کد تأیید الزامی است' });
        return;
      }

      const userData = await authService.verifyOtp(mobile, otp);

      if (!userData) {
        res.status(401).json({ error: 'کد تأیید نامعتبر است' });
        return;
      }

      const sessionToken = await sessionService.createSession(userData.id, req, userData.isAdmin);

      const isProd = process.env.NODE_ENV === 'production';
      
      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: sessionService.getSessionDurationDays() * 24 * 60 * 60 * 1000
      });

      console.log(`✅ نشست ایجاد شد برای ${userData.isAdmin ? 'ادمین' : 'کاربر'} با ID: ${userData.id}`);

      // ساخت full_name برای اطمینان
      const fullName = userData.full_name || 
                       `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 
                       userData.mobile_number || 
                       'کاربر';

      res.json({
        success: true,
        message: 'ورود با موفقیت انجام شد',
        user: {
          id: userData.id,
          mobile_number: userData.mobile_number,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          full_name: fullName,
          code: userData.code,
          isAdmin: userData.isAdmin || false,
          is_main_admin: userData.is_main_admin || false,
          device_limit: userData.device_limit || 1,
          melted_price_offset: userData.melted_price_offset || 0,
          coin_price_offset: userData.coin_price_offset || 0
        }
      });
    } catch (err: any) {
      console.error('خطا در تأیید OTP:', err);
      res.status(500).json({ error: err.message || 'خطا در تأیید کد' });
    }
  }

  async checkSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionToken = req.cookies?.session_token;

      if (!sessionToken) {
        res.json({ authenticated: false });
        return;
      }

      const sessionData = await sessionService.validateSession(sessionToken);

      if (!sessionData) {
        res.clearCookie('session_token', { path: '/', httpOnly: true });
        res.json({ authenticated: false });
        return;
      }

      await sessionService.refreshSession(sessionToken);

      const user = sessionData.user;
      
      // ساخت full_name برای اطمینان
      const fullName = user.full_name || 
                       `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                       user.mobile_number || 
                       'کاربر';

      res.json({
        authenticated: true,
        user: {
          id: user.id,
          mobile_number: user.mobile_number,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          full_name: fullName,
          code: user.code,
          isAdmin: user.isAdmin || false,
          is_main_admin: user.is_main_admin || false
        },
        expiresAt: sessionData.session.expires_at
      });
    } catch (err) {
      console.error('خطا در بررسی نشست:', err);
      res.json({ authenticated: false });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const sessionToken = req.cookies?.session_token;

      if (sessionToken) {
        await sessionService.revokeSession(sessionToken);
      }

      res.clearCookie('session_token', {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      });

      res.json({
        success: true,
        message: 'خروج از سیستم با موفقیت انجام شد'
      });
    } catch (err) {
      console.error('خطا در خروج:', err);
      res.status(500).json({ error: 'خطا در خروج از سیستم' });
    }
  }

  async getUserProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'احراز هویت نشده' });
        return;
      }

      // دریافت اطلاعات کامل کاربر از دیتابیس
      const userData = await authService.getUserById(req.user.id);
      
      if (!userData) {
        res.status(404).json({ error: 'کاربر یافت نشد' });
        return;
      }

      const fullName = userData.full_name || 
                       `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 
                       userData.mobile_number || 
                       'کاربر';

      res.json({
        success: true,
        data: {
          id: userData.id,
          mobile_number: userData.mobile_number,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          full_name: fullName,
          code: userData.code,
          isAdmin: userData.is_admin || false,
          is_main_admin: userData.is_main_admin || false,
          device_limit: userData.device_limit || 1,
          melted_price_offset: userData.melted_price_offset || 0,
          coin_price_offset: userData.coin_price_offset || 0
        }
      });
    } catch (err) {
      console.error('خطا در دریافت پروفایل:', err);
      res.status(500).json({ error: 'خطای سرور' });
    }
  }

  // ============================================
  // مدیریت نشست‌ها (Session Management)
  // ============================================

  async getSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'احراز هویت نشده' });
        return;
      }

      const sessions = await sessionService.getUserSessions(req.user.id);
      
      const formattedSessions = sessions.map(s => ({
        id: s.id,
        ip_address: s.ip_address,
        last_activity: s.last_activity,
        expires_at: s.expires_at,
        is_current: s.session_token === req.cookies?.session_token
      }));

      res.json({ success: true, data: formattedSessions });
    } catch (err: any) {
      console.error('خطا در دریافت نشست‌ها:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async revokeSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      if (!req.user) {
        res.status(401).json({ error: 'احراز هویت نشده' });
        return;
      }

      await sessionService.revokeSessionById(parseInt(sessionId));
      
      res.json({ success: true, message: 'نشست با موفقیت باطل شد' });
    } catch (err: any) {
      console.error('خطا در باطل کردن نشست:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async revokeAllSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'احراز هویت نشده' });
        return;
      }

      const currentToken = req.cookies?.session_token;
      await sessionService.revokeAllUserSessionsExceptCurrent(req.user.id, currentToken);
      
      res.json({ success: true, message: 'تمام نشست‌ها با موفقیت باطل شدند' });
    } catch (err: any) {
      console.error('خطا در باطل کردن نشست‌ها:', err);
      res.status(500).json({ error: err.message });
    }
  }
}

export const authController = new AuthController();