"use strict";
// backend/src/modules/transaction/validators/transaction.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTimer = exports.validateGetTransactions = exports.validateCreateManualTransaction = exports.validateUpdateTransaction = exports.validateUpdateTransactionStatus = exports.validateCreateTransaction = void 0;
const express_validator_1 = require("express-validator");
exports.validateCreateTransaction = [
    (0, express_validator_1.body)('product_code')
        .notEmpty()
        .withMessage('کد محصول الزامی است')
        .matches(/^(AB_|COIN_)/)
        .withMessage('کد محصول باید با AB_ (آبشده) یا COIN_ (سکه) شروع شود'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('نوع معامله الزامی است')
        .isIn(['buy', 'sell', 'خرید', 'فروش'])
        .withMessage('نوع معامله باید خرید یا فروش باشد'),
    (0, express_validator_1.body)('amount')
        .notEmpty()
        .withMessage('مبلغ الزامی است')
        .isFloat({ min: 0.01 })
        .withMessage('مبلغ باید یک عدد مثبت باشد'),
    (0, express_validator_1.body)('coin_quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('تعداد سکه باید عدد صحیح مثبت باشد'),
    (0, express_validator_1.body)('melted_weight')
        .optional()
        .isFloat({ min: 0.001 })
        .withMessage('وزن باید عدد مثبت باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateUpdateTransactionStatus = [
    (0, express_validator_1.param)('id').isInt().withMessage('شناسه تراکنش نامعتبر است'),
    (0, express_validator_1.body)('status')
        .notEmpty()
        .withMessage('وضعیت الزامی است')
        .isIn(['approved', 'rejected'])
        .withMessage('وضعیت باید approved یا rejected باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateUpdateTransaction = [
    (0, express_validator_1.param)('id').isInt().withMessage('شناسه تراکنش نامعتبر است'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['approved', 'rejected', 'pending', 'expired', 'cancelled'])
        .withMessage('وضعیت نامعتبر است'),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(['buy', 'sell', 'خرید', 'فروش'])
        .withMessage('نوع معامله نامعتبر است'),
    (0, express_validator_1.body)('amount')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('مبلغ باید عدد مثبت باشد'),
    (0, express_validator_1.body)('transaction_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('قیمت تراکنش باید عدد باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateCreateManualTransaction = [
    (0, express_validator_1.body)('product_code')
        .notEmpty()
        .withMessage('کد محصول الزامی است')
        .matches(/^(AB_|COIN_)/)
        .withMessage('کد محصول باید با AB_ (آبشده) یا COIN_ (سکه) شروع شود'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('نوع معامله الزامی است')
        .isIn(['buy', 'sell', 'خرید', 'فروش'])
        .withMessage('نوع معامله باید خرید یا فروش باشد'),
    (0, express_validator_1.body)('user_id')
        .notEmpty()
        .isInt({ min: 1 })
        .withMessage('شناسه کاربر الزامی است'),
    (0, express_validator_1.body)('amount')
        .notEmpty()
        .isFloat({ min: 0.01 })
        .withMessage('مبلغ باید یک عدد مثبت باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateGetTransactions = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد'),
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
exports.validateTimer = [
    (0, express_validator_1.body)('timer')
        .notEmpty()
        .withMessage('مقدار تایمر الزامی است')
        .isInt({ min: 5, max: 300 })
        .withMessage('تایمر باید بین ۵ تا ۳۰۰ ثانیه باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
