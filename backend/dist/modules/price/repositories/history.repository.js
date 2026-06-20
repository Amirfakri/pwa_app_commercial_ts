"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyRepository = exports.HistoryRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class HistoryRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async addToHistory(price) {
        // حذف ON CONFLICT - فقط INSERT انجام بده
        await this.pool.query(`INSERT INTO price_history (
        product_code, buy_price, sell_price, 
        is_visible_buy, is_visible_sell, display_name, 
        price_date, change_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`, [
            price.product_code,
            price.buy_price,
            price.sell_price,
            price.is_visible_buy,
            price.is_visible_sell,
            price.display_name,
            price.price_date,
        ]);
    }
    async getPriceHistory(productCode, startDate, endDate) {
        let query = `
      SELECT id, product_code, buy_price, sell_price,
             is_visible_buy, is_visible_sell, display_name,
             price_date, change_date
      FROM price_history
      WHERE product_code = $1
    `;
        const params = [productCode];
        let paramIndex = 2;
        if (startDate && endDate) {
            query += ` AND price_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            params.push(startDate, endDate);
            paramIndex += 2;
        }
        query += ` ORDER BY change_date DESC`;
        const { rows } = await this.pool.query(query, params);
        return rows;
    }
    async archiveYesterdayPrices(yesterday) {
        const { rows } = await this.pool.query(`INSERT INTO price_history (
        product_code, buy_price, sell_price, 
        is_visible_buy, is_visible_sell, display_name, 
        price_date, change_date
      )
      SELECT 
        product_code, buy_price, sell_price,
        is_visible_buy, is_visible_sell, display_name,
        price_date, NOW()
      FROM prices
      WHERE price_date = $1
        AND NOT EXISTS (
          SELECT 1 FROM price_history 
          WHERE product_code = prices.product_code 
            AND price_date = prices.price_date
        )
      RETURNING id`, [yesterday]);
        return rows.length;
    }
    async deleteOldHistory(days = 90) {
        const { rowCount } = await this.pool.query(`DELETE FROM price_history WHERE change_date < NOW() - INTERVAL '${days} days'`);
        return rowCount || 0;
    }
}
exports.HistoryRepository = HistoryRepository;
exports.historyRepository = new HistoryRepository();
