"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.descriptionController = exports.DescriptionController = void 0;
const description_service_1 = require("../services/description.service");
class DescriptionController {
    async getAllDescriptions(req, res) {
        try {
            const { active_only = 'true' } = req.query;
            const onlyActive = active_only === 'true';
            console.log('📨 دریافت توضیحات صفحات...');
            const descriptions = await description_service_1.descriptionService.getAllDescriptions(onlyActive);
            console.log(`✅ ${descriptions.length} توضیح یافت شد`);
            res.json({
                success: true,
                data: descriptions,
                total: descriptions.length
            });
        }
        catch (err) {
            console.error('خطا در دریافت توضیحات:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async getDescriptionById(req, res) {
        try {
            const { id } = req.params;
            const description = await description_service_1.descriptionService.getDescriptionById(id);
            if (!description) {
                res.status(404).json({ success: false, error: 'توضیح مورد نظر یافت نشد' });
                return;
            }
            res.json({
                success: true,
                data: description
            });
        }
        catch (err) {
            console.error('خطا در دریافت توضیح:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async upsertDescription(req, res) {
        try {
            const data = req.body;
            if (!data.id || !data.title || !data.content) {
                res.status(400).json({ success: false, error: 'شناسه، عنوان و متن توضیح الزامی است' });
                return;
            }
            const description = await description_service_1.descriptionService.upsertDescription(data);
            // ارسال رویداد Socket.IO
            const io = req.app.get('io');
            if (io) {
                io.emit('description_updated', {
                    id: description.id,
                    title: description.title,
                    updated_at: description.updated_at
                });
            }
            res.status(201).json({
                success: true,
                message: 'توضیح با موفقیت ذخیره شد',
                data: description
            });
        }
        catch (err) {
            console.error('خطا در ذخیره توضیح:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async bulkUpsertDescriptions(req, res) {
        try {
            const { descriptions } = req.body;
            if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
                res.status(400).json({ success: false, error: 'لیست توضیحات نامعتبر است' });
                return;
            }
            const results = await description_service_1.descriptionService.bulkUpsertDescriptions(descriptions);
            // ارسال رویداد Socket.IO
            const io = req.app.get('io');
            if (io) {
                io.emit('descriptions_bulk_updated', {
                    count: results.length,
                    updated_at: new Date().toISOString()
                });
            }
            res.status(201).json({
                success: true,
                message: `${results.length} توضیح با موفقیت ذخیره شد`,
                data: results
            });
        }
        catch (err) {
            console.error('خطا در ذخیره دسته‌جمعی توضیحات:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async updateDescription(req, res) {
        try {
            const { id } = req.params;
            const { title, content, is_active, display_order } = req.body;
            console.log('📝 ویرایش توضیح:', { id, title, is_active, display_order });
            if (!title && !content && is_active === undefined && display_order === undefined) {
                res.status(400).json({ success: false, error: 'حداقل یک فیلد برای به‌روزرسانی الزامی است' });
                return;
            }
            const description = await description_service_1.descriptionService.updateDescription(id, {
                title,
                content,
                is_active,
                display_order
            });
            if (!description) {
                res.status(404).json({ success: false, error: 'توضیح مورد نظر یافت نشد' });
                return;
            }
            // ارسال رویداد Socket.IO
            const io = req.app.get('io');
            if (io) {
                io.emit('description_updated', {
                    id: description.id,
                    title: description.title,
                    updated_at: description.updated_at
                });
            }
            res.json({
                success: true,
                message: 'توضیح با موفقیت به‌روزرسانی شد',
                data: description
            });
        }
        catch (err) {
            console.error('خطا در به‌روزرسانی توضیح:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async deleteDescription(req, res) {
        try {
            const { id } = req.params;
            const deleted = await description_service_1.descriptionService.deleteDescription(id);
            if (!deleted) {
                res.status(404).json({ success: false, error: 'توضیح مورد نظر یافت نشد' });
                return;
            }
            // ارسال رویداد Socket.IO
            const io = req.app.get('io');
            if (io) {
                io.emit('description_deleted', { id });
            }
            res.json({
                success: true,
                message: 'توضیح با موفقیت حذف شد'
            });
        }
        catch (err) {
            console.error('خطا در حذف توضیح:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async getDefaultDescriptions(req, res) {
        try {
            const defaults = await description_service_1.descriptionService.getDefaultDescriptions();
            res.json({
                success: true,
                data: defaults
            });
        }
        catch (err) {
            console.error('خطا در دریافت توضیحات پیش‌فرض:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.DescriptionController = DescriptionController;
exports.descriptionController = new DescriptionController();
