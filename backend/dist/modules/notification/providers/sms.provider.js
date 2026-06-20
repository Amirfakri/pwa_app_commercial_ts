"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsProviderService = exports.SmsProviderService = void 0;
// backend/src/modules/notification/providers/sms.provider.ts
const axios_1 = __importDefault(require("axios"));
// تنظیمات MeliPayamak
const MELIPAYAMAK_API_KEY = process.env.MELIPAYAMAK_API_KEY || '';
const MELIPAYAMAK_USERNAME = process.env.MELI_SMS_USERNAME || '';
const MELIPAYAMAK_PASSWORD = process.env.MELI_SMS_PASSWORD || '';
const MELIPAYAMAK_FROM = process.env.MELIPAYAMAK_FROM || '50002710012799';
class SmsProviderService {
    async callApi(endpoint, method = 'POST', data = null) {
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
                response = await (0, axios_1.default)({
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
            }
            else {
                response = await (0, axios_1.default)({
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
            }
            else {
                return { success: false, error: `HTTP ${response.status}: ${response.statusText}`, statusCode: response.status };
            }
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async sendSimpleSms(receptor, message, from) {
        // استفاده از پیامک ساده
        return this.callApi('https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2', 'POST', {
            from: from || MELIPAYAMAK_FROM,
            to: receptor,
            text: message,
        });
    }
    async sendWithBodyId(receptor, bodyId, from) {
        // استفاده از بادی‌آیدی (template)
        return this.callApi('https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2', 'POST', {
            from: from || MELIPAYAMAK_FROM,
            to: receptor,
            text: bodyId,
            isBodyId: true,
        });
    }
    async sendBulkSms(receptors, message, from) {
        // ارسال گروهی
        return this.callApi('https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2', 'POST', {
            from: from || MELIPAYAMAK_FROM,
            to: receptors.join(','),
            text: message,
        });
    }
    async sendBulkWithBodyId(receptors, bodyId, from) {
        return this.callApi('https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2', 'POST', {
            from: from || MELIPAYAMAK_FROM,
            to: receptors.join(','),
            text: bodyId,
            isBodyId: true,
        });
    }
    async sendOtp(receptor) {
        // ارسال OTP با متن پیش‌فرض
        // در سیستم واقعی، باید از یک الگو خاص استفاده کنید
        return this.callApi('https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2', 'POST', {
            from: MELIPAYAMAK_FROM,
            to: receptor,
            text: 'کد تایید شما: {code}',
            isOtp: true,
        });
    }
    async getAccountInfo() {
        return this.callApi('https://api.payamak-panel.com/post/GetCredit.asmx/GetCredit', 'GET');
    }
}
exports.SmsProviderService = SmsProviderService;
exports.smsProviderService = new SmsProviderService();
