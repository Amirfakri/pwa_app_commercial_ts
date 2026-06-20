"use strict";
// backend/src/modules/notification/validators/dailyMessage.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateDailyMessage = exports.validateCreateDailyMessage = void 0;
const express_validator_1 = require("express-validator");
exports.validateCreateDailyMessage = [
    (0, express_validator_1.body)('message_text')
        .notEmpty()
        .withMessage('متن پیام الزامی است')
        .isLength({ min: 1, max: 1000 })
        .withMessage('متن پیام باید بین ۱ تا ۱۰۰۰ کاراکتر باشد'),
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
exports.validateUpdateDailyMessage = [
    (0, express_validator_1.param)('id').isInt().withMessage('شناسه پیام نامعتبر است'),
    (0, express_validator_1.body)('message_text')
        .optional()
        .isLength({ min: 1, max: 1000 })
        .withMessage('متن پیام باید بین ۱ تا ۱۰۰۰ کاراکتر باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
