"use strict";
// backend/src/modules/riz/utils/dateFormatter.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIranTimeString = exports.formatPersianDate = exports.getJalaaliDateTimeForFile = exports.toJalaali = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
// تبدیل تاریخ میلادی به شمسی (برای نام فایل - اعداد انگلیسی)
const toJalaali = (gy, gm, gd) => {
    const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    let gy2 = gm > 2 ? gy + 1 : gy;
    let gDayOfYear = 0;
    for (let i = 0; i < gm - 1; i++) {
        if (i === 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) {
            gDayOfYear += 29;
        }
        else {
            gDayOfYear += gDaysInMonth[i];
        }
    }
    gDayOfYear += gd;
    let jDayOfYear = gDayOfYear - 79;
    let jy = gy2 - 621;
    let jm = 1;
    let jd = 1;
    if (jDayOfYear <= 0) {
        jy -= 1;
        let isLeap = (jy % 4 === 0 && jy % 100 !== 0) || jy % 400 === 0;
        jDayOfYear += isLeap ? 366 : 365;
    }
    let jDaysInMonthLocal = [...jDaysInMonth];
    let isJLeap = (jy % 4 === 0 && jy % 100 !== 0) || jy % 400 === 0;
    if (isJLeap)
        jDaysInMonthLocal[11] = 30;
    for (let i = 0; i < jDaysInMonthLocal.length; i++) {
        if (jDayOfYear > jDaysInMonthLocal[i]) {
            jDayOfYear -= jDaysInMonthLocal[i];
            jm++;
        }
        else {
            jd = jDayOfYear;
            break;
        }
    }
    return { jy, jm, jd };
};
exports.toJalaali = toJalaali;
// دریافت تاریخ شمسی با اعداد انگلیسی (برای نام فایل)
const getJalaaliDateTimeForFile = () => {
    const now = (0, moment_timezone_1.default)().tz('Asia/Tehran');
    const gy = now.year();
    const gm = now.month() + 1;
    const gd = now.date();
    const hour = now.format('HH');
    const minute = now.format('mm');
    const { jy, jm, jd } = (0, exports.toJalaali)(gy, gm, gd);
    return `${jy}_${jm.toString().padStart(2, '0')}_${jd.toString().padStart(2, '0')}_${hour}-${minute}`;
};
exports.getJalaaliDateTimeForFile = getJalaaliDateTimeForFile;
// فرمت تاریخ شمسی برای نمایش (با اعداد فارسی)
const formatPersianDate = (date) => {
    if (!date)
        return 'نامشخص';
    const m = (0, moment_timezone_1.default)(date).tz('Asia/Tehran');
    const gy = m.year();
    const gm = m.month() + 1;
    const gd = m.date();
    const hour = m.format('HH');
    const minute = m.format('mm');
    const second = m.format('ss');
    const { jy, jm, jd } = (0, exports.toJalaali)(gy, gm, gd);
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const toPersian = (num) => {
        return num.toString().replace(/\d/g, d => persianDigits[parseInt(d)]);
    };
    return `${toPersian(jy)}/${toPersian(jm)}/${toPersian(jd)} - ${toPersian(parseInt(hour))}:${toPersian(parseInt(minute))}:${toPersian(parseInt(second))}`;
};
exports.formatPersianDate = formatPersianDate;
// فرمت تاریخ برای ذخیره در دیتابیس
const getIranTimeString = () => {
    return (0, moment_timezone_1.default)().tz('Asia/Tehran').format('YYYY-MM-DD HH:mm:ss');
};
exports.getIranTimeString = getIranTimeString;
