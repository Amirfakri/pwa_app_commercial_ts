import { Router } from 'express';
import { authenticateSession, requireAdmin } from '../../auth/middlewares/auth.middleware';
import { descriptionController } from '../controllers/description.controller';

const router = Router();

// Route تست (بدون احراز هویت برای تست)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'description module is working!' });
});

// همه کاربران احراز هویت شده می‌توانند توضیحات را ببینند
router.get('/', authenticateSession, descriptionController.getAllDescriptions);
router.get('/:id', authenticateSession, descriptionController.getDescriptionById);

// فقط ادمین می‌تواند ویرایش کند
router.put('/:id', authenticateSession, requireAdmin, descriptionController.updateDescription);
router.post('/', authenticateSession, requireAdmin, descriptionController.upsertDescription);
router.delete('/:id', authenticateSession, requireAdmin, descriptionController.deleteDescription);

export default router;