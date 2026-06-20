// backend/src/modules/support/routes/terms.routes.ts

import { Router } from 'express';
import { authenticateSession, requireAdmin } from '../../auth/middlewares/auth.middleware';
import { termsController } from '../controllers/terms.controller';

const router = Router();

// روت تست - بدون احراز هویت
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Terms module is working!' });
});

// روت‌های اصلی
router.get('/', authenticateSession, termsController.getActiveTerms);
router.get('/history', authenticateSession, requireAdmin, termsController.getTermsHistory);
router.post('/', authenticateSession, requireAdmin, termsController.createTerms);
router.post('/accept', authenticateSession, termsController.acceptTerms);
router.get('/check', authenticateSession, termsController.checkAcceptance);

export default router;