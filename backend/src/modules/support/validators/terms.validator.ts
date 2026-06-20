// backend/src/modules/support/validators/terms.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateTerms = [
  body('content')
    .notEmpty()
    .withMessage('متن شرایط و قوانین الزامی است')
    .isLength({ min: 10 })
    .withMessage('متن شرایط و قوانین باید حداقل ۱۰ کاراکتر باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateAcceptTerms = [
  body('accepted_at')
    .optional()
    .isISO8601()
    .withMessage('فرمت تاریخ پذیرش نامعتبر است'),
  body('version')
    .optional()
    .isString()
    .withMessage('نسخه باید متن باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetTermsHistory = [
  query('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('تعداد باید بین ۱ تا ۵۰ باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];