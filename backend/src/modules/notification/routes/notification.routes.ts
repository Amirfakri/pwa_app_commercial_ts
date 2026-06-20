// backend/src/modules/notification/routes/notification.routes.ts

import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticateSession, requireAdmin } from '../../auth/middlewares/auth.middleware';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'notification module is working!' });
});

// مسیرهای کاربر عادی
router.get('/active', authenticateSession, notificationController.getActiveNotifications);
router.get('/my', authenticateSession, notificationController.getUserNotifications);
router.get('/unread-count', authenticateSession, notificationController.getUnreadCount);
router.put('/:id/read', authenticateSession, notificationController.markAsRead);
router.put('/read-all', authenticateSession, notificationController.markAllAsRead);

// مسیرهای ادمین
router.get('/', authenticateSession, requireAdmin, notificationController.getAllNotifications);
router.get('/:id', authenticateSession, requireAdmin, notificationController.getNotificationById);
router.post('/', authenticateSession, requireAdmin, notificationController.createNotification);
router.put('/:id', authenticateSession, requireAdmin, notificationController.updateNotification);
router.delete('/:id', authenticateSession, requireAdmin, notificationController.deleteNotification);

export default router;