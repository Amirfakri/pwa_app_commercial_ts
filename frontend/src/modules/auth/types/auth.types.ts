export interface IUser {
  id: number;
  mobile_number: string;
  full_name: string;
  code?: string;
  isAdmin: boolean;
  is_main_admin?: boolean;
  melted_price_offset?: number;
  coin_price_offset?: number;
}

export interface ILoginResponse {
  success: boolean;
  user: IUser;
  sessionToken: string;
  deviceId: string;
  expiresAt: string;
}

export interface ISendOtpRequest {
  mobile: string;
}

export interface IVerifyOtpRequest {
  mobile: string;
  otp: string;
  deviceName?: string;
}