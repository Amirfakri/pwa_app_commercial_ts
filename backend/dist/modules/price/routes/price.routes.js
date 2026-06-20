"use strict";
// backend/src/modules/price/routes/price.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const price_controller_1 = require("../controllers/price.controller");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// مسیرهای عمومی
router.use(auth_middleware_1.authenticateSession);
router.get('/today', price_controller_1.priceController.getTodayPrice);
router.get('/all', price_controller_1.priceController.getAllTodayPrices);
router.get('/products', price_controller_1.priceController.getProductsWithPrices);
router.get('/history', price_controller_1.priceController.getPriceHistory);
router.get('/my-offsets', price_controller_1.priceController.getUserOffsets);
// مسیرهای ادمین
router.post('/', auth_middleware_1.requireAdmin, price_controller_1.priceController.createPrice);
router.put('/:id', auth_middleware_1.requireAdmin, price_controller_1.priceController.updatePrice);
router.put('/users/:user_id/offsets', auth_middleware_1.requireAdmin, price_controller_1.priceController.updateUserOffsets);
// ==================== مسیرهای منبع خارجی ====================
// Webhook برای دریافت قیمت از Electron App (بدون احراز هویت - با API Key)
router.post('/webhook/external', price_controller_1.priceController.externalPriceWebhook);
// دریافت قیمت خارجی (برای فرانت‌اند)
router.get('/external/:product_code', price_controller_1.priceController.getExternalPrice);
router.get('/external/all', price_controller_1.priceController.getAllExternalPrices);
exports.default = router;
