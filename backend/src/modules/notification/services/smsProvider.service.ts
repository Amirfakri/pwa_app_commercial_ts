import axios from 'axios';

// تنظیمات MeliPayamak
const MELIPAYAMAK_API_KEY = process.env.MELIPAYAMAK_API_KEY || '';
const MELIPAYAMAK_USERNAME = process.env.MELI_SMS_USERNAME || '';
const MELIPAYAMAK_FROM = process.env.MELIPAYAMAK_FROM || '50002710012799';

export interface ISmsResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}

export class SmsProviderService {
  private async callApi(endpoint: string, method: 'GET' | 'POST' = 'POST', data: any = null): Promise<ISmsResult> {
    if (!MELIPAYAMAK_API_KEY || !MELIPAYAMAK_USERNAME) {
      return { success: false, error: 'تنظیمات MeliPayamak کامل نیست' };
    }

    const url = `https://api.payamak-panel.com${endpoint}`;

    try {
      const response = await axios({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${MELIPAYAMAK_USERNAME}:${MELIPAYAMAK_API_KEY}`).toString('base64')}`,
        },
        data,
        timeout: 30000,
      });

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
    return this.callApi(`/api/send/simple/${MELIPAYAMAK_API_KEY}`, 'POST', {
      from: from || MELIPAYAMAK_FROM,
      to: receptor,
      text: message,
    });
  }

  async sendWithBodyId(receptor: string, bodyId: string, from?: string): Promise<ISmsResult> {
    return this.callApi(`/api/send/simple/${MELIPAYAMAK_API_KEY}`, 'POST', {
      from: from || MELIPAYAMAK_FROM,
      to: receptor,
      bodyId: bodyId,
    });
  }

  async sendBulkSms(receptors: string[], message: string, from?: string): Promise<ISmsResult> {
    return this.callApi(`/api/send/multiple/${MELIPAYAMAK_API_KEY}`, 'POST', {
      from: from || MELIPAYAMAK_FROM,
      to: receptors,
      text: message,
    });
  }

  async sendBulkWithBodyId(receptors: string[], bodyId: string, from?: string): Promise<ISmsResult> {
    return this.callApi(`/api/send/multiple/${MELIPAYAMAK_API_KEY}`, 'POST', {
      from: from || MELIPAYAMAK_FROM,
      to: receptors,
      bodyId: bodyId,
    });
  }

  async sendOtp(receptor: string): Promise<ISmsResult> {
    return this.callApi(`/api/send/otp/${MELIPAYAMAK_API_KEY}`, 'POST', {
      to: receptor,
    });
  }

  async getAccountInfo(): Promise<ISmsResult> {
    return this.callApi(`/api/receive/credit/${MELIPAYAMAK_API_KEY}`, 'GET');
  }
}

export const smsProviderService = new SmsProviderService();