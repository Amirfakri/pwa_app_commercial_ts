"use strict";
// backend/src/core/socket/socket.manager.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketManager = exports.SocketManager = void 0;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const price_controller_1 = require("../../modules/price/controllers/price.controller");
const auth_service_1 = require("../../modules/auth/services/auth.service");
class SocketManager {
    static instance;
    io;
    pubClient = null;
    subClient = null;
    onlineUsers = new Map();
    constructor(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
                credentials: true,
                methods: ['GET', 'POST']
            },
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000,
            allowEIO3: true
        });
        this.setupRedis();
        this.setupHandlers();
        this.setupErrorHandling();
    }
    static getInstance(server) {
        if (!SocketManager.instance && server) {
            SocketManager.instance = new SocketManager(server);
        }
        return SocketManager.instance;
    }
    async setupRedis() {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            try {
                this.pubClient = new ioredis_1.default(redisUrl, {
                    retryStrategy: (times) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    }
                });
                this.subClient = this.pubClient.duplicate();
                await Promise.all([
                    this.pubClient.ping(),
                    this.subClient.ping()
                ]);
                this.io.adapter((0, redis_adapter_1.createAdapter)(this.pubClient, this.subClient));
                console.log('✅ Redis adapter configured for Socket.IO');
            }
            catch (error) {
                console.warn('⚠️ Redis not available, running without adapter:', error);
            }
        }
        else {
            console.log('ℹ️ Redis not configured, running without adapter');
        }
    }
    setupErrorHandling() {
        this.io.engine.on('connection_error', (err) => {
            console.error('Socket.IO connection error:', err);
        });
    }
    setupHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            // احراز هویت
            socket.on('authenticate', async (data) => {
                try {
                    const { token, type, apiKey } = data;
                    // اگر منبع خارجی است (Electron app)
                    if (type === 'external_price_source') {
                        const expectedKey = process.env.EXTERNAL_SOURCE_API_KEY;
                        if (apiKey === expectedKey) {
                            socket.isExternalSource = true;
                            socket.sourceName = data.source || 'external';
                            socket.join('external_sources');
                            socket.emit('authenticated', {
                                success: true,
                                role: 'external_source',
                                message: 'Authenticated as external price source'
                            });
                            console.log(`✅ External price source authenticated: ${socket.sourceName}`);
                        }
                        else {
                            socket.emit('authenticated', { success: false, error: 'Invalid API key' });
                            socket.disconnect();
                        }
                        return;
                    }
                    // احراز هویت کاربر عادی یا ادمین
                    if (!token) {
                        socket.emit('authenticated', { success: false, error: 'Token required' });
                        return;
                    }
                    const user = await auth_service_1.authService.verifySocketToken(token);
                    if (!user) {
                        socket.emit('authenticated', { success: false, error: 'Invalid token' });
                        return;
                    }
                    socket.user = user;
                    this.onlineUsers.set(socket.id, user);
                    // پیوستن به room مناسب
                    socket.join(`user_${user.id}`);
                    if (user.isAdmin) {
                        socket.join('admin_room');
                        console.log(`👑 Admin connected: ${user.mobile_number} (${user.id})`);
                    }
                    else {
                        console.log(`👤 User connected: ${user.mobile_number} (${user.id})`);
                    }
                    socket.emit('authenticated', {
                        success: true,
                        user: { id: user.id, isAdmin: user.isAdmin }
                    });
                    // ارسال وضعیت آنلاین به ادمین
                    this.sendOnlineUsersToAdmins();
                }
                catch (error) {
                    console.error('Authentication error:', error);
                    socket.emit('authenticated', { success: false, error: 'Authentication failed' });
                }
            });
            // پیوستن به room خاص
            socket.on('join:user', (userId) => {
                socket.join(`user_${userId}`);
                console.log(`Socket ${socket.id} joined user_${userId}`);
            });
            socket.on('join:admin', () => {
                socket.join('admin_room');
                console.log(`Socket ${socket.id} joined admin_room`);
            });
            // دریافت قیمت از منبع خارجی (Electron app)
            socket.on('price:update:external', async (data, callback) => {
                if (!socket.isExternalSource) {
                    if (callback)
                        callback({ success: false, error: 'Unauthorized' });
                    return;
                }
                try {
                    const { source, prices, is_active, timestamp } = data;
                    console.log(`📡 External price update from ${source}: ${prices?.length || 0} items`);
                    const results = [];
                    for (const price of prices) {
                        const updatedPrice = await price_controller_1.priceController['priceService'].createOrUpdatePrice({
                            product_code: price.product_code,
                            buy_price: price.buy_price,
                            sell_price: price.sell_price,
                            display_name: price.display_name,
                            is_visible_buy: true,
                            is_visible_sell: true
                        }, 1);
                        results.push(updatedPrice);
                        // پخش به همه کاربران
                        await price_controller_1.priceController.broadcastPriceToUsers(this.io, updatedPrice, source);
                    }
                    if (callback) {
                        callback({ success: true, count: results.length });
                    }
                }
                catch (error) {
                    console.error('Error processing external price:', error);
                    if (callback) {
                        callback({ success: false, error: error.message });
                    }
                }
            });
            // به‌روزرسانی قیمت از ادمین
            socket.on('price:update:admin', async (data) => {
                const user = socket.user;
                if (!user?.isAdmin) {
                    socket.emit('error', { message: 'Unauthorized' });
                    return;
                }
                try {
                    const price = await price_controller_1.priceController['priceService'].createOrUpdatePrice(data, user.id);
                    await price_controller_1.priceController.broadcastPriceToUsers(this.io, price, 'admin');
                    socket.emit('price:update:ack', { success: true, data: price });
                }
                catch (error) {
                    socket.emit('price:update:ack', { success: false, error: error.message });
                }
            });
            // درخواست قیمت‌های اولیه
            socket.on('get:initial:prices', async () => {
                const user = socket.user;
                if (!user)
                    return;
                try {
                    const products = await price_controller_1.priceController['priceService'].getProductsWithPrices(user.id, user.isAdmin);
                    socket.emit('initial:prices', {
                        success: true,
                        data: products,
                        timestamp: new Date().toISOString()
                    });
                }
                catch (error) {
                    socket.emit('initial:prices', { success: false, error: error.message });
                }
            });
            // heartbeat
            socket.on('heartbeat', (data) => {
                socket.emit('heartbeat:ack', {
                    timestamp: Date.now(),
                    clientTime: data?.timestamp
                });
            });
            // دریافت وضعیت آنلاین کاربران (فقط ادمین)
            socket.on('get:online:users', () => {
                const user = socket.user;
                if (user?.isAdmin) {
                    this.sendOnlineUsersToSocket(socket);
                }
            });
            // قطع اتصال
            socket.on('disconnect', () => {
                const user = socket.user;
                if (user) {
                    this.onlineUsers.delete(socket.id);
                    console.log(`🔌 Client disconnected: ${socket.id} (User: ${user.id})`);
                    this.sendOnlineUsersToAdmins();
                }
                else if (socket.isExternalSource) {
                    console.log(`🔌 External source disconnected: ${socket.sourceName}`);
                }
                else {
                    console.log(`🔌 Client disconnected: ${socket.id}`);
                }
            });
        });
    }
    sendOnlineUsersToAdmins() {
        const onlineList = Array.from(this.onlineUsers.values()).map(user => ({
            id: user.id,
            isAdmin: user.isAdmin,
            mobile_number: user.mobile_number
        }));
        this.io.to('admin_room').emit('online:users:update', {
            count: this.onlineUsers.size,
            users: onlineList,
            timestamp: new Date().toISOString()
        });
    }
    sendOnlineUsersToSocket(socket) {
        const onlineList = Array.from(this.onlineUsers.values()).map(user => ({
            id: user.id,
            isAdmin: user.isAdmin,
            mobile_number: user.mobile_number
        }));
        socket.emit('online:users:update', {
            count: this.onlineUsers.size,
            users: onlineList,
            timestamp: new Date().toISOString()
        });
    }
    getIO() {
        return this.io;
    }
    getOnlineUsersCount() {
        return this.onlineUsers.size;
    }
    getOnlineUsers() {
        return Array.from(this.onlineUsers.values());
    }
    async broadcastToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }
    async broadcastToUser(userId, event, data) {
        this.io.to(`user_${userId}`).emit(event, data);
    }
    async broadcastToAdmins(event, data) {
        this.io.to('admin_room').emit(event, data);
    }
    async close() {
        if (this.pubClient) {
            await this.pubClient.quit();
        }
        if (this.subClient) {
            await this.subClient.quit();
        }
        await this.io.close();
    }
}
exports.SocketManager = SocketManager;
const getSocketManager = (server) => SocketManager.getInstance(server);
exports.getSocketManager = getSocketManager;
