// backend/src/modules/auth/services/auth.service.ts

import { userRepository } from '../repositories/user.repository';

export class AuthService {
  private readonly FIXED_OTP = '123456';

  // ==================== متد کمکی برای ساخت full_name ====================
  
  private buildFullName(user: any): string {
    if (!user) return 'کاربر';
    
    if (user.full_name && user.full_name.trim()) {
      return user.full_name.trim();
    }
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (fullName) {
      return fullName;
    }
    
    if (user.mobile_number) {
      return user.mobile_number;
    }
    
    if (user.code) {
      return user.code;
    }
    
    return 'کاربر';
  }

  // ==================== متدهای سرویس ====================

  async sendOtp(mobile: string): Promise<{ otp: string; isNewUser: boolean; userInfo?: any }> {
    let user = await userRepository.findByMobile(mobile);
    let isNewUser = false;

    if (!user) {
      const userCode = await userRepository.generateUniqueCode();
      user = await userRepository.create({
        mobile_number: mobile,
        first_name: 'کاربر',
        last_name: 'جدید',
        code: userCode
      });
      isNewUser = true;
    }

    if (!user) {
      throw new Error('خطا در ایجاد کاربر');
    }

    if (user.is_blocked) {
      throw new Error('حساب کاربری شما مسدود شده است');
    }

    const fullName = this.buildFullName(user);

    console.log(`📱 OTP برای ${mobile}: ${this.FIXED_OTP} (${user.is_admin ? 'ادمین' : 'کاربر'})`);

    return {
      otp: this.FIXED_OTP,
      isNewUser,
      userInfo: {
        id: user.id,
        mobile_number: user.mobile_number,
        full_name: fullName,
        code: user.code,
        isAdmin: user.is_admin || false,
        is_blocked: user.is_blocked,
        first_name: user.first_name,
        last_name: user.last_name
      }
    };
  }

  async verifyOtp(mobile: string, otp: string): Promise<any | null> {
    if (otp !== this.FIXED_OTP) {
      return null;
    }

    const user = await userRepository.findByMobile(mobile);
    if (!user) {
      return null;
    }

    if (user.is_blocked) {
      throw new Error('حساب کاربری شما مسدود شده است');
    }

    const fullName = this.buildFullName(user);

    console.log(`✅ ورود ${user.is_admin ? 'ادمین' : 'کاربر'}: ${user.mobile_number}`);

    return {
      id: user.id,
      mobile_number: user.mobile_number,
      full_name: fullName,
      code: user.code,
      isAdmin: user.is_admin || false,
      is_main_admin: user.is_admin || false,
      first_name: user.first_name,
      last_name: user.last_name,
      device_limit: user.device_limit,
      melted_price_offset: user.melted_price_offset,
      coin_price_offset: user.coin_price_offset
    };
  }

  async getUserById(userId: number): Promise<any | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;
    
    return {
      ...user,
      full_name: this.buildFullName(user)
    };
  }

  async getUserByMobile(mobile: string): Promise<any | null> {
    const user = await userRepository.findByMobile(mobile);
    if (!user) return null;
    
    return {
      ...user,
      full_name: this.buildFullName(user)
    };
  }
}

export const authService = new AuthService();