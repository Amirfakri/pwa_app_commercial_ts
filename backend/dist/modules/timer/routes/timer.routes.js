"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/timer/routes/timer.routes.ts
const express_1 = require("express");
const timer_controller_1 = require("../controllers/timer.controller");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Route تست
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Timer module is working!' });
});
// اعمال middleware احراز هویت روی همه مسیرها
router.use(auth_middleware_1.authenticateSession);
// مسیرهای کاربر
router.get('/transaction/:transactionId', timer_controller_1.timerController.getTimerByTransaction);
router.get('/my-timers', timer_controller_1.timerController.getUserTimers);
router.post('/', timer_controller_1.timerController.createTimer);
router.put('/:id/decrement', timer_controller_1.timerController.decrementTimer);
// مسیرهای ادمین
router.get('/admin/all', auth_middleware_1.requireAdmin, timer_controller_1.timerController.getAllTimers);
router.get('/admin/stats', auth_middleware_1.requireAdmin, timer_controller_1.timerController.getTimerStats);
router.put('/admin/:id/expire', auth_middleware_1.requireAdmin, timer_controller_1.timerController.expireTimer);
router.delete('/admin/:id', auth_middleware_1.requireAdmin, timer_controller_1.timerController.deleteTimer);
router.delete('/admin/transaction/:transactionId', auth_middleware_1.requireAdmin, timer_controller_1.timerController.deleteTimerByTransaction);
exports.default = router;
