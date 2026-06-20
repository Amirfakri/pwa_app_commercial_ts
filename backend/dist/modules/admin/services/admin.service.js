"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
const user_repository_1 = require("../../auth/repositories/user.repository");
const admin_repository_1 = require("../../auth/repositories/admin.repository");
const session_repository_1 = require("../../auth/repositories/session.repository");
class AdminService {
    async getAllUsers(filters) {
        return user_repository_1.userRepository.findAll(filters);
    }
    async createUser(data) {
        const existing = await user_repository_1.userRepository.findByMobile(data.mobile_number);
        if (existing) {
            throw new Error('شماره موبایل قبلاً ثبت شده است');
        }
        const userCode = await user_repository_1.userRepository.generateUniqueCode();
        return user_repository_1.userRepository.create({
            mobile_number: data.mobile_number,
            first_name: data.first_name,
            last_name: data.last_name,
            code: userCode
        });
    }
    async updateUser(id, data) {
        return user_repository_1.userRepository.update(id, data);
    }
    async deleteUser(id) {
        await session_repository_1.sessionRepository.revokeAllUserSessions(id);
        return user_repository_1.userRepository.delete(id);
    }
    async getAllAdmins() {
        return admin_repository_1.adminRepository.findAll();
    }
    async createAdmin(data) {
        const existing = await admin_repository_1.adminRepository.findByMobile(data.mobile_number);
        if (existing) {
            throw new Error('شماره موبایل قبلاً ثبت شده است');
        }
        return admin_repository_1.adminRepository.create(data);
    }
    async updateAdmin(id, is_active) {
        return admin_repository_1.adminRepository.update(id, is_active);
    }
    async deleteAdmin(id) {
        const isMain = await admin_repository_1.adminRepository.isMainAdmin(id);
        if (isMain) {
            throw new Error('نمی‌توان ادمین اصلی را حذف کرد');
        }
        return admin_repository_1.adminRepository.delete(id);
    }
    async getPendingRegistrations() {
        return user_repository_1.userRepository.getPendingRegistrations();
    }
    async getUserSessions(userId) {
        return session_repository_1.sessionRepository.findByUserId(userId);
    }
    async revokeUserSession(sessionId) {
        await session_repository_1.sessionRepository.revokeById(sessionId);
        return true;
    }
    async revokeAllUserSessions(userId) {
        return session_repository_1.sessionRepository.revokeAllUserSessions(userId);
    }
    async approveRegistration(registrationId, adminId) {
        const registration = await user_repository_1.userRepository.approveRegistration(registrationId, adminId);
        if (!registration) {
            throw new Error('درخواست ثبت‌نام یافت نشد');
        }
        const user = await user_repository_1.userRepository.createUserFromRegistration(registration);
        return { registration, user };
    }
    async rejectRegistration(registrationId, adminId) {
        const registration = await user_repository_1.userRepository.rejectRegistration(registrationId, adminId);
        if (!registration) {
            throw new Error('درخواست ثبت‌نام یافت نشد');
        }
        return registration;
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
