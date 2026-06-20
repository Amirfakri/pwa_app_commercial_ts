// backend/src/modules/notification/validators/dailyMessage.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateDailyMessage = [
  body('message_text')
    .notEmpty()
    .withMessage('متن پیام الزامی است')
    .isLength({ min: 1, max: 1000 })
    .withMessage('متن پیام باید بین ۱ تا ۱۰۰۰ کاراکتر باشد'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('وضعیت فعال باید true/false باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateDailyMessage = [
  param('id').isInt().withMessage('شناسه پیام نامعتبر است'),
  body('message_text')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('متن پیام باید بین ۱ تا ۱۰۰۰ کاراکتر باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];