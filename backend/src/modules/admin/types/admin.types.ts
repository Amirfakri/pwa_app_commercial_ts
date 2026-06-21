// backend/src/modules/admin/types/admin.types.ts

export interface IUser {
  id: number;
  mobile_number: string;
  first_name: string | null;
  last_name: string | null;
  code: string;
  is_blocked: boolean;
  device_limit: number;
  melted_price_offset: number;
  coin_price_offset: number;
  created_at: Date;
  updated_at: Date;
}

export interface IUserCreateInput {
  mobile_number: string;
  first_name?: string;
  last_name?: string;
  code?: string;
}

export interface IUserUpdateInput {
  mobile_number?: string;
  first_name?: string;
  last_name?: string;
  code?: string;
  device_limit?: number;
  melted_price_offset?: number;
  coin_price_offset?: number;
  is_blocked?: boolean;
}

export interface IAdmin {
  id: number;
  mobile_number: string;
  first_name: string;
  last_name: string;
  is_main_admin: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IAdminCreateInput {
  mobile_number: string;
  first_name: string;
  last_name: string;
}

export interface IAdminUpdateInput {
  is_active?: boolean;
}

export interface IUserRegistration {
  id: number;
  mobile_number: string;
  first_name: string;
  last_name: string;
  national_code: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: Date;
  created_at: Date;
}