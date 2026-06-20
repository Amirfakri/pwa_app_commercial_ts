"use strict";
// backend/src/modules/support/controllers/terms.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.termsController = exports.TermsController = void 0;
const terms_service_1 = require("../services/terms.service");
class TermsController {
    async getActiveTerms(req, res) {
        try {
            let terms = await terms_service_1.termsService.getActiveTerms();
            if (!terms) {
                terms = await terms_service_1.termsService.getInitialTerms();
            }
            res.json({
                success: true,
                data: {
                    id: terms.id,
                    content: terms.content,
                    version: terms.version,
                    created_at: terms.created_at,
                    updated_at: terms.updated_at,
                },
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'خطای سرور',
            });
        }
    }
    async getTermsHistory(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await terms_service_1.termsService.getAllVersions(page, limit);
            res.json({
                success: true,
                data: result.terms,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    pages: Math.ceil(result.total / limit),
                },
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'خطای سرور',
            });
        }
    }
    async createTerms(req, res) {
        try {
            const data = req.body;
            const terms = await terms_service_1.termsService.createTerms(data, req.user.id);
            const io = req.app.get('io');
            if (io) {
                io.emit('terms_updated', {
                    id: terms.id,
                    version: terms.version,
                    updated_at: terms.updated_at,
                });
            }
            res.status(201).json({
                success: true,
                message: 'شرایط و قوانین با موفقیت ایجاد شد',
                data: {
                    id: terms.id,
                    content: terms.content,
                    version: terms.version,
                    created_at: terms.created_at,
                    updated_at: terms.updated_at,
                },
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'خطای سرور در ایجاد شرایط و قوانین',
            });
        }
    }
    async acceptTerms(req, res) {
        try {
            const userId = req.user.id;
            const result = await terms_service_1.termsService.acceptTerms(userId);
            res.json({
                success: true,
                message: result.message,
                needsRedirect: result.needsRedirect,
            });
        }
        catch (err) {
            res.json({
                success: true,
                message: 'پذیرش شرایط ثبت شد',
                needsRedirect: true,
            });
        }
    }
    async checkAcceptance(req, res) {
        try {
            const userId = req.user.id;
            const acceptanceStatus = await terms_service_1.termsService.checkUserAcceptance(userId);
            res.json({
                success: true,
                data: acceptanceStatus,
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'خطای سرور',
            });
        }
    }
}
exports.TermsController = TermsController;
exports.termsController = new TermsController();
