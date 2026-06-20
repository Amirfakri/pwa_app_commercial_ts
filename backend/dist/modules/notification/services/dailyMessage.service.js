"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyMessageService = exports.DailyMessageService = void 0;
const dailyMessage_repository_1 = require("../repositories/dailyMessage.repository");
class DailyMessageService {
    async getActiveMessage() {
        return dailyMessage_repository_1.dailyMessageRepository.findActive();
    }
    async getAllMessages(filters) {
        return dailyMessage_repository_1.dailyMessageRepository.findAll(filters);
    }
    async getMessageById(id) {
        return dailyMessage_repository_1.dailyMessageRepository.findById(id);
    }
    async createMessage(data, adminId) {
        if (!data.message_text || !data.message_text.trim()) {
            throw new Error('متن پیام الزامی است');
        }
        return dailyMessage_repository_1.dailyMessageRepository.create(data, adminId);
    }
    async updateMessage(id, data) {
        return dailyMessage_repository_1.dailyMessageRepository.update(id, data);
    }
    async deleteMessage(id) {
        return dailyMessage_repository_1.dailyMessageRepository.delete(id);
    }
}
exports.DailyMessageService = DailyMessageService;
exports.dailyMessageService = new DailyMessageService();
