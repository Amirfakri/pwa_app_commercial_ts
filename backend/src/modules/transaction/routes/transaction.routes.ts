import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticateSession, requireAdmin } from '../../auth/middlewares/auth.middleware';

const router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Transaction module is working!' });
});

// ==================== مسیرهای کاربر عادی ====================
router.post('/', authenticateSession, transactionController.createTransaction);
router.get('/user', authenticateSession, transactionController.getUserTransactions);
router.get('/user/pending', authenticateSession, transactionController.getUserPendingTransactions);
router.get('/timer', authenticateSession, transactionController.getTimer);

// ==================== مسیرهای ادمین ====================
router.get('/admin/all', authenticateSession, requireAdmin, transactionController.getAllTransactions);
router.get('/admin/pending/count', authenticateSession, requireAdmin, transactionController.getPendingCount);
router.post('/admin/manual', authenticateSession, requireAdmin, transactionController.createManualTransaction);
router.put('/admin/:id/status', authenticateSession, requireAdmin, transactionController.updateTransactionStatus);
router.put('/admin/:id', authenticateSession, requireAdmin, transactionController.updateTransaction);
router.put('/admin/timer', authenticateSession, requireAdmin, transactionController.updateTimer);

export default router;