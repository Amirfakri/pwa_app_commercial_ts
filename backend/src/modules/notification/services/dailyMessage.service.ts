import { dailyMessageRepository } from '../repositories/dailyMessage.repository';

export class DailyMessageService {
  async getActiveMessage() {
    return dailyMessageRepository.findActive();
  }

  async getAllMessages(filters: { is_active?: boolean; page?: number; limit?: number }) {
    return dailyMessageRepository.findAll(filters);
  }

  async getMessageById(id: number) {
    return dailyMessageRepository.findById(id);
  }

  async createMessage(data: { message_text: string; is_active?: boolean; start_date?: Date; end_date?: Date }, adminId: number) {
    if (!data.message_text || !data.message_text.trim()) {
      throw new Error('متن پیام الزامی است');
    }
    return dailyMessageRepository.create(data, adminId);
  }

  async updateMessage(id: number, data: Partial<{ message_text: string; is_active: boolean; start_date: Date; end_date: Date }>) {
    return dailyMessageRepository.update(id, data);
  }

  async deleteMessage(id: number) {
    return dailyMessageRepository.delete(id);
  }
}

export const dailyMessageService = new DailyMessageService();