// backend/src/modules/notification/services/notification.service.ts

import { notificationRepository } from '../repositories/notification.repository';
import { ICreateNotificationInput, NotificationAudience } from '../types/notification.types';

export class NotificationService {
  async getAllNotifications(filters: { is_active?: boolean; page?: number; limit?: number; audience?: NotificationAudience; user_id?: number }) {
    return notificationRepository.findAll(filters);
  }

  async getUserNotifications(userId: number, filters: { page?: number; limit?: number; is_read?: boolean }) {
    return notificationRepository.findUserNotifications(userId, filters);
  }

  async getActiveNotifications(userId?: number) {
    return notificationRepository.findActive(userId);
  }

  async getNotificationById(id: number) {
    return notificationRepository.findById(id);
  }

  async getUnreadCount(userId: number) {
    return notificationRepository.getUnreadCount(userId);
  }

  async markAsRead(notificationId: number, userId: number) {
    // ابتدا بررسی کن که کاربر اجازه دسترسی به این اعلان را دارد
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error('اعلان یافت نشد');
    }

    // بررسی دسترسی کاربر به اعلان
    if (notification.audience === 'specific_user' && notification.user_id !== userId) {
      throw new Error('شما دسترسی به این اعلان ندارید');
    }

    return notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: number) {
    return notificationRepository.markAllAsRead(userId);
  }

  async createNotification(data: ICreateNotificationInput, adminId: number) {
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

    return notificationRepository.create(data, adminId);
  }

  async updateNotification(id: number, data: Partial<ICreateNotificationInput>) {
    return notificationRepository.update(id, data);
  }

  async deleteNotification(id: number) {
    return notificationRepository.delete(id);
  }
}

export const notificationService = new NotificationService();