"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/remittance/routes/remittance.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const remittance_controller_1 = require("../controllers/remittance.controller");
const router = (0, express_1.Router)();
// 🔐 اعمال middleware احراز هویت روی همه مسیرها
router.use(auth_middleware_1.authenticateSession);
// Route تست Socket.IO (فقط برای تست)
router.post('/test-socket', (req, res) => {
    const io = req.app.get('io');
    if (io) {
        const testData = {
            message: 'Test message from server',
            timestamp: new Date().toISOString(),
            id: Math.floor(Math.random() * 1000)
        };
        console.log('📤 Sending test event:', testData);
        io.emit('test_event', testData);
        res.json({ success: true, message: 'Test event sent', data: testData });
    }
    else {
        console.log('⚠️ io not available');
        res.status(500).json({ success: false, message: 'Socket not available' });
    }
});
// ============== مسیرهای کاربر عادی ==============
router.post('/', remittance_controller_1.remittanceController.createRemittance);
router.get('/user', remittance_controller_1.remittanceController.getUserRemittances);
// ============== مسیرهای ادمین ==============
router.get('/admin', remittance_controller_1.remittanceController.getAllRemittances);
router.get('/admin/stats', remittance_controller_1.remittanceController.getRemittanceStats);
router.get('/admin/recent', remittance_controller_1.remittanceController.getRecentPendingRemittances);
router.get('/admin/today', remittance_controller_1.remittanceController.getTodayRemittances);
router.put('/admin/:id/status', remittance_controller_1.remittanceController.updateRemittanceStatus);
router.delete('/admin/:id', remittance_controller_1.remittanceController.deleteRemittance);
exports.default = router;
