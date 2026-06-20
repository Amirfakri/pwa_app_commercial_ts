export interface ITimer {
  id: number;
  transaction_id: number;
  user_id: number;
  remaining_seconds: number;
  initial_seconds: number;
  status: 'active' | 'expired' | 'cancelled';
  started_at: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateTimerInput {
  transaction_id: number;
  user_id: number;
  remaining_seconds: number;
  initial_seconds: number;
  status?: 'active' | 'expired' | 'cancelled';
}

export interface IUpdateTimerInput {
  remaining_seconds?: number;
  status?: 'active' | 'expired' | 'cancelled';
}

export interface ITimerResponse {
  id: number;
  transaction_id: number;
  remaining_seconds: number;
  initial_seconds: number;
  status: string;
  expires_at: string;
  started_at: string;
  is_expired: boolean;
}