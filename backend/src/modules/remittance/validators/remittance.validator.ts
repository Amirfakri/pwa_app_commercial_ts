// backend/src/modules/remittance/validators/remittance.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateRemittance = [
  body('type')
    .notEmpty()
    .withMessage('نوع حواله الزامی است')
    .isIn(['وزنی', 'ریالی', 'سکه'])
    .withMessage('نوع حواله باید وزنی، ریالی یا سکه باشد'),
  body('weight')
    .if(body('type').equals('وزنی'))
    .notEmpty()
    .withMessage('وزن برای حواله وزنی الزامی است')
    .isFloat({ min: 0.001 })
    .withMessage('وزن باید یک عدد مثبت باشد'),
  body('amount')
    .if(body('type').equals('ریالی'))
    .notEmpty()
    .withMessage('مبلغ برای حواله ریالی الزامی است')
    .isFloat({ min: 1000 })
    .withMessage('مبلغ باید حداقل ۱۰۰۰ ریال باشد'),
  body('coin_count')
    .if(body('type').equals('سکه'))
    .notEmpty()
    .withMessage('تعداد سکه برای حواله سکه الزامی است')
    .isInt({ min: 1 })
    .withMessage('تعداد سکه باید یک عدد صحیح مثبت باشد'),
  body('recipient')
    .notEmpty()
    .withMessage('نام گیرنده الزامی است')
    .isLength({ min: 2, max: 100 })
    .withMessage('نام گیرنده باید بین ۲ تا ۱۰۰ کاراکتر باشد'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateRemittanceStatus = [
  param('id').isInt().withMessage('شناسه حواله نامعتبر است'),
  body('status')
    .notEmpty()
    .withMessage('وضعیت الزامی است')
    .isIn(['در حال بررسی', 'تأییدشده', 'ردشده', 'تحویل شده'])
    .withMessage('وضعیت نامعتبر است'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetRemittances = [
  query('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد'),
  query('start_date').optional().isString().withMessage('تاریخ شروع نامعتبر است'),
  query('end_date').optional().isString().withMessage('تاریخ پایان نامعتبر است'),
  query('status')
    .optional()
    .isIn(['در حال بررسی', 'تأییدشده', 'ردشده', 'تحویل شده'])
    .withMessage('وضعیت نامعتبر است'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateSearchRemittances = [
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