import crypto from 'crypto';
import { smsRepository } from '../repositories/sms.repository';
import { smsProviderService } from '../providers/sms.provider';

export class SmsService {
  async sendSms(data: { receptor: string; message?: string; bodyId?: string; from?: string }, adminId: number): Promise<any> {
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
      smsResult = await smsProviderService.sendWithBodyId(receptor, bodyId, from);
    } else {
      smsResult = await smsProviderService.sendSimpleSms(receptor, message!, from);
    }

    const smsId = crypto.randomBytes(8).toString('hex');
    const status = smsResult.success ? 'sent' : 'failed';

    // ذخیره لاگ
    await smsRepository.logSms({
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

  async sendBulkSms(data: { receptors: string[]; message?: string; bodyId?: string; from?: string }, adminId: number): Promise<any> {
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
      smsResult = await smsProviderService.sendBulkWithBodyId(receptors, bodyId, from);
    } else {
      smsResult = await smsProviderService.sendBulkSms(receptors, message!, from);
    }

    const batchId = crypto.randomBytes(8).toString('hex');
    const successCount = smsResult.success ? receptors.length : 0;
    const failCount = smsResult.success ? 0 : receptors.length;

    // ذخیره لاگ هر پیامک
    for (let i = 0; i < receptors.length; i++) {
      await smsRepository.logSms({
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
    await smsRepository.logBatch(batchId, adminId, receptors.length, successCount, failCount, message || `باد: ${bodyId}`);

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

  async getSmsLogs(filters: { page?: number; limit?: number; status?: string }) {
    return smsRepository.getLogs(filters);
  }

  async searchCustomers(query: string, limit?: number) {
    if (!query || query.length < 2) {
      return [];
    }
    return smsRepository.searchCustomers(query, limit);
  }

  async getCustomerBalance(userId: number) {
    return smsRepository.getCustomerBalance(userId);
  }
}

export const smsService = new SmsService();