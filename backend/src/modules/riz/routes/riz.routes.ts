import { Router } from 'express';
import { rizController } from '../controllers/riz.controller';
import { authenticateSession } from '../../auth/middlewares/auth.middleware';

const router = Router();

// اعمال middleware روی همه مسیرها
router.use(authenticateSession);

// ============== مسیرهای کاربر عادی ==============
router.get('/my-balance', rizController.getMyBalance.bind(rizController));
router.get('/my-transactions', rizController.getMyTransactions.bind(rizController));

// ============== مسیرهای ادمین ==============
router.get('/customer-summary', rizController.getCustomerSummaries.bind(rizController));
router.get('/users', rizController.getAllUsers.bind(rizController));
router.get('/customer-transactions/:user_code', rizController.getUserTransactions.bind(rizController));
router.post('/upload', rizController.uploadRiz.bind(rizController));
router.delete('/:id', rizController.deleteRecord.bind(rizController));
router.delete('/user/:user_code', rizController.deleteAllUserRecords.bind(rizController));

export default router;