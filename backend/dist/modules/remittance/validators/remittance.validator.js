"use strict";
// backend/src/modules/remittance/validators/remittance.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSearchRemittances = exports.validateGetRemittances = exports.validateUpdateRemittanceStatus = exports.validateCreateRemittance = void 0;
const express_validator_1 = require("express-validator");
exports.validateCreateRemittance = [
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('نوع حواله الزامی است')
        .isIn(['وزنی', 'ریالی', 'سکه'])
        .withMessage('نوع حواله باید وزنی، ریالی یا سکه باشد'),
    (0, express_validator_1.body)('weight')
        .if((0, express_validator_1.body)('type').equals('وزنی'))
        .notEmpty()
        .withMessage('وزن برای حواله وزنی الزامی است')
        .isFloat({ min: 0.001 })
        .withMessage('وزن باید یک عدد مثبت باشد'),
    (0, express_validator_1.body)('amount')
        .if((0, express_validator_1.body)('type').equals('ریالی'))
        .notEmpty()
        .withMessage('مبلغ برای حواله ریالی الزامی است')
        .isFloat({ min: 1000 })
        .withMessage('مبلغ باید حداقل ۱۰۰۰ ریال باشد'),
    (0, express_validator_1.body)('coin_count')
        .if((0, express_validator_1.body)('type').equals('سکه'))
        .notEmpty()
        .withMessage('تعداد سکه برای حواله سکه الزامی است')
        .isInt({ min: 1 })
        .withMessage('تعداد سکه باید یک عدد صحیح مثبت باشد'),
    (0, express_validator_1.body)('recipient')
        .notEmpty()
        .withMessage('نام گیرنده الزامی است')
        .isLength({ min: 2, max: 100 })
        .withMessage('نام گیرنده باید بین ۲ تا ۱۰۰ کاراکتر باشد'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateUpdateRemittanceStatus = [
    (0, express_validator_1.param)('id').isInt().withMessage('شناسه حواله نامعتبر است'),
    (0, express_validator_1.body)('status')
        .notEmpty()
        .withMessage('وضعیت الزامی است')
        .isIn(['در حال بررسی', 'تأییدشده', 'ردشده', 'تحویل شده'])
        .withMessage('وضعیت نامعتبر است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateGetRemittances = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد'),
    (0, express_validator_1.query)('start_date').optional().isString().withMessage('تاریخ شروع نامعتبر است'),
    (0, express_validator_1.query)('end_date').optional().isString().withMessage('تاریخ پایان نامعتبر است'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['در حال بررسی', 'تأییدشده', 'ردشده', 'تحویل شده'])
        .withMessage('وضعیت نامعتبر است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateSearchRemittances = [
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
