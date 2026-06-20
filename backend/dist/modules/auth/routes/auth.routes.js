"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// مسیرهای عمومی
router.post('/send-otp', auth_controller_1.authController.sendOtp);
router.post('/verify-otp', auth_controller_1.authController.verifyOtp);
router.get('/check-session', auth_controller_1.authController.checkSession);
// مسیرهای محافظت شده (نیاز به احراز هویت)
router.post('/logout', auth_middleware_1.authenticateSession, auth_controller_1.authController.logout);
router.get('/profile', auth_middleware_1.authenticateSession, auth_controller_1.authController.getUserProfile);
// مسیرهای مدیریت نشست (Session Management)
router.get('/sessions', auth_middleware_1.authenticateSession, auth_controller_1.authController.getSessions);
router.delete('/sessions/:sessionId', auth_middleware_1.authenticateSession, auth_controller_1.authController.revokeSession);
router.delete('/sessions', auth_middleware_1.authenticateSession, auth_controller_1.authController.revokeAllSessions);
exports.default = router;
