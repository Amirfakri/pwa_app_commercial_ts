"use strict";
// backend/src/modules/transaction/cron/expiration.cron.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDayChangeCron = exports.initExpirationCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const transaction_service_1 = require("../services/transaction.service");
let io;
const initExpirationCron = (socketIo) => {
    io = socketIo;
    // Run every minute
    node_cron_1.default.schedule('* * * * *', async () => {
        try {
            const expiredTransactions = await transaction_service_1.transactionService.expirePendingTransactions();
            if (expiredTransactions.length > 0 && io) {
                expiredTransactions.forEach((tx) => {
                    io.emit('transaction_expired', tx);
                    io.to(`user_${tx.user_id}`).emit('transaction_expired', tx);
                    io.to('admin_room').emit('transaction_expired', tx);
                    io.to('transactions_room').emit('transaction_expired', tx);
                });
                console.log(`⏰ ${expiredTransactions.length} تراکنش منقضی شد`);
            }
        }
        catch (err) {
            console.error('❌ خطا در کرون‌جاب انقضای تراکنش:', err);
        }
    });
};
exports.initExpirationCron = initExpirationCron;
const initDayChangeCron = (socketIo) => {
    // Run at midnight (00:00:00) every day
    node_cron_1.default.schedule('0 0 * * *', async () => {
        try {
            if (socketIo) {
                socketIo.emit('day_changed');
                console.log('📅 روز جدید شروع شد - سیگنال day_changed ارسال شد');
            }
        }
        catch (err) {
            console.error('خطا در ارسال سیگنال تغییر روز:', err);
        }
    });
};
exports.initDayChangeCron = initDayChangeCron;
