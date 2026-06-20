"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timerService = exports.TimerService = void 0;
// backend/src/modules/timer/services/timer.service.ts
const timer_repository_1 = require("../repositories/timer.repository");
class TimerService {
    async createTimer(transactionId, userId, initialSeconds = 30) {
        const existingTimer = await timer_repository_1.timerRepository.findByTransactionId(transactionId);
        if (existingTimer) {
            return existingTimer;
        }
        const timer = await timer_repository_1.timerRepository.create({
            transaction_id: transactionId,
            user_id: userId,
            remaining_seconds: initialSeconds,
            initial_seconds: initialSeconds,
            status: 'active'
        });
        return timer;
    }
    async getTimerByTransactionId(transactionId) {
        return timer_repository_1.timerRepository.findByTransactionId(transactionId);
    }
    async getTimerById(id) {
        return timer_repository_1.timerRepository.findById(id);
    }
    async getUserActiveTimers(userId) {
        if (userId === 0) {
            return timer_repository_1.timerRepository.getActiveTimers();
        }
        return timer_repository_1.timerRepository.findByUserId(userId);
    }
    async getAllActiveTimers() {
        return timer_repository_1.timerRepository.getActiveTimers();
    }
    async getAllTimers(page = 1, limit = 50, status) {
        return timer_repository_1.timerRepository.getAllTimers(page, limit, status);
    }
    async decrementTimer(id, seconds = 1) {
        const timer = await timer_repository_1.timerRepository.decrementRemainingSeconds(id, seconds);
        if (timer && timer.remaining_seconds <= 0) {
            await this.expireTimer(id);
            return timer_repository_1.timerRepository.findById(id);
        }
        return timer;
    }
    async expireTimer(id) {
        const timer = await timer_repository_1.timerRepository.expireTimer(id);
        if (timer) {
            const io = global.io;
            if (io) {
                io.to(`user_${timer.user_id}`).emit('timer_expired', {
                    timer_id: timer.id,
                    transaction_id: timer.transaction_id,
                    remaining_seconds: 0,
                    status: 'expired'
                });
            }
        }
        return timer;
    }
    async updateTimerStatus(id, status) {
        return timer_repository_1.timerRepository.update(id, { status });
    }
    async deleteTimerByTransactionId(transactionId) {
        return timer_repository_1.timerRepository.deleteByTransactionId(transactionId);
    }
    async deleteTimer(id) {
        return timer_repository_1.timerRepository.delete(id);
    }
    async getTimerResponse(timer) {
        const now = new Date();
        const expiresAt = new Date(timer.expires_at);
        const isExpired = now >= expiresAt || timer.remaining_seconds <= 0;
        return {
            id: timer.id,
            transaction_id: timer.transaction_id,
            user_id: timer.user_id,
            remaining_seconds: isExpired ? 0 : timer.remaining_seconds,
            initial_seconds: timer.initial_seconds,
            status: isExpired ? 'expired' : timer.status,
            expires_at: expiresAt.toISOString(),
            started_at: timer.started_at.toISOString(),
            created_at: timer.created_at,
            updated_at: timer.updated_at,
            is_expired: isExpired,
            progress_percent: ((timer.initial_seconds - (isExpired ? 0 : timer.remaining_seconds)) / timer.initial_seconds) * 100
        };
    }
    async getTimerStats() {
        const activeTimers = await timer_repository_1.timerRepository.getActiveTimers();
        const expiredTimers = await timer_repository_1.timerRepository.getExpiredTimers();
        const totalTimers = await timer_repository_1.timerRepository.getTotalCount();
        return {
            total: totalTimers,
            active: activeTimers.length,
            expired: expiredTimers.length,
            by_user: await timer_repository_1.timerRepository.getCountByUser()
        };
    }
}
exports.TimerService = TimerService;
exports.timerService = new TimerService();
