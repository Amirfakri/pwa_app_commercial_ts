"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateOffsets = exports.validateGetPriceHistory = exports.validateGetPrice = exports.validateUpdatePrice = exports.validateCreatePrice = void 0;
const express_validator_1 = require("express-validator");
exports.validateCreatePrice = [
    (0, express_validator_1.body)('product_code')
        .notEmpty()
        .withMessage('کد محصول الزامی است')
        .matches(/^(AB_|COIN_)/)
        .withMessage('کد محصول باید با AB_ (آبشده) یا COIN_ (سکه) شروع شود'),
    (0, express_validator_1.body)('buy_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('قیمت خرید باید عدد مثبت باشد'),
    (0, express_validator_1.body)('sell_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('قیمت فروش باید عدد مثبت باشد'),
    (0, express_validator_1.body)('is_visible_buy')
        .optional()
        .isBoolean()
        .withMessage('وضعیت نمایش قیمت خرید باید true/false باشد'),
    (0, express_validator_1.body)('is_visible_sell')
        .optional()
        .isBoolean()
        .withMessage('وضعیت نمایش قیمت فروش باید true/false باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateUpdatePrice = [
    (0, express_validator_1.param)('id').isInt().withMessage('شناسه قیمت نامعتبر است'),
    (0, express_validator_1.body)('buy_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('قیمت خرید باید عدد مثبت باشد'),
    (0, express_validator_1.body)('sell_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('قیمت فروش باید عدد مثبت باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateGetPrice = [
    (0, express_validator_1.query)('product_code')
        .notEmpty()
        .withMessage('کد محصول الزامی است')
        .matches(/^(AB_|COIN_)/)
        .withMessage('کد محصول باید با AB_ (آبشده) یا COIN_ (سکه) شروع شود'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateGetPriceHistory = [
    (0, express_validator_1.query)('product_code')
        .notEmpty()
        .withMessage('کد محصول الزامی است'),
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
exports.validateUpdateOffsets = [
    (0, express_validator_1.body)('melted_offset')
        .optional()
        .isFloat()
        .withMessage('افست آبشده باید عدد باشد'),
    (0, express_validator_1.body)('coin_offset')
        .optional()
        .isFloat()
        .withMessage('افست سکه باید عدد باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
