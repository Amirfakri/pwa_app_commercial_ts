
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
        isAdmin: result.userInfo?.isAdmin || false
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

      res.json({
        success: true,
        message: 'ورود با موفقیت انجام شد',
        user: {
          id: userData.id,
          mobile_number: userData.mobile_number,
          full_name: userData.full_name,
          code: userData.code,
          isAdmin: userData.isAdmin || false,
          is_main_admin: userData.is_main_admin || false
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

      res.json({
        authenticated: true,
        user: sessionData.user,
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

      res.json({
        success: true,
        data: req.user
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
