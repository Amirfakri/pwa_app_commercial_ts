// backend/src/modules/admin/routes/admin.routes.ts
import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateSession, requireAdmin, AuthRequest } from '../../auth/middlewares/auth.middleware';

const router = Router();

// Test route
router.get('/test', authenticateSession, requireAdmin, (req: AuthRequest, res) => {
  res.json({ success: true, message: 'Admin route is working!', user: req.user });
});

// همه مسیرهای ادمین نیاز به احراز هویت و دسترسی ادمین دارند
router.use(authenticateSession, requireAdmin);

// مدیریت کاربران
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// مدیریت نشست‌های کاربر
router.get('/users/:id/sessions', adminController.getUserSessions);
router.delete('/user-sessions/:sessionId', adminController.revokeUserSession);
router.delete('/users/:id/sessions/all', adminController.revokeAllUserSessions);

// مدیریت ادمین‌ها
router.get('/admins', adminController.getAdmins);
router.post('/admins', adminController.createAdmin);
router.put('/admins/:id', adminController.updateAdmin);
router.delete('/admins/:id', adminController.deleteAdmin);

// مدیریت درخواست‌های ثبت‌نام
router.get('/pending-registrations', adminController.getPendingRegistrations);
router.put('/approve-registration/:id', adminController.approveRegistration);
router.put('/reject-registration/:id', adminController.rejectRegistration);

// مدیریت محصولات آبشده
router.get('/melted-products', adminController.getMeltedProducts);
router.post('/melted-products', adminController.createMeltedProduct);
router.put('/melted-products/:id', adminController.updateMeltedProduct);
router.delete('/melted-products/:id', adminController.deleteMeltedProduct);

// مدیریت سکه‌ها
router.get('/coins', adminController.getCoins);
router.post('/coins', adminController.createCoin);
router.put('/coins/:id', adminController.updateCoin);
router.delete('/coins/:id', adminController.deleteCoin);

// ==================== مدیریت تایمر تراکنش ====================
router.get('/timer', adminController.getTimer);
router.put('/timer', adminController.updateTimer);

export default router;