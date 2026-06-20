// backend/src/modules/auth/middlewares/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.service';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    isAdmin: boolean;
    code: string;
    mobile_number: string;
    first_name?: string;
    last_name?: string;
  };
}

// لیست مسیرهای عمومی که نیاز به احراز هویت ندارند
const publicPaths = [
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/auth/check-session',
  '/api/auth/logout',
  '/api/support/terms',
  '/api/support/terms/',
  '/api/support/terms/public',
  '/api/support/terms/public/latest',
  '/api/support/terms/test',
  '/api/support/descriptions',
  '/health',
  '/health/ready',
  '/health/live',
  '/api/test',
  '/api/prices/products'
];

export const authenticateSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // بررسی مسیرهای عمومی
    const isPublicPath = publicPaths.some(path => {
      return req.path === path || req.path.startsWith(path);
    });
    
    if (isPublicPath) {
      return next();
    }
    
    const sessionToken = req.cookies?.session_token;
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'لطفاً ابتدا وارد شوید', code: 'NO_SESSION' });
    }
    
    const sessionData = await sessionService.validateSession(sessionToken);
    
    if (!sessionData) {
      res.clearCookie('session_token', { path: '/', httpOnly: true });
      return res.status(401).json({ error: 'نشست معتبر نیست', code: 'INVALID_SESSION' });
    }
    
    req.user = {
      id: sessionData.user.id,
      isAdmin: sessionData.user.isAdmin || false,
      code: sessionData.user.code,
      mobile_number: sessionData.user.mobile_number,
      first_name: sessionData.user.first_name,
      last_name: sessionData.user.last_name,
    };
    
    next();
  } catch (err) {
    console.error('Session auth error:', err);
    res.status(500).json({ error: 'خطای سرور' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'لطفاً ابتدا وارد شوید' });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
  }
  next();
};