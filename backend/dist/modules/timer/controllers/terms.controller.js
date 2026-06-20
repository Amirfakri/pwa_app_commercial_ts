"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timerController = exports.TimerController = void 0;
const timer_service_1 = require("../services/timer.service");
class TimerController {
    async getTimerByTransaction(req, res) {
        try {
            const { transactionId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'احراز هویت نشده' });
                return;
            }
            const timer = await timer_service_1.timerService.getTimerByTransactionId(parseInt(transactionId));
            if (!timer) {
                res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
                return;
            }
            if (timer.user_id !== userId && !req.user?.isAdmin) {
                res.status(403).json({ success: false, error: 'دسترسی غیرمجاز' });
                return;
            }
            const response = await timer_service_1.timerService.getTimerResponse(timer);
            res.json({
                success: true,
                data: response
            });
        }
        catch (err) {
            console.error('خطا در دریافت تایمر:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async getUserTimers(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'احراز هویت نشده' });
                return;
            }
            const timers = await timer_service_1.timerService.getUserActiveTimers(userId);
            const responses = await Promise.all(timers.map(t => timer_service_1.timerService.getTimerResponse(t)));
            res.json({
                success: true,
                data: responses
            });
        }
        catch (err) {
            console.error('خطا در دریافت تایمرهای کاربر:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async createTimer(req, res) {
        try {
            const { transaction_id, initial_seconds } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'احراز هویت نشده' });
                return;
            }
            if (!transaction_id) {
                res.status(400).json({ success: false, error: 'شناسه تراکنش الزامی است' });
                return;
            }
            const timer = await timer_service_1.timerService.createTimer(transaction_id, userId, initial_seconds || 30);
            const response = await timer_service_1.timerService.getTimerResponse(timer);
            res.status(201).json({
                success: true,
                message: 'تایمر با موفقیت ایجاد شد',
                data: response
            });
        }
        catch (err) {
            console.error('خطا در ایجاد تایمر:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async decrementTimer(req, res) {
        try {
            const { id } = req.params;
            const { seconds = 1 } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'احراز هویت نشده' });
                return;
            }
            const timer = await timer_service_1.timerService.getTimerById(parseInt(id));
            if (!timer) {
                res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
                return;
            }
            if (timer.user_id !== userId && !req.user?.isAdmin) {
                res.status(403).json({ success: false, error: 'دسترسی غیرمجاز' });
                return;
            }
            const updatedTimer = await timer_service_1.timerService.decrementTimer(parseInt(id), seconds);
            if (!updatedTimer) {
                res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
                return;
            }
            const response = await timer_service_1.timerService.getTimerResponse(updatedTimer);
            res.json({
                success: true,
                data: response
            });
        }
        catch (err) {
            console.error('خطا در کاهش تایمر:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async expireTimer(req, res) {
        try {
            const { id } = req.params;
            if (!req.user?.isAdmin) {
                res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
                return;
            }
            const timer = await timer_service_1.timerService.expireTimer(parseInt(id));
            if (!timer) {
                res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
                return;
            }
            const response = await timer_service_1.timerService.getTimerResponse(timer);
            res.json({
                success: true,
                message: 'تایمر با موفقیت منقضی شد',
                data: response
            });
        }
        catch (err) {
            console.error('خطا در انقضای تایمر:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async deleteTimer(req, res) {
        try {
            const { transactionId } = req.params;
            if (!req.user?.isAdmin) {
                res.status(403).json({ success: false, error: 'دسترسی غیرمجاز: فقط ادمین‌ها' });
                return;
            }
            const deleted = await timer_service_1.timerService.deleteTimerByTransactionId(parseInt(transactionId));
            if (!deleted) {
                res.status(404).json({ success: false, error: 'تایمر یافت نشد' });
                return;
            }
            res.json({
                success: true,
                message: 'تایمر با موفقیت حذف شد'
            });
        }
        catch (err) {
            console.error('خطا در حذف تایمر:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.TimerController = TimerController;
exports.timerController = new TimerController();
