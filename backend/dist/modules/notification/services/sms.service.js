"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsService = exports.SmsService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const sms_repository_1 = require("../repositories/sms.repository");
const sms_provider_1 = require("../providers/sms.provider");
class SmsService {
    async sendSms(data, adminId) {
        const { receptor, message, bodyId, from } = data;
        // اعتبارسنجی شماره موبایل
        const phoneRegex = /^09[0-9]{9}$/;
        if (!phoneRegex.test(receptor)) {
            throw new Error('شماره موبایل نامعتبر است');
        }
        if (!message && !bodyId) {
            throw new Error('متن پیامک یا bodyId الزامی است');
        }
        if (message && message.length > 500) {
            throw new Error('متن پیامک نباید بیشتر از ۵۰۰ کاراکتر باشد');
        }
        // ارسال پیامک
        let smsResult;
        if (bodyId) {
            smsResult = await sms_provider_1.smsProviderService.sendWithBodyId(receptor, bodyId, from);
        }
        else {
            smsResult = await sms_provider_1.smsProviderService.sendSimpleSms(receptor, message, from);
        }
        const smsId = crypto_1.default.randomBytes(8).toString('hex');
        const status = smsResult.success ? 'sent' : 'failed';
        // ذخیره لاگ
        await sms_repository_1.smsRepository.logSms({
            adminId,
            receptor,
            message: message || `باد: ${bodyId}`,
            status,
            smsId: smsResult.data?.recId || smsResult.data?.RetValue || null,
            provider: 'MeliPayamak',
            error: smsResult.success ? null : smsResult.error,
        });
        if (!smsResult.success) {
            throw new Error(smsResult.error || 'خطا در ارسال پیامک');
        }
        return {
            success: true,
            message: 'پیامک با موفقیت ارسال شد',
            smsId,
        };
    }
    async sendBulkSms(data, adminId) {
        const { receptors, message, bodyId, from } = data;
        if (!receptors || receptors.length === 0) {
            throw new Error('لیست گیرندگان الزامی است');
        }
        if (receptors.length > 50) {
            throw new Error('حداکثر 50 شماره مجاز است');
        }
        const phoneRegex = /^09[0-9]{9}$/;
        const invalidNumbers = receptors.filter(r => !phoneRegex.test(r));
        if (invalidNumbers.length > 0) {
            throw new Error(`${invalidNumbers.length} شماره نامعتبر`);
        }
        if (!message && !bodyId) {
            throw new Error('متن پیامک یا bodyId الزامی است');
        }
        // ارسال گروهی
        let smsResult;
        if (bodyId) {
            smsResult = await sms_provider_1.smsProviderService.sendBulkWithBodyId(receptors, bodyId, from);
        }
        else {
            smsResult = await sms_provider_1.smsProviderService.sendBulkSms(receptors, message, from);
        }
        const batchId = crypto_1.default.randomBytes(8).toString('hex');
        const successCount = smsResult.success ? receptors.length : 0;
        const failCount = smsResult.success ? 0 : receptors.length;
        // ذخیره لاگ هر پیامک
        for (let i = 0; i < receptors.length; i++) {
            await sms_repository_1.smsRepository.logSms({
                adminId,
                receptor: receptors[i],
                message: message || `باد: ${bodyId}`,
                status: smsResult.success ? 'sent' : 'failed',
                smsId: smsResult.data?.recIds?.[i] || null,
                provider: 'MeliPayamak',
                batchId,
                error: smsResult.success ? null : smsResult.error,
            });
        }
        // ذخیره لاگ دسته
        await sms_repository_1.smsRepository.logBatch(batchId, adminId, receptors.length, successCount, failCount, message || `باد: ${bodyId}`);
        if (!smsResult.success) {
            throw new Error(smsResult.error || 'خطا در ارسال گروهی');
        }
        return {
            success: true,
            message: `ارسال گروهی تکمیل شد. موفق: ${successCount}، ناموفق: ${failCount}`,
            batchId,
            total: receptors.length,
            successCount,
            failCount,
        };
    }
    async getSmsLogs(filters) {
        return sms_repository_1.smsRepository.getLogs(filters);
    }
    async searchCustomers(query, limit) {
        if (!query || query.length < 2) {
            return [];
        }
        return sms_repository_1.smsRepository.searchCustomers(query, limit);
    }
    async getCustomerBalance(userId) {
        return sms_repository_1.smsRepository.getCustomerBalance(userId);
    }
}
exports.SmsService = SmsService;
exports.smsService = new SmsService();
