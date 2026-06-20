"use strict";
// backend/src/modules/support/validators/terms.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGetTermsHistory = exports.validateAcceptTerms = exports.validateCreateTerms = void 0;
const express_validator_1 = require("express-validator");
exports.validateCreateTerms = [
    (0, express_validator_1.body)('content')
        .notEmpty()
        .withMessage('متن شرایط و قوانین الزامی است')
        .isLength({ min: 10 })
        .withMessage('متن شرایط و قوانین باید حداقل ۱۰ کاراکتر باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateAcceptTerms = [
    (0, express_validator_1.body)('accepted_at')
        .optional()
        .isISO8601()
        .withMessage('فرمت تاریخ پذیرش نامعتبر است'),
    (0, express_validator_1.body)('version')
        .optional()
        .isString()
        .withMessage('نسخه باید متن باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateGetTermsHistory = [
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
