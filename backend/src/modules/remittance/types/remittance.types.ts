// backend/src/modules/remittance/types/remittance.types.ts

export type RemittanceType = 'وزنی' | 'ریالی' | 'سکه';
export type RemittanceStatus = 'در حال بررسی' | 'تأییدشده' | 'ردشده' | 'تحویل شده';

export interface IRemittance {
  id: number;
  user_id: number;
  type: RemittanceType;
  weight: number | null;
  amount: number | null;
  coin_count: number | null;
  recipient: string;
  description: string | null;
  status: RemittanceStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateRemittanceInput {
  type: RemittanceType;
  weight?: number;
  amount?: number;
  coin_count?: number;
  recipient: string;
  description?: string;
}

export interface IUpdateRemittanceStatusInput {
  status: RemittanceStatus;
}

export interface IRemittanceWithUser extends IRemittance {
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  code?: string;
  user_code?: string;
}

export interface IRemittanceResponse {
  id: number;
  user_id: number;
  user_code?: string;
  type: RemittanceType;
  weight: number | null;
  amount: number | null;
  coin_count: number | null;
  recipient: string;
  description: string | null;
  status: RemittanceStatus;
  created_at: string;
  updated_at: string;
  user_info?: {
    first_name: string;
    last_name: string;
    mobile_number: string;
    full_name: string;
    code: string;
  };
}

export interface IRemittanceSearchFilters {
  start_date?: string;
  end_date?: string;
  user_id?: number;
  status?: RemittanceStatus;
  type?: RemittanceType;
  query?: string;
  page?: number;
  limit?: number;
}