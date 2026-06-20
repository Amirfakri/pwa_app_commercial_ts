"use strict";
// backend/src/modules/price/services/price.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceService = exports.PriceService = void 0;
const price_repository_1 = require("../repositories/price.repository");
const product_repository_1 = require("../repositories/product.repository");
const history_repository_1 = require("../repositories/history.repository");
const offset_service_1 = require("./offset.service");
class PriceService {
    async getTodayPrice(productCode, userId, isAdmin) {
        const today = new Date().toISOString().split('T')[0];
        const price = await price_repository_1.priceRepository.getTodayPrice(productCode, today);
        if (!price) {
            return null;
        }
        const offsets = await offset_service_1.offsetService.getUserOffsets(userId, isAdmin);
        const offset = productCode.startsWith('AB_') ? offsets.melted_offset : offsets.coin_offset;
        let finalBuyPrice = null;
        let finalSellPrice = null;
        if (!isAdmin) {
            if (price.sell_price !== null) {
                finalBuyPrice = Math.floor(Number(price.sell_price) + Number(offset));
            }
            if (price.buy_price !== null) {
                finalSellPrice = Math.floor(Number(price.buy_price) - Number(offset));
            }
        }
        else {
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
    async getAllTodayPrices(userId, isAdmin) {
        const today = new Date().toISOString().split('T')[0];
        const prices = await price_repository_1.priceRepository.getAllTodayPrices(today);
        const offsets = await offset_service_1.offsetService.getUserOffsets(userId, isAdmin);
        const result = [];
        for (const price of prices) {
            const offset = price.product_code.startsWith('AB_') ? offsets.melted_offset : offsets.coin_offset;
            let finalBuyPrice = null;
            let finalSellPrice = null;
            if (!isAdmin) {
                if (price.sell_price !== null) {
                    finalBuyPrice = Math.floor(Number(price.sell_price) + Number(offset));
                }
                if (price.buy_price !== null) {
                    finalSellPrice = Math.floor(Number(price.buy_price) - Number(offset));
                }
            }
            else {
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
    // تابع کمکی برای گرفتن display_name از محصول
    async getDisplayNameFromProduct(productCode) {
        try {
            const product = await product_repository_1.productRepository.getMeltedProductByCode(productCode);
            if (product) {
                return product.default_display_name || product.name;
            }
            const coin = await product_repository_1.productRepository.getCoinProductByCode(productCode);
            if (coin) {
                return coin.name;
            }
            return null;
        }
        catch (error) {
            console.error('Error getting display name from product:', error);
            return null;
        }
    }
    async createOrUpdatePrice(data, adminUserId) {
        const today = new Date().toISOString().split('T')[0];
        // اگر display_name ارسال نشده، از محصول بگیر
        let displayName = data.display_name;
        if (!displayName || displayName === 'null' || displayName === '') {
            displayName = await this.getDisplayNameFromProduct(data.product_code);
        }
        const existingPrice = await price_repository_1.priceRepository.getTodayPrice(data.product_code, today);
        let price;
        if (existingPrice) {
            price = await price_repository_1.priceRepository.updatePrice(data.product_code, today, {
                buy_price: data.buy_price,
                sell_price: data.sell_price,
                is_visible_buy: data.is_visible_buy,
                is_visible_sell: data.is_visible_sell,
                display_name: displayName || existingPrice.display_name
            });
        }
        else {
            price = await price_repository_1.priceRepository.createPrice({
                product_code: data.product_code,
                buy_price: data.buy_price,
                sell_price: data.sell_price,
                is_visible_buy: data.is_visible_buy,
                is_visible_sell: data.is_visible_sell,
                display_name: displayName
            }, today);
        }
        // ذخیره در تاریخچه
        if (price) {
            await history_repository_1.historyRepository.addToHistory({
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
    async updatePriceById(id, data, adminUserId) {
        // اگر display_name ارسال نشده، قیمت موجود را بگیر و از آن استفاده کن
        let displayName = data.display_name;
        if (!displayName || displayName === 'null' || displayName === '') {
            const existingPrice = await price_repository_1.priceRepository.updatePriceById(id, {});
            if (existingPrice) {
                displayName = existingPrice.display_name;
            }
        }
        const price = await price_repository_1.priceRepository.updatePriceById(id, {
            buy_price: data.buy_price,
            sell_price: data.sell_price,
            is_visible_buy: data.is_visible_buy,
            is_visible_sell: data.is_visible_sell,
            display_name: displayName
        });
        if (price) {
            await history_repository_1.historyRepository.addToHistory({
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
    async getProductsWithPrices(userId, isAdmin) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const meltedProducts = await product_repository_1.productRepository.getAllMeltedProducts(false);
            const coinProducts = await product_repository_1.productRepository.getAllCoinProducts(false);
            const allProducts = [...meltedProducts, ...coinProducts];
            const prices = await price_repository_1.priceRepository.getAllTodayPrices(today);
            const priceMap = new Map();
            for (const price of prices) {
                priceMap.set(price.product_code, price);
            }
            const offsets = await offset_service_1.offsetService.getUserOffsets(userId, isAdmin);
            const result = [];
            for (const product of allProducts) {
                const price = priceMap.get(product.code);
                const isMelted = product.type === 'melted' || product.code.startsWith('AB_');
                const offset = isMelted ? offsets.melted_offset : offsets.coin_offset;
                const baseBuyPrice = price?.buy_price !== null && price?.buy_price !== undefined ? Number(price.buy_price) : null;
                const baseSellPrice = price?.sell_price !== null && price?.sell_price !== undefined ? Number(price.sell_price) : null;
                let finalBuyPrice = null;
                let finalSellPrice = null;
                let userIsVisibleBuy;
                let userIsVisibleSell;
                // تعیین display_name: اول از price، سپس از product
                let displayName = price?.display_name;
                if (!displayName || displayName === 'null' || displayName === '') {
                    if (isMelted) {
                        displayName = product.default_display_name || product.name;
                    }
                    else {
                        displayName = product.name;
                    }
                }
                if (isAdmin) {
                    finalBuyPrice = baseBuyPrice;
                    finalSellPrice = baseSellPrice;
                    userIsVisibleBuy = price?.is_visible_buy !== undefined ? price.is_visible_buy : true;
                    userIsVisibleSell = price?.is_visible_sell !== undefined ? price.is_visible_sell : true;
                }
                else {
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
                let updatedAt = null;
                if (price?.updated_at) {
                    updatedAt = price.updated_at.toISOString();
                }
                else if (product.updated_at) {
                    updatedAt = product.updated_at.toISOString();
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
                    min_weight: isMelted ? product.min_weight : undefined,
                    max_weight: isMelted ? product.max_weight : undefined,
                    min_count: !isMelted ? product.min_count : undefined,
                    max_count: !isMelted ? product.max_count : undefined,
                    type: isMelted ? 'melted' : 'coin',
                    updated_at: updatedAt,
                    has_price: hasPrice
                });
            }
            return result;
        }
        catch (error) {
            console.error('Error in getProductsWithPrices:', error);
            throw error;
        }
    }
    async getPriceHistory(productCode, startDate, endDate) {
        return await history_repository_1.historyRepository.getPriceHistory(productCode, startDate, endDate);
    }
    async archiveYesterdayPrices() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        return await history_repository_1.historyRepository.archiveYesterdayPrices(yesterdayStr);
    }
}
exports.PriceService = PriceService;
exports.priceService = new PriceService();
