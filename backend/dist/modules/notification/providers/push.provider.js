"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushProviderService = exports.PushProviderService = void 0;
class PushProviderService {
    async sendToUser(userId, title, body, data) {
        // در حال حاضر غیرفعال است
        console.log(`📱 Push notification would be sent to user ${userId}: ${title} - ${body}`);
        return [{ success: true, data: { message: 'Push disabled' } }];
    }
    async sendToAll(title, body, data) {
        console.log(`📱 Push notification would be sent to all: ${title} - ${body}`);
        return [{ success: true, data: { message: 'Push disabled' } }];
    }
}
exports.PushProviderService = PushProviderService;
exports.pushProviderService = new PushProviderService();
