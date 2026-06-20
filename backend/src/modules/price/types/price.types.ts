// backend/src/modules/price/types/price.types.ts

export type ProductType = 'melted' | 'coin';

export interface IPrice {
  id: number;
  product_code: string;
  buy_price: number | null;
  sell_price: number | null;
  is_visible_buy: boolean;
  is_visible_sell: boolean;
  display_name: string | null;
  price_date: string;
  created_at: Date;
  updated_at: Date;
}

export interface IPriceHistory {
  id: number;
  product_code: string;
  buy_price: number | null;
  sell_price: number | null;
  is_visible_buy: boolean;
  is_visible_sell: boolean;
  display_name: string | null;
  price_date: string;
  change_date: Date;
}

export interface ICreatePriceInput {
  product_code: string;
  buy_price?: number | null;
  sell_price?: number | null;
  is_visible_buy?: boolean;
  is_visible_sell?: boolean;
  display_name?: string | null;
}

export interface IUpdatePriceInput {
  buy_price?: number | null;
  sell_price?: number | null;
  is_visible_buy?: boolean;
  is_visible_sell?: boolean;
  display_name?: string | null;
}

export interface IPriceWithOffset extends IPrice {
  base_buy_price: number | null;
  base_sell_price: number | null;
  final_buy_price: number | null;
  final_sell_price: number | null;
  applied_offset: number;
  is_admin: boolean;
}

export interface IMeltedProduct {
  id: number;
  name: string;
  code: string;
  min_weight: number | null;
  max_weight: number | null;
  default_display_name: string;
  is_active: boolean;
  display_order: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ICoinProduct {
  id: number;
  name: string;
  code: string;
  min_count: number | null;
  max_count: number | null;
  is_active: boolean;
  display_order: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface IProductWithPrice {
  id: number;
  code: string;
  name: string;
  display_name: string;
  buy_price: number | null;
  sell_price: number | null;
  final_buy_price: number | null;
  final_sell_price: number | null;
  base_buy_price: number;
  base_sell_price: number;
  applied_offset: number;
  is_visible_buy: boolean;
  is_visible_sell: boolean;
  min_weight?: number | null;
  max_weight?: number | null;
  min_count?: number | null;
  max_count?: number | null;
  type: ProductType;
  updated_at: string | null;
  has_price: boolean;
}

export interface IUserOffsets {
  melted_offset: number;
  coin_offset: number;
}

export interface IExternalPrice {
  code: string;
  buy_price: number;
  sell_price: number;
  display_name?: string;
  name?: string;
  is_visible_buy?: boolean;
  is_visible_sell?: boolean;
}