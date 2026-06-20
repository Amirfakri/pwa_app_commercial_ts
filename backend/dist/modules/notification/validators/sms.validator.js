"use strict";
// backend/src/modules/notification/validators/sms.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSearchCustomers = exports.validateSendOtp = exports.validateSendBulkSms = exports.validateSendSms = void 0;
const express_validator_1 = require("express-validator");
exports.validateSendSms = [
    (0, express_validator_1.body)('receptor')
        .notEmpty()
        .withMessage('شماره گیرنده الزامی است')
        .matches(/^09[0-9]{9}$/)
        .withMessage('فرمت شماره موبایل نامعتبر است'),
    (0, express_validator_1.body)('message')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('متن پیامک باید بین ۱ تا ۵۰۰ کاراکتر باشد'),
    (0, express_validator_1.body)('bodyId')
        .optional()
        .isString()
        .withMessage('bodyId باید متن باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // Either message or bodyId must be provided
        if (!req.body.message && !req.body.bodyId) {
            return res.status(400).json({ error: 'متن پیامک یا bodyId الزامی است' });
        }
        next();
    },
];
exports.validateSendBulkSms = [
    (0, express_validator_1.body)('receptors')
        .isArray()
        .withMessage('لیست گیرندگان باید به صورت آرایه باشد')
        .notEmpty()
        .withMessage('لیست گیرندگان نباید خالی باشد')
        .custom((value) => value.length <= 50)
        .withMessage('حداکثر 50 شماره مجاز است'),
    (0, express_validator_1.body)('receptors.*')
        .matches(/^09[0-9]{9}$/)
        .withMessage('فرمت شماره موبایل نامعتبر است'),
    (0, express_validator_1.body)('message')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('متن پیامک باید بین ۱ تا ۵۰۰ کاراکتر باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!req.body.message && !req.body.bodyId) {
            return res.status(400).json({ error: 'متن پیامک یا bodyId الزامی است' });
        }
        next();
    },
];
exports.validateSendOtp = [
    (0, express_validator_1.body)('receptor')
        .notEmpty()
        .withMessage('شماره گیرنده الزامی است')
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
exports.validateSearchCustomers = [
    (0, express_validator_1.query)('q')
        .notEmpty()
        .withMessage('متن جستجو الزامی است')
        .isLength({ min: 2 })
        .withMessage('حداقل ۲ کاراکتر برای جستجو نیاز است'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
