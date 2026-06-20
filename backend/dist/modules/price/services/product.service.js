"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = exports.ProductService = void 0;
const postgres_1 = require("../../../core/database/postgres");
class ProductService {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async getAllProducts() {
        const melted = await this.pool.query('SELECT *, \'melted\' as type FROM melted_products ORDER BY display_order');
        const coins = await this.pool.query('SELECT *, \'coin\' as type FROM coins ORDER BY display_order');
        return [...melted.rows, ...coins.rows];
    }
    async getProductByCode(code) {
        let result;
        if (code.startsWith('AB_')) {
            result = await this.pool.query('SELECT *, \'melted\' as type FROM melted_products WHERE code = $1', [code]);
        }
        else {
            result = await this.pool.query('SELECT *, \'coin\' as type FROM coins WHERE code = $1', [code]);
        }
        return result.rows[0];
    }
    async updateProduct(code, data) {
        let query;
        let values;
        if (code.startsWith('AB_')) {
            query = `
        UPDATE melted_products 
        SET 
          name = COALESCE($1, name),
          default_display_name = COALESCE($2, default_display_name),
          is_active = COALESCE($3, is_active),
          min_weight = COALESCE($4, min_weight),
          max_weight = COALESCE($5, max_weight),
          display_order = COALESCE($6, display_order),
          updatedat = NOW()
        WHERE code = $7
        RETURNING *, 'melted' as type
      `;
            values = [
                data.name,
                data.display_name || data.default_display_name,
                data.is_active,
                data.min_weight,
                data.max_weight,
                data.display_order,
                code
            ];
        }
        else {
            query = `
        UPDATE coins 
        SET 
          name = COALESCE($1, name),
          is_active = COALESCE($2, is_active),
          min_count = COALESCE($3, min_count),
          max_count = COALESCE($4, max_count),
          display_order = COALESCE($5, display_order),
          updatedat = NOW()
        WHERE code = $6
        RETURNING *, 'coin' as type
      `;
            values = [
                data.name,
                data.is_active,
                data.min_count,
                data.max_count,
                data.display_order,
                code
            ];
        }
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }
    async createProduct(data) {
        let query;
        let values;
        if (data.type === 'melted') {
            query = `
        INSERT INTO melted_products (name, code, min_weight, max_weight, default_display_name, is_active, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *, 'melted' as type
      `;
            values = [
                data.name,
                data.code,
                data.min_weight || 0,
                data.max_weight || 1000,
                data.display_name || data.name,
                data.is_active !== false,
                data.display_order || 999
            ];
        }
        else {
            query = `
        INSERT INTO coins (name, code, min_count, max_count, is_active, display_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *, 'coin' as type
      `;
            values = [
                data.name,
                data.code,
                data.min_count || 1,
                data.max_count || 100,
                data.is_active !== false,
                data.display_order || 999
            ];
        }
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }
    async deleteProduct(code) {
        if (code.startsWith('AB_')) {
            await this.pool.query('UPDATE melted_products SET is_active = false WHERE code = $1', [code]);
        }
        else {
            await this.pool.query('UPDATE coins SET is_active = false WHERE code = $1', [code]);
        }
        return { code, deleted: true };
    }
}
exports.ProductService = ProductService;
exports.productService = new ProductService();
