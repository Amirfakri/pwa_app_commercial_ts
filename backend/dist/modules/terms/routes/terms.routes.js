"use strict";
// backend/src/modules/terms/routes/terms.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const terms_controller_1 = require("../controllers/terms.controller");
const router = (0, express_1.Router)();
// مسیرهای عمومی (بدون احراز هویت)
router.get('/', terms_controller_1.termsController.getActiveTerms);
router.get('/public', terms_controller_1.termsController.getActiveTerms);
router.get('/public/latest', terms_controller_1.termsController.getActiveTerms);
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Terms module is working!' });
});
router.get('/debug', terms_controller_1.termsController.debugTerms);
// مسیرهای با احراز هویت (نیاز به لاگین)
router.post('/accept', terms_controller_1.termsController.acceptTerms);
router.get('/check', terms_controller_1.termsController.checkAcceptance);
// مسیرهای ادمین (نیاز به احراز هویت و ادمین بودن)
router.get('/history', terms_controller_1.termsController.getTermsHistory);
router.post('/', terms_controller_1.termsController.createTerms);
exports.default = router;
