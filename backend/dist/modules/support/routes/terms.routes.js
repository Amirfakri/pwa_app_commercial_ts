"use strict";
// backend/src/modules/support/routes/terms.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const terms_controller_1 = require("../controllers/terms.controller");
const router = (0, express_1.Router)();
// روت تست - بدون احراز هویت
router.get('/ping', (req, res) => {
    res.json({ success: true, message: 'Terms module is working!' });
});
// روت‌های اصلی
router.get('/', auth_middleware_1.authenticateSession, terms_controller_1.termsController.getActiveTerms);
router.get('/history', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, terms_controller_1.termsController.getTermsHistory);
router.post('/', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, terms_controller_1.termsController.createTerms);
router.post('/accept', auth_middleware_1.authenticateSession, terms_controller_1.termsController.acceptTerms);
router.get('/check', auth_middleware_1.authenticateSession, terms_controller_1.termsController.checkAcceptance);
exports.default = router;
