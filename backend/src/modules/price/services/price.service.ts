// backend/src/modules/price/services/price.service.ts

import moment from 'moment-timezone';
import { priceRepository } from '../repositories/price.repository';
import { productRepository } from '../repositories/product.repository';
import { historyRepository } from '../repositories/history.repository';
import { offsetService } from './offset.service';
import { ICreatePriceInput, IUpdatePriceInput, IProductWithPrice } from '../types/price.types';

export class PriceService {
  
  // تابع کمکی برای دریافت تاریخ ایران
  private getIranDate(): string {
    return moment().tz('Asia/Tehran').format('YYYY-MM-DD');
  }

  async getTodayPrice(productCode: string, userId: number, isAdmin: boolean) {
    const today = this.getIranDate(); // استفاده از تاریخ ایران
    const price = await priceRepository.getTodayPrice(productCode, today);
    
    if (!price) {
      return null;
    }
    
    const offsets = await offsetService.getUserOffsets(userId, isAdmin);
    const offset = productCode.startsWith('AB_') ? offsets.melted_offset : offsets.coin_offset;
    
    let finalBuyPrice: number | null = null;
    let finalSellPrice: number | null = null;
    
    if (!isAdmin) {
      if (price.sell_price !== null) {
        finalBuyPrice = Math.floor(Number(price.sell_price) + Number(offset));
      }
      if (price.buy_price !== null) {
        finalSellPrice = Math.floor(Number(price.buy_price) - Number(offset));
      }
    } else {
      finalBuyPrice = price.buy_price;
      finalSellPrice = price.sell_price;
    }
    
    return {
      ...price,
      base_buy_price: price.buy_price,
      base_sell_price: price.sell_price,
      final_buy_price: finalBuyPrice,
      final_sell_price: finalSellPrice,
      applied_offset: offset,
      is_admin: isAdmin
    };
  }
  
  async getAllTodayPrices(userId: number, isAdmin: boolean) {
    const today = this.getIranDate(); // استفاده از تاریخ ایران
    const prices = await priceRepository.getAllTodayPrices(today);
    
    const offsets = await offsetService.getUserOffsets(userId, isAdmin);
    
    const result = [];
    for (const price of prices) {
      const offset = price.product_code.startsWith('AB_') ? offsets.melted_offset : offsets.coin_offset;
      
      let finalBuyPrice: number | null = null;
      let finalSellPrice: number | null = null;
      
      if (!isAdmin) {
        if (price.sell_price !== null) {
          finalBuyPrice = Math.floor(Number(price.sell_price) + Number(offset));
        }
        if (price.buy_price !== null) {
          finalSellPrice = Math.floor(Number(price.buy_price) - Number(offset));
        }
      } else {
        finalBuyPrice = price.buy_price;
        finalSellPrice = price.sell_price;
      }
      
      result.push({
        ...price,
        base_buy_price: price.buy_price,
        base_sell_price: price.sell_price,
        final_buy_price: finalBuyPrice,
        final_sell_price: finalSellPrice,
        applied_offset: offset,
        is_admin: isAdmin
      });
    }
    
    return result;
  }
  
