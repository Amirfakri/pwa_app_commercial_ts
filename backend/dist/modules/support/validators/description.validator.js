"use strict";
// backend/src/modules/support/validators/description.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGetDescription = exports.validateBulkUpsertDescriptions = exports.validateUpsertDescription = void 0;
const express_validator_1 = require("express-validator");
const support_types_1 = require("../types/support.types");
exports.validateUpsertDescription = [
    (0, express_validator_1.body)('id')
        .notEmpty()
        .withMessage('شناسه صفحه الزامی است')
        .isIn(Object.values(support_types_1.PAGE_IDS))
        .withMessage('شناسه صفحه نامعتبر است'),
    (0, express_validator_1.body)('title')
        .notEmpty()
        .withMessage('عنوان الزامی است')
        .isLength({ max: 200 })
        .withMessage('عنوان نباید بیشتر از ۲۰۰ کاراکتر باشد'),
    (0, express_validator_1.body)('content')
        .notEmpty()
        .withMessage('متن توضیح الزامی است'),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('وضعیت فعال باید true/false باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateBulkUpsertDescriptions = [
    (0, express_validator_1.body)('descriptions')
        .isArray()
        .withMessage('descriptions باید به صورت آرایه باشد')
        .notEmpty()
        .withMessage('لیست توضیحات نمی‌تواند خالی باشد'),
    (0, express_validator_1.body)('descriptions.*.id')
        .notEmpty()
        .withMessage('شناسه صفحه برای همه آیتم‌ها الزامی است'),
    (0, express_validator_1.body)('descriptions.*.title')
        .notEmpty()
        .withMessage('عنوان برای همه آیتم‌ها الزامی است'),
    (0, express_validator_1.body)('descriptions.*.content')
        .notEmpty()
        .withMessage('متن توضیح برای همه آیتم‌ها الزامی است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateGetDescription = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage('شناسه صفحه الزامی است'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
