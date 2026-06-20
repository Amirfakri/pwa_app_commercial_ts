"use strict";
// backend/src/modules/riz/utils/numberFormatter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRial = exports.toEnglishNumber = exports.toPersianNumber = exports.formatDecimal = exports.formatNumber = void 0;
// فرمت اعداد با کاما (برای نمایش)
const formatNumber = (num) => {
    if (num === null || num === undefined)
        return '۰';
    return num.toLocaleString('fa-IR');
};
exports.formatNumber = formatNumber;
// فرمت اعداد اعشاری (برای طلا)
const formatDecimal = (num, decimals = 3) => {
    if (num === null || num === undefined)
        return '۰';
    return num.toLocaleString('fa-IR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};
exports.formatDecimal = formatDecimal;
// تبدیل اعداد انگلیسی به فارسی
const toPersianNumber = (num) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, d => persianDigits[parseInt(d)]);
};
exports.toPersianNumber = toPersianNumber;
// تبدیل اعداد فارسی به انگلیسی
const toEnglishNumber = (str) => {
    const persianDigits = {
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    return str.replace(/[۰-۹]/g, d => persianDigits[d] || d);
};
exports.toEnglishNumber = toEnglishNumber;
// فرمت ریال (با تومان هم می‌توان استفاده کرد)
const formatRial = (amount) => {
    if (amount === 0)
        return '۰ ریال';
    const formatted = (0, exports.formatNumber)(amount);
    if (amount < 0)
        return `-${formatted.replace('-', '')} ریال`;
    return `${formatted} ریال`;
};
exports.formatRial = formatRial;
