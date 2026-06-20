// backend/src/modules/notification/validators/notification.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateNotification = [
  body('message_text')
    .notEmpty()
    .withMessage('متن اعلان الزامی است')
    .isLength({ min: 1, max: 500 })
    .withMessage('متن اعلان باید بین ۱ تا ۵۰۰ کاراکتر باشد'),
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('عنوان نباید بیشتر از ۱۰۰ کاراکتر باشد'),
  body('notification_type')
    .optional()
    .isIn(['info', 'warning', 'success', 'error', 'simple'])
    .withMessage('نوع اعلان نامعتبر است'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('وضعیت فعال باید true/false باشد'),
  body('audience')
    .optional()
    .isIn(['all', 'specific_user', 'specific_role'])
    .withMessage('نوع مخاطب نامعتبر است'),
  body('user_id')
    .optional()
    .isInt()
    .withMessage('شناسه کاربر باید عدد باشد')
    .custom((value, { req }) => {
      if (req.body.audience === 'specific_user' && !value) {
        throw new Error('برای اعلان خصوصی، شناسه کاربر الزامی است');
      }
      return true;
    }),
  body('role')
    .optional()
    .isString()
    .withMessage('نقش باید متن باشد')
    .custom((value, { req }) => {
      if (req.body.audience === 'specific_role' && !value) {
        throw new Error('برای اعلان بر اساس نقش، نقش الزامی است');
      }
      return true;
    }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateNotification = [
  param('id').isInt().withMessage('شناسه اعلان نامعتبر است'),
  body('message_text')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('متن اعلان باید بین ۱ تا ۵۰۰ کاراکتر باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];