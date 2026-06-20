// backend/src/modules/notification/providers/sms.provider.ts
import axios from 'axios';

// تنظیمات MeliPayamak
const MELIPAYAMAK_API_KEY = process.env.MELIPAYAMAK_API_KEY || '';
const MELIPAYAMAK_USERNAME = process.env.MELI_SMS_USERNAME || '';
const MELIPAYAMAK_PASSWORD = process.env.MELI_SMS_PASSWORD || '';
const MELIPAYAMAK_FROM = process.env.MELIPAYAMAK_FROM || '50002710012799';

export interface ISmsResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}

export class SmsProviderService {
  private async callApi(endpoint: string, method: 'GET' | 'POST' = 'POST', data: any = null): Promise<ISmsResult> {
    const url = `${endpoint}`;
    
    // آدرس‌های API ملت پیامک
    const apiUrls = {
      send: `https://api.payamak-panel.com/post/send.asmx?op=SendSimpleSMS2`,
      credit: `https://api.payamak-panel.com/post/GetCredit.asmx?op=GetCredit`,
      base: 'https://api.payamak-panel.com'
    };
    
    if (!MELIPAYAMAK_USERNAME || !MELIPAYAMAK_PASSWORD) {
      return { success: false, error: 'تنظیمات MeliPayamak کامل نیست' };
    }

    try {
      let response;
      
      if (method === 'POST') {
        response = await axios({
          method: 'POST',
          url: endpoint,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          data: {
            username: MELIPAYAMAK_USERNAME,
            password: MELIPAYAMAK_PASSWORD,
            ...data
          },
          timeout: 30000,
        });
      } else {
        response = await axios({
          method: 'GET',
          url: endpoint,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          params: {
            username: MELIPAYAMAK_USERNAME,
            password: MELIPAYAMAK_PASSWORD,
            ...data
          },
          timeout: 30000,
        });
      }

      if (response.status >= 200 && response.status < 300) {
        return { success: true, data: response.data, statusCode: response.status };
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}`, statusCode: response.status };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async sendSimpleSms(receptor: string, message: string, from?: string): Promise<ISmsResult> {
    // استفاده از پیامک ساده
    return this.callApi('https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2', 'POST', {
      from: from || MELIPAYAMAK_FROM,
      to: receptor,
      text: message,
    });
  }

  async sendWithBodyId(receptor: string, bodyId: string, from?: string): Promise<ISmsResult> {
    // استفاده از بادی‌آیدی (template)
    return this.callApi('https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2', 'POST', {
      from: from || MELIPAYAMAK_FROM,
      to: receptor,
      text: bodyId,
      isBodyId: true,
    });
  }

  async sendBulkSms(receptors: string[], message: string, from?: string): Promise<ISmsResult> {
    // ارسال گروهی
    return this.callApi('https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2', 'POST', {
      from: from || MELIPAYAMAK_FROM,
      to: receptors.join(','),
      text: message,
    });
  }

  async sendBulkWithBodyId(receptors: string[], bodyId: string, from?: string): Promise<ISmsResult> {
    return this.callApi('https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2', 'POST', {
      from: from || MELIPAYAMAK_FROM,
      to: receptors.join(','),
      text: bodyId,
      isBodyId: true,
    });
  }

  async sendOtp(receptor: string): Promise<ISmsResult> {
    // ارسال OTP با متن پیش‌فرض
    // در سیستم واقعی، باید از یک الگو خاص استفاده کنید
    return this.callApi('https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2', 'POST', {
      from: MELIPAYAMAK_FROM,
      to: receptor,
      text: 'کد تایید شما: {code}',
      isOtp: true,
    });
  }

  async getAccountInfo(): Promise<ISmsResult> {
    return this.callApi('https://api.payamak-panel.com/post/GetCredit.asmx/GetCredit', 'GET');
  }
}

export const smsProviderService = new SmsProviderService();