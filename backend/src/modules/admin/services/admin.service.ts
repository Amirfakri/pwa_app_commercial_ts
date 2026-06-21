// backend/src/modules/admin/services/admin.service.ts

import { userRepository } from '../../auth/repositories/user.repository';
import { adminRepository } from '../../auth/repositories/admin.repository';
import { sessionRepository } from '../../auth/repositories/session.repository';
import { IUser, IUserUpdateInput } from '../types/admin.types';

export class AdminService {
  // متدهای جدید برای مدیریت کد کاربر
  async getUserByCode(code: string): Promise<IUser | null> {
    return userRepository.findByCode(code);
  }

  async getUserById(id: number): Promise<IUser | null> {
    return userRepository.findById(id);
  }

  async getAllUsers(filters: { search?: string; is_blocked?: boolean; page?: number; limit?: number }) {
    return userRepository.findAll(filters);
  }

  async createUser(data: { mobile_number: string; first_name: string; last_name: string }) {
    const existing = await userRepository.findByMobile(data.mobile_number);
    if (existing) {
      throw new Error('شماره موبایل قبلاً ثبت شده است');
    }
    const userCode = await userRepository.generateUniqueCode();
    return userRepository.create({
      mobile_number: data.mobile_number,
      first_name: data.first_name,
      last_name: data.last_name,
      code: userCode
    });
  }

  async updateUser(id: number, data: IUserUpdateInput) {
    // اگر کد در حال تغییر است، بررسی یکتایی
    if (data.code) {
      const existingUser = await userRepository.findByCode(data.code);
      const currentUser = await userRepository.findById(id);
      
      // اگر کاربر دیگری با این کد وجود دارد و کاربر فعلی نیست
      if (existingUser && existingUser.id !== id) {
        throw new Error('کد کاربر قبلاً ثبت شده است');
      }
    }
    return userRepository.update(id, data);
  }

  async deleteUser(id: number) {
    await sessionRepository.revokeAllUserSessions(id);
    return userRepository.delete(id);
  }

  async getAllAdmins() {
    return adminRepository.findAll();
  }

  async createAdmin(data: { mobile_number: string; first_name: string; last_name: string }) {
    const existing = await adminRepository.findByMobile(data.mobile_number);
    if (existing) {
      throw new Error('شماره موبایل قبلاً ثبت شده است');
    }
    return adminRepository.create(data);
  }

  async updateAdmin(id: number, is_active: boolean) {
    return adminRepository.update(id, is_active);
  }

  async deleteAdmin(id: number) {
    const isMain = await adminRepository.isMainAdmin(id);
    if (isMain) {
      throw new Error('نمی‌توان ادمین اصلی را حذف کرد');
    }
    return adminRepository.delete(id);
  }

  async getPendingRegistrations() {
    return userRepository.getPendingRegistrations();
  }

  async getUserSessions(userId: number) {
    return sessionRepository.findByUserId(userId);
  }

  async revokeUserSession(sessionId: number) {
    await sessionRepository.revokeById(sessionId);
    return true;
  }

  async revokeAllUserSessions(userId: number) {
    return sessionRepository.revokeAllUserSessions(userId);
  }

  async approveRegistration(registrationId: number, adminId: number) {
    const registration = await userRepository.approveRegistration(registrationId, adminId);
    if (!registration) {
      throw new Error('درخواست ثبت‌نام یافت نشد');
    }
    const user = await userRepository.createUserFromRegistration(registration);
    return { registration, user };
  }

  async rejectRegistration(registrationId: number, adminId: number) {
    const registration = await userRepository.rejectRegistration(registrationId, adminId);
    if (!registration) {
      throw new Error('درخواست ثبت‌نام یافت نشد');
    }
    return registration;
  }
}

export const adminService = new AdminService();