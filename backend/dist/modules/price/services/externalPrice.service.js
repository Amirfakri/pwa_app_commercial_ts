"use strict";
// backend/src/modules/price/services/externalPrice.service.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalPriceService = void 0;
const axios_1 = __importDefault(require("axios"));
const ws_1 = __importDefault(require("ws"));
const price_service_1 = require("./price.service");
const price_repository_1 = require("../repositories/price.repository");
class ExternalPriceService {
    ws = null;
    io = null;
    pollingInterval = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    priceCache = new Map();
    isConnected = false;
    connectionMode = 'none';
    constructor() {
        this.initialize();
    }
    initialize() {
        const apiUrl = process.env.EXTERNAL_PRICE_API_URL;
        const wsUrl = process.env.EXTERNAL_PRICE_WS_URL;
        if (wsUrl) {
            this.connectionMode = 'websocket';
            this.connectWebSocket();
            console.log('🌐 External price service: WebSocket mode');
        }
        else if (apiUrl) {
            this.connectionMode = 'polling';
            this.startPolling();
            console.log('🌐 External price service: Polling mode');
        }
        else {
            this.connectionMode = 'none';
            console.log('ℹ️ External price service: Not configured');
        }
    }
    setIo(io) {
        this.io = io;
        console.log('✅ Socket.IO set for external price service');
    }
    // ==================== WebSocket Mode ====================
    connectWebSocket() {
        const wsUrl = process.env.EXTERNAL_PRICE_WS_URL;
        if (!wsUrl)
            return;
        try {
            this.ws = new ws_1.default(wsUrl, {
                headers: {
                    'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY || ''}`,
                    'X-Source': 'pwa-backend'
                }
            });
            this.ws.on('open', () => {
                console.log('✅ Connected to external price WebSocket');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                // ارسال درخواست اشتراک
                this.subscribeToProducts();
            });
            this.ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleWebSocketMessage(message);
                }
                catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            });
            this.ws.on('error', (err) => {
                console.error('External WebSocket error:', err);
                this.isConnected = false;
            });
            this.ws.on('close', () => {
                console.log('External WebSocket closed');
                this.isConnected = false;
                this.reconnectWebSocket();
            });
        }
        catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.reconnectWebSocket();
        }
    }
    reconnectWebSocket() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached, switching to polling mode');
            this.switchToPolling();
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`Reconnecting WebSocket in ${delay}ms... (attempt ${this.reconnectAttempts})`);
        setTimeout(() => {
            this.connectWebSocket();
        }, delay);
    }
    subscribeToProducts() {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN)
            return;
        const products = [
            'AB_FARDA', 'AB_PASFARDA', 'AB_14', 'AB_14_4', 'AB_14_6', 'AB_14_8',
            'AB_18_4', 'AB_18_6', 'AB_18_8', 'AB_18_10', 'AB_18_12', 'AB_18_14',
            'AB_18_16', 'AB_18_18', 'AB_18_20',
            'COIN_EMAMI', 'COIN_AZADI', 'COIN_1', 'COIN_2', 'COIN_3', 'COIN_1_4',
            'COIN_1_2', 'COIN_MELI', 'COIN_TAMAM'
        ];
        const subscribeMessage = {
            action: 'subscribe',
            products: products
        };
        this.ws.send(JSON.stringify(subscribeMessage));
        console.log(`📡 Subscribed to ${products.length} products`);
    }
    async handleWebSocketMessage(message) {
        // پشتیبانی از فرمت‌های مختلف پیام
        let priceItem = null;
        if (message.type === 'price' || message.type === 'update') {
            priceItem = {
                code: message.code || message.product_code,
                buy_price: message.buy_price || message.buy,
                sell_price: message.sell_price || message.sell,
                name: message.name,
                display_name: message.display_name
            };
        }
        else if (message.price) {
            priceItem = message.price;
        }
        else if (message.code && (message.buy_price || message.sell_price)) {
            priceItem = message;
        }
        if (priceItem && priceItem.code) {
            await this.saveAndBroadcastPrice(priceItem, 'websocket');
        }
        else if (message.prices && Array.isArray(message.prices)) {
            for (const item of message.prices) {
                await this.saveAndBroadcastPrice(item, 'websocket');
            }
        }
    }
    // ==================== Polling Mode ====================
    startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        // اولین بار بلافاصله
        this.fetchAndUpdatePrices();
        // سپس هر ۵ ثانیه
        this.pollingInterval = setInterval(() => {
            this.fetchAndUpdatePrices();
        }, 5000);
        console.log('✅ External price polling started (every 5 seconds)');
    }
    switchToPolling() {
        if (this.connectionMode === 'websocket') {
            console.log('Switching from WebSocket to polling mode...');
            this.connectionMode = 'polling';
            this.startPolling();
        }
    }
    async fetchAndUpdatePrices() {
        try {
            const apiUrl = process.env.EXTERNAL_PRICE_API_URL;
            if (!apiUrl)
                return;
            const response = await axios_1.default.get(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            let prices = [];
            // تبدیل فرمت‌های مختلف پاسخ
            if (response.data.prices && Array.isArray(response.data.prices)) {
                prices = response.data.prices;
            }
            else if (response.data.data && Array.isArray(response.data.data)) {
                prices = response.data.data;
            }
            else if (Array.isArray(response.data)) {
                prices = response.data;
            }
            else if (response.data.code) {
                prices = [response.data];
            }
            for (const price of prices) {
                await this.saveAndBroadcastPrice(price, 'polling');
            }
            if (prices.length > 0) {
                console.log(`📡 Polled ${prices.length} external prices`);
            }
        }
        catch (error) {
            console.error('Error fetching external prices:', error);
        }
    }
    // ==================== Core Functions ====================
    async saveAndBroadcastPrice(priceItem, source) {
        try {
            const productCode = priceItem.code;
            if (!productCode)
                return;
            // بررسی اینکه آیا محصول در سیستم وجود دارد
            const buyPrice = priceItem.buy_price || null;
            const sellPrice = priceItem.sell_price || null;
            if (!buyPrice && !sellPrice)
                return;
            // ذخیره در دیتابیس
            const updatedPrice = await price_service_1.priceService.createOrUpdatePrice({
                product_code: productCode,
                buy_price: buyPrice,
                sell_price: sellPrice,
                display_name: priceItem.display_name || priceItem.name || productCode,
                is_visible_buy: true,
                is_visible_sell: true
            }, 1); // adminId=1 برای سیستم
            // به‌روزرسانی کش
            this.priceCache.set(productCode, {
                product_code: productCode,
                buy_price: buyPrice,
                sell_price: sellPrice,
                display_name: priceItem.display_name || null,
                updated_at: new Date(),
                source: source
            });
            // پخش به کاربران از طریق Socket.IO
            if (this.io) {
                const { priceController } = await Promise.resolve().then(() => __importStar(require('../controllers/price.controller')));
                await priceController.broadcastPriceToUsers(this.io, updatedPrice, source);
            }
        }
        catch (error) {
            console.error(`Error saving price for ${priceItem.code}:`, error);
        }
    }
    // ==================== Public Methods ====================
    async getCachedPrice(productCode) {
        return this.priceCache.get(productCode) || null;
    }
    async getAllCachedPrices() {
        return Array.from(this.priceCache.values());
    }
    async fetchSingleProductPrice(productCode) {
        try {
            const apiUrl = process.env.EXTERNAL_PRICE_API_URL;
            if (!apiUrl)
                return null;
            const response = await axios_1.default.get(`${apiUrl}/${productCode}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`
                },
                timeout: 5000
            });
            if (response.data) {
                return {
                    code: response.data.code || productCode,
                    buy_price: response.data.buy_price || response.data.buy,
                    sell_price: response.data.sell_price || response.data.sell,
                    name: response.data.name,
                    display_name: response.data.display_name
                };
            }
            return null;
        }
        catch (error) {
            console.error(`Error fetching price for ${productCode}:`, error);
            return null;
        }
    }
    async syncExternalPrices(adminId, forceUpdate = false) {
        const result = {
            success: 0,
            failed: 0,
            skipped: []
        };
        try {
            const apiUrl = process.env.EXTERNAL_PRICE_API_URL;
            if (!apiUrl) {
                throw new Error('External price API not configured');
            }
            const response = await axios_1.default.get(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`
                },
                timeout: 15000
            });
            let prices = [];
            if (response.data.prices && Array.isArray(response.data.prices)) {
                prices = response.data.prices;
            }
            else if (Array.isArray(response.data)) {
                prices = response.data;
            }
            for (const price of prices) {
                try {
                    const existing = await price_repository_1.priceRepository.getLatestPrice(price.code);
                    if (!forceUpdate && existing) {
                        const existingBuy = existing.buy_price;
                        const existingSell = existing.sell_price;
                        if (existingBuy === price.buy_price && existingSell === price.sell_price) {
                            result.skipped.push(price.code);
                            continue;
                        }
                    }
                    await price_service_1.priceService.createOrUpdatePrice({
                        product_code: price.code,
                        buy_price: price.buy_price,
                        sell_price: price.sell_price,
                        display_name: price.display_name || price.name || price.code,
                        is_visible_buy: true,
                        is_visible_sell: true
                    }, adminId);
                    result.success++;
                }
                catch (err) {
                    result.failed++;
                    console.error(`Failed to sync ${price.code}:`, err);
                }
            }
            return result;
        }
        catch (error) {
            console.error('Error syncing external prices:', error);
            throw error;
        }
    }
    async checkExternalApiStatus() {
        const status = {
            available: false,
            mode: this.connectionMode,
            cachedCount: this.priceCache.size,
        };
        if (this.connectionMode === 'websocket') {
            status.wsConnected = this.isConnected;
            status.available = this.isConnected;
        }
        else if (this.connectionMode === 'polling') {
            try {
                const apiUrl = process.env.EXTERNAL_PRICE_API_URL;
                if (apiUrl) {
                    const response = await axios_1.default.get(apiUrl, {
                        timeout: 5000,
                        headers: { 'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}` }
                    });
                    status.available = response.status === 200;
                    if (status.available) {
                        status.lastUpdate = new Date();
                    }
                }
            }
            catch (error) {
                status.available = false;
            }
        }
        return status;
    }
    getConnectionStatus() {
        return {
            mode: this.connectionMode,
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            cachedItems: this.priceCache.size,
            wsReadyState: this.ws ? this.ws.readyState : null
        };
    }
    stop() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isConnected = false;
        console.log('⏹️ External price service stopped');
    }
}
exports.externalPriceService = new ExternalPriceService();
