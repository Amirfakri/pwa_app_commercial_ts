"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const user_repository_1 = require("../../auth/repositories/user.repository");
const session_repository_1 = require("../repositories/session.repository");
class UserService {
    async getAllUsers(filters) {
        return user_repository_1.userRepository.findAll(filters);
    }
    async getUserById(id) {
        return user_repository_1.userRepository.findById(id);
    }
    async createUser(data) {
        const existing = await user_repository_1.userRepository.findByMobile(data.mobile_number);
        if (existing) {
            throw new Error('شماره موبایل قبلاً ثبت شده است');
        }
        const userCode = await user_repository_1.userRepository.generateUniqueCode();
        return user_repository_1.userRepository.create({
            mobile_number: data.mobile_number,
            first_name: data.first_name || 'کاربر',
            last_name: data.last_name || 'جدید',
            code: userCode
        });
    }
    async updateUser(id, data) {
        return user_repository_1.userRepository.update(id, data);
    }
    async deleteUser(id) {
        const user = await user_repository_1.userRepository.findById(id);
        if (!user) {
            return { success: false, message: 'کاربر یافت نشد' };
        }
        await session_repository_1.sessionRepositoryForAdmin.revokeAllUserSessions(id);
        const deleted = await user_repository_1.userRepository.delete(id);
        if (deleted) {
            return { success: true, message: 'کاربر با موفقیت حذف شد' };
        }
        return { success: false, message: 'خطا در حذف کاربر' };
    }
    async blockUser(id, block) {
        const user = await user_repository_1.userRepository.findById(id);
        if (!user) {
            throw new Error('کاربر یافت نشد');
        }
        if (block && !user.is_blocked) {
            await session_repository_1.sessionRepositoryForAdmin.revokeAllUserSessions(id);
        }
        await user_repository_1.userRepository.block(id, block);
        return user_repository_1.userRepository.findById(id);
    }
    async updateUserOffsets(id, meltedOffset, coinOffset) {
        return user_repository_1.userRepository.updateOffsets(id, meltedOffset, coinOffset);
    }
    async getPendingRegistrations() {
        return user_repository_1.userRepository.getPendingRegistrations();
    }
    async approveRegistration(registrationId, adminId) {
        const registration = await user_repository_1.userRepository.approveRegistration(registrationId, adminId);
        if (!registration) {
            throw new Error('درخواست ثبت‌نام یافت نشد یا قبلاً پردازش شده است');
        }
        const user = await user_repository_1.userRepository.createUserFromRegistration(registration);
        return { registration, user };
    }
    async rejectRegistration(registrationId, adminId) {
        const registration = await user_repository_1.userRepository.rejectRegistration(registrationId, adminId);
        if (!registration) {
            throw new Error('درخواست ثبت‌نام یافت نشد یا قبلاً پردازش شده است');
        }
        return registration;
    }
    async getUserSessions(userId) {
        return session_repository_1.sessionRepositoryForAdmin.getUserSessions(userId);
    }
    async revokeUserSession(sessionId) {
        return session_repository_1.sessionRepositoryForAdmin.revokeSession(sessionId);
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
