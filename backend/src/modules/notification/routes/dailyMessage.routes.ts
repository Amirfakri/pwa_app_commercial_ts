import { Router } from 'express';
import { dailyMessageController } from '../controllers/dailyMessage.controller';
import { authenticateSession, requireAdmin } from '../../auth/middlewares/auth.middleware';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'dailyMessage module is working!' });
});

// مسیرهای کاربر عادی (فقط پیام فعال)
router.get('/active', authenticateSession, dailyMessageController.getActiveMessage);

// مسیرهای ادمین
router.get('/', authenticateSession, requireAdmin, dailyMessageController.getAllMessages);
router.post('/', authenticateSession, requireAdmin, dailyMessageController.createMessage);
router.put('/:id', authenticateSession, requireAdmin, dailyMessageController.updateMessage);
router.delete('/:id', authenticateSession, requireAdmin, dailyMessageController.deleteMessage);

export default router;