// backend/src/modules/transaction/types/transaction.types.ts

export type TransactionType = 'buy' | 'sell' | 'خرید' | 'فروش';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type ProductType = 'melted' | 'coin';

export interface ITransaction {
  id: number;
  user_id: number;
  price_id: number | null;
  product_code: string;
  display_name: string | null;
  type: TransactionType;
  coin_quantity: number | null;
  melted_weight: number | null;
  amount: number;
  transaction_price: number | null;
  base_price: number | null;
  applied_offset: number | null;
  user_melted_offset: number | null;
  user_coin_offset: number | null;
  offset_type: ProductType | null;
  status: TransactionStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateTransactionInput {
  product_code: string;
  type: TransactionType;
  coin_quantity?: number;
  melted_weight?: number;
  amount: number;
}

export interface ICreateManualTransactionInput {
  product_code: string;
  type: TransactionType;
  user_id: number;
  amount: number;
  coin_quantity?: number;
  melted_weight?: number;
  transaction_price?: number;
  status?: TransactionStatus;
}

export interface IUpdateTransactionInput {
  status?: TransactionStatus;
  type?: TransactionType;
  display_name?: string;
  amount?: number;
  transaction_price?: number;
  coin_quantity?: number;
  melted_weight?: number;
}

export interface ITransactionWithUser extends ITransaction {
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  code?: string;
  user_code?: string;
}

export interface ITransactionResponse {
  id: number;
  user_id: number;
  product_code: string;
  display_name: string;
  type: string;
  coin_quantity: number | null;
  melted_weight: number | null;
  amount: number;
  transaction_price: number | null;
  base_price: number | null;
  applied_offset: number;
  status: TransactionStatus;
  status_persian: string;
  created_at: string;
  updated_at: string;
  remaining_seconds?: number;
  timer_total?: number;
  user_info?: {
    first_name: string;
    last_name: string;
    mobile_number: string;
    full_name: string;
    code: string;
  };
  price_info?: {
    base_price: number;
    applied_offset: number;
    final_price: number;
    has_offset: boolean;
    offset_type: string;
  };
}

export interface ITimer {
  id: number;
  value: number;
  updated_at: Date;
}

export interface IPriceData {
  id: number;
  buy_price: number | null;
  sell_price: number | null;
  display_name: string;
  is_visible_buy: boolean;
  is_visible_sell: boolean;
}

export interface IProductLimits {
  min_weight?: number;
  max_weight?: number;
  min_count?: number;
  max_count?: number;
}