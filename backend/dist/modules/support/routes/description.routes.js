"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const description_controller_1 = require("../controllers/description.controller");
const router = (0, express_1.Router)();
// Route تست (بدون احراز هویت برای تست)
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'description module is working!' });
});
// همه کاربران احراز هویت شده می‌توانند توضیحات را ببینند
router.get('/', auth_middleware_1.authenticateSession, description_controller_1.descriptionController.getAllDescriptions);
router.get('/:id', auth_middleware_1.authenticateSession, description_controller_1.descriptionController.getDescriptionById);
// فقط ادمین می‌تواند ویرایش کند
router.put('/:id', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, description_controller_1.descriptionController.updateDescription);
router.post('/', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, description_controller_1.descriptionController.upsertDescription);
router.delete('/:id', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, description_controller_1.descriptionController.deleteDescription);
exports.default = router;
