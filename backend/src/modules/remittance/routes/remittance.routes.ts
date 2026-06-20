// backend/src/modules/remittance/routes/remittance.routes.ts
import { Router } from 'express';
import { authenticateSession } from '../../auth/middlewares/auth.middleware';
import { remittanceController } from '../controllers/remittance.controller';

const router = Router();

// 🔐 اعمال middleware احراز هویت روی همه مسیرها
router.use(authenticateSession);

// Route تست Socket.IO (فقط برای تست)
router.post('/test-socket', (req, res) => {
  const io = req.app.get('io');
  if (io) {
    const testData = {
      message: 'Test message from server',
      timestamp: new Date().toISOString(),
      id: Math.floor(Math.random() * 1000)
    };
    console.log('📤 Sending test event:', testData);
    io.emit('test_event', testData);
    res.json({ success: true, message: 'Test event sent', data: testData });
  } else {
    console.log('⚠️ io not available');
    res.status(500).json({ success: false, message: 'Socket not available' });
  }
});

// ============== مسیرهای کاربر عادی ==============
router.post('/', remittanceController.createRemittance);
router.get('/user', remittanceController.getUserRemittances);

// ============== مسیرهای ادمین ==============
router.get('/admin', remittanceController.getAllRemittances);
router.get('/admin/stats', remittanceController.getRemittanceStats);
router.get('/admin/recent', remittanceController.getRecentPendingRemittances);
router.get('/admin/today', remittanceController.getTodayRemittances);
router.put('/admin/:id/status', remittanceController.updateRemittanceStatus);
router.delete('/admin/:id', remittanceController.deleteRemittance);

export default router;