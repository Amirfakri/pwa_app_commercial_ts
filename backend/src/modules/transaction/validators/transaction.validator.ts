// backend/src/modules/transaction/validators/transaction.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateTransaction = [
  body('product_code')
    .notEmpty()
    .withMessage('کد محصول الزامی است')
    .matches(/^(AB_|COIN_)/)
    .withMessage('کد محصول باید با AB_ (آبشده) یا COIN_ (سکه) شروع شود'),
  body('type')
    .notEmpty()
    .withMessage('نوع معامله الزامی است')
    .isIn(['buy', 'sell', 'خرید', 'فروش'])
    .withMessage('نوع معامله باید خرید یا فروش باشد'),
  body('amount')
    .notEmpty()
    .withMessage('مبلغ الزامی است')
    .isFloat({ min: 0.01 })
    .withMessage('مبلغ باید یک عدد مثبت باشد'),
  body('coin_quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('تعداد سکه باید عدد صحیح مثبت باشد'),
  body('melted_weight')
    .optional()
    .isFloat({ min: 0.001 })
    .withMessage('وزن باید عدد مثبت باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateTransactionStatus = [
  param('id').isInt().withMessage('شناسه تراکنش نامعتبر است'),
  body('status')
    .notEmpty()
    .withMessage('وضعیت الزامی است')
    .isIn(['approved', 'rejected'])
    .withMessage('وضعیت باید approved یا rejected باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateTransaction = [
  param('id').isInt().withMessage('شناسه تراکنش نامعتبر است'),
  body('status')
    .optional()
    .isIn(['approved', 'rejected', 'pending', 'expired', 'cancelled'])
    .withMessage('وضعیت نامعتبر است'),
  body('type')
    .optional()
    .isIn(['buy', 'sell', 'خرید', 'فروش'])
    .withMessage('نوع معامله نامعتبر است'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('مبلغ باید عدد مثبت باشد'),
  body('transaction_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('قیمت تراکنش باید عدد باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateCreateManualTransaction = [
  body('product_code')
    .notEmpty()
    .withMessage('کد محصول الزامی است')
    .matches(/^(AB_|COIN_)/)
    .withMessage('کد محصول باید با AB_ (آبشده) یا COIN_ (سکه) شروع شود'),
  body('type')
    .notEmpty()
    .withMessage('نوع معامله الزامی است')
    .isIn(['buy', 'sell', 'خرید', 'فروش'])
    .withMessage('نوع معامله باید خرید یا فروش باشد'),
  body('user_id')
    .notEmpty()
    .isInt({ min: 1 })
    .withMessage('شناسه کاربر الزامی است'),
  body('amount')
    .notEmpty()
    .isFloat({ min: 0.01 })
    .withMessage('مبلغ باید یک عدد مثبت باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetTransactions = [
  query('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد'),
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

export const validateTimer = [
  body('timer')
    .notEmpty()
    .withMessage('مقدار تایمر الزامی است')
    .isInt({ min: 5, max: 300 })
    .withMessage('تایمر باید بین ۵ تا ۳۰۰ ثانیه باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];