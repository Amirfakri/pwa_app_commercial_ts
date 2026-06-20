// backend/src/modules/auth/types/auth.types.ts

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
  show_gram: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IAdmin {
  id: number;
  mobile_number: string;
  first_name: string;
  last_name: string;
  is_main_admin: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface ISession {
  id: number;
  user_id: number | null;
  admin_id: number | null;
  device_id: string;
  session_token: string;
  refresh_token: string;
  device_name: string | null;
  device_type: string | null;
  ip_address: string | null;
  browser: string | null;
  platform: string | null;
  is_active: boolean;
  expires_at: Date;
  last_activity: Date;
  created_at: Date;
}

export interface ILoginRequest {
  mobile: string;
}

export interface IVerifyOtpRequest {
  mobile: string;
  otp: string;
  deviceName?: string;
}

export interface ILogoutRequest {
  allDevices?: boolean;
}

export interface IAuthResponse {
  success: boolean;
  user: {
    id: number;
    mobile_number: string;
    full_name: string;
    code?: string;
    isAdmin: boolean;
    is_main_admin?: boolean;
  };
  sessionToken: string;
  deviceId: string;
  expiresAt: string;
  session: {
    expiresAt: string;
    durationDays: number;
  };
}

export interface ISessionInfo {
  sessionToken: string;
  refreshToken: string;
  sessionId: number;
  deviceId: string;
  expiresAt: string;
}

export interface IDeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  platform: string;
  ipAddress: string;
}