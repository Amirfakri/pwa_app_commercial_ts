"use strict";
// backend/src/modules/riz/services/balance.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceService = exports.BalanceService = void 0;
const riz_repository_1 = require("../repositories/riz.repository");
class BalanceService {
    async getCurrentUserBalance(userCode) {
        return riz_repository_1.rizRepository.getUserBalance(userCode);
    }
    async checkBalanceStatus(balance) {
        if (balance > 0)
            return 'positive';
        if (balance < 0)
            return 'negative';
        return 'zero';
    }
    formatBalanceMessage(balance) {
        const rialStatus = this.checkBalanceStatus(balance.rial_balance);
        const goldStatus = this.checkBalanceStatus(balance.gold_balance);
        let message = `💰 مانده حساب ${balance.user_name}:\n`;
        message += `ریال: ${balance.rial_balance.toLocaleString('fa-IR')} `;
        switch (rialStatus) {
            case 'positive':
                message += `(بستانکار ✅)\n`;
                break;
            case 'negative':
                message += `(بدهکار ❌)\n`;
                break;
            default:
                message += `(صفر 🟡)\n`;
        }
        message += `طلای آبشده: ${balance.gold_balance.toLocaleString('fa-IR')} گرم `;
        switch (goldStatus) {
            case 'positive':
                message += `(بستانکار ✅)`;
                break;
            case 'negative':
                message += `(بدهکار ❌)`;
                break;
            default:
                message += `(صفر 🟡)`;
        }
        return message;
    }
}
exports.BalanceService = BalanceService;
exports.balanceService = new BalanceService();
