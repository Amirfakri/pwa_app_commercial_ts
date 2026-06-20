// backend/src/modules/price/services/autoPriceSync.service.ts

import { externalPriceService } from './externalPrice.service';
import { priceService } from './price.service';
import { Server as SocketServer } from 'socket.io';

let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

export class AutoPriceSyncService {
  private io: SocketServer | null = null;
  private intervalMinutes: number = 5; // پیش‌فرض هر 5 دقیقه
  private lastSyncTime: Date | null = null;
  private syncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';
  private lastError: string | null = null;

  constructor(io?: SocketServer) {
    if (io) {
      this.io = io;
    }
  }

  setIo(io: SocketServer) {
    this.io = io;
  }

  setInterval(minutes: number) {
    this.intervalMinutes = minutes;
    this.restart();
  }

  async start() {
    if (syncInterval) {
      clearInterval(syncInterval);
    }

    console.log(`🔄 Auto price sync started - Interval: ${this.intervalMinutes} minutes`);
    
    // اولین همگام‌سازی فوری
    await this.syncPrices();
    
    // تنظیم تایمر برای همگام‌سازی دوره‌ای
    syncInterval = setInterval(async () => {
      await this.syncPrices();
    }, this.intervalMinutes * 60 * 1000);
  }

  async stop() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
      console.log('🛑 Auto price sync stopped');
    }
  }

  async syncPrices(): Promise<{ success: boolean; message: string; data?: any }> {
    if (isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return { success: false, message: 'Sync already in progress' };
    }

    isSyncing = true;
    this.syncStatus = 'syncing';
    this.emitStatus();

    try {
      console.log('🔄 Auto syncing external prices...');
      const startTime = Date.now();
      
      // همگام‌سازی قیمت‌ها
      const result = await externalPriceService.syncExternalPrices(1, true);
      
      const duration = Date.now() - startTime;
      this.lastSyncTime = new Date();
      this.syncStatus = 'success';
      this.lastError = null;
      
      console.log(`✅ Auto sync completed: ${result.success} updated, ${result.failed} failed, duration: ${duration}ms`);
      
      // ارسال بروزرسانی از طریق Socket
      if (this.io) {
        this.io.emit('prices_auto_synced', {
          success: true,
          updated: result.updated,
          failed: result.failed,
          timestamp: new Date().toISOString(),
          duration
        });
      }
      
      this.emitStatus();
      
      return {
        success: true,
        message: `همگام‌سازی خودکار انجام شد: ${result.success} قیمت به‌روزرسانی شد`,
        data: result
      };
    } catch (error: any) {
      console.error('❌ Auto sync failed:', error.message);
      this.syncStatus = 'error';
      this.lastError = error.message;
      this.emitStatus();
      
      return {
        success: false,
        message: `خطا در همگام‌سازی خودکار: ${error.message}`,
        data: { error: error.message }
      };
    } finally {
      isSyncing = false;
    }
  }

  private emitStatus() {
    if (this.io) {
      this.io.to('admin_room').emit('price_sync_status', {
        status: this.syncStatus,
        lastSyncTime: this.lastSyncTime,
        lastError: this.lastError,
        intervalMinutes: this.intervalMinutes,
        timestamp: new Date().toISOString()
      });
    }
  }

  getStatus() {
    return {
      isRunning: syncInterval !== null,
      intervalMinutes: this.intervalMinutes,
      lastSyncTime: this.lastSyncTime,
      syncStatus: this.syncStatus,
      lastError: this.lastError,
      isSyncing: isSyncing
    };
  }

  async syncNow(): Promise<{ success: boolean; message: string; data?: any }> {
    return this.syncPrices();
  }

  restart() {
    this.stop();
    this.start();
  }
}

export const autoPriceSyncService = new AutoPriceSyncService();