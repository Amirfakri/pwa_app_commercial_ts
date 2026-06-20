
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateSession } from '../middlewares/auth.middleware';

const router = Router();

// مسیرهای عمومی
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.get('/check-session', authController.checkSession);

// مسیرهای محافظت شده (نیاز به احراز هویت)
router.post('/logout', authenticateSession, authController.logout);
router.get('/profile', authenticateSession, authController.getUserProfile);

// مسیرهای مدیریت نشست (Session Management)
router.get('/sessions', authenticateSession, authController.getSessions);
router.delete('/sessions/:sessionId', authenticateSession, authController.revokeSession);
router.delete('/sessions', authenticateSession, authController.revokeAllSessions);

export default router;
