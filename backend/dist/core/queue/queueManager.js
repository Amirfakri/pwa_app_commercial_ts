"use strict";
// backend/src/core/queue/queueManager.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.initQueues = exports.requestQueues = exports.OptimizedQueue = void 0;
const winston_1 = require("../logger/winston");
class OptimizedQueue {
    queue = [];
    activeRequests = 0;
    totalProcessed = 0;
    totalQueued = 0;
    totalWaitTime = 0;
    maxConcurrent;
    maxQueueSize;
    name;
    constructor(name, maxConcurrent = 5, maxQueueSize = 1000) {
        this.name = name;
        this.maxConcurrent = maxConcurrent;
        this.maxQueueSize = maxQueueSize;
    }
    async add(data, priority = 0) {
        return new Promise((resolve, reject) => {
            if (this.queue.length >= this.maxQueueSize) {
                reject(new Error(`Queue ${this.name} is full`));
                return;
            }
            const item = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                data,
                priority,
                timestamp: Date.now(),
                resolve,
                reject,
            };
            // Insert in priority order (higher priority first)
            const insertIndex = this.queue.findIndex(q => q.priority < priority);
            if (insertIndex === -1) {
                this.queue.push(item);
            }
            else {
                this.queue.splice(insertIndex, 0, item);
            }
            this.totalQueued++;
            this.processNext();
        });
    }
    async processNext() {
        while (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
            const item = this.queue.shift();
            if (!item)
                break;
            this.activeRequests++;
            const waitTime = Date.now() - item.timestamp;
            this.totalWaitTime += waitTime;
            winston_1.logger.debug(`📦 Queue ${this.name}: Processing item ${item.id} (priority: ${item.priority}, wait: ${waitTime}ms)`);
            try {
                const result = await this.processItem(item.data);
                item.resolve(result);
            }
            catch (error) {
                item.reject(error);
            }
            finally {
                this.activeRequests--;
                this.totalProcessed++;
                this.processNext();
            }
        }
    }
    async processItem(data) {
        // This should be overridden or provided via callback
        // For now, just return the data
        return data;
    }
    setProcessor(processor) {
        this.processItem = processor;
    }
    getStats() {
        const priorityStats = {};
        for (const item of this.queue) {
            priorityStats[item.priority] = (priorityStats[item.priority] || 0) + 1;
        }
        return {
            queueLength: this.queue.length,
            activeRequests: this.activeRequests,
            totalProcessed: this.totalProcessed,
            totalQueued: this.totalQueued,
            avgWaitTime: this.totalProcessed > 0 ? this.totalWaitTime / this.totalProcessed : 0,
            maxConcurrent: this.maxConcurrent,
            maxQueueSize: this.maxQueueSize,
            priorityStats,
        };
    }
    clearQueue() {
        const cleared = this.queue.length;
        this.queue = [];
        return cleared;
    }
    isFull() {
        return this.queue.length >= this.maxQueueSize;
    }
    isEmpty() {
        return this.queue.length === 0 && this.activeRequests === 0;
    }
}
exports.OptimizedQueue = OptimizedQueue;
// Queue instances for different purposes
exports.requestQueues = {
    general: new OptimizedQueue('general', 10, 500),
    transaction: new OptimizedQueue('transaction', 5, 200),
    price: new OptimizedQueue('price', 3, 100),
    report: new OptimizedQueue('report', 2, 50),
    sms: new OptimizedQueue('sms', 5, 1000),
};
// Initialize processors
const initQueues = () => {
    // Example processor for transaction queue
    exports.requestQueues.transaction.setProcessor(async (data) => {
        // Process transaction logic here
        winston_1.logger.debug(`Processing transaction: ${JSON.stringify(data)}`);
        return data;
    });
    winston_1.logger.info(`✅ Initialized ${Object.keys(exports.requestQueues).length} queues`);
};
exports.initQueues = initQueues;
