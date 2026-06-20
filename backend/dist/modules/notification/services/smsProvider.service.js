"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsProviderService = exports.SmsProviderService = void 0;
const axios_1 = __importDefault(require("axios"));
// تنظیمات MeliPayamak
const MELIPAYAMAK_API_KEY = process.env.MELIPAYAMAK_API_KEY || '';
const MELIPAYAMAK_USERNAME = process.env.MELI_SMS_USERNAME || '';
const MELIPAYAMAK_FROM = process.env.MELIPAYAMAK_FROM || '50002710012799';
class SmsProviderService {
    async callApi(endpoint, method = 'POST', data = null) {
        if (!MELIPAYAMAK_API_KEY || !MELIPAYAMAK_USERNAME) {
            return { success: false, error: 'تنظیمات MeliPayamak کامل نیست' };
        }
        const url = `https://api.payamak-panel.com${endpoint}`;
        try {
            const response = await (0, axios_1.default)({
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
        return this.callApi(`/api/send/simple/${MELIPAYAMAK_API_KEY}`, 'POST', {
            from: from || MELIPAYAMAK_FROM,
            to: receptor,
            text: message,
        });
    }
    async sendWithBodyId(receptor, bodyId, from) {
        return this.callApi(`/api/send/simple/${MELIPAYAMAK_API_KEY}`, 'POST', {
            from: from || MELIPAYAMAK_FROM,
            to: receptor,
            bodyId: bodyId,
        });
    }
    async sendBulkSms(receptors, message, from) {
        return this.callApi(`/api/send/multiple/${MELIPAYAMAK_API_KEY}`, 'POST', {
            from: from || MELIPAYAMAK_FROM,
            to: receptors,
            text: message,
        });
    }
    async sendBulkWithBodyId(receptors, bodyId, from) {
        return this.callApi(`/api/send/multiple/${MELIPAYAMAK_API_KEY}`, 'POST', {
            from: from || MELIPAYAMAK_FROM,
            to: receptors,
            bodyId: bodyId,
        });
    }
    async sendOtp(receptor) {
        return this.callApi(`/api/send/otp/${MELIPAYAMAK_API_KEY}`, 'POST', {
            to: receptor,
        });
    }
    async getAccountInfo() {
        return this.callApi(`/api/receive/credit/${MELIPAYAMAK_API_KEY}`, 'GET');
    }
}
exports.SmsProviderService = SmsProviderService;
exports.smsProviderService = new SmsProviderService();
