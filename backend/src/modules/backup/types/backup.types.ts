export interface IBackupLog {
  id: number;
  admin_id: number;
  tables: string[];
  record_count: number;
  file_name: string;
  created_at: Date;
}

export interface IBackupFilters {
  start_date: string;
  end_date: string;
  tables: string[];
}

export interface IExcelTransaction {
  row: number;
  user_code: string;
  user_name: string;
  mobile: string;
  product: string;
  type: string;
  quantity: string;
  amount: string;
  unit_price: string;
  offset: string;
  date: string;
  time: string;
}