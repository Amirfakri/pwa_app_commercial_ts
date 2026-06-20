// backend/src/modules/backup/utils/numberFormatter.ts

export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '۰';
  return num.toLocaleString('fa-IR');
};

export const formatDecimal = (num: number | null | undefined, decimals: number = 3): string => {
  if (num === null || num === undefined) return '۰';
  return num.toLocaleString('fa-IR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const toPersianNumber = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, d => persianDigits[parseInt(d)]);
};