import { api } from '@/core/http/axios';

class AuthService {
  async sendOtp(mobile: string): Promise<any> {
    const response = await api.post('/auth/send-otp', { mobile });
    return response.data;
  }

  async verifyOtp(mobile: string, otp: string, deviceName?: string): Promise<any> {
    const response = await api.post('/auth/verify-otp', { mobile, otp, deviceName });
    const data = response.data;
    
    if (data.success && data.sessionToken) {
      localStorage.setItem('session_token', data.sessionToken);
      localStorage.setItem('device_id', data.deviceId);
      localStorage.setItem('user_id', String(data.user.id));
      localStorage.setItem('user_role', data.user.isAdmin ? 'admin' : 'user');
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async checkSession(): Promise<any> {
    const sessionToken = localStorage.getItem('session_token');
    const deviceId = localStorage.getItem('device_id');
    const userId = localStorage.getItem('user_id');
    
    if (!sessionToken || !deviceId || !userId) {
      return { authenticated: false };
    }
    
    const response = await api.get('/auth/check-session', {
      headers: {
        'x-session-token': sessionToken,
        'x-device-id': deviceId,
        'x-user-id': userId,
      }
    });
    return response.data;
  }

  async logout(): Promise<void> {
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
      await api.post('/auth/logout', {}, {
        headers: { 'x-session-token': sessionToken }
      });
    }
    localStorage.clear();
  }
}

export const authService = new AuthService();