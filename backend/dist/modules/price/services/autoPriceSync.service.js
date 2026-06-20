"use strict";
// backend/src/modules/price/services/autoPriceSync.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoPriceSyncService = exports.AutoPriceSyncService = void 0;
const externalPrice_service_1 = require("./externalPrice.service");
let syncInterval = null;
let isSyncing = false;
class AutoPriceSyncService {
    io = null;
    intervalMinutes = 5; // پیش‌فرض هر 5 دقیقه
    lastSyncTime = null;
    syncStatus = 'idle';
    lastError = null;
    constructor(io) {
        if (io) {
            this.io = io;
        }
    }
    setIo(io) {
        this.io = io;
    }
    setInterval(minutes) {
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
    async syncPrices() {
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
            const result = await externalPrice_service_1.externalPriceService.syncExternalPrices(1, true);
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
        }
        catch (error) {
            console.error('❌ Auto sync failed:', error.message);
            this.syncStatus = 'error';
            this.lastError = error.message;
            this.emitStatus();
            return {
                success: false,
                message: `خطا در همگام‌سازی خودکار: ${error.message}`,
                data: { error: error.message }
            };
        }
        finally {
            isSyncing = false;
        }
    }
    emitStatus() {
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
    async syncNow() {
        return this.syncPrices();
    }
    restart() {
        this.stop();
        this.start();
    }
}
exports.AutoPriceSyncService = AutoPriceSyncService;
exports.autoPriceSyncService = new AutoPriceSyncService();
