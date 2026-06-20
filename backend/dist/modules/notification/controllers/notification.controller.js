"use strict";
// backend/src/modules/notification/controllers/notification.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("../services/notification.service");
class NotificationController {
    // دریافت اعلان‌های فعال (برای کاربر عادی - شامل اعلان‌های عمومی و خصوصی)
    async getActiveNotifications(req, res) {
        try {
            const userId = req.user.id;
            const notifications = await notification_service_1.notificationService.getActiveNotifications(userId);
            res.json({ success: true, data: notifications });
        }
        catch (err) {
            console.error('خطا در دریافت اعلان‌های فعال:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // دریافت اعلان‌های کاربر با صفحه‌بندی (تاریخچه)
    async getUserNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20, is_read } = req.query;
            const result = await notification_service_1.notificationService.getUserNotifications(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                is_read: is_read === 'true' ? true : is_read === 'false' ? false : undefined
            });
            res.json({
                success: true,
                data: result.notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    pages: Math.ceil(result.total / parseInt(limit))
                }
            });
        }
        catch (err) {
            console.error('خطا در دریافت اعلان‌های کاربر:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // دریافت تعداد اعلان‌های خوانده نشده
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const count = await notification_service_1.notificationService.getUnreadCount(userId);
            res.json({ success: true, data: { unread_count: count } });
        }
        catch (err) {
            console.error('خطا در دریافت تعداد اعلان‌های خوانده نشده:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // علامت زدن اعلان به عنوان خوانده شده
    async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await notification_service_1.notificationService.markAsRead(parseInt(id), userId);
            res.json({ success: true, message: 'اعلان به عنوان خوانده شده علامت‌گذاری شد' });
        }
        catch (err) {
            console.error('خطا در علامت زدن اعلان:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // علامت زدن همه اعلان‌ها به عنوان خوانده شده
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            const count = await notification_service_1.notificationService.markAllAsRead(userId);
            res.json({
                success: true,
                message: `${count} اعلان به عنوان خوانده شده علامت‌گذاری شد`,
                data: { marked_count: count }
            });
        }
        catch (err) {
            console.error('خطا در علامت زدن همه اعلان‌ها:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // دریافت همه اعلان‌ها (برای ادمین)
    async getAllNotifications(req, res) {
        try {
            const { is_active, page = 1, limit = 50, audience, user_id } = req.query;
            const result = await notification_service_1.notificationService.getAllNotifications({
                is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
                page: parseInt(page),
                limit: parseInt(limit),
                audience: audience,
                user_id: user_id ? parseInt(user_id) : undefined
            });
            res.json({
                success: true,
                data: result.notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    pages: Math.ceil(result.total / parseInt(limit))
                }
            });
        }
        catch (err) {
            console.error('خطا در دریافت اعلان‌ها:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async getNotificationById(req, res) {
        try {
            const { id } = req.params;
            const notification = await notification_service_1.notificationService.getNotificationById(parseInt(id));
            if (!notification) {
                res.status(404).json({ success: false, error: 'اعلان یافت نشد' });
                return;
            }
            res.json({ success: true, data: notification });
        }
        catch (err) {
            console.error('خطا در دریافت اعلان:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async createNotification(req, res) {
        try {
            const adminId = req.user.id;
            const notification = await notification_service_1.notificationService.createNotification(req.body, adminId);
            // ارسال از طریق Socket.IO به کاربران مربوطه
            const io = req.app.get('io');
            if (io) {
                if (notification.audience === 'specific_user' && notification.user_id) {
                    // ارسال به کاربر خاص
                    io.to(`user_${notification.user_id}`).emit('new_notification', notification);
                }
                else {
                    // ارسال به همه کاربران آنلاین
                    io.emit('new_notification', notification);
                }
            }
            res.status(201).json({
                success: true,
                message: 'اعلان با موفقیت ایجاد شد',
                data: notification
            });
        }
        catch (err) {
            console.error('خطا در ایجاد اعلان:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async updateNotification(req, res) {
        try {
            const { id } = req.params;
            const notification = await notification_service_1.notificationService.updateNotification(parseInt(id), req.body);
            if (!notification) {
                res.status(404).json({ success: false, error: 'اعلان یافت نشد' });
                return;
            }
            // ارسال از طریق Socket.IO
            const io = req.app.get('io');
            if (io) {
                io.emit('notification_updated', notification);
            }
            res.json({
                success: true,
                message: 'اعلان با موفقیت به‌روزرسانی شد',
                data: notification
            });
        }
        catch (err) {
            console.error('خطا در به‌روزرسانی اعلان:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            const deleted = await notification_service_1.notificationService.deleteNotification(parseInt(id));
            if (!deleted) {
                res.status(404).json({ success: false, error: 'اعلان یافت نشد' });
                return;
            }
            res.json({ success: true, message: 'اعلان با موفقیت حذف شد' });
        }
        catch (err) {
            console.error('خطا در حذف اعلان:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
