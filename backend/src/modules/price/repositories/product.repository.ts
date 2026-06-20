import { Pool } from 'pg';
import { pool } from '../../../core/database/postgres';
import { IMeltedProduct, ICoinProduct } from '../types/price.types';

export class ProductRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async getAllMeltedProducts(onlyActive: boolean = true): Promise<IMeltedProduct[]> {
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

  async getAllCoinProducts(onlyActive: boolean = true): Promise<ICoinProduct[]> {
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

  async getMeltedProductByCode(code: string): Promise<IMeltedProduct | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM melted_products WHERE code = $1',
      [code]
    );
    return rows[0] || null;
  }

  async getCoinProductByCode(code: string): Promise<ICoinProduct | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM coins WHERE code = $1',
      [code]
    );
    return rows[0] || null;
  }

  async detectProductType(code: string): Promise<'melted' | 'coin' | null> {
    const melted = await this.getMeltedProductByCode(code);
    if (melted) return 'melted';
    
    const coin = await this.getCoinProductByCode(code);
    if (coin) return 'coin';
    
    return null;
  }

  async getMeltedProductById(id: number): Promise<IMeltedProduct | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM melted_products WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async getCoinProductById(id: number): Promise<ICoinProduct | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM coins WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }
}

export const productRepository = new ProductRepository();