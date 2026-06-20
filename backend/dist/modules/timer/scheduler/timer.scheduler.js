"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopTimerScheduler = exports.startTimerScheduler = void 0;
// backend/src/modules/timer/scheduler/timer.scheduler.ts
const transaction_service_1 = require("../../transaction/services/transaction.service");
const postgres_1 = require("../../../core/database/postgres");
let timerInterval = null;
const startTimerScheduler = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    // هر ثانیه یکبار تراکنش‌های در انتظار را بررسی کن
    timerInterval = setInterval(async () => {
        try {
            // دریافت مقدار تایمر فعلی از دیتابیس
            const timerResult = await postgres_1.pool.query('SELECT value FROM timer WHERE id = 1');
            let currentTimerValue = 30;
            if (timerResult.rows.length > 0) {
                currentTimerValue = parseInt(timerResult.rows[0].value);
                if (isNaN(currentTimerValue) || currentTimerValue < 5) {
                    currentTimerValue = 30;
                }
            }
            // دریافت همه تراکنش‌های در انتظار
            const pendingTransactions = await transaction_service_1.transactionService.getPendingTransactions();
            for (const tx of pendingTransactions) {
                const createdAt = new Date(tx.created_at);
                const now = new Date();
                const elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
                const remainingSeconds = Math.max(0, currentTimerValue - elapsedSeconds);
                // اگر زمان به پایان رسیده و تراکنش هنوز در انتظار است
                if (remainingSeconds === 0 && tx.status === 'pending') {
                    console.log(`⏰ Transaction ${tx.id} expired after ${currentTimerValue} seconds`);
                    // منقضی کردن تراکنش
                    await transaction_service_1.transactionService.expireTransaction(tx.id);
                    // ارسال نوتیفیکیشن از طریق Socket
                    const io = global.io;
                    if (io) {
                        io.emit('transaction_expired', {
                            transaction_id: tx.id,
                            user_id: tx.user_id,
                            status: 'expired',
                            message: 'زمان تراکنش به پایان رسید'
                        });
                        io.to(`user_${tx.user_id}`).emit('transaction_expired', {
                            transaction_id: tx.id,
                            status: 'expired',
                            message: 'زمان تراکنش به پایان رسید'
                        });
                        io.to('admin_room').emit('transaction_update', {
                            id: tx.id,
                            status: 'expired',
                            updated_at: new Date().toISOString()
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in timer scheduler:', error);
        }
    }, 1000);
};
exports.startTimerScheduler = startTimerScheduler;
const stopTimerScheduler = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
};
exports.stopTimerScheduler = stopTimerScheduler;
