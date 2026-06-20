import { Router } from 'express';
import { backupController } from '../controllers/backup.controller';
import { authenticateSession, requireAdmin } from '../../auth/middlewares/auth.middleware';
import { validateSqlBackup, validateCleanupBackups, validateGetBackupHistory } from '../validators/backup.validator';

const router = Router();

router.use(authenticateSession, requireAdmin);

router.get('/live-excel', backupController.downloadLiveExcel);
router.post('/full', validateSqlBackup, backupController.generateSqlBackup);
router.get('/history', validateGetBackupHistory, backupController.getBackupHistory);
router.post('/cleanup', validateCleanupBackups, backupController.cleanupBackups);

export default router;