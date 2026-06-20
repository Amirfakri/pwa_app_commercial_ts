"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rizService = exports.RizService = void 0;
const riz_repository_1 = require("../repositories/riz.repository");
class RizService {
    // دریافت خلاصه همه مشتریان
    async getCustomerSummaries() {
        return riz_repository_1.rizRepository.getCustomerSummaries();
    }
    // دریافت لیست کاربران برای جستجو
    async getAllUsers() {
        return riz_repository_1.rizRepository.getAllUsersForSearch();
    }
    // دریافت مانده حساب یک کاربر
    async getUserBalance(userCode) {
        const balance = await riz_repository_1.rizRepository.getUserBalance(userCode);
        const userInfo = await riz_repository_1.rizRepository.getUserInfo(userCode);
        if (!userInfo) {
            return null;
        }
        return {
            user: {
                code: userInfo.code,
                full_name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || userInfo.code,
                mobile_number: userInfo.mobile_number || ''
            },
            balance: {
                rial: balance?.rial || 0,
                gold: balance?.gold || 0,
                last_update: balance?.last_update || '',
                last_document: balance?.last_document || ''
            },
            total_transactions: await riz_repository_1.rizRepository.getTotalTransactionsCount(userCode)
        };
    }
    // دریافت تراکنش‌های یک کاربر (از آخر به اول)
    async getUserTransactions(userCode, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const transactions = await riz_repository_1.rizRepository.getUserTransactions(userCode, limit, offset);
        const total = await riz_repository_1.rizRepository.getTotalTransactionsCount(userCode);
        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: offset + limit < total
            }
        };
    }
    // تبدیل داده‌های JSON به فرمت دیتابیس
    transformRizData(record, index) {
        // پشتیبانی از کلیدهای مختلف
        const docNo = record.سند || record.document_no || record.documentNo;
        const invoiceNo = record.فاکتور || record.invoice_no || record.invoiceNo;
        const dateVal = record.تاريخ || record.date;
        const descVal = record.شرح || record.description;
        const weightVal = record.وزن || record.weight;
        const weightDebitVal = record['وزن بدهکار'] || record.weight_debit || record.weightDebit;
        const weightCreditVal = record['وزن بستانکار'] || record.weight_credit || record.weightCredit;
        const rateVal = record.عيار || record.rate;
        const wageVal = record.اجرت || record.wage;
        const balanceWeightVal = record['مانده وزن'] || record.balance_weight || record.balanceWeight;
        const debitAmountVal = record['بدهکار ريال'] || record.debit_amount || record.debitAmount;
        const creditAmountVal = record['بستانکار ريال'] || record.credit_amount || record.creditAmount;
        const balanceAmountVal = record['مانده ريال'] || record.balance_amount || record.balanceAmount;
        if (!docNo && docNo !== 0)
            return null;
        // تبدیل تاریخ
        let formattedDate = null;
        if (dateVal) {
            try {
                formattedDate = new Date(dateVal);
                if (isNaN(formattedDate.getTime())) {
                    formattedDate = null;
                }
            }
            catch {
                formattedDate = null;
            }
        }
        return {
            document_no: docNo ? docNo.toString().trim() : '0',
            invoice_no: invoiceNo ? invoiceNo.toString().trim() : null,
            date: formattedDate,
            description: descVal ? descVal.toString().trim() : null,
            weight: weightVal ? parseFloat(weightVal) : null,
            weight_debit: parseFloat(weightDebitVal) || 0,
            weight_credit: parseFloat(weightCreditVal) || 0,
            rate: rateVal ? parseInt(rateVal) : null,
            wage: parseFloat(wageVal) || 0,
            balance_weight: parseFloat(balanceWeightVal) || 0,
            debit_amount: parseInt(debitAmountVal) || 0,
            credit_amount: parseInt(creditAmountVal) || 0,
            balance_amount: parseInt(balanceAmountVal) || 0,
            sort_order: index, // استفاده از index به عنوان sort_order
            raw_json: record
        };
    }
    // آپلود ریزحساب
    async uploadRizData(rizData, userCode) {
        if (!rizData || rizData.length === 0) {
            throw new Error('داده‌های ریزحساب نامعتبر است');
        }
        // تبدیل داده‌ها به فرمت مناسب (با حفظ ترتیب ورودی)
        const records = rizData
            .map((record, index) => this.transformRizData(record, index))
            .filter(r => r !== null && r.document_no !== '0');
        if (records.length === 0) {
            throw new Error('هیچ رکورد معتبری برای ذخیره وجود ندارد');
        }
        const inserted = await riz_repository_1.rizRepository.uploadRizData(records, userCode);
        return { inserted, user_code: userCode };
    }
    // حذف یک رکورد
    async deleteRecord(id) {
        const record = await riz_repository_1.rizRepository.findRecordById(id);
        if (!record)
            return false;
        return riz_repository_1.rizRepository.deleteRecord(id);
    }
    // حذف همه تراکنش‌های یک کاربر
    async deleteAllUserRecords(userCode) {
        return riz_repository_1.rizRepository.deleteAllUserRecords(userCode);
    }
}
exports.RizService = RizService;
exports.rizService = new RizService();
