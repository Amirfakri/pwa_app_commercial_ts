"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excelService = exports.ExcelService = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const postgres_1 = require("../../../core/database/postgres");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const dateFormatter_1 = require("../utils/dateFormatter");
class ExcelService {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async generateLiveExcel() {
        const today = (0, moment_timezone_1.default)().tz('Asia/Tehran').format('YYYY-MM-DD');
        const { rows: transactions } = await this.pool.query(`
      SELECT 
        t.id,
        t.user_id,
        t.product_code,
        t.display_name,
        t.type,
        t.coin_quantity,
        t.melted_weight,
        t.amount,
        t.transaction_price,
        t.base_price,
        t.applied_offset,
        t.status,
        t.created_at,
        u.first_name,
        u.last_name,
        u.mobile_number,
        u.code as user_code
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE DATE(t.created_at) = $1 
        AND t.status = 'approved'
      ORDER BY t.created_at DESC
    `, [today]);
        const workbook = new exceljs_1.default.Workbook();
        workbook.creator = 'PWA Gold System';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('معاملات امروز', {
            properties: { defaultRowHeight: 20, defaultColWidth: 15 },
            views: [{ rightToLeft: true, showGridLines: true }]
        });
        worksheet.columns = [
            { header: 'ردیف', key: 'row', width: 8 },
            { header: 'کد کاربر', key: 'user_code', width: 15 },
            { header: 'نام کاربر', key: 'user_name', width: 20 },
            { header: 'موبایل', key: 'mobile', width: 15 },
            { header: 'محصول', key: 'product', width: 20 },
            { header: 'نوع', key: 'type', width: 10 },
            { header: 'مقدار', key: 'quantity', width: 15 },
            { header: 'مبلغ (ریال)', key: 'amount', width: 20 },
            { header: 'قیمت واحد', key: 'unit_price', width: 20 },
            { header: 'افست', key: 'offset', width: 15 },
            { header: 'تاریخ', key: 'date', width: 20 },
            { header: 'ساعت', key: 'time', width: 15 }
        ];
        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: 'B Nazanin', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3C34' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        let totalAmount = 0;
        transactions.forEach((tx, index) => {
            const createdDate = (0, moment_timezone_1.default)(tx.created_at).tz('Asia/Tehran');
            const gy = createdDate.year();
            const gm = createdDate.month() + 1;
            const gd = createdDate.date();
            const hour = createdDate.format('HH');
            const minute = createdDate.format('mm');
            const second = createdDate.format('ss');
            const { jy, jm, jd } = (0, dateFormatter_1.toJalaali)(gy, gm, gd);
            const persianDate = `${jy}/${jm.toString().padStart(2, '0')}/${jd.toString().padStart(2, '0')}`;
            const persianTime = `${hour}:${minute}:${second}`;
            const quantity = tx.type === 'خرید' ?
                (tx.coin_quantity ? `${tx.coin_quantity} عدد` : (tx.melted_weight ? `${tx.melted_weight} گرم` : '-')) :
                (tx.coin_quantity ? `${tx.coin_quantity} عدد` : (tx.melted_weight ? `${tx.melted_weight} گرم` : '-'));
            const amount = parseInt(tx.amount) || 0;
            totalAmount += amount;
            const row = worksheet.addRow({
                row: index + 1,
                user_code: tx.user_code || '-',
                user_name: `${tx.first_name || ''} ${tx.last_name || ''}`.trim() || 'کاربر',
                mobile: tx.mobile_number || '-',
                product: tx.display_name || tx.product_code,
                type: tx.type === 'خرید' ? 'خرید' : 'فروش',
                quantity: quantity,
                amount: amount.toLocaleString(),
                unit_price: tx.transaction_price ? tx.transaction_price.toLocaleString() : '-',
                offset: tx.applied_offset ? tx.applied_offset.toLocaleString() : '0',
                date: persianDate,
                time: persianTime
            });
            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'B Nazanin', size: 11 };
                cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'right' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
            if (tx.type === 'خرید') {
                row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
            }
            else {
                row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
            }
        });
        const totalRow = worksheet.addRow({});
        totalRow.getCell(7).value = 'جمع کل:';
        totalRow.getCell(8).value = totalAmount.toLocaleString();
        totalRow.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
        totalRow.font = { bold: true, size: 12 };
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `transactions_${(0, dateFormatter_1.getJalaaliDateTimeForFile)()}.xlsx`;
        return { buffer, fileName };
    }
}
exports.ExcelService = ExcelService;
exports.excelService = new ExcelService();
