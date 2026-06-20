"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGetBackupHistory = exports.validateCleanupBackups = exports.validateSqlBackup = void 0;
const express_validator_1 = require("express-validator");
exports.validateSqlBackup = [
    (0, express_validator_1.body)('start_date')
        .notEmpty()
        .withMessage('تاریخ شروع الزامی است')
        .isISO8601()
        .withMessage('فرمت تاریخ شروع نامعتبر است'),
    (0, express_validator_1.body)('end_date')
        .notEmpty()
        .withMessage('تاریخ پایان الزامی است')
        .isISO8601()
        .withMessage('فرمت تاریخ پایان نامعتبر است'),
    (0, express_validator_1.body)('tables')
        .isArray()
        .withMessage('لیست جداول باید به صورت آرایه باشد')
        .notEmpty()
        .withMessage('حداقل یک جدول را انتخاب کنید'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateCleanupBackups = [
    (0, express_validator_1.body)('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('تعداد روز باید بین ۱ تا ۳۶۵ باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateGetBackupHistory = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).withMessage('تعداد باید بین ۱ تا ۵۰ باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
