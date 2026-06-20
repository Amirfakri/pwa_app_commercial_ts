"use strict";
// backend/src/modules/backup/utils/numberFormatter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPersianNumber = exports.formatDecimal = exports.formatNumber = void 0;
const formatNumber = (num) => {
    if (num === null || num === undefined)
        return '۰';
    return num.toLocaleString('fa-IR');
};
exports.formatNumber = formatNumber;
const formatDecimal = (num, decimals = 3) => {
    if (num === null || num === undefined)
        return '۰';
    return num.toLocaleString('fa-IR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};
exports.formatDecimal = formatDecimal;
const toPersianNumber = (num) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, d => persianDigits[parseInt(d)]);
};
exports.toPersianNumber = toPersianNumber;
