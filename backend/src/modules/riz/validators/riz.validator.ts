// backend/src/modules/riz/validators/riz.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateUploadRiz = [
  body('rizData')
    .isArray()
    .withMessage('داده‌های ریزحساب باید به صورت آرایه باشد')
    .notEmpty()
    .withMessage('داده‌های ریزحساب نباید خالی باشد'),
  body('user_code')
    .notEmpty()
    .withMessage('کد کاربر الزامی است')
    .matches(/^USER[0-9]+$/)
    .withMessage('فرمت کد کاربر نامعتبر است'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetTransactions = [
  param('user_code')
    .optional()
    .matches(/^USER[0-9]+$/)
    .withMessage('فرمت کد کاربر نامعتبر است'),
  query('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('تعداد باید بین ۱ تا ۱۰۰۰۰ باشد'),
  query('start_date').optional().isString().withMessage('تاریخ شروع نامعتبر است'),
  query('end_date').optional().isString().withMessage('تاریخ پایان نامعتبر است'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateSearchUsers = [
  query('q')
    .notEmpty()
    .withMessage('متن جستجو الزامی است')
    .isLength({ min: 2 })
    .withMessage('حداقل ۲ کاراکتر برای جستجو نیاز است'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('تعداد باید بین ۱ تا ۵۰ باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateDeleteRecord = [
  param('id').isInt({ min: 1 }).withMessage('شناسه رکورد نامعتبر است'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateDeleteUserRecords = [
  param('user_code')
    .notEmpty()
    .withMessage('کد کاربر الزامی است')
    .matches(/^USER[0-9]+$/)
    .withMessage('فرمت کد کاربر نامعتبر است'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];