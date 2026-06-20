"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.termsController = exports.TermsController = void 0;
const terms_service_1 = require("../services/terms.service");
class TermsController {
    async getActiveTerms(req, res) {
        try {
            const terms = await terms_service_1.termsService.getActiveTerms();
            if (!terms) {
                res.status(404).json({
                    success: false,
                    error: 'شرایط و قوانین یافت نشد',
                    message: 'هیچ شرایط و قوانینی در سیستم ثبت نشده است',
                });
                return;
            }
            res.json({
                success: true,
                data: terms,
            });
        }
        catch (err) {
            console.error('خطا در دریافت شرایط و قوانین:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async getTermsHistory(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await terms_service_1.termsService.getAllVersions(parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: result.terms,
                pagination: result.pagination,
            });
        }
        catch (err) {
            console.error('خطا در دریافت تاریخچه:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async createTerms(req, res) {
        try {
            const adminId = req.user?.id || 1;
            const { content } = req.body;
            const result = await terms_service_1.termsService.createTerms(content, adminId);
            // ارسال رویداد سوکت
            const io = req.app?.get('io');
            if (io) {
                io.emit('terms_updated', result);
            }
            res.status(201).json({
                success: true,
                message: 'شرایط و قوانین با موفقیت ایجاد شد',
                data: result,
            });
        }
        catch (err) {
            console.error('خطا در ایجاد شرایط:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async acceptTerms(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'احراز هویت نشده' });
                return;
            }
            const result = await terms_service_1.termsService.acceptTerms(userId);
            res.json({
                success: true,
                message: result.message,
                data: {
                    version: result.version,
                    accepted_at: new Date().toISOString(),
                },
            });
        }
        catch (err) {
            console.error('خطا در پذیرش شرایط:', err);
            res.json({
                success: true,
                message: 'پذیرش شرایط با موفقیت ثبت شد',
            });
        }
    }
    async checkAcceptance(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'احراز هویت نشده' });
                return;
            }
            const status = await terms_service_1.termsService.getUserAcceptanceStatus(userId);
            res.json({
                success: true,
                data: status,
            });
        }
        catch (err) {
            console.error('خطا در بررسی وضعیت:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async debugTerms(req, res) {
        try {
            const debugInfo = await terms_service_1.termsService.debugTerms();
            res.json({ success: true, data: debugInfo });
        }
        catch (err) {
            console.error('خطا در دیباگ:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.TermsController = TermsController;
exports.termsController = new TermsController();
