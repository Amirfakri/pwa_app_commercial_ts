"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offsetService = exports.OffsetService = void 0;
const postgres_1 = require("../../../core/database/postgres");
class OffsetService {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async getUserOffsets(userId, isAdmin = false) {
        if (isAdmin) {
            return { melted_offset: 0, coin_offset: 0 };
        }
        const { rows } = await this.pool.query('SELECT melted_price_offset, coin_price_offset FROM users WHERE id = $1', [userId]);
        if (rows.length === 0) {
            return { melted_offset: 0, coin_offset: 0 };
        }
        return {
            melted_offset: parseFloat(rows[0].melted_price_offset) || 0,
            coin_offset: parseFloat(rows[0].coin_price_offset) || 0,
        };
    }
    async updateUserOffsets(userId, meltedOffset, coinOffset) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (meltedOffset !== undefined) {
            updates.push(`melted_price_offset = $${paramIndex++}`);
            values.push(meltedOffset.toString());
        }
        if (coinOffset !== undefined) {
            updates.push(`coin_price_offset = $${paramIndex++}`);
            values.push(coinOffset.toString());
        }
        if (updates.length === 0) {
            return this.getUserOffsets(userId);
        }
        updates.push(`updated_at = NOW()`);
        values.push(userId);
        await this.pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
        return this.getUserOffsets(userId);
    }
    /**
     * محاسبه قیمت نهایی برای کاربر با اعمال افست
     * @param adminBuyPrice - قیمت خرید ادمین (قیمت پایه)
     * @param adminSellPrice - قیمت فروش ادمین (قیمت پایه)
     * @param offset - مقدار افست کاربر
     * @param transactionType - نوع تراکنش ('buy' برای خرید کاربر, 'sell' برای فروش کاربر)
     * @returns قیمت نهایی برای کاربر
     */
    calculateUserPrice(adminBuyPrice, adminSellPrice, offset, transactionType) {
        if (transactionType === 'buy') {
            // قیمت خرید کاربر = قیمت فروش ادمین + افست
            return adminSellPrice !== null ? adminSellPrice + offset : null;
        }
        else {
            // قیمت فروش کاربر = قیمت خرید ادمین - افست
            return adminBuyPrice !== null ? adminBuyPrice - offset : null;
        }
    }
    /**
     * محاسبه قیمت‌های نهایی کاربر (هم خرید و هم فروش)
     */
    calculateUserPrices(adminBuyPrice, adminSellPrice, offset) {
        return {
            userBuyPrice: adminSellPrice !== null ? adminSellPrice + offset : null,
            userSellPrice: adminBuyPrice !== null ? adminBuyPrice - offset : null
        };
    }
    getOffsetByProductType(productCode, offsets) {
        if (productCode.startsWith('AB_')) {
            return offsets.melted_offset;
        }
        if (productCode.startsWith('COIN_')) {
            return offsets.coin_offset;
        }
        return 0;
    }
    formatOffsetMessage(offsets) {
        let message = '';
        if (offsets.melted_offset !== 0) {
            message += `افست آبشده: ${offsets.melted_offset > 0 ? '+' : ''}${offsets.melted_offset.toLocaleString('fa-IR')} تومان\n`;
        }
        if (offsets.coin_offset !== 0) {
            message += `افست سکه: ${offsets.coin_offset > 0 ? '+' : ''}${offsets.coin_offset.toLocaleString('fa-IR')} تومان`;
        }
        return message || 'هیچ افستی اعمال نشده است';
    }
}
exports.OffsetService = OffsetService;
exports.offsetService = new OffsetService();
