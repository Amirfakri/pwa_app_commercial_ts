
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