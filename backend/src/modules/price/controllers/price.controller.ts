// backend/src/modules/price/controllers/price.controller.ts

import { Request, Response } from 'express';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';
import { priceService } from '../services/price.service';
import { offsetService } from '../services/offset.service';
import { priceRepository } from '../repositories/price.repository';

export class PriceController {
  
  // دریافت قیمت امروز برای یک محصول
  getTodayPrice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { product_code } = req.query;
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;

      if (!product_code) {
        res.status(400).json({ error: 'product_code الزامی است' });
        return;
      }

      const price = await priceService.getTodayPrice(product_code as string, userId, isAdmin);

      if (!price) {
        res.status(200).json({
          no_price_for_today: true,
          message: 'قیمت برای امروز ثبت نشده است',
        });
        return;
      }

      res.json(price);
    } catch (err: any) {
      console.error('خطا در دریافت قیمت:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // دریافت همه قیمت‌های امروز
  getAllTodayPrices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;
      const prices = await priceService.getAllTodayPrices(userId, isAdmin);
      
      const melted = prices.filter(p => p.product_code.startsWith('AB_'));
      const coins = prices.filter(p => p.product_code.startsWith('COIN_'));

      res.json({
        success: true,
        melted,
        coins,
        summary: {
          total: prices.length,
          melted_count: melted.length,
          coin_count: coins.length,
        },
      });
    } catch (err: any) {
      console.error('خطا در دریافت همه قیمت‌ها:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // ایجاد یا به‌روزرسانی قیمت (دستی توسط ادمین)
  createPrice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'احراز هویت نشده' });
        return;
      }

      const data = req.body;
      
      const priceData = {
        product_code: data.product_code,
        buy_price: data.buy_price,
        sell_price: data.sell_price,
        is_visible_buy: data.is_visible_buy,
        is_visible_sell: data.is_visible_sell,
        display_name: data.display_name || data.name || null
      };
      
      const price = await priceService.createOrUpdatePrice(priceData, req.user!.id);

      const io = req.app.get('io');
      if (io) {
        await this.broadcastPriceToUsers(io, price);
      }

      res.status(201).json({
        success: true,
        message: 'قیمت با موفقیت ثبت شد',
        data: price,
      });
    } catch (err: any) {
      console.error('خطا در ایجاد قیمت:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // به‌روزرسانی قیمت با آیدی
  updatePrice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'احراز هویت نشده' });
        return;
      }

      const { id } = req.params;
      const data = req.body;
      
      const priceData = {
        buy_price: data.buy_price,
        sell_price: data.sell_price,
        is_visible_buy: data.is_visible_buy,
        is_visible_sell: data.is_visible_sell,
        display_name: data.display_name || null
      };
      
      const price = await priceService.updatePriceById(parseInt(id), priceData, req.user!.id);

      if (!price) {
        res.status(404).json({ error: 'قیمت یافت نشد' });
        return;
      }

      const io = req.app.get('io');
      if (io) {
        await this.broadcastPriceToUsers(io, price);
      }

      res.json({
        success: true,
        message: 'قیمت با موفقیت به‌روزرسانی شد',
        data: price,
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی قیمت:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // دریافت محصولات با قیمت‌هایشان
  getProductsWithPrices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;
      const products = await priceService.getProductsWithPrices(userId, isAdmin);

      const melted = products.filter(p => p.type === 'melted');
      const coins = products.filter(p => p.type === 'coin');

      res.json({
        success: true,
        data: {
          melted,
          coins
        },
      });
    } catch (err: any) {
      console.error('خطا در دریافت محصولات با قیمت:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // دریافت تاریخچه قیمت
  getPriceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { product_code, start_date, end_date } = req.query;
      
      if (!product_code) {
        res.status(400).json({ error: 'product_code الزامی است' });
        return;
      }

      const history = await priceService.getPriceHistory(
        product_code as string,
        start_date as string,
        end_date as string
      );

      res.json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (err: any) {
      console.error('خطا در دریافت تاریخچه قیمت:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // دریافت افست‌های کاربر
  getUserOffsets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;
      const offsets = await offsetService.getUserOffsets(userId, isAdmin);

      res.json({
        success: true,
        data: offsets,
      });
    } catch (err: any) {
      console.error('خطا در دریافت افست کاربر:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // به‌روزرسانی افست‌های کاربر (فقط ادمین)
  updateUserOffsets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const { melted_offset, coin_offset } = req.body;

      const offsets = await offsetService.updateUserOffsets(
        parseInt(user_id),
        melted_offset,
        coin_offset
      );

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${user_id}`).emit('price_offsets_updated', offsets);
      }

      res.json({
        success: true,
        message: 'افست قیمت با موفقیت به‌روزرسانی شد',
        data: offsets,
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی افست کاربر:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // ==================== Webhook برای دریافت قیمت از منبع خارجی ====================
  
  externalPriceWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const priceData = req.body;
      
      let prices = [];
      let source = priceData.source || priceData.app || 'external';
      
      if (priceData.prices && Array.isArray(priceData.prices)) {
        prices = priceData.prices;
      } else if (priceData.price) {
        prices = [priceData];
      } else {
        prices = [priceData];
      }
      
      console.log(`📥 Webhook received from ${source}: ${prices.length} items`);
      
      const results = [];
      
      for (const item of prices) {
        const productCode = item.product_code || item.code;
        if (!productCode) {
          console.log('⚠️ Missing product_code in item:', item);
          continue;
        }
        
        const updatedPrice = await priceService.createOrUpdatePrice({
          product_code: productCode,
          buy_price: item.buy_price || item.buy || null,
          sell_price: item.sell_price || item.sell || null,
          display_name: item.display_name || item.name || productCode,
          is_visible_buy: item.is_visible_buy !== undefined ? item.is_visible_buy : true,
          is_visible_sell: item.is_visible_sell !== undefined ? item.is_visible_sell : true
        }, 1);
        
        results.push(updatedPrice);
      }
      
      const io = req.app.get('io');
      if (io && results.length > 0) {
        for (const price of results) {
          await this.broadcastPriceToUsers(io, price, source);
        }
      }
      
      res.status(200).json({ 
        success: true, 
        message: `Received ${results.length} prices from ${source}`,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error('Webhook error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // دریافت قیمت از منبع خارجی
  getExternalPrice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { product_code } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;

      if (!product_code) {
        res.status(400).json({ error: 'product_code الزامی است' });
        return;
      }

      const price = await priceRepository.getLatestPrice(product_code);
      
      if (!price) {
        res.status(404).json({ 
          success: false, 
          error: 'قیمتی برای این محصول یافت نشد' 
        });
        return;
      }

      const offsets = await offsetService.getUserOffsets(userId, isAdmin);
      const offset = product_code.startsWith('AB_') 
        ? offsets.melted_offset 
        : offsets.coin_offset;

      let userBuyPrice = null;
      let userSellPrice = null;
      
      if (!isAdmin) {
        if (price.sell_price !== null) {
          userBuyPrice = Math.floor(Number(price.sell_price) + Number(offset));
        }
        if (price.buy_price !== null) {
          userSellPrice = Math.floor(Number(price.buy_price) - Number(offset));
        }
      } else {
        userBuyPrice = price.buy_price;
        userSellPrice = price.sell_price;
      }

      const result = {
        success: true,
        product_code: price.product_code,
        buy_price: userBuyPrice,
        sell_price: userSellPrice,
        display_name: price.display_name,
        updated_at: price.updated_at,
        source: 'external'
      };

      res.json(result);
    } catch (err: any) {
      console.error('Error getting external price:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // دریافت همه قیمت‌های خارجی
  getAllExternalPrices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;
      const today = new Date().toISOString().split('T')[0];
      const prices = await priceRepository.getAllTodayPrices(today);
      
      const offsets = await offsetService.getUserOffsets(userId, isAdmin);
      
      const result = prices.map(price => {
        const offset = price.product_code.startsWith('AB_') 
          ? offsets.melted_offset 
          : offsets.coin_offset;
        
        let userBuyPrice = null;
        let userSellPrice = null;
        
        if (!isAdmin) {
          if (price.sell_price !== null) {
            userBuyPrice = Math.floor(Number(price.sell_price) + Number(offset));
          }
          if (price.buy_price !== null) {
            userSellPrice = Math.floor(Number(price.buy_price) - Number(offset));
          }
        } else {
          userBuyPrice = price.buy_price;
          userSellPrice = price.sell_price;
        }
        
        return {
          product_code: price.product_code,
          buy_price: userBuyPrice,
          sell_price: userSellPrice,
          display_name: price.display_name,
          updated_at: price.updated_at
        };
      });
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error getting all external prices:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // ==================== تابع پخش قیمت به کاربران ====================
  
  broadcastPriceToUsers = async (io: any, price: any, source: string = 'admin') => {
    try {
      const baseBuyPrice = price.buy_price !== null && price.buy_price !== undefined ? Number(price.buy_price) : null;
      const baseSellPrice = price.sell_price !== null && price.sell_price !== undefined ? Number(price.sell_price) : null;
      
      const updatedAt = price.updated_at ? new Date(price.updated_at).toISOString() : new Date().toISOString();
      
      console.log(`📡 Broadcasting price for ${price.product_code}: buy=${baseBuyPrice}, sell=${baseSellPrice}, updated_at=${updatedAt}`);
      
      // 1. ارسال به ادمین‌ها (بدون افست و با مقادیر اصلی)
      io.to('admin_room').emit('price_update', {
        product_code: price.product_code,
        buy_price: baseBuyPrice,
        sell_price: baseSellPrice,
        final_buy_price: baseBuyPrice,
        final_sell_price: baseSellPrice,
        is_visible_buy: price.is_visible_buy,
        is_visible_sell: price.is_visible_sell,
        display_name: price.display_name,
        source: source,
        isAdminView: true,
        applied_offset: 0,
        updated_at: updatedAt,
        timestamp: new Date().toISOString()
      });

      // 2. گرفتن همه کاربران متصل
      const sockets = await io.fetchSockets();
      const userRooms = new Set<string>();
      
      for (const socket of sockets) {
        for (const room of socket.rooms) {
          if (room.startsWith('user_')) {
            userRooms.add(room);
          }
        }
      }

      console.log(`📡 Broadcasting to ${userRooms.size} user rooms`);

      // 3. ارسال به هر کاربر با افست خودش و منطق معکوس
      for (const room of userRooms) {
        const userId = parseInt(room.replace('user_', ''));
        if (isNaN(userId)) continue;
        
        const offsets = await offsetService.getUserOffsets(userId, false);
        const offset = price.product_code.startsWith('AB_') 
          ? Number(offsets.melted_offset) 
          : Number(offsets.coin_offset);
        
        let userBuyPrice: number | null = null;
        let userSellPrice: number | null = null;
        
        // قیمت خرید کاربر = قیمت فروش ادمین + افست
        if (baseSellPrice !== null) {
          userBuyPrice = Math.floor(baseSellPrice + offset);
        }
        
        // قیمت فروش کاربر = قیمت خرید ادمین - افست
        if (baseBuyPrice !== null) {
          userSellPrice = Math.floor(baseBuyPrice - offset);
        }
        
        console.log(`📡 User ${userId}: offset=${offset}, buyPrice=${userBuyPrice}, sellPrice=${userSellPrice}`);
        
        // ارسال به کاربر با منطق معکوس برای is_visible
        io.to(room).emit('price_update', {
          product_code: price.product_code,
          base_buy_price: baseBuyPrice,
          base_sell_price: baseSellPrice,
          buy_price: userBuyPrice,
          sell_price: userSellPrice,
          final_buy_price: userBuyPrice,
          final_sell_price: userSellPrice,
          // منطق معکوس: کاربر قیمت خرید را از is_visible_sell ادمین می‌گیرد
          is_visible_buy: price.is_visible_sell,
          // منطق معکوس: کاربر قیمت فروش را از is_visible_buy ادمین می‌گیرد
          is_visible_sell: price.is_visible_buy,
          display_name: price.display_name,
          applied_offset: offset,
          source: source,
          updated_at: updatedAt,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Error broadcasting price to users:', error);
    }
  }
}

export const priceController = new PriceController();