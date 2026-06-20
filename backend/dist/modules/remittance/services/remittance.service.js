"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remittanceService = exports.RemittanceService = void 0;
// backend/src/modules/remittance/services/remittance.service.ts
const remittance_repository_1 = require("../repositories/remittance.repository");
class RemittanceService {
    async createRemittance(userId, input, req) {
        // اعتبارسنجی بر اساس نوع
        if (input.type === 'وزنی') {
            if (!input.weight || input.weight <= 0) {
                throw new Error('وزن باید یک عدد مثبت باشد');
            }
            const weightStr = input.weight.toString();
            const decimalParts = weightStr.split('.');
            if (decimalParts.length === 2 && decimalParts[1].length > 3) {
                throw new Error('وزن فقط می‌تواند حداکثر 3 رقم اعشار داشته باشد');
            }
            if (input.weight > 999.999) {
                throw new Error('وزن نمی‌تواند بیشتر از 999.999 گرم باشد');
            }
            input.weight = Math.round(input.weight * 1000) / 1000;
        }
        if (input.type === 'ریالی' && (!input.amount || input.amount <= 0)) {
            throw new Error('مبلغ باید یک عدد مثبت باشد');
        }
        if (input.type === 'سکه' && (!input.coin_count || input.coin_count <= 0)) {
            throw new Error('تعداد سکه باید یک عدد صحیح مثبت باشد');
        }
        if (!input.recipient || !input.recipient.trim()) {
            throw new Error('نام گیرنده الزامی است');
        }
        const persianRegex = /^[\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u200C\u200E\u200F\s\.]+$/;
        if (!persianRegex.test(input.recipient.trim())) {
            throw new Error('نام گیرنده باید فقط با حروف فارسی وارد شود');
        }
        const remittance = await remittance_repository_1.remittanceRepository.create({
            user_id: userId,
            type: input.type,
            weight: input.weight,
            amount: input.amount,
            coin_count: input.coin_count,
            recipient: input.recipient.trim(),
            description: input.description?.trim(),
        });
        // دریافت اطلاعات کاربر
        const userInfo = await this.getUserInfo(userId);
        // فقط یک بار رویداد ارسال شود
        const io = req?.app?.get('io');
        if (io) {
            const eventData = {
                id: remittance.id,
                user_id: remittance.user_id,
                user_name: userInfo?.full_name || userInfo?.first_name || 'کاربر',
                user_code: userInfo?.code,
                user_mobile: userInfo?.mobile_number,
                type: remittance.type,
                weight: remittance.weight ? Number(remittance.weight) : null,
                amount: remittance.amount ? Number(remittance.amount) : null,
                coin_count: remittance.coin_count ? Number(remittance.coin_count) : null,
                recipient: remittance.recipient,
                description: remittance.description,
                status: remittance.status,
                created_at: remittance.created_at,
                updated_at: remittance.updated_at
            };
            console.log('📤 Emitting new_remittance from service:', eventData);
            io.to('admin_room').emit('new_remittance', eventData);
        }
        return {
            id: remittance.id,
            user_id: remittance.user_id,
            type: remittance.type,
            weight: remittance.weight ? Number(remittance.weight) : null,
            amount: remittance.amount ? Number(remittance.amount) : null,
            coin_count: remittance.coin_count ? Number(remittance.coin_count) : null,
            recipient: remittance.recipient,
            description: remittance.description,
            status: remittance.status,
            created_at: remittance.created_at,
            updated_at: remittance.updated_at
        };
    }
    async updateRemittanceStatus(id, status, req) {
        const validStatuses = ['در حال بررسی', 'تأییدشده', 'ردشده', 'تحویل شده'];
        if (!validStatuses.includes(status)) {
            throw new Error('وضعیت نامعتبر است');
        }
        const remittance = await remittance_repository_1.remittanceRepository.updateStatus(id, status);
        if (!remittance) {
            return null;
        }
        // فقط یک بار رویداد ارسال شود
        const io = req?.app?.get('io');
        if (io) {
            const eventData = {
                id: remittance.id,
                user_id: remittance.user_id,
                status: remittance.status,
                updated_at: remittance.updated_at
            };
            console.log('📤 Emitting remittance_status_update from service:', eventData);
            // ارسال به ادمین و کاربر
            io.to('admin_room').emit('remittance_status_update', eventData);
            io.to(`user_${remittance.user_id}`).emit('remittance_status_update', eventData);
        }
        return {
            id: remittance.id,
            user_id: remittance.user_id,
            status: remittance.status,
            updated_at: remittance.updated_at
        };
    }
    // بقیه متدها...
    async getUserInfo(userId) {
        const userInfo = await remittance_repository_1.remittanceRepository.getUserInfo(userId);
        if (userInfo) {
            return {
                ...userInfo,
                full_name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || userInfo.code
            };
        }
        return null;
    }
    async deleteRemittance(id) {
        return remittance_repository_1.remittanceRepository.delete(id);
    }
    async getUserRemittances(userId, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const remittances = await remittance_repository_1.remittanceRepository.findByUserId(userId, limit, offset);
        const total = await remittance_repository_1.remittanceRepository.countByUserId(userId);
        return {
            remittances: remittances.map(r => ({
                id: r.id,
                type: r.type,
                weight: r.weight ? Number(r.weight) : null,
                amount: r.amount ? Number(r.amount) : null,
                coin_count: r.coin_count ? Number(r.coin_count) : null,
                recipient: r.recipient,
                description: r.description,
                status: r.status,
                created_at: r.created_at,
                updated_at: r.updated_at
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    async getAllRemittances(filters) {
        const result = await remittance_repository_1.remittanceRepository.findAll(filters);
        const formattedRemittances = result.remittances.map((r) => ({
            id: r.id,
            user_id: r.user_id,
            user_name: r.first_name && r.last_name ? `${r.first_name} ${r.last_name}`.trim() : (r.first_name || r.last_name || 'کاربر'),
            user_code: r.code,
            user_mobile: r.mobile_number,
            type: r.type,
            weight: r.weight ? Number(r.weight) : null,
            amount: r.amount ? Number(r.amount) : null,
            coin_count: r.coin_count ? Number(r.coin_count) : null,
            recipient: r.recipient,
            description: r.description,
            status: r.status,
            created_at: r.created_at,
            updated_at: r.updated_at
        }));
        return {
            remittances: formattedRemittances,
            total: result.total,
            stats: result.stats,
            pagination: {
                page: filters.page || 1,
                limit: filters.limit || 50,
                total: result.total,
                pages: Math.ceil(result.total / (filters.limit || 50))
            }
        };
    }
    async getRemittanceStats() {
        const stats = await remittance_repository_1.remittanceRepository.getStats();
        return stats;
    }
    async getRecentPendingRemittances(limit = 50) {
        const pending = await remittance_repository_1.remittanceRepository.getRecentPending(limit);
        return pending.map((r) => ({
            id: r.id,
            user_id: r.user_id,
            user_name: r.first_name && r.last_name ? `${r.first_name} ${r.last_name}`.trim() : (r.first_name || r.last_name || 'کاربر'),
            user_code: r.code,
            type: r.type,
            weight: r.weight ? Number(r.weight) : null,
            amount: r.amount ? Number(r.amount) : null,
            coin_count: r.coin_count ? Number(r.coin_count) : null,
            recipient: r.recipient,
            status: r.status,
            created_at: r.created_at
        }));
    }
    async getTodayRemittances(status, page = 1, limit = 50) {
        const result = await remittance_repository_1.remittanceRepository.getTodayRemittances(status, page, limit);
        const formattedRemittances = result.remittances.map((r) => ({
            id: r.id,
            user_id: r.user_id,
            user_name: r.first_name && r.last_name ? `${r.first_name} ${r.last_name}`.trim() : (r.first_name || r.last_name || 'کاربر'),
            user_code: r.code,
            type: r.type,
            weight: r.weight ? Number(r.weight) : null,
            amount: r.amount ? Number(r.amount) : null,
            coin_count: r.coin_count ? Number(r.coin_count) : null,
            recipient: r.recipient,
            description: r.description,
            status: r.status,
            created_at: r.created_at
        }));
        return {
            remittances: formattedRemittances,
            total: result.total,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            }
        };
    }
}
exports.RemittanceService = RemittanceService;
exports.remittanceService = new RemittanceService();
