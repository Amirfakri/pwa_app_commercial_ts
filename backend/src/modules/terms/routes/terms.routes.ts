// backend/src/modules/terms/routes/terms.routes.ts

import { Router } from 'express';
import { termsController } from '../controllers/terms.controller';

const router = Router();

// مسیرهای عمومی (بدون احراز هویت)
router.get('/', termsController.getActiveTerms);
router.get('/public', termsController.getActiveTerms);
router.get('/public/latest', termsController.getActiveTerms);
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Terms module is working!' });
});
router.get('/debug', termsController.debugTerms);

// مسیرهای با احراز هویت (نیاز به لاگین)
router.post('/accept', termsController.acceptTerms);
router.get('/check', termsController.checkAcceptance);

// مسیرهای ادمین (نیاز به احراز هویت و ادمین بودن)
router.get('/history', termsController.getTermsHistory);
router.post('/', termsController.createTerms);

export default router;