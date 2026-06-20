"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remittanceController = exports.RemittanceController = void 0;
const remittance_service_1 = require("../services/remittance.service");
class RemittanceController {
    // ایجاد حواله جدید (کاربر عادی)
    async createRemittance(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'احراز هویت نشده' });
                return;
            }
            const { type, weight, amount, coin_count, recipient, description } = req.body;
            if (!type || !recipient) {
                res.status(400).json({ success: false, error: 'نوع حواله و نام گیرنده الزامی است' });
                return;
            }
            const remittance = await remittance_service_1.remittanceService.createRemittance(userId, {
                type, weight, amount, coin_count, recipient, description
            }, req);
            res.status(201).json({
                success: true,
                message: 'حواله با موفقیت ایجاد شد',
                data: remittance
            });
        }
        catch (err) {
            console.error('خطا در ایجاد حواله:', err);
            res.status(400).json({ success: false, error: err.message });
        }
    }
    // دریافت حواله‌های کاربر جاری (کاربر عادی)
    async getUserRemittances(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'احراز هویت نشده' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const result = await remittance_service_1.remittanceService.getUserRemittances(userId, page, limit);
            res.json({
                success: true,
                data: result.remittances,
                pagination: result.pagination
            });
        }
        catch (err) {
            console.error('خطا در دریافت حواله‌ها:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // دریافت همه حواله‌ها (ادمین)
    async getAllRemittances(req, res) {
        try {
            if (!req.user?.isAdmin) {
                res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
                return;
            }
            const { status, page = 1, limit = 50, search } = req.query;
            const result = await remittance_service_1.remittanceService.getAllRemittances({
                status: status,
                page: parseInt(page),
                limit: parseInt(limit),
                search: search
            });
            res.json({
                success: true,
                data: result.remittances,
                pagination: result.pagination,
                stats: result.stats,
                total: result.total
            });
        }
        catch (err) {
            console.error('خطا در دریافت لیست حواله‌ها:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // دریافت آمار حواله‌ها (ادمین)
    async getRemittanceStats(req, res) {
        try {
            if (!req.user?.isAdmin) {
                res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
                return;
            }
            const stats = await remittance_service_1.remittanceService.getRemittanceStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (err) {
            console.error('خطا در دریافت آمار حواله‌ها:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // دریافت حواله‌های در انتظار اخیر (ادمین)
    async getRecentPendingRemittances(req, res) {
        try {
            if (!req.user?.isAdmin) {
                res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
                return;
            }
            const remittances = await remittance_service_1.remittanceService.getRecentPendingRemittances();
            res.json({ success: true, data: remittances });
        }
        catch (err) {
            console.error('خطا در دریافت حواله‌های جدید:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // دریافت حواله‌های امروز (ادمین)
    async getTodayRemittances(req, res) {
        try {
            if (!req.user?.isAdmin) {
                res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
                return;
            }
            const { status, page = 1, limit = 50 } = req.query;
            const result = await remittance_service_1.remittanceService.getTodayRemittances(status, parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: result.remittances,
                pagination: result.pagination
            });
        }
        catch (err) {
            console.error('خطا در دریافت حواله‌های امروز:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    // به‌روزرسانی وضعیت حواله (ادمین)
    async updateRemittanceStatus(req, res) {
        try {
            if (!req.user?.isAdmin) {
                res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
                return;
            }
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                res.status(400).json({ success: false, error: 'وضعیت الزامی است' });
                return;
            }
            const remittance = await remittance_service_1.remittanceService.updateRemittanceStatus(parseInt(id), status, req);
            if (!remittance) {
                res.status(404).json({ success: false, error: 'حواله یافت نشد' });
                return;
            }
            res.json({
                success: true,
                message: 'وضعیت حواله با موفقیت به‌روزرسانی شد',
                data: remittance
            });
        }
        catch (err) {
            console.error('خطا در به‌روزرسانی وضعیت حواله:', err);
            res.status(400).json({ success: false, error: err.message });
        }
    }
    // حذف حواله (ادمین)
    async deleteRemittance(req, res) {
        try {
            if (!req.user?.isAdmin) {
                res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
                return;
            }
            const { id } = req.params;
            const deleted = await remittance_service_1.remittanceService.deleteRemittance(parseInt(id));
            if (!deleted) {
                res.status(404).json({ success: false, error: 'حواله یافت نشد' });
                return;
            }
            res.json({
                success: true,
                message: 'حواله با موفقیت حذف شد'
            });
        }
        catch (err) {
            console.error('خطا در حذف حواله:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.RemittanceController = RemittanceController;
exports.remittanceController = new RemittanceController();
