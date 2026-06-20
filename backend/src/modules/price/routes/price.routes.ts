// backend/src/modules/price/routes/price.routes.ts

import { Router } from 'express';
import { priceController } from '../controllers/price.controller';
import { authenticateSession, requireAdmin } from '../../auth/middlewares/auth.middleware';

const router = Router();

// مسیرهای عمومی
router.use(authenticateSession);

router.get('/today', priceController.getTodayPrice);
router.get('/all', priceController.getAllTodayPrices);
router.get('/products', priceController.getProductsWithPrices);
router.get('/history', priceController.getPriceHistory);
router.get('/my-offsets', priceController.getUserOffsets);

// مسیرهای ادمین
router.post('/', requireAdmin, priceController.createPrice);
router.put('/:id', requireAdmin, priceController.updatePrice);
router.put('/users/:user_id/offsets', requireAdmin, priceController.updateUserOffsets);

// ==================== مسیرهای منبع خارجی ====================
// Webhook برای دریافت قیمت از Electron App (بدون احراز هویت - با API Key)
router.post('/webhook/external', priceController.externalPriceWebhook);

// دریافت قیمت خارجی (برای فرانت‌اند)
router.get('/external/:product_code', priceController.getExternalPrice);
router.get('/external/all', priceController.getAllExternalPrices);

export default router;