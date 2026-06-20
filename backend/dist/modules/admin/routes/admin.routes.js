"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/admin/routes/admin.routes.ts
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Test route
router.get('/test', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, (req, res) => {
    res.json({ success: true, message: 'Admin route is working!', user: req.user });
});
// همه مسیرهای ادمین نیاز به احراز هویت و دسترسی ادمین دارند
router.use(auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin);
// مدیریت کاربران
router.get('/users', admin_controller_1.adminController.getUsers);
router.post('/users', admin_controller_1.adminController.createUser);
router.put('/users/:id', admin_controller_1.adminController.updateUser);
router.delete('/users/:id', admin_controller_1.adminController.deleteUser);
// مدیریت نشست‌های کاربر
router.get('/users/:id/sessions', admin_controller_1.adminController.getUserSessions);
router.delete('/user-sessions/:sessionId', admin_controller_1.adminController.revokeUserSession);
router.delete('/users/:id/sessions/all', admin_controller_1.adminController.revokeAllUserSessions);
// مدیریت ادمین‌ها
router.get('/admins', admin_controller_1.adminController.getAdmins);
router.post('/admins', admin_controller_1.adminController.createAdmin);
router.put('/admins/:id', admin_controller_1.adminController.updateAdmin);
router.delete('/admins/:id', admin_controller_1.adminController.deleteAdmin);
// مدیریت درخواست‌های ثبت‌نام
router.get('/pending-registrations', admin_controller_1.adminController.getPendingRegistrations);
router.put('/approve-registration/:id', admin_controller_1.adminController.approveRegistration);
router.put('/reject-registration/:id', admin_controller_1.adminController.rejectRegistration);
// مدیریت محصولات آبشده
router.get('/melted-products', admin_controller_1.adminController.getMeltedProducts);
router.post('/melted-products', admin_controller_1.adminController.createMeltedProduct);
router.put('/melted-products/:id', admin_controller_1.adminController.updateMeltedProduct);
router.delete('/melted-products/:id', admin_controller_1.adminController.deleteMeltedProduct);
// مدیریت سکه‌ها
router.get('/coins', admin_controller_1.adminController.getCoins);
router.post('/coins', admin_controller_1.adminController.createCoin);
router.put('/coins/:id', admin_controller_1.adminController.updateCoin);
router.delete('/coins/:id', admin_controller_1.adminController.deleteCoin);
// ==================== مدیریت تایمر تراکنش ====================
router.get('/timer', admin_controller_1.adminController.getTimer);
router.put('/timer', admin_controller_1.adminController.updateTimer);
exports.default = router;
