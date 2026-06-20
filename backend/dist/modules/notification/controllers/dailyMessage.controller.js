"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyMessageController = exports.DailyMessageController = void 0;
const dailyMessage_service_1 = require("../services/dailyMessage.service");
class DailyMessageController {
    // دریافت پیام روزانه فعال (برای کاربر عادی)
    async getActiveMessage(req, res) {
        try {
            const message = await dailyMessage_service_1.dailyMessageService.getActiveMessage();
            res.json({ success: true, data: message });
        }
        catch (err) {
            console.error('خطا در دریافت پیام فعال:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // دریافت همه پیام‌ها (برای ادمین)
    async getAllMessages(req, res) {
        try {
            const { is_active, page = 1, limit = 50 } = req.query;
            const result = await dailyMessage_service_1.dailyMessageService.getAllMessages({
                is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
                page: parseInt(page),
                limit: parseInt(limit)
            });
            res.json({
                success: true,
                data: result.messages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    pages: Math.ceil(result.total / parseInt(limit))
                }
            });
        }
        catch (err) {
            console.error('خطا در دریافت پیام‌ها:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async createMessage(req, res) {
        try {
            const adminId = req.user.id;
            const message = await dailyMessage_service_1.dailyMessageService.createMessage(req.body, adminId);
            // ارسال از طریق Socket.IO به همه کاربران آنلاین
            const io = req.app.get('io');
            if (io) {
                io.emit('daily_message_updated', message);
            }
            res.status(201).json({
                success: true,
                message: 'پیام روزانه با موفقیت ایجاد شد',
                data: message
            });
        }
        catch (err) {
            console.error('خطا در ایجاد پیام:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async updateMessage(req, res) {
        try {
            const { id } = req.params;
            const message = await dailyMessage_service_1.dailyMessageService.updateMessage(parseInt(id), req.body);
            if (!message) {
                res.status(404).json({ success: false, error: 'پیام یافت نشد' });
                return;
            }
            // ارسال از طریق Socket.IO به همه کاربران آنلاین
            const io = req.app.get('io');
            if (io) {
                io.emit('daily_message_updated', message);
            }
            res.json({
                success: true,
                message: 'پیام روزانه با موفقیت به‌روزرسانی شد',
                data: message
            });
        }
        catch (err) {
            console.error('خطا در به‌روزرسانی پیام:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async deleteMessage(req, res) {
        try {
            const { id } = req.params;
            const deleted = await dailyMessage_service_1.dailyMessageService.deleteMessage(parseInt(id));
            if (!deleted) {
                res.status(404).json({ success: false, error: 'پیام یافت نشد' });
                return;
            }
            res.json({ success: true, message: 'پیام روزانه با موفقیت حذف شد' });
        }
        catch (err) {
            console.error('خطا در حذف پیام:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.DailyMessageController = DailyMessageController;
exports.dailyMessageController = new DailyMessageController();
