import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreatePrice = [
  body('product_code')
    .notEmpty()
    .withMessage('کد محصول الزامی است')
    .matches(/^(AB_|COIN_)/)
    .withMessage('کد محصول باید با AB_ (آبشده) یا COIN_ (سکه) شروع شود'),
  body('buy_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('قیمت خرید باید عدد مثبت باشد'),
  body('sell_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('قیمت فروش باید عدد مثبت باشد'),
  body('is_visible_buy')
    .optional()
    .isBoolean()
    .withMessage('وضعیت نمایش قیمت خرید باید true/false باشد'),
  body('is_visible_sell')
    .optional()
    .isBoolean()
    .withMessage('وضعیت نمایش قیمت فروش باید true/false باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdatePrice = [
  param('id').isInt().withMessage('شناسه قیمت نامعتبر است'),
  body('buy_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('قیمت خرید باید عدد مثبت باشد'),
  body('sell_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('قیمت فروش باید عدد مثبت باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetPrice = [
  query('product_code')
    .notEmpty()
    .withMessage('کد محصول الزامی است')
    .matches(/^(AB_|COIN_)/)
    .withMessage('کد محصول باید با AB_ (آبشده) یا COIN_ (سکه) شروع شود'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetPriceHistory = [
  query('product_code')
    .notEmpty()
    .withMessage('کد محصول الزامی است'),
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

export const validateUpdateOffsets = [
  body('melted_offset')
    .optional()
    .isFloat()
    .withMessage('افست آبشده باید عدد باشد'),
  body('coin_offset')
    .optional()
    .isFloat()
    .withMessage('افست سکه باید عدد باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];