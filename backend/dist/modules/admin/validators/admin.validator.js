"use strict";
// backend/src/modules/admin/validators/admin.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePagination = exports.validateUpdateAdmin = exports.validateCreateAdmin = exports.validateUpdateUser = exports.validateCreateUser = void 0;
const express_validator_1 = require("express-validator");
exports.validateCreateUser = [
    (0, express_validator_1.body)('mobile_number')
        .notEmpty()
        .withMessage('شماره موبایل الزامی است')
        .matches(/^09[0-9]{9}$/)
        .withMessage('فرمت شماره موبایل نامعتبر است'),
    (0, express_validator_1.body)('first_name').optional().isString().withMessage('نام باید متن باشد'),
    (0, express_validator_1.body)('last_name').optional().isString().withMessage('نام خانوادگی باید متن باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateUpdateUser = [
    (0, express_validator_1.param)('id').isInt().withMessage('شناسه کاربر نامعتبر است'),
    (0, express_validator_1.body)('mobile_number')
        .optional()
        .matches(/^09[0-9]{9}$/)
        .withMessage('فرمت شماره موبایل نامعتبر است'),
    (0, express_validator_1.body)('device_limit').optional().isInt({ min: 1 }).withMessage('محدودیت دستگاه باید عدد مثبت باشد'),
    (0, express_validator_1.body)('melted_price_offset').optional().isFloat().withMessage('افست قیمت آبشده باید عدد باشد'),
    (0, express_validator_1.body)('coin_price_offset').optional().isFloat().withMessage('افست قیمت سکه باید عدد باشد'),
    (0, express_validator_1.body)('is_blocked').optional().isBoolean().withMessage('وضعیت بلاک باید true/false باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateCreateAdmin = [
    (0, express_validator_1.body)('mobile_number')
        .notEmpty()
        .withMessage('شماره موبایل الزامی است')
        .matches(/^09[0-9]{9}$/)
        .withMessage('فرمت شماره موبایل نامعتبر است'),
    (0, express_validator_1.body)('first_name').notEmpty().withMessage('نام الزامی است'),
    (0, express_validator_1.body)('last_name').notEmpty().withMessage('نام خانوادگی الزامی است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateUpdateAdmin = [
    (0, express_validator_1.param)('id').isInt().withMessage('شناسه ادمین نامعتبر است'),
    (0, express_validator_1.body)('is_active').optional().isBoolean().withMessage('وضعیت فعال باید true/false باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validatePagination = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
