"use strict";
// backend/src/modules/notification/validators/notification.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateNotification = exports.validateCreateNotification = void 0;
const express_validator_1 = require("express-validator");
exports.validateCreateNotification = [
    (0, express_validator_1.body)('message_text')
        .notEmpty()
        .withMessage('متن اعلان الزامی است')
        .isLength({ min: 1, max: 500 })
        .withMessage('متن اعلان باید بین ۱ تا ۵۰۰ کاراکتر باشد'),
    (0, express_validator_1.body)('title')
        .optional()
        .isLength({ max: 100 })
        .withMessage('عنوان نباید بیشتر از ۱۰۰ کاراکتر باشد'),
    (0, express_validator_1.body)('notification_type')
        .optional()
        .isIn(['info', 'warning', 'success', 'error', 'simple'])
        .withMessage('نوع اعلان نامعتبر است'),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('وضعیت فعال باید true/false باشد'),
    (0, express_validator_1.body)('audience')
        .optional()
        .isIn(['all', 'specific_user', 'specific_role'])
        .withMessage('نوع مخاطب نامعتبر است'),
    (0, express_validator_1.body)('user_id')
        .optional()
        .isInt()
        .withMessage('شناسه کاربر باید عدد باشد')
        .custom((value, { req }) => {
        if (req.body.audience === 'specific_user' && !value) {
            throw new Error('برای اعلان خصوصی، شناسه کاربر الزامی است');
        }
        return true;
    }),
    (0, express_validator_1.body)('role')
        .optional()
        .isString()
        .withMessage('نقش باید متن باشد')
        .custom((value, { req }) => {
        if (req.body.audience === 'specific_role' && !value) {
            throw new Error('برای اعلان بر اساس نقش، نقش الزامی است');
        }
        return true;
    }),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateUpdateNotification = [
    (0, express_validator_1.param)('id').isInt().withMessage('شناسه اعلان نامعتبر است'),
    (0, express_validator_1.body)('message_text')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('متن اعلان باید بین ۱ تا ۵۰۰ کاراکتر باشد'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
