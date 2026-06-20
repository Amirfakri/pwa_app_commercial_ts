"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sms_controller_1 = require("../controllers/sms.controller");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'sms module is working!' });
});
// همه مسیرهای SMS فقط برای ادمین هستند
router.use(auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin);
router.post('/send', sms_controller_1.smsController.sendSms);
router.post('/send-bulk', sms_controller_1.smsController.sendBulkSms);
router.get('/logs', sms_controller_1.smsController.getSmsLogs);
router.get('/customers/search', sms_controller_1.smsController.searchCustomers);
router.get('/customers/:id/balance', sms_controller_1.smsController.getCustomerBalance);
exports.default = router;
