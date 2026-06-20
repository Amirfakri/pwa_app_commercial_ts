
import crypto from 'crypto';
import { Request } from 'express';
import { sessionRepository, ISession } from '../repositories/session.repository';
import { userRepository } from '../repositories/user.repository';

export class SessionService {
  private readonly SESSION_DURATION_DAYS = 90;
  
  generateSecureToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }
  
  getClientInfo(req: Request): { ip: string } {
    const ip = req.ip || 
               req.headers['x-forwarded-for']?.toString().split(',')[0] || 
               req.connection?.remoteAddress || 
               'unknown';
    return { ip };
  }
  
  async createSession(userId: number, req: Request, isAdmin: boolean = false): Promise<string> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }
    
    // بررسی محدودیت دستگاه (فقط برای کاربران عادی - غیر ادمین)
    if (!isAdmin && !user.is_admin) {
      const activeSessions = await sessionRepository.getActiveSessionsCount(userId);
      const deviceLimit = user.device_limit || 1;
      if (activeSessions >= deviceLimit) {
        throw new Error(`محدودیت تعداد دستگاه‌ها (${deviceLimit}) پر شده است. لطفاً از دستگاه دیگر خارج شوید.`);
      }
    }
    
    const sessionToken = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
    const { ip } = this.getClientInfo(req);
    
    await sessionRepository.create({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt,
      ip_address: ip
    });
    
    return sessionToken;
  }
  
  async validateSession(sessionToken: string): Promise<any> {
    const session = await sessionRepository.findByToken(sessionToken);
    
    if (!session) {
      return null;
    }
    
    if (new Date(session.expires_at) < new Date()) {
      return null;
    }
    
    const user = await userRepository.findById(session.user_id);
    
    if (!user || user.is_blocked) {
      return null;
    }
    
    return {
      user: {
        id: user.id,
        mobile_number: user.mobile_number,
        full_name: user.full_name,
        code: user.code,
        isAdmin: user.is_admin || false
      },
      session: {
        id: session.id,
        expires_at: session.expires_at,
        ip_address: session.ip_address,
        last_activity: session.last_activity
      }
    };
  }
  
  async refreshSession(sessionToken: string): Promise<string | null> {
    const session = await sessionRepository.findByToken(sessionToken);
    if (!session) return null;
    
    const newExpiry = new Date(Date.now() + this.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
    await sessionRepository.updateExpiry(session.id, newExpiry);
    return sessionToken;
  }
  
  async revokeSession(sessionToken: string): Promise<void> {
    await sessionRepository.revokeByToken(sessionToken);
  }
  
  async revokeSessionById(sessionId: number): Promise<void> {
    await sessionRepository.revokeById(sessionId);
  }
  
  async revokeAllUserSessions(userId: number): Promise<number> {
    return sessionRepository.revokeAllUserSessions(userId);
  }
  
  async revokeAllUserSessionsExceptCurrent(userId: number, currentSessionToken: string): Promise<number> {
    const currentSession = await sessionRepository.findByToken(currentSessionToken);
    if (!currentSession) return 0;
    
    const { rowCount } = await sessionRepository['pool'].query(
      `UPDATE sessions SET is_active = false 
       WHERE user_id = $1 AND is_active = true AND id != $2`,
      [userId, currentSession.id]
    );
    return rowCount || 0;
  }
  
  async getUserSessions(userId: number): Promise<ISession[]> {
    const sessions = await sessionRepository.findByUserId(userId);
    return sessions;
  }
  
  getSessionDurationDays(): number {
    return this.SESSION_DURATION_DAYS;
  }
}

export const sessionService = new SessionService();
