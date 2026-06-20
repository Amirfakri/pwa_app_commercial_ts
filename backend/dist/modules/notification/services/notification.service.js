"use strict";
// backend/src/modules/notification/services/notification.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const notification_repository_1 = require("../repositories/notification.repository");
class NotificationService {
    async getAllNotifications(filters) {
        return notification_repository_1.notificationRepository.findAll(filters);
    }
    async getUserNotifications(userId, filters) {
        return notification_repository_1.notificationRepository.findUserNotifications(userId, filters);
    }
    async getActiveNotifications(userId) {
        return notification_repository_1.notificationRepository.findActive(userId);
    }
    async getNotificationById(id) {
        return notification_repository_1.notificationRepository.findById(id);
    }
    async getUnreadCount(userId) {
        return notification_repository_1.notificationRepository.getUnreadCount(userId);
    }
    async markAsRead(notificationId, userId) {
        // ابتدا بررسی کن که کاربر اجازه دسترسی به این اعلان را دارد
        const notification = await notification_repository_1.notificationRepository.findById(notificationId);
        if (!notification) {
            throw new Error('اعلان یافت نشد');
        }
        // بررسی دسترسی کاربر به اعلان
        if (notification.audience === 'specific_user' && notification.user_id !== userId) {
            throw new Error('شما دسترسی به این اعلان ندارید');
        }
        return notification_repository_1.notificationRepository.markAsRead(notificationId, userId);
    }
    async markAllAsRead(userId) {
        return notification_repository_1.notificationRepository.markAllAsRead(userId);
    }
    async createNotification(data, adminId) {
        if (!data.message_text || !data.message_text.trim()) {
            throw new Error('متن اعلان الزامی است');
        }
        // اعتبارسنجی برای اعلان خصوصی
        if (data.audience === 'specific_user' && !data.user_id) {
            throw new Error('برای اعلان خصوصی، شناسه کاربر الزامی است');
        }
        if (data.audience === 'specific_role' && !data.role) {
            throw new Error('برای اعلان بر اساس نقش، نقش الزامی است');
        }
        return notification_repository_1.notificationRepository.create(data, adminId);
    }
    async updateNotification(id, data) {
        return notification_repository_1.notificationRepository.update(id, data);
    }
    async deleteNotification(id) {
        return notification_repository_1.notificationRepository.delete(id);
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
