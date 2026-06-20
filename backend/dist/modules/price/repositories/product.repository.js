"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = exports.ProductRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class ProductRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async getAllMeltedProducts(onlyActive = true) {
        let query = `
      SELECT id, name, code, min_weight, max_weight, default_display_name, 
             is_active, display_order, created_at, updated_at
      FROM melted_products
    `;
        if (onlyActive) {
            query += ` WHERE is_active = true`;
        }
        query += ` ORDER BY display_order ASC, created_at DESC`;
        const { rows } = await this.pool.query(query);
        return rows;
    }
    async getAllCoinProducts(onlyActive = true) {
        let query = `
      SELECT id, name, code, min_count, max_count, 
             is_active, display_order, created_at, updated_at
      FROM coins
    `;
        if (onlyActive) {
            query += ` WHERE is_active = true`;
        }
        query += ` ORDER BY display_order ASC, created_at DESC`;
        const { rows } = await this.pool.query(query);
        return rows;
    }
    async getMeltedProductByCode(code) {
        const { rows } = await this.pool.query('SELECT * FROM melted_products WHERE code = $1', [code]);
        return rows[0] || null;
    }
    async getCoinProductByCode(code) {
        const { rows } = await this.pool.query('SELECT * FROM coins WHERE code = $1', [code]);
        return rows[0] || null;
    }
    async detectProductType(code) {
        const melted = await this.getMeltedProductByCode(code);
        if (melted)
            return 'melted';
        const coin = await this.getCoinProductByCode(code);
        if (coin)
            return 'coin';
        return null;
    }
    async getMeltedProductById(id) {
        const { rows } = await this.pool.query('SELECT * FROM melted_products WHERE id = $1', [id]);
        return rows[0] || null;
    }
    async getCoinProductById(id) {
        const { rows } = await this.pool.query('SELECT * FROM coins WHERE id = $1', [id]);
        return rows[0] || null;
    }
}
exports.ProductRepository = ProductRepository;
exports.productRepository = new ProductRepository();