  private async getDisplayNameFromProduct(productCode: string): Promise<string | null> {
    try {
      const product = await productRepository.getMeltedProductByCode(productCode);
      if (product) {
        return product.default_display_name || product.name;
      }
      
      const coin = await productRepository.getCoinProductByCode(productCode);
      if (coin) {
        return coin.name;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting display name from product:', error);
      return null;
    }
  }
  
  async createOrUpdatePrice(data: ICreatePriceInput, adminUserId: number) {
    const today = this.getIranDate(); // استفاده از تاریخ ایران
    
    let displayName = data.display_name;
    if (!displayName || displayName === 'null' || displayName === '') {
      displayName = await this.getDisplayNameFromProduct(data.product_code);
    }
    
    const existingPrice = await priceRepository.getTodayPrice(data.product_code, today);
    
    let price;
    if (existingPrice) {
      price = await priceRepository.updatePrice(data.product_code, today, {
        buy_price: data.buy_price,
        sell_price: data.sell_price,
        is_visible_buy: data.is_visible_buy,
        is_visible_sell: data.is_visible_sell,
        display_name: displayName || existingPrice.display_name
      });
    } else {
      price = await priceRepository.createPrice({
        product_code: data.product_code,
        buy_price: data.buy_price,
        sell_price: data.sell_price,
        is_visible_buy: data.is_visible_buy,
        is_visible_sell: data.is_visible_sell,
        display_name: displayName
      }, today);
    }
    
    if (price) {
      await historyRepository.addToHistory({
        product_code: price.product_code,
        buy_price: price.buy_price,
        sell_price: price.sell_price,
        is_visible_buy: price.is_visible_buy,
        is_visible_sell: price.is_visible_sell,
        display_name: price.display_name,
        price_date: price.price_date
      });
    }
    
    return price;
  }
  
  async updatePriceById(id: number, data: IUpdatePriceInput, adminUserId: number) {
    let displayName = data.display_name;
    if (!displayName || displayName === 'null' || displayName === '') {
      const existingPrice = await priceRepository.updatePriceById(id, {});
      if (existingPrice) {
        displayName = existingPrice.display_name;
      }
    }
    
    const price = await priceRepository.updatePriceById(id, {
      buy_price: data.buy_price,
      sell_price: data.sell_price,
      is_visible_buy: data.is_visible_buy,
      is_visible_sell: data.is_visible_sell,
      display_name: displayName
    });
    
    if (price) {
      await historyRepository.addToHistory({
        product_code: price.product_code,
        buy_price: price.buy_price,
        sell_price: price.sell_price,
        is_visible_buy: price.is_visible_buy,
        is_visible_sell: price.is_visible_sell,
        display_name: price.display_name,
        price_date: price.price_date
      });
    }
    
    return price;
  }
  
  async getProductsWithPrices(userId: number, isAdmin: boolean): Promise<IProductWithPrice[]> {
    try {
      const today = this.getIranDate(); // استفاده از تاریخ ایران
      
      const meltedProducts = await productRepository.getAllMeltedProducts(false);
      const coinProducts = await productRepository.getAllCoinProducts(false);
      const allProducts = [...meltedProducts, ...coinProducts];
      
      const prices = await priceRepository.getAllTodayPrices(today);
      const priceMap = new Map();
      for (const price of prices) {
        priceMap.set(price.product_code, price);
      }
      
      const offsets = await offsetService.getUserOffsets(userId, isAdmin);
      
      const result: IProductWithPrice[] = [];
      
      for (const product of allProducts) {
        const price = priceMap.get(product.code);
        const isMelted = (product as any).type === 'melted' || product.code.startsWith('AB_');
        const offset = isMelted ? offsets.melted_offset : offsets.coin_offset;
        
        const baseBuyPrice = price?.buy_price !== null && price?.buy_price !== undefined ? Number(price.buy_price) : null;
        const baseSellPrice = price?.sell_price !== null && price?.sell_price !== undefined ? Number(price.sell_price) : null;
        
        let finalBuyPrice: number | null = null;
        let finalSellPrice: number | null = null;
        
        let userIsVisibleBuy: boolean;
        let userIsVisibleSell: boolean;
        
        let displayName = price?.display_name;
        if (!displayName || displayName === 'null' || displayName === '') {
          if (isMelted) {
            displayName = (product as any).default_display_name || (product as any).name;
          } else {
            displayName = (product as any).name;
          }
        }
        
        if (isAdmin) {
          finalBuyPrice = baseBuyPrice;
          finalSellPrice = baseSellPrice;
          userIsVisibleBuy = price?.is_visible_buy !== undefined ? price.is_visible_buy : true;
          userIsVisibleSell = price?.is_visible_sell !== undefined ? price.is_visible_sell : true;
        } else {
          if (baseSellPrice !== null) {
            finalBuyPrice = Math.floor(baseSellPrice + offset);
          }
          if (baseBuyPrice !== null) {
            finalSellPrice = Math.floor(baseBuyPrice - offset);
          }
          userIsVisibleBuy = price?.is_visible_sell !== undefined ? price.is_visible_sell : true;
          userIsVisibleSell = price?.is_visible_buy !== undefined ? price.is_visible_buy : true;
        }
        
        const hasPrice = (finalBuyPrice !== null && finalBuyPrice > 0) || (finalSellPrice !== null && finalSellPrice > 0);
        
        let updatedAt: string | null = null;
        if (price?.updated_at) {
          updatedAt = price.updated_at.toISOString();
        } else if ((product as any).updated_at) {
          updatedAt = (product as any).updated_at.toISOString();
        }
        
        result.push({
          id: product.id,
          code: product.code,
          name: product.name,
          display_name: displayName || product.name,
          buy_price: finalBuyPrice,
          sell_price: finalSellPrice,
          final_buy_price: finalBuyPrice,
          final_sell_price: finalSellPrice,
          base_buy_price: baseBuyPrice || 0,
          base_sell_price: baseSellPrice || 0,
          applied_offset: offset,
          is_visible_buy: userIsVisibleBuy && hasPrice,
          is_visible_sell: userIsVisibleSell && hasPrice,
          min_weight: isMelted ? (product as any).min_weight : undefined,
          max_weight: isMelted ? (product as any).max_weight : undefined,
          min_count: !isMelted ? (product as any).min_count : undefined,
          max_count: !isMelted ? (product as any).max_count : undefined,
          type: isMelted ? 'melted' : 'coin',
          updated_at: updatedAt,
          has_price: hasPrice
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in getProductsWithPrices:', error);
      throw error;
    }
  }
  
  async getPriceHistory(productCode: string, startDate?: string, endDate?: string) {
    return await historyRepository.getPriceHistory(productCode, startDate, endDate);
  }
  
  async archiveYesterdayPrices() {
    const yesterday = moment().tz('Asia/Tehran').subtract(1, 'day').format('YYYY-MM-DD');
    return await historyRepository.archiveYesterdayPrices(yesterday);
  }
}

export const priceService = new PriceService();