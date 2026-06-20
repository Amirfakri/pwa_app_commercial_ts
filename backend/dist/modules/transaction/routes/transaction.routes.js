"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Test route
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Transaction module is working!' });
});
// ==================== مسیرهای کاربر عادی ====================
router.post('/', auth_middleware_1.authenticateSession, transaction_controller_1.transactionController.createTransaction);
router.get('/user', auth_middleware_1.authenticateSession, transaction_controller_1.transactionController.getUserTransactions);
router.get('/user/pending', auth_middleware_1.authenticateSession, transaction_controller_1.transactionController.getUserPendingTransactions);
router.get('/timer', auth_middleware_1.authenticateSession, transaction_controller_1.transactionController.getTimer);
// ==================== مسیرهای ادمین ====================
router.get('/admin/all', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, transaction_controller_1.transactionController.getAllTransactions);
router.get('/admin/pending/count', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, transaction_controller_1.transactionController.getPendingCount);
router.post('/admin/manual', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, transaction_controller_1.transactionController.createManualTransaction);
router.put('/admin/:id/status', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, transaction_controller_1.transactionController.updateTransactionStatus);
router.put('/admin/:id', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, transaction_controller_1.transactionController.updateTransaction);
router.put('/admin/timer', auth_middleware_1.authenticateSession, auth_middleware_1.requireAdmin, transaction_controller_1.transactionController.updateTimer);
exports.default = router;
