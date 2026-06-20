"use strict";
// backend/src/modules/notification/routes/notification.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'notification module is working!' });
});
// مسیرهای کاربر عادی
router.get('/active', auth_middleware_1.authenticateSession, notification_controller_1.notificationController.getActiveNotifications);
router.get('/my', auth_middleware_1.authenticateSession, notification_controller_1.notificationController.getUserNotifications);
router.get('/unread-count', auth_middleware_1.authenticateSession, notification_controller_1.notificationController.getUnreadCount);
router.put('/:id/read', auth_middleware_1.authenticateSession, notification_controller_1.notificationController.markAsRead);
router.put('/read-all', auth_middleware_1.authenticateSession, notification_controller_1.notificationController.markAllAsRead);
// مسیرهای ادمین
router.get('/', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, notification_controller_1.notificationController.getAllNotifications);
router.get('/:id', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, notification_controller_1.notificationController.getNotificationById);
router.post('/', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, notification_controller_1.notificationController.createNotification);
router.put('/:id', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, notification_controller_1.notificationController.updateNotification);
router.delete('/:id', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, notification_controller_1.notificationController.deleteNotification);
exports.default = router;
