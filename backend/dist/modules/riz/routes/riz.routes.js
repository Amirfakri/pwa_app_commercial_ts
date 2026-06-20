"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const riz_controller_1 = require("../controllers/riz.controller");
const auth_middleware_1 = require("../../auth/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// اعمال middleware روی همه مسیرها
router.use(auth_middleware_1.authenticateSession);
// ============== مسیرهای کاربر عادی ==============
router.get('/my-balance', riz_controller_1.rizController.getMyBalance.bind(riz_controller_1.rizController));
router.get('/my-transactions', riz_controller_1.rizController.getMyTransactions.bind(riz_controller_1.rizController));
// ============== مسیرهای ادمین ==============
router.get('/customer-summary', riz_controller_1.rizController.getCustomerSummaries.bind(riz_controller_1.rizController));
router.get('/users', riz_controller_1.rizController.getAllUsers.bind(riz_controller_1.rizController));
router.get('/customer-transactions/:user_code', riz_controller_1.rizController.getUserTransactions.bind(riz_controller_1.rizController));
router.post('/upload', riz_controller_1.rizController.uploadRiz.bind(riz_controller_1.rizController));
router.delete('/:id', riz_controller_1.rizController.deleteRecord.bind(riz_controller_1.rizController));
router.delete('/user/:user_code', riz_controller_1.rizController.deleteAllUserRecords.bind(riz_controller_1.rizController));
exports.default = router;
