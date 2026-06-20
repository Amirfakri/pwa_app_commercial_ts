"use strict";
// backend/src/modules/price/repositories/price.repository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceRepository = exports.PriceRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class PriceRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async getTodayPrice(productCode, today) {
        const { rows } = await this.pool.query(`SELECT id, product_code, buy_price, sell_price, 
              is_visible_buy, is_visible_sell, display_name, 
              price_date, created_at, updated_at
       FROM prices 
       WHERE product_code = $1 AND price_date = $2
       ORDER BY created_at DESC LIMIT 1`, [productCode, today]);
        return rows[0] || null;
    }
    async getLatestPrice(productCode) {
        const { rows } = await this.pool.query(`SELECT id, product_code, buy_price, sell_price, 
              is_visible_buy, is_visible_sell, display_name, 
              price_date, created_at, updated_at
       FROM prices 
       WHERE product_code = $1
       ORDER BY created_at DESC LIMIT 1`, [productCode]);
        return rows[0] || null;
    }
    async getAllTodayPrices(today) {
        const { rows } = await this.pool.query(`SELECT id, product_code, buy_price, sell_price, 
              is_visible_buy, is_visible_sell, display_name, 
              price_date, created_at, updated_at
       FROM prices 
       WHERE price_date = $1
       ORDER BY product_code`, [today]);
        return rows;
    }
    async createPrice(data, priceDate) {
        const { rows } = await this.pool.query(`INSERT INTO prices (
        product_code, buy_price, sell_price, 
        is_visible_buy, is_visible_sell, display_name, price_date,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *`, [
            data.product_code,
            data.buy_price !== undefined && data.buy_price !== null ? data.buy_price : null,
            data.sell_price !== undefined && data.sell_price !== null ? data.sell_price : null,
            data.is_visible_buy !== undefined ? data.is_visible_buy : true,
            data.is_visible_sell !== undefined ? data.is_visible_sell : true,
            data.display_name || null,
            priceDate,
        ]);
        return rows[0];
    }
    async updatePrice(productCode, priceDate, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.buy_price !== undefined) {
            updates.push(`buy_price = $${paramIndex++}`);
            values.push(data.buy_price !== null ? data.buy_price : null);
        }
        if (data.sell_price !== undefined) {
            updates.push(`sell_price = $${paramIndex++}`);
            values.push(data.sell_price !== null ? data.sell_price : null);
        }
        if (data.is_visible_buy !== undefined) {
            updates.push(`is_visible_buy = $${paramIndex++}`);
            values.push(data.is_visible_buy);
        }
        if (data.is_visible_sell !== undefined) {
            updates.push(`is_visible_sell = $${paramIndex++}`);
            values.push(data.is_visible_sell);
        }
        if (data.display_name !== undefined) {
            updates.push(`display_name = $${paramIndex++}`);
            values.push(data.display_name);
        }
        if (updates.length === 0)
            return null;
        updates.push(`updated_at = NOW()`);
        values.push(productCode, priceDate);
        const { rows } = await this.pool.query(`UPDATE prices 
       SET ${updates.join(', ')}
       WHERE product_code = $${paramIndex} AND price_date = $${paramIndex + 1}
       RETURNING *`, values);
        return rows[0] || null;
    }
    async upsertPrice(data, priceDate) {
        const existing = await this.getTodayPrice(data.product_code, priceDate);
        if (existing) {
            const updated = await this.updatePrice(data.product_code, priceDate, data);
            return updated;
        }
        return this.createPrice(data, priceDate);
    }
    async updatePriceById(id, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.buy_price !== undefined) {
            updates.push(`buy_price = $${paramIndex++}`);
            values.push(data.buy_price !== null ? data.buy_price : null);
        }
        if (data.sell_price !== undefined) {
            updates.push(`sell_price = $${paramIndex++}`);
            values.push(data.sell_price !== null ? data.sell_price : null);
        }
        if (data.is_visible_buy !== undefined) {
            updates.push(`is_visible_buy = $${paramIndex++}`);
            values.push(data.is_visible_buy);
        }
        if (data.is_visible_sell !== undefined) {
            updates.push(`is_visible_sell = $${paramIndex++}`);
            values.push(data.is_visible_sell);
        }
        if (data.display_name !== undefined) {
            updates.push(`display_name = $${paramIndex++}`);
            values.push(data.display_name);
        }
        if (updates.length === 0)
            return null;
        updates.push(`updated_at = NOW()`);
        values.push(id);
        const { rows } = await this.pool.query(`UPDATE prices 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`, values);
        return rows[0] || null;
    }
}
exports.PriceRepository = PriceRepository;
exports.priceRepository = new PriceRepository();
