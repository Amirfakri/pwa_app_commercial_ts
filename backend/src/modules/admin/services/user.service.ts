
import { userRepository } from '../../auth/repositories/user.repository';
import { sessionRepositoryForAdmin } from '../repositories/session.repository';
import { IUser, IUserCreateInput, IUserUpdateInput } from '../types/admin.types';

export class UserService {
  async getAllUsers(filters: {
    search?: string;
    is_blocked?: boolean;
    page?: number;
    limit?: number;
  }) {
    return userRepository.findAll(filters);
  }

  async getUserById(id: number): Promise<IUser | null> {
    return userRepository.findById(id);
  }

  async createUser(data: IUserCreateInput): Promise<IUser> {
    const existing = await userRepository.findByMobile(data.mobile_number);
    if (existing) {
      throw new Error('شماره موبایل قبلاً ثبت شده است');
    }
    const userCode = await userRepository.generateUniqueCode();
    return userRepository.create({
      mobile_number: data.mobile_number,
      first_name: data.first_name || 'کاربر',
      last_name: data.last_name || 'جدید',
      code: userCode
    });
  }

  async updateUser(id: number, data: IUserUpdateInput): Promise<IUser | null> {
    return userRepository.update(id, data);
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    const user = await userRepository.findById(id);
    if (!user) {
      return { success: false, message: 'کاربر یافت نشد' };
    }
    await sessionRepositoryForAdmin.revokeAllUserSessions(id);
    const deleted = await userRepository.delete(id);
    if (deleted) {
      return { success: true, message: 'کاربر با موفقیت حذف شد' };
    }
    return { success: false, message: 'خطا در حذف کاربر' };
  }

  async blockUser(id: number, block: boolean): Promise<IUser | null> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }
    if (block && !user.is_blocked) {
      await sessionRepositoryForAdmin.revokeAllUserSessions(id);
    }
    await userRepository.block(id, block);
    return userRepository.findById(id);
  }

  async updateUserOffsets(id: number, meltedOffset: number, coinOffset: number): Promise<IUser | null> {
    return userRepository.updateOffsets(id, meltedOffset, coinOffset);
  }

  async getPendingRegistrations() {
    return userRepository.getPendingRegistrations();
  }

  async approveRegistration(registrationId: number, adminId: number) {
    const registration = await userRepository.approveRegistration(registrationId, adminId);
    if (!registration) {
      throw new Error('درخواست ثبت‌نام یافت نشد یا قبلاً پردازش شده است');
    }
    const user = await userRepository.createUserFromRegistration(registration);
    return { registration, user };
  }

  async rejectRegistration(registrationId: number, adminId: number) {
    const registration = await userRepository.rejectRegistration(registrationId, adminId);
    if (!registration) {
      throw new Error('درخواست ثبت‌نام یافت نشد یا قبلاً پردازش شده است');
    }
    return registration;
  }

  async getUserSessions(userId: number) {
    return sessionRepositoryForAdmin.getUserSessions(userId);
  }

  async revokeUserSession(sessionId: number): Promise<boolean> {
    return sessionRepositoryForAdmin.revokeSession(sessionId);
  }
}

export const userService = new UserService();
