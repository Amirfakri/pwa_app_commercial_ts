
// ============================================
// 1. فایل تایپ‌ها - backend/src/modules/riz/types/riz.types.ts
// ============================================

export interface IRizRecord {
  id: number;
  user_code: string;
  document_no: string;
  invoice_no: string | null;
  date: string | null;
  description: string | null;
  weight: number | null;
  weight_debit: number;
  weight_credit: number;
  rate: number | null;
  wage: number;
  balance_weight: number;
  debit_amount: number;
  credit_amount: number;
  balance_amount: number;
  sort_order: number;
  raw_json: any;
  created_at: Date;
}

export interface IRizCreateInput {
  user_code: string;
  document_no: string;
  invoice_no?: string | null;
  date?: string | null;
  description?: string | null;
  weight?: number | null;
  weight_debit?: number;
  weight_credit?: number;
  rate?: number | null;
  wage?: number;
  balance_weight?: number;
  debit_amount?: number;
  credit_amount?: number;
  balance_amount?: number;
  sort_order?: number;
  raw_json?: any;
}

export interface IUserBalance {
  user_code: string;
  user_name: string;
  mobile_number: string;
  rial_balance: number;
  gold_balance: number;
  rial_status: 'بستانکار' | 'بدهکار' | 'صفر';
  gold_status: 'بستانکار' | 'بدهکار' | 'صفر';
  last_update: string;
  last_document: string;
  total_transactions: number;
}

export interface ICustomerSummary {
  user_code: string;
  full_name: string;
  mobile_number: string;
  last_transaction_date: string;
  last_document_no: string;
  final_weight_balance: number;
  weight_type: 'بستانکار' | 'بدهکار' | 'صفر';
  final_amount_balance: number;
  amount_type: 'بستانکار' | 'بدهکار' | 'صفر';
  total_transactions: number;
  is_blocked: boolean;
}

export interface IUploadResult {
  inserted: number;
  updated: number;
  total: number;
  user_code: string;
}

export interface IRizSearchFilters {
  user_code?: string;
  start_date?: string;
  end_date?: string;
  document_no?: string;
  invoice_no?: string;
  page?: number;
  limit?: number;
}

export interface IUserSearchResult {
  id: number;
  code: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  mobile_number: string;
  is_blocked: boolean;
  device_limit: number;
  created_at: string;
}