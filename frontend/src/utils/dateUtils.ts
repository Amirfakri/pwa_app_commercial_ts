// frontend/src/utils/dateUtils.ts

// تبدیل عدد به فارسی
export const toPersianNumber = (num: number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, d => persianDigits[parseInt(d)]);
};

// محاسبه کبیسه بودن سال میلادی
const isLeapGregorian = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

// محاسبه کبیسه بودن سال شمسی
const isLeapJalali = (year: number): boolean => {
  const matches = [1, 5, 9, 13, 17, 22, 26, 30];
  const remainder = (year + 12) % 33;
  return matches.includes(remainder);
};

// تبدیل تاریخ میلادی به شمسی
const gregorianToJalali = (gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } => {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  
  let dayOfYear = 0;
  for (let i = 0; i < gm - 1; i++) {
    dayOfYear += gDaysInMonth[i];
  }
  dayOfYear += gd;
  
  if (gm > 2 && isLeapGregorian(gy)) {
    dayOfYear += 1;
  }
  
  let jy = gy - 621;
  let jd = dayOfYear - 79;
  
  if (jd < 0) {
    jy--;
    jd += isLeapJalali(jy) ? 366 : 365;
  }
  
  let jm = 1;
  let isJLeap = isLeapJalali(jy);
  
  for (let i = 0; i < jDaysInMonth.length; i++) {
    const monthDays = jDaysInMonth[i] + (i === 11 && isJLeap ? 1 : 0);
    if (jd <= monthDays) {
      jm = i + 1;
      break;
    }
    jd -= monthDays;
  }
  
  return { jy, jm, jd: jd };
};

// فرمت تاریخ شمسی با ساعت 24 ساعته
export const formatJalaliDateTime = (date: string | Date | null): string => {
  if (!date) return '-';
  
  let d: Date;
  if (typeof date === 'string') {
    d = new Date(date);
  } else {
    d = date;
  }
  
  if (isNaN(d.getTime())) return '-';
  
  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  
  const { jy, jm, jd: jday } = gregorianToJalali(gy, gm, gd);
  
  const persianYear = toPersianNumber(jy);
  const persianMonth = toPersianNumber(jm);
  const persianDay = toPersianNumber(jday);
  const persianHour = toPersianNumber(hours);
  const persianMinute = toPersianNumber(minutes);
  
  return `${persianYear}/${persianMonth}/${persianDay} - ${persianHour}:${persianMinute}`;
};

// فرمت تاریخ شمسی بدون ساعت
export const formatJalaliDate = (date: string | Date | null): string => {
  if (!date) return '-';
  
  let d: Date;
  if (typeof date === 'string') {
    d = new Date(date);
  } else {
    d = date;
  }
  
  if (isNaN(d.getTime())) return '-';
  
  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();
  
  const { jy, jm, jd: jday } = gregorianToJalali(gy, gm, gd);
  
  const persianYear = toPersianNumber(jy);
  const persianMonth = toPersianNumber(jm);
  const persianDay = toPersianNumber(jday);
  
  return `${persianYear}/${persianMonth}/${persianDay}`;
};

// فرمت ساعت 24 ساعته
export const formatTime24 = (date: string | Date | null): string => {
  if (!date) return '-';
  
  let d: Date;
  if (typeof date === 'string') {
    d = new Date(date);
  } else {
    d = date;
  }
  
  if (isNaN(d.getTime())) return '-';
  
  const hours = toPersianNumber(d.getHours());
  const minutes = toPersianNumber(d.getMinutes());
  
  return `${hours}:${minutes}`;
};

// تابع کمکی برای تبدیل در کنسول (برای دیباگ)
if (typeof window !== 'undefined') {
  (window as any).formatJalaliDateTime = formatJalaliDateTime;
  (window as any).formatJalaliDate = formatJalaliDate;
  (window as any).formatTime24 = formatTime24;
}