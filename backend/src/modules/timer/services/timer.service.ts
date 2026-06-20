// backend/src/modules/timer/services/timer.service.ts
import { timerRepository } from '../repositories/timer.repository';
import { ITimer, ICreateTimerInput } from '../types/timer.types';

export class TimerService {
  async createTimer(transactionId: number, userId: number, initialSeconds: number = 30): Promise<ITimer> {
    const existingTimer = await timerRepository.findByTransactionId(transactionId);
    if (existingTimer) {
      return existingTimer;
    }

    const timer = await timerRepository.create({
      transaction_id: transactionId,
      user_id: userId,
      remaining_seconds: initialSeconds,
      initial_seconds: initialSeconds,
      status: 'active'
    });

    return timer;
  }

  async getTimerByTransactionId(transactionId: number): Promise<ITimer | null> {
    return timerRepository.findByTransactionId(transactionId);
  }

  async getTimerById(id: number): Promise<ITimer | null> {
    return timerRepository.findById(id);
  }

  async getUserActiveTimers(userId: number): Promise<ITimer[]> {
    if (userId === 0) {
      return timerRepository.getActiveTimers();
    }
    return timerRepository.findByUserId(userId);
  }

  async getAllActiveTimers(): Promise<ITimer[]> {
    return timerRepository.getActiveTimers();
  }

  async getAllTimers(page: number = 1, limit: number = 50, status?: string): Promise<{ timers: ITimer[]; total: number }> {
    return timerRepository.getAllTimers(page, limit, status);
  }

  async decrementTimer(id: number, seconds: number = 1): Promise<ITimer | null> {
    const timer = await timerRepository.decrementRemainingSeconds(id, seconds);
    
    if (timer && timer.remaining_seconds <= 0) {
      await this.expireTimer(id);
      return timerRepository.findById(id);
    }
    
    return timer;
  }

  async expireTimer(id: number): Promise<ITimer | null> {
    const timer = await timerRepository.expireTimer(id);
    
    if (timer) {
      const io = (global as any).io;
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

  async updateTimerStatus(id: number, status: 'active' | 'expired' | 'cancelled'): Promise<ITimer | null> {
    return timerRepository.update(id, { status });
  }

  async deleteTimerByTransactionId(transactionId: number): Promise<boolean> {
    return timerRepository.deleteByTransactionId(transactionId);
  }

  async deleteTimer(id: number): Promise<boolean> {
    return timerRepository.delete(id);
  }

  async getTimerResponse(timer: ITimer): Promise<any> {
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

  async getTimerStats(): Promise<any> {
    const activeTimers = await timerRepository.getActiveTimers();
    const expiredTimers = await timerRepository.getExpiredTimers();
    const totalTimers = await timerRepository.getTotalCount();
    
    return {
      total: totalTimers,
      active: activeTimers.length,
      expired: expiredTimers.length,
      by_user: await timerRepository.getCountByUser()
    };
  }
}

export const timerService = new TimerService();