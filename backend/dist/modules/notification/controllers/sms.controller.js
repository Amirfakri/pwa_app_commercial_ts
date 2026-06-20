"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsController = exports.SmsController = void 0;
const sms_service_1 = require("../services/sms.service");
class SmsController {
    async sendSms(req, res) {
        try {
            const adminId = req.user.id;
            const result = await sms_service_1.smsService.sendSms(req.body, adminId);
            res.json(result);
        }
        catch (err) {
            console.error('خطا در ارسال پیامک:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async sendBulkSms(req, res) {
        try {
            const adminId = req.user.id;
            const result = await sms_service_1.smsService.sendBulkSms(req.body, adminId);
            res.json(result);
        }
        catch (err) {
            console.error('خطا در ارسال گروهی:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async getSmsLogs(req, res) {
        try {
            const { page = 1, limit = 50, status } = req.query;
            const result = await sms_service_1.smsService.getSmsLogs({
                page: parseInt(page),
                limit: parseInt(limit),
                status: status,
            });
            res.json({
                success: true,
                data: result.logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    pages: Math.ceil(result.total / parseInt(limit)),
                },
            });
        }
        catch (err) {
            console.error('خطا در دریافت لاگ‌ها:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async searchCustomers(req, res) {
        try {
            const { q, limit = 50 } = req.query;
            if (!q || q.length < 2) {
                res.json({ success: true, data: [] });
                return;
            }
            const customers = await sms_service_1.smsService.searchCustomers(q, parseInt(limit));
            const formattedCustomers = customers.map(c => ({
                id: c.id,
                code: c.code,
                full_name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.code,
                mobile_number: c.mobile_number,
            }));
            res.json({ success: true, data: formattedCustomers });
        }
        catch (err) {
            console.error('خطا در جستجوی مشتریان:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async getCustomerBalance(req, res) {
        try {
            const { id } = req.params;
            const balance = await sms_service_1.smsService.getCustomerBalance(parseInt(id));
            if (!balance) {
                res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
                return;
            }
            res.json({ success: true, data: balance });
        }
        catch (err) {
            console.error('خطا در دریافت مانده حساب:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.SmsController = SmsController;
exports.smsController = new SmsController();
