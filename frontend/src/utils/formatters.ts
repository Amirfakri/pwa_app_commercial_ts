
// فرمت اعداد با جداکننده هزارگان
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '۰';
  return num.toLocaleString('fa-IR');
};

// تبدیل رشته به عدد (حذف جداکننده‌ها)
export const parseNumber = (str: string): number => {
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};