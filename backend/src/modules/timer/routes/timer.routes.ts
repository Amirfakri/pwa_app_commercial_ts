// backend/src/modules/timer/routes/timer.routes.ts
import { Router } from 'express';
import { timerController } from '../controllers/timer.controller';
import { authenticateSession, requireAdmin } from '../../auth/middlewares/auth.middleware';

const router = Router();

// Route تست
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Timer module is working!' });
});

// اعمال middleware احراز هویت روی همه مسیرها
router.use(authenticateSession);

// مسیرهای کاربر
router.get('/transaction/:transactionId', timerController.getTimerByTransaction);
router.get('/my-timers', timerController.getUserTimers);
router.post('/', timerController.createTimer);
router.put('/:id/decrement', timerController.decrementTimer);

// مسیرهای ادمین
router.get('/admin/all', requireAdmin, timerController.getAllTimers);
router.get('/admin/stats', requireAdmin, timerController.getTimerStats);
router.put('/admin/:id/expire', requireAdmin, timerController.expireTimer);
router.delete('/admin/:id', requireAdmin, timerController.deleteTimer);
router.delete('/admin/transaction/:transactionId', requireAdmin, timerController.deleteTimerByTransaction);

export default router;