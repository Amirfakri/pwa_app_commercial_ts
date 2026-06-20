// backend/src/modules/price/services/externalWebSocket.service.ts

import { Server as SocketServer } from 'socket.io';
import { priceService } from './price.service';
import { offsetService } from './offset.service';

export class ExternalWebSocketService {
  private io: SocketServer | null = null;
  private broadcastPriceUpdateFn: ((data: any) => Promise<void>) | null = null;
  private ws: any = null;
  private isActive = false;

  constructor(io?: SocketServer) {
    if (io) {
      this.io = io;
    }
  }

  setIo(io: SocketServer) {
    this.io = io;
  }

  setBroadcastFunction(fn: (data: any) => Promise<void>) {
    this.broadcastPriceUpdateFn = fn;
  }

  async start(): Promise<void> {
    this.isActive = true;
    console.log('✅ External WebSocket service started');
  }

  async stop(): Promise<void> {
    this.isActive = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log('⏹️ External WebSocket service stopped');
  }

  getStatus() {
    return {
      isActive: this.isActive,
      isConnected: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 10,
      message: 'WebSocket service is configured but not connected'
    };
  }
}

export const externalWebSocketService = new ExternalWebSocketService();