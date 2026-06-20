// backend/src/core/queue/queueManager.ts

import { logger } from '../logger/winston';

interface QueueItem<T = any> {
  id: string;
  data: T;
  priority: number;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

interface QueueStats {
  queueLength: number;
  activeRequests: number;
  totalProcessed: number;
  totalQueued: number;
  avgWaitTime: number;
  maxConcurrent: number;
  maxQueueSize: number;
  priorityStats: Record<number, number>;
}

export class OptimizedQueue<T = any> {
  private queue: QueueItem<T>[] = [];
  private activeRequests: number = 0;
  private totalProcessed: number = 0;
  private totalQueued: number = 0;
  private totalWaitTime: number = 0;
  public maxConcurrent: number;
  public maxQueueSize: number;
  private name: string;

  constructor(name: string, maxConcurrent: number = 5, maxQueueSize: number = 1000) {
    this.name = name;
    this.maxConcurrent = maxConcurrent;
    this.maxQueueSize = maxQueueSize;
  }

  async add(data: T, priority: number = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.maxQueueSize) {
        reject(new Error(`Queue ${this.name} is full`));
        return;
      }

      const item: QueueItem<T> = {
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
      } else {
        this.queue.splice(insertIndex, 0, item);
      }

      this.totalQueued++;
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    while (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      this.activeRequests++;
      const waitTime = Date.now() - item.timestamp;
      this.totalWaitTime += waitTime;

      logger.debug(`📦 Queue ${this.name}: Processing item ${item.id} (priority: ${item.priority}, wait: ${waitTime}ms)`);

      try {
        const result = await this.processItem(item.data);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      } finally {
        this.activeRequests--;
        this.totalProcessed++;
        this.processNext();
      }
    }
  }

  private async processItem(data: T): Promise<any> {
    // This should be overridden or provided via callback
    // For now, just return the data
    return data;
  }

  setProcessor(processor: (data: T) => Promise<any>): void {
    this.processItem = processor;
  }

  getStats(): QueueStats {
    const priorityStats: Record<number, number> = {};
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

  clearQueue(): number {
    const cleared = this.queue.length;
    this.queue = [];
    return cleared;
  }

  isFull(): boolean {
    return this.queue.length >= this.maxQueueSize;
  }

  isEmpty(): boolean {
    return this.queue.length === 0 && this.activeRequests === 0;
  }
}

// Queue instances for different purposes
export const requestQueues: Record<string, OptimizedQueue> = {
  general: new OptimizedQueue('general', 10, 500),
  transaction: new OptimizedQueue('transaction', 5, 200),
  price: new OptimizedQueue('price', 3, 100),
  report: new OptimizedQueue('report', 2, 50),
  sms: new OptimizedQueue('sms', 5, 1000),
};

// Initialize processors
export const initQueues = (): void => {
  // Example processor for transaction queue
  requestQueues.transaction.setProcessor(async (data) => {
    // Process transaction logic here
    logger.debug(`Processing transaction: ${JSON.stringify(data)}`);
    return data;
  });

  logger.info(`✅ Initialized ${Object.keys(requestQueues).length} queues`);
};