// backend/src/modules/admin/validators/admin.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateUser = [
  body('mobile_number')
    .notEmpty()
    .withMessage('شماره موبایل الزامی است')
    .matches(/^09[0-9]{9}$/)
    .withMessage('فرمت شماره موبایل نامعتبر است'),
  body('first_name').optional().isString().withMessage('نام باید متن باشد'),
  body('last_name').optional().isString().withMessage('نام خانوادگی باید متن باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateUser = [
  param('id').isInt().withMessage('شناسه کاربر نامعتبر است'),
  body('mobile_number')
    .optional()
    .matches(/^09[0-9]{9}$/)
    .withMessage('فرمت شماره موبایل نامعتبر است'),
  body('device_limit').optional().isInt({ min: 1 }).withMessage('محدودیت دستگاه باید عدد مثبت باشد'),
  body('melted_price_offset').optional().isFloat().withMessage('افست قیمت آبشده باید عدد باشد'),
  body('coin_price_offset').optional().isFloat().withMessage('افست قیمت سکه باید عدد باشد'),
  body('is_blocked').optional().isBoolean().withMessage('وضعیت بلاک باید true/false باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateCreateAdmin = [
  body('mobile_number')
    .notEmpty()
    .withMessage('شماره موبایل الزامی است')
    .matches(/^09[0-9]{9}$/)
    .withMessage('فرمت شماره موبایل نامعتبر است'),
  body('first_name').notEmpty().withMessage('نام الزامی است'),
  body('last_name').notEmpty().withMessage('نام خانوادگی الزامی است'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateAdmin = [
  param('id').isInt().withMessage('شناسه ادمین نامعتبر است'),
  body('is_active').optional().isBoolean().withMessage('وضعیت فعال باید true/false باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];