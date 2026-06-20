// backend/src/modules/price/services/externalPrice.service.ts

import axios from 'axios';
import WebSocket from 'ws';
import { priceService } from './price.service';
import { priceRepository } from '../repositories/price.repository';
import { Server as SocketServer } from 'socket.io';

interface ExternalPriceItem {
  code: string;
  buy_price: number;
  sell_price: number;
  name?: string;
  display_name?: string;
}

interface CachedPrice {
  product_code: string;
  buy_price: number | null;
  sell_price: number | null;
  display_name: string | null;
  updated_at: Date;
  source: string;
}

class ExternalPriceService {
  private ws: WebSocket | null = null;
  private io: SocketServer | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private priceCache: Map<string, CachedPrice> = new Map();
  private isConnected = false;
  private connectionMode: 'websocket' | 'polling' | 'none' = 'none';

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiUrl = process.env.EXTERNAL_PRICE_API_URL;
    const wsUrl = process.env.EXTERNAL_PRICE_WS_URL;
    
    if (wsUrl) {
      this.connectionMode = 'websocket';
      this.connectWebSocket();
      console.log('🌐 External price service: WebSocket mode');
    } else if (apiUrl) {
      this.connectionMode = 'polling';
      this.startPolling();
      console.log('🌐 External price service: Polling mode');
    } else {
      this.connectionMode = 'none';
      console.log('ℹ️ External price service: Not configured');
    }
  }

  public setIo(io: SocketServer) {
    this.io = io;
    console.log('✅ Socket.IO set for external price service');
  }

  // ==================== WebSocket Mode ====================

  private connectWebSocket() {
    const wsUrl = process.env.EXTERNAL_PRICE_WS_URL;
    if (!wsUrl) return;

    try {
      this.ws = new WebSocket(wsUrl, {
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

      this.ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(message);
        } catch (err) {
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

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.reconnectWebSocket();
    }
  }

  private reconnectWebSocket() {
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

  private subscribeToProducts() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

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

  private async handleWebSocketMessage(message: any) {
    // پشتیبانی از فرمت‌های مختلف پیام
    let priceItem: ExternalPriceItem | null = null;
    
    if (message.type === 'price' || message.type === 'update') {
      priceItem = {
        code: message.code || message.product_code,
        buy_price: message.buy_price || message.buy,
        sell_price: message.sell_price || message.sell,
        name: message.name,
        display_name: message.display_name
      };
    } else if (message.price) {
      priceItem = message.price;
    } else if (message.code && (message.buy_price || message.sell_price)) {
      priceItem = message;
    }
    
    if (priceItem && priceItem.code) {
      await this.saveAndBroadcastPrice(priceItem, 'websocket');
    } else if (message.prices && Array.isArray(message.prices)) {
      for (const item of message.prices) {
        await this.saveAndBroadcastPrice(item, 'websocket');
      }
    }
  }

  // ==================== Polling Mode ====================

  private startPolling() {
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

  private switchToPolling() {
    if (this.connectionMode === 'websocket') {
      console.log('Switching from WebSocket to polling mode...');
      this.connectionMode = 'polling';
      this.startPolling();
    }
  }

  private async fetchAndUpdatePrices() {
    try {
      const apiUrl = process.env.EXTERNAL_PRICE_API_URL;
      if (!apiUrl) return;
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      let prices: ExternalPriceItem[] = [];
      
      // تبدیل فرمت‌های مختلف پاسخ
      if (response.data.prices && Array.isArray(response.data.prices)) {
        prices = response.data.prices;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        prices = response.data.data;
      } else if (Array.isArray(response.data)) {
        prices = response.data;
      } else if (response.data.code) {
        prices = [response.data];
      }
      
      for (const price of prices) {
        await this.saveAndBroadcastPrice(price, 'polling');
      }
      
      if (prices.length > 0) {
        console.log(`📡 Polled ${prices.length} external prices`);
      }
      
    } catch (error) {
      console.error('Error fetching external prices:', error);
    }
  }

  // ==================== Core Functions ====================

  private async saveAndBroadcastPrice(priceItem: ExternalPriceItem, source: string) {
    try {
      const productCode = priceItem.code;
      if (!productCode) return;
      
      // بررسی اینکه آیا محصول در سیستم وجود دارد
      const buyPrice = priceItem.buy_price || null;
      const sellPrice = priceItem.sell_price || null;
      
      if (!buyPrice && !sellPrice) return;
      
      // ذخیره در دیتابیس
      const updatedPrice = await priceService.createOrUpdatePrice({
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
        const { priceController } = await import('../controllers/price.controller');
        await priceController.broadcastPriceToUsers(this.io, updatedPrice, source);
      }
      
    } catch (error) {
      console.error(`Error saving price for ${priceItem.code}:`, error);
    }
  }

  // ==================== Public Methods ====================

  async getCachedPrice(productCode: string): Promise<CachedPrice | null> {
    return this.priceCache.get(productCode) || null;
  }

  async getAllCachedPrices(): Promise<CachedPrice[]> {
    return Array.from(this.priceCache.values());
  }

  async fetchSingleProductPrice(productCode: string): Promise<ExternalPriceItem | null> {
    try {
      const apiUrl = process.env.EXTERNAL_PRICE_API_URL;
      if (!apiUrl) return null;
      
      const response = await axios.get(`${apiUrl}/${productCode}`, {
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
    } catch (error) {
      console.error(`Error fetching price for ${productCode}:`, error);
      return null;
    }
  }

  async syncExternalPrices(adminId: number, forceUpdate: boolean = false): Promise<{
    success: number;
    failed: number;
    skipped: string[];
  }> {
    const result = {
      success: 0,
      failed: 0,
      skipped: [] as string[]
    };
    
    try {
      const apiUrl = process.env.EXTERNAL_PRICE_API_URL;
      if (!apiUrl) {
        throw new Error('External price API not configured');
      }
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`
        },
        timeout: 15000
      });
      
      let prices: ExternalPriceItem[] = [];
      if (response.data.prices && Array.isArray(response.data.prices)) {
        prices = response.data.prices;
      } else if (Array.isArray(response.data)) {
        prices = response.data;
      }
      
      for (const price of prices) {
        try {
          const existing = await priceRepository.getLatestPrice(price.code);
          
          if (!forceUpdate && existing) {
            const existingBuy = existing.buy_price;
            const existingSell = existing.sell_price;
            
            if (existingBuy === price.buy_price && existingSell === price.sell_price) {
              result.skipped.push(price.code);
              continue;
            }
          }
          
          await priceService.createOrUpdatePrice({
            product_code: price.code,
            buy_price: price.buy_price,
            sell_price: price.sell_price,
            display_name: price.display_name || price.name || price.code,
            is_visible_buy: true,
            is_visible_sell: true
          }, adminId);
          
          result.success++;
        } catch (err) {
          result.failed++;
          console.error(`Failed to sync ${price.code}:`, err);
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('Error syncing external prices:', error);
      throw error;
    }
  }

  async checkExternalApiStatus(): Promise<{
    available: boolean;
    mode: string;
    lastUpdate?: Date;
    cachedCount: number;
    wsConnected?: boolean;
  }> {
    const status = {
      available: false,
      mode: this.connectionMode,
      cachedCount: this.priceCache.size,
    };
    
    if (this.connectionMode === 'websocket') {
      (status as any).wsConnected = this.isConnected;
      status.available = this.isConnected;
    } else if (this.connectionMode === 'polling') {
      try {
        const apiUrl = process.env.EXTERNAL_PRICE_API_URL;
        if (apiUrl) {
          const response = await axios.get(apiUrl, {
            timeout: 5000,
            headers: { 'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}` }
          });
          status.available = response.status === 200;
          if (status.available) {
            status.lastUpdate = new Date();
          }
        }
      } catch (error) {
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

export const externalPriceService = new ExternalPriceService();