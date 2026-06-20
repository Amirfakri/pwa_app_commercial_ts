"use strict";
// backend/src/modules/riz/validators/riz.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDeleteUserRecords = exports.validateDeleteRecord = exports.validateSearchUsers = exports.validateGetTransactions = exports.validateUploadRiz = void 0;
const express_validator_1 = require("express-validator");
exports.validateUploadRiz = [
    (0, express_validator_1.body)('rizData')
        .isArray()
        .withMessage('داده‌های ریزحساب باید به صورت آرایه باشد')
        .notEmpty()
        .withMessage('داده‌های ریزحساب نباید خالی باشد'),
    (0, express_validator_1.body)('user_code')
        .notEmpty()
        .withMessage('کد کاربر الزامی است')
        .matches(/^USER[0-9]+$/)
        .withMessage('فرمت کد کاربر نامعتبر است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateGetTransactions = [
    (0, express_validator_1.param)('user_code')
        .optional()
        .matches(/^USER[0-9]+$/)
        .withMessage('فرمت کد کاربر نامعتبر است'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('تعداد باید بین ۱ تا ۱۰۰۰۰ باشد'),
    (0, express_validator_1.query)('start_date').optional().isString().withMessage('تاریخ شروع نامعتبر است'),
    (0, express_validator_1.query)('end_date').optional().isString().withMessage('تاریخ پایان نامعتبر است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateSearchUsers = [
    (0, express_validator_1.query)('q')
        .notEmpty()
        .withMessage('متن جستجو الزامی است')
        .isLength({ min: 2 })
        .withMessage('حداقل ۲ کاراکتر برای جستجو نیاز است'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).withMessage('تعداد باید بین ۱ تا ۵۰ باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateDeleteRecord = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('شناسه رکورد نامعتبر است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateDeleteUserRecords = [
    (0, express_validator_1.param)('user_code')
        .notEmpty()
        .withMessage('کد کاربر الزامی است')
        .matches(/^USER[0-9]+$/)
        .withMessage('فرمت کد کاربر نامعتبر است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
