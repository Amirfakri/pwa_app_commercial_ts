"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dailyMessage_controller_1 = require("../controllers/dailyMessage.controller");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'dailyMessage module is working!' });
});
// مسیرهای کاربر عادی (فقط پیام فعال)
router.get('/active', auth_middleware_1.authenticateSession, dailyMessage_controller_1.dailyMessageController.getActiveMessage);
// مسیرهای ادمین
router.get('/', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, dailyMessage_controller_1.dailyMessageController.getAllMessages);
router.post('/', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, dailyMessage_controller_1.dailyMessageController.createMessage);
router.put('/:id', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, dailyMessage_controller_1.dailyMessageController.updateMessage);
router.delete('/:id', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, dailyMessage_controller_1.dailyMessageController.deleteMessage);
exports.default = router;
