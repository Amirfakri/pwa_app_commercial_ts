// backend/src/modules/notification/types/notification.types.ts

export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'simple';
export type SmsStatus = 'sent' | 'failed' | 'pending';
export type NotificationAudience = 'all' | 'specific_user' | 'specific_role';

export interface INotification {
  id: number;
  title: string | null;
  message_text: string;
  notification_type: NotificationType;
  is_active: boolean;
  start_date: Date | null;
  end_date: Date | null;
  audience: NotificationAudience;
  user_id: number | null;
  role: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  read_at: Date | null;  // زمان خوانده شدن توسط کاربر
}

export interface ICreateNotificationInput {
  title?: string;
  message_text: string;
  notification_type?: NotificationType;
  is_active?: boolean;
  start_date?: Date | null;
  end_date?: Date | null;
  audience?: NotificationAudience;
  user_id?: number | null;
  role?: string | null;
}

export interface IUpdateNotificationInput {
  title?: string | null;
  message_text?: string;
  notification_type?: NotificationType;
  is_active?: boolean;
  start_date?: Date | null;
  end_date?: Date | null;
  audience?: NotificationAudience;
  user_id?: number | null;
  role?: string | null;
}

export interface INotificationWithReadStatus extends INotification {
  is_read: boolean;
  read_at: Date | null;
}

export interface IUserNotification {
  notification_id: number;
  user_id: number;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date;
}

export interface IDailyMessage {
  id: number;
  message_text: string;
  is_active: boolean;
  start_date: Date | null;
  end_date: Date | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateDailyMessageInput {
  message_text: string;
  is_active?: boolean;
  start_date?: Date | null;
  end_date?: Date | null;
}

export interface IUpdateDailyMessageInput {
  message_text?: string;
  is_active?: boolean;
  start_date?: Date | null;
  end_date?: Date | null;
}

export interface ISmsLog {
  id: string;
  admin_id: number | null;
  receptor: string;
  message: string | null;
  status: SmsStatus;
  sms_id: string | null;
  provider: string | null;
  batch_id: string | null;
  error: string | null;
  created_at: Date;
}

export interface ISendSmsInput {
  receptor: string;
  message?: string;
  bodyId?: string;
  from?: string;
}

export interface ISendBulkSmsInput {
  receptors: string[];
  message?: string;
  bodyId?: string;
  from?: string;
}

export interface ISmsAccountInfo {
  remainsms: number;
  remaincredit: number;
  status: 'active' | 'inactive' | 'error';
  provider: string;
  lastUpdate: string;
}

export interface ICustomerSearchResult {
  id: number;
  code: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  mobile_number: string;
  created_at: Date;
}

export interface ICustomerBalance {
  user: {
    id: number;
    code: string;
    full_name: string;
    mobile_number: string;
  };
  balance: {
    rial: number;
    gold: number;
    status: 'بستانکار' | 'بدهکار' | 'صفر';
    last_update: string;
    last_document: string;
  };
}

export interface IGetNotificationsQuery {
  page?: number;
  limit?: number;
  is_active?: boolean;
  audience?: NotificationAudience;
  user_id?: number;
}