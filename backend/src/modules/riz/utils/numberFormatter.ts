// backend/src/modules/riz/utils/numberFormatter.ts

// فرمت اعداد با کاما (برای نمایش)
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '۰';
  return num.toLocaleString('fa-IR');
};

// فرمت اعداد اعشاری (برای طلا)
export const formatDecimal = (num: number | null | undefined, decimals: number = 3): string => {
  if (num === null || num === undefined) return '۰';
  return num.toLocaleString('fa-IR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// تبدیل اعداد انگلیسی به فارسی
export const toPersianNumber = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, d => persianDigits[parseInt(d)]);
};

// تبدیل اعداد فارسی به انگلیسی
export const toEnglishNumber = (str: string): string => {
  const persianDigits: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  return str.replace(/[۰-۹]/g, d => persianDigits[d] || d);
};

// فرمت ریال (با تومان هم می‌توان استفاده کرد)
export const formatRial = (amount: number): string => {
  if (amount === 0) return '۰ ریال';
  const formatted = formatNumber(amount);
  if (amount < 0) return `-${formatted.replace('-', '')} ریال`;
  return `${formatted} ریال`;
};