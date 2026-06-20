"use strict";
// backend/src/modules/auth/validators/auth.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCheckUser = exports.validateSendOtp = exports.validateVerifyOtp = exports.validateLogin = void 0;
const express_validator_1 = require("express-validator");
exports.validateLogin = [
    (0, express_validator_1.body)('mobile')
        .notEmpty()
        .withMessage('شماره موبایل الزامی است')
        .matches(/^09[0-9]{9}$/)
        .withMessage('فرمت شماره موبایل نامعتبر است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateVerifyOtp = [
    (0, express_validator_1.body)('mobile')
        .notEmpty()
        .withMessage('شماره موبایل الزامی است')
        .matches(/^09[0-9]{9}$/)
        .withMessage('فرمت شماره موبایل نامعتبر است'),
    (0, express_validator_1.body)('otp')
        .notEmpty()
        .withMessage('کد تأیید الزامی است')
        .isLength({ min: 6, max: 6 })
        .withMessage('کد تأیید باید ۶ رقم باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateSendOtp = [
    (0, express_validator_1.body)('receptor')
        .notEmpty()
        .withMessage('شماره موبایل الزامی است')
        .matches(/^09[0-9]{9}$/)
        .withMessage('فرمت شماره موبایل نامعتبر است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateCheckUser = [
    (0, express_validator_1.param)('mobile')
        .notEmpty()
        .withMessage('شماره موبایل الزامی است')
        .matches(/^09[0-9]{9}$/)
        .withMessage('فرمت شماره موبایل نامعتبر است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
