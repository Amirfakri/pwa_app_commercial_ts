import { Router } from 'express';
import { smsController } from '../controllers/sms.controller';
import { authenticateSession, requireAdmin } from '../../auth/middlewares/auth.middleware';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'sms module is working!' });
});

// همه مسیرهای SMS فقط برای ادمین هستند
router.use(authenticateSession, requireAdmin);

router.post('/send', smsController.sendSms);
router.post('/send-bulk', smsController.sendBulkSms);
router.get('/logs', smsController.getSmsLogs);
router.get('/customers/search', smsController.searchCustomers);
router.get('/customers/:id/balance', smsController.getCustomerBalance);

export default router;