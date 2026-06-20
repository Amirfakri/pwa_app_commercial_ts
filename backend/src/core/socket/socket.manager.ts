// backend/src/core/socket/socket.manager.ts

import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server as HttpServer } from 'http';
import { priceController } from '../../modules/price/controllers/price.controller';
import { authService } from '../../modules/auth/services/auth.service';

interface SocketUser {
  id: number;
  isAdmin: boolean;
  mobile_number?: string;
}

export class SocketManager {
  private static instance: SocketManager;
  private io: SocketServer;
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private onlineUsers: Map<string, SocketUser> = new Map();

  private constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
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

  public static getInstance(server?: HttpServer): SocketManager {
    if (!SocketManager.instance && server) {
      SocketManager.instance = new SocketManager(server);
    }
    return SocketManager.instance;
  }

  private async setupRedis() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.pubClient = new Redis(redisUrl, {
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
        
        this.io.adapter(createAdapter(this.pubClient, this.subClient));
        console.log('✅ Redis adapter configured for Socket.IO');
      } catch (error) {
        console.warn('⚠️ Redis not available, running without adapter:', error);
      }
    } else {
      console.log('ℹ️ Redis not configured, running without adapter');
    }
  }

  private setupErrorHandling() {
    this.io.engine.on('connection_error', (err) => {
      console.error('Socket.IO connection error:', err);
    });
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // احراز هویت
      socket.on('authenticate', async (data: any) => {
        try {
          const { token, type, apiKey } = data;
          
          // اگر منبع خارجی است (Electron app)
          if (type === 'external_price_source') {
            const expectedKey = process.env.EXTERNAL_SOURCE_API_KEY;
            if (apiKey === expectedKey) {
              (socket as any).isExternalSource = true;
              (socket as any).sourceName = data.source || 'external';
              socket.join('external_sources');
              socket.emit('authenticated', { 
                success: true, 
                role: 'external_source',
                message: 'Authenticated as external price source'
              });
              console.log(`✅ External price source authenticated: ${(socket as any).sourceName}`);
            } else {
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
          
          const user = await authService.verifySocketToken(token);
          if (!user) {
            socket.emit('authenticated', { success: false, error: 'Invalid token' });
            return;
          }
          
          (socket as any).user = user;
          this.onlineUsers.set(socket.id, user);
          
          // پیوستن به room مناسب
          socket.join(`user_${user.id}`);
          if (user.isAdmin) {
            socket.join('admin_room');
            console.log(`👑 Admin connected: ${user.mobile_number} (${user.id})`);
          } else {
            console.log(`👤 User connected: ${user.mobile_number} (${user.id})`);
          }
          
          socket.emit('authenticated', { 
            success: true, 
            user: { id: user.id, isAdmin: user.isAdmin }
          });
          
          // ارسال وضعیت آنلاین به ادمین
          this.sendOnlineUsersToAdmins();
          
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authenticated', { success: false, error: 'Authentication failed' });
        }
      });

      // پیوستن به room خاص
      socket.on('join:user', (userId: number) => {
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined user_${userId}`);
      });

      socket.on('join:admin', () => {
        socket.join('admin_room');
        console.log(`Socket ${socket.id} joined admin_room`);
      });

      // دریافت قیمت از منبع خارجی (Electron app)
      socket.on('price:update:external', async (data: any, callback) => {
        if (!(socket as any).isExternalSource) {
          if (callback) callback({ success: false, error: 'Unauthorized' });
          return;
        }
        
        try {
          const { source, prices, is_active, timestamp } = data;
          console.log(`📡 External price update from ${source}: ${prices?.length || 0} items`);
          
          const results = [];
          for (const price of prices) {
            const updatedPrice = await priceController['priceService'].createOrUpdatePrice({
              product_code: price.product_code,
              buy_price: price.buy_price,
              sell_price: price.sell_price,
              display_name: price.display_name,
              is_visible_buy: true,
              is_visible_sell: true
            }, 1);
            results.push(updatedPrice);
            
            // پخش به همه کاربران
            await priceController.broadcastPriceToUsers(this.io, updatedPrice, source);
          }
          
          if (callback) {
            callback({ success: true, count: results.length });
          }
          
        } catch (error: any) {
          console.error('Error processing external price:', error);
          if (callback) {
            callback({ success: false, error: error.message });
          }
        }
      });

      // به‌روزرسانی قیمت از ادمین
      socket.on('price:update:admin', async (data: any) => {
        const user = (socket as any).user;
        if (!user?.isAdmin) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }
        
        try {
          const price = await priceController['priceService'].createOrUpdatePrice(data, user.id);
          await priceController.broadcastPriceToUsers(this.io, price, 'admin');
          socket.emit('price:update:ack', { success: true, data: price });
        } catch (error: any) {
          socket.emit('price:update:ack', { success: false, error: error.message });
        }
      });

      // درخواست قیمت‌های اولیه
      socket.on('get:initial:prices', async () => {
        const user = (socket as any).user;
        if (!user) return;
        
        try {
          const products = await priceController['priceService'].getProductsWithPrices(user.id, user.isAdmin);
          socket.emit('initial:prices', {
            success: true,
            data: products,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          socket.emit('initial:prices', { success: false, error: error.message });
        }
      });

      // heartbeat
      socket.on('heartbeat', (data: any) => {
        socket.emit('heartbeat:ack', { 
          timestamp: Date.now(),
          clientTime: data?.timestamp 
        });
      });

      // دریافت وضعیت آنلاین کاربران (فقط ادمین)
      socket.on('get:online:users', () => {
        const user = (socket as any).user;
        if (user?.isAdmin) {
          this.sendOnlineUsersToSocket(socket);
        }
      });

      // قطع اتصال
      socket.on('disconnect', () => {
        const user = (socket as any).user;
        if (user) {
          this.onlineUsers.delete(socket.id);
          console.log(`🔌 Client disconnected: ${socket.id} (User: ${user.id})`);
          this.sendOnlineUsersToAdmins();
        } else if ((socket as any).isExternalSource) {
          console.log(`🔌 External source disconnected: ${(socket as any).sourceName}`);
        } else {
          console.log(`🔌 Client disconnected: ${socket.id}`);
        }
      });
    });
  }

  private sendOnlineUsersToAdmins() {
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

  private sendOnlineUsersToSocket(socket: any) {
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

  public getIO(): SocketServer {
    return this.io;
  }

  public getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  public getOnlineUsers(): SocketUser[] {
    return Array.from(this.onlineUsers.values());
  }

  public async broadcastToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }

  public async broadcastToUser(userId: number, event: string, data: any) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  public async broadcastToAdmins(event: string, data: any) {
    this.io.to('admin_room').emit(event, data);
  }

  public async close() {
    if (this.pubClient) {
      await this.pubClient.quit();
    }
    if (this.subClient) {
      await this.subClient.quit();
    }
    await this.io.close();
  }
}

export const getSocketManager = (server?: HttpServer) => SocketManager.getInstance(server);