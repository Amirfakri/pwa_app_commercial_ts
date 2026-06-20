"use strict";
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
exports.broadcastProductsFullUpdate = exports.broadcastPriceUpdate = exports.io = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const node_cron_1 = __importDefault(require("node-cron"));
const auth_middleware_1 = require("./modules/auth/middlewares/auth.middleware");
const transaction_1 = require("./modules/transaction");
// IMPORT support routes
const support_1 = require("./modules/support");
// IMPORT external WebSocket service - بدون top-level await
let externalWebSocketService = null;
// تابع کمکی برای لود ماژول به صورت async
async function loadExternalWebSocketService() {
    try {
        const module = await Promise.resolve().then(() => __importStar(require('./modules/price/services/externalWebSocket.service')));
        externalWebSocketService = module.externalWebSocketService;
        console.log('✅ External WebSocket service module loaded');
    }
    catch (err) {
        console.log('ℹ️ External WebSocket service not available:', err.message);
    }
}
const app = (0, express_1.default)();
exports.app = app;
// ============================================
// 🔧 Basic Middlewares
// ============================================
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// ============================================
// 🔒 Security Middlewares
// ============================================
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// ============================================
// 🌐 CORS
// ============================================
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:5173',
            'https://yourdomain.com'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`Blocked CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'x-session-token', 'x-device-id', 'x-user-id', 'Cookie'],
    exposedHeaders: ['Set-Cookie', 'Content-Length', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
// ============================================
// 📝 Request Logger (فقط در محیط توسعه)
// ============================================
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`📥 ${req.method} ${req.url}`);
        next();
    });
}
// ============================================
// 🏥 Health Check Routes
// ============================================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});
app.get('/health/ready', (req, res) => {
    res.json({ status: 'READY' });
});
app.get('/health/live', (req, res) => {
    res.json({ status: 'LIVE' });
});
// ============================================
// 🚀 Public API Routes (بدون احراز هویت)
// ============================================
console.log('📌 Registering public routes...');
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API is working!' });
});
// مسیر عمومی شرایط و قوانین - قبل از هر middleware ای
app.get('/api/support/terms/public', async (req, res) => {
    try {
        const { termsService } = await Promise.resolve().then(() => __importStar(require('./modules/terms')));
        const terms = await termsService.getActiveTerms();
        if (!terms) {
            return res.status(404).json({ success: false, error: 'شرایط و قوانین یافت نشد' });
        }
        res.json({ success: true, data: terms });
    }
    catch (err) {
        console.error('Error in public terms route:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});
// مسیر عمومی شرایط و قوانین با مسیر معمولی
app.get('/api/support/terms', async (req, res) => {
    try {
        const { termsService } = await Promise.resolve().then(() => __importStar(require('./modules/terms')));
        const terms = await termsService.getActiveTerms();
        if (!terms) {
            return res.status(404).json({ success: false, error: 'شرایط و قوانین یافت نشد' });
        }
        res.json({ success: true, data: terms });
    }
    catch (err) {
        console.error('Error in public terms route:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});
// ============================================
// 🚀 API Routes (نیاز به احراز هویت)
// ============================================
console.log('📌 Registering protected routes...');
// Auth routes
try {
    const authRoutes = require('./modules/auth/routes/auth.routes').default;
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes registered at /api/auth');
}
catch (err) {
    console.error('❌ Error loading auth routes:', err.message);
}
// Price routes (با احراز هویت)
try {
    const priceRoutes = require('./modules/price/routes/price.routes').default;
    app.use('/api/prices', auth_middleware_1.authenticateSession, priceRoutes);
    console.log('✅ Price routes registered at /api/prices (protected)');
}
catch (err) {
    console.error('❌ Error loading price routes:', err.message);
}
// Transaction routes (با احراز هویت)
try {
    const transactionRoutes = require('./modules/transaction/routes/transaction.routes').default;
    app.use('/api/transactions', auth_middleware_1.authenticateSession, transactionRoutes);
    console.log('✅ Transaction routes registered at /api/transactions (protected)');
}
catch (err) {
    console.error('❌ Error loading transaction routes:', err.message);
}
// Riz routes (با احراز هویت)
try {
    const rizRoutes = require('./modules/riz/routes/riz.routes').default;
    app.use('/api/riz', auth_middleware_1.authenticateSession, rizRoutes);
    console.log('✅ Riz routes registered at /api/riz (protected)');
}
catch (err) {
    console.error('❌ Error loading riz routes:', err.message);
}
// Remittance routes (با احراز هویت)
try {
    const remittanceRoutes = require('./modules/remittance/routes/remittance.routes').default;
    app.use('/api/remittances', auth_middleware_1.authenticateSession, remittanceRoutes);
    console.log('✅ Remittance routes registered at /api/remittances (protected)');
}
catch (err) {
    console.error('❌ Error loading remittance routes:', err.message);
}
// Notification routes (با احراز هویت)
try {
    const notificationRoutes = require('./modules/notification/routes/notification.routes').default;
    app.use('/api/notifications', auth_middleware_1.authenticateSession, notificationRoutes);
    console.log('✅ Notification routes registered at /api/notifications (protected)');
}
catch (err) {
    console.error('❌ Error loading notification routes:', err.message);
}
// SMS routes (با احراز هویت)
try {
    const smsRoutes = require('./modules/notification/routes/sms.routes').default;
    app.use('/api/sms', auth_middleware_1.authenticateSession, smsRoutes);
    console.log('✅ SMS routes registered at /api/sms (protected)');
}
catch (err) {
    console.error('❌ Error loading sms routes:', err.message);
}
// Daily Message routes (با احراز هویت)
try {
    const dailyMessageRoutes = require('./modules/notification/routes/dailyMessage.routes').default;
    app.use('/api/daily-messages', auth_middleware_1.authenticateSession, dailyMessageRoutes);
    console.log('✅ Daily Message routes registered at /api/daily-messages (protected)');
}
catch (err) {
    console.error('❌ Error loading daily message routes:', err.message);
}
// Support Routes - Descriptions (با احراز هویت)
try {
    app.use('/api/support/descriptions', auth_middleware_1.authenticateSession, support_1.descriptionRoutes);
    console.log('✅ Description routes registered at /api/support/descriptions (protected)');
}
catch (err) {
    console.error('❌ Error loading description routes:', err.message);
}
// Admin routes (با احراز هویت و ادمین)
try {
    const adminRoutes = require('./modules/admin/routes/admin.routes').default;
    app.use('/api/admin', auth_middleware_1.authenticateSession, adminRoutes);
    console.log('✅ Admin routes registered at /api/admin (protected)');
}
catch (err) {
    console.error('❌ Error loading admin routes:', err.message);
}
// Backup routes (با احراز هویت و ادمین)
try {
    const backupRoutes = require('./modules/backup/routes/backup.routes').default;
    app.use('/api/backup', auth_middleware_1.authenticateSession, backupRoutes);
    console.log('✅ Backup routes registered at /api/backup (protected)');
}
catch (err) {
    console.error('❌ Error loading backup routes:', err.message);
}
// ============================================
// ❌ 404 Handler
// ============================================
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found', path: req.path });
});
// ============================================
// 🎯 Global Error Handler
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
});
// ============================================
// 🔌 Socket.IO
// ============================================
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST'],
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    allowEIO3: true,
});
exports.io = io;
const onlineUsers = new Map();
async function sendPriceUpdateToUser(userId, data) {
    try {
        const { offsetService } = await Promise.resolve().then(() => __importStar(require('./modules/price/services/offset.service')));
        const offsets = await offsetService.getUserOffsets(parseInt(userId), false);
        const adminBuyPrice = typeof data.buy_price === 'string' ? parseFloat(data.buy_price) : data.buy_price;
        const adminSellPrice = typeof data.sell_price === 'string' ? parseFloat(data.sell_price) : data.sell_price;
        let userBuyPrice = null;
        let userSellPrice = null;
        if (data.product_code.startsWith('AB_')) {
            if (adminSellPrice !== null && adminSellPrice !== undefined) {
                userBuyPrice = adminSellPrice + offsets.melted_offset;
            }
            if (adminBuyPrice !== null && adminBuyPrice !== undefined) {
                userSellPrice = adminBuyPrice - offsets.melted_offset;
            }
        }
        else {
            if (adminSellPrice !== null && adminSellPrice !== undefined) {
                userBuyPrice = adminSellPrice + offsets.coin_offset;
            }
            if (adminBuyPrice !== null && adminBuyPrice !== undefined) {
                userSellPrice = adminBuyPrice - offsets.coin_offset;
            }
        }
        const emitData = {
            product_code: data.product_code,
            buy_price: userBuyPrice,
            sell_price: userSellPrice,
            final_buy_price: userBuyPrice,
            final_sell_price: userSellPrice,
            is_visible_buy: data.is_visible_buy,
            is_visible_sell: data.is_visible_sell,
            display_name: data.display_name,
            timestamp: new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
            applied_offset: data.product_code.startsWith('AB_') ? offsets.melted_offset : offsets.coin_offset
        };
        io.to(`user_${userId}`).emit('price_update', emitData);
    }
    catch (error) {
        console.error(`Error sending price to user ${userId}:`, error);
    }
}
const broadcastPriceUpdate = async (data) => {
    const allUsers = Array.from(onlineUsers.entries()).filter(([_, id]) => id !== 'admin');
    for (const [socketId, userId] of allUsers) {
        await sendPriceUpdateToUser(userId, data);
    }
};
exports.broadcastPriceUpdate = broadcastPriceUpdate;
const broadcastProductsFullUpdate = async () => {
    try {
        const { priceService } = await Promise.resolve().then(() => __importStar(require('./modules/price/services/price.service')));
        const products = await priceService.getProductsWithPrices(0, false);
        const melted = products.filter((p) => p.type === 'melted');
        const coins = products.filter((p) => p.type === 'coin');
        const productsWithFinal = {
            melted: melted.map((p) => ({
                ...p,
                final_buy_price: p.buy_price,
                final_sell_price: p.sell_price
            })),
            coins: coins.map((p) => ({
                ...p,
                final_buy_price: p.buy_price,
                final_sell_price: p.sell_price
            }))
        };
        io.emit('products_full_update', {
            success: true,
            data: productsWithFinal,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error broadcasting products full update:', error);
    }
};
exports.broadcastProductsFullUpdate = broadcastProductsFullUpdate;
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    socket.on('join-user', async (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
            onlineUsers.set(socket.id, userId);
            try {
                const { priceService } = await Promise.resolve().then(() => __importStar(require('./modules/price/services/price.service')));
                const products = await priceService.getProductsWithPrices(parseInt(userId), false);
                const melted = products.filter((p) => p.type === 'melted');
                const coins = products.filter((p) => p.type === 'coin');
                const productsWithFinal = {
                    melted: melted.map((p) => ({
                        ...p,
                        final_buy_price: p.buy_price,
                        final_sell_price: p.sell_price
                    })),
                    coins: coins.map((p) => ({
                        ...p,
                        final_buy_price: p.buy_price,
                        final_sell_price: p.sell_price
                    }))
                };
                socket.emit('initial_prices', { success: true, data: productsWithFinal });
            }
            catch (error) {
                console.error('Error sending prices to user:', error);
            }
        }
    });
    socket.on('join-admin', () => {
        socket.join('admin_room');
        onlineUsers.set(socket.id, 'admin');
        console.log('👑 Admin joined admin_room');
    });
    socket.on('get_initial_prices', async () => {
        try {
            const userId = onlineUsers.get(socket.id);
            if (userId && userId !== 'admin') {
                const { priceService } = await Promise.resolve().then(() => __importStar(require('./modules/price/services/price.service')));
                const products = await priceService.getProductsWithPrices(parseInt(userId), false);
                const melted = products.filter((p) => p.type === 'melted');
                const coins = products.filter((p) => p.type === 'coin');
                const productsWithFinal = {
                    melted: melted.map((p) => ({
                        ...p,
                        final_buy_price: p.buy_price,
                        final_sell_price: p.sell_price
                    })),
                    coins: coins.map((p) => ({
                        ...p,
                        final_buy_price: p.buy_price,
                        final_sell_price: p.sell_price
                    }))
                };
                socket.emit('initial_prices', { success: true, data: productsWithFinal });
            }
            else {
                const { priceService } = await Promise.resolve().then(() => __importStar(require('./modules/price/services/price.service')));
                const products = await priceService.getProductsWithPrices(0, false);
                const melted = products.filter((p) => p.type === 'melted');
                const coins = products.filter((p) => p.type === 'coin');
                const productsWithFinal = {
                    melted: melted.map((p) => ({
                        ...p,
                        final_buy_price: p.buy_price,
                        final_sell_price: p.sell_price
                    })),
                    coins: coins.map((p) => ({
                        ...p,
                        final_buy_price: p.buy_price,
                        final_sell_price: p.sell_price
                    }))
                };
                socket.emit('initial_prices', { success: true, data: productsWithFinal });
            }
        }
        catch (error) {
            console.error('Error in get_initial_prices:', error);
            const mockData = {
                melted: [
                    { code: 'AB_FARDA', name: 'آبشده فردا', display_name: 'آبشده فردا', buy_price: 35000000, sell_price: 35500000, final_buy_price: 35000000, final_sell_price: 35500000, type: 'melted', min_weight: 1, max_weight: 1000, is_active: true }
                ],
                coins: [
                    { code: 'COIN_EMAMI', name: 'سکه امامی', display_name: 'سکه امامی', buy_price: 32000000, sell_price: 32500000, final_buy_price: 32000000, final_sell_price: 32500000, type: 'coin', min_count: 1, max_count: 100, is_active: true }
                ]
            };
            socket.emit('initial_prices', { success: true, data: mockData });
        }
    });
    socket.on('price_update_from_admin', async (data) => {
        await broadcastPriceUpdate(data);
    });
    socket.on('products_full_update_request', async () => {
        await broadcastProductsFullUpdate();
    });
    socket.on('product_status_update', (data) => {
        io.emit('product_status_update', data);
    });
    socket.on('product_update', (data) => {
        io.emit('product_update', data);
    });
    socket.on('product_deleted', (data) => {
        io.emit('product_deleted', data);
    });
    socket.on('daily_message_update_from_admin', async (data) => {
        io.emit('daily_message_updated', data);
    });
    socket.on('notification_update_from_admin', async (data) => {
        if (data.user_id) {
            io.to(`user_${data.user_id}`).emit('new_notification', data);
        }
        else {
            io.emit('new_notification', data);
        }
    });
    socket.on('transaction_update', (data) => {
        if (data?.user_id) {
            io.to(`user_${data.user_id}`).emit('transaction_update', data);
        }
    });
    socket.on('balance_update', (data) => {
        if (data?.user_id) {
            io.to(`user_${data.user_id}`).emit('balance_update', data);
        }
    });
    socket.on('remittance_update', (data) => {
        if (data?.user_id) {
            io.to(`user_${data.user_id}`).emit('remittance_update', data);
            io.to('admin_room').emit('admin_remittance_update', data);
        }
    });
    socket.on('notification_update', (data) => {
        if (data?.user_id) {
            io.to(`user_${data.user_id}`).emit('notification_update', data);
        }
    });
    socket.on('backup_completed', (data) => {
        io.to('admin_room').emit('backup_completed', data);
    });
    socket.on('disconnect', () => {
        const userId = onlineUsers.get(socket.id);
        if (userId) {
            onlineUsers.delete(socket.id);
            console.log(`🔌 Client disconnected: ${socket.id} (User: ${userId})`);
        }
        else {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        }
    });
});
// ============================================
// ⏰ Cron Jobs
// ============================================
let cronJobRunning = false;
node_cron_1.default.schedule('*/5 * * * * *', async () => {
    if (cronJobRunning) {
        return;
    }
    cronJobRunning = true;
    try {
        const expiredTransactions = await transaction_1.transactionService.autoExpirePendingTransactions(io);
        if (expiredTransactions && expiredTransactions.length > 0) {
            console.log(`⏰ Expired ${expiredTransactions.length} transactions`);
        }
    }
    catch (error) {
        console.error('❌ Error in auto-expire job:', error);
    }
    finally {
        cronJobRunning = false;
    }
});
// ============================================
// 🔌 External WebSocket Service Setup (without top-level await)
// ============================================
// تابع راه‌اندازی سرویس خارجی
async function setupExternalWebSocket() {
    await loadExternalWebSocketService();
    if (externalWebSocketService) {
        try {
            externalWebSocketService.setIo(io);
            externalWebSocketService.setBroadcastFunction(broadcastPriceUpdate);
            if (process.env.EXTERNAL_PRICE_WS_URL) {
                await externalWebSocketService.start().catch((err) => {
                    console.error('Failed to start external WebSocket:', err);
                });
                console.log('✅ External WebSocket service initialized');
            }
            else {
                console.log('ℹ️ External WebSocket disabled (EXTERNAL_PRICE_WS_URL not set)');
            }
        }
        catch (err) {
            console.error('❌ Failed to setup external WebSocket:', err.message);
        }
    }
    else {
        console.log('ℹ️ External WebSocket service not available - skipping setup');
    }
}
// راه‌اندازی بدون blocking
setupExternalWebSocket();
app.set('io', io);
