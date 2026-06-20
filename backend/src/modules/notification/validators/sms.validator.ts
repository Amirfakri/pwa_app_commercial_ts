// backend/src/modules/notification/validators/sms.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateSendSms = [
  body('receptor')
    .notEmpty()
    .withMessage('شماره گیرنده الزامی است')
    .matches(/^09[0-9]{9}$/)
    .withMessage('فرمت شماره موبایل نامعتبر است'),
  body('message')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('متن پیامک باید بین ۱ تا ۵۰۰ کاراکتر باشد'),
  body('bodyId')
    .optional()
    .isString()
    .withMessage('bodyId باید متن باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Either message or bodyId must be provided
    if (!req.body.message && !req.body.bodyId) {
      return res.status(400).json({ error: 'متن پیامک یا bodyId الزامی است' });
    }
    
    next();
  },
];

export const validateSendBulkSms = [
  body('receptors')
    .isArray()
    .withMessage('لیست گیرندگان باید به صورت آرایه باشد')
    .notEmpty()
    .withMessage('لیست گیرندگان نباید خالی باشد')
    .custom((value) => value.length <= 50)
    .withMessage('حداکثر 50 شماره مجاز است'),
  body('receptors.*')
    .matches(/^09[0-9]{9}$/)
    .withMessage('فرمت شماره موبایل نامعتبر است'),
  body('message')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('متن پیامک باید بین ۱ تا ۵۰۰ کاراکتر باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    if (!req.body.message && !req.body.bodyId) {
      return res.status(400).json({ error: 'متن پیامک یا bodyId الزامی است' });
    }
    
    next();
  },
];

export const validateSendOtp = [
  body('receptor')
    .notEmpty()
    .withMessage('شماره گیرنده الزامی است')
    .matches(/^09[0-9]{9}$/)
    .withMessage('فرمت شماره موبایل نامعتبر است'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateSearchCustomers = [
  query('q')
    .notEmpty()
    .withMessage('متن جستجو الزامی است')
    .isLength({ min: 2 })
    .withMessage('حداقل ۲ کاراکتر برای جستجو نیاز است'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];