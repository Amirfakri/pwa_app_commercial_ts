"use strict";
// backend/src/modules/price/services/externalWebSocket.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalWebSocketService = exports.ExternalWebSocketService = void 0;
class ExternalWebSocketService {
    io = null;
    broadcastPriceUpdateFn = null;
    ws = null;
    isActive = false;
    constructor(io) {
        if (io) {
            this.io = io;
        }
    }
    setIo(io) {
        this.io = io;
    }
    setBroadcastFunction(fn) {
        this.broadcastPriceUpdateFn = fn;
    }
    async start() {
        this.isActive = true;
        console.log('✅ External WebSocket service started');
    }
    async stop() {
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
exports.ExternalWebSocketService = ExternalWebSocketService;
exports.externalWebSocketService = new ExternalWebSocketService();
