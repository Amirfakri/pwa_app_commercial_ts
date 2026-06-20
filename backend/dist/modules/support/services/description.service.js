"use strict";
// backend/src/modules/support/services/description.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.descriptionService = exports.DescriptionService = void 0;
const description_repository_1 = require("../repositories/description.repository");
class DescriptionService {
    async getAllDescriptions(onlyActive = true) {
        return description_repository_1.descriptionRepository.findAll(onlyActive);
    }
    async getDescriptionById(id) {
        if (!id)
            return null;
        return description_repository_1.descriptionRepository.findById(id);
    }
    async upsertDescription(data) {
        if (!data.id || !data.title || !data.content) {
            throw new Error('شناسه، عنوان و متن توضیح الزامی است');
        }
        return description_repository_1.descriptionRepository.upsert(data);
    }
    async bulkUpsertDescriptions(descriptions) {
        if (!descriptions || descriptions.length === 0) {
            throw new Error('لیست توضیحات نمی‌تواند خالی باشد');
        }
        return description_repository_1.descriptionRepository.bulkUpsert(descriptions);
    }
    async updateDescription(id, data) {
        if (!id) {
            throw new Error('شناسه صفحه الزامی است');
        }
        return description_repository_1.descriptionRepository.update(id, data);
    }
    async deleteDescription(id) {
        if (!id)
            return false;
        return description_repository_1.descriptionRepository.delete(id);
    }
    async getDefaultDescriptions() {
        const descriptions = await description_repository_1.descriptionRepository.findAll(true);
        const result = {};
        for (const desc of descriptions) {
            result[desc.id] = desc;
        }
        return result;
    }
    async initializeDefaultDescriptions() {
        // ایجاد ۱۰ باکس خالی (بدون عنوان و متن پیش‌فرض)
        const defaultDescriptions = [];
        for (let i = 1; i <= 10; i++) {
            const boxId = `box_${i}`;
            defaultDescriptions.push({
                id: boxId,
                title: '', // عنوان خالی
                content: '', // متن خالی
                is_active: true,
                display_order: i
            });
        }
        for (const desc of defaultDescriptions) {
            const existing = await description_repository_1.descriptionRepository.findById(desc.id);
            if (!existing) {
                await description_repository_1.descriptionRepository.upsert(desc);
            }
        }
    }
}
exports.DescriptionService = DescriptionService;
exports.descriptionService = new DescriptionService();
