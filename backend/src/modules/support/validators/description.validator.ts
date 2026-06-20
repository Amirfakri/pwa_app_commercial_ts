// backend/src/modules/support/validators/description.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { PAGE_IDS } from '../types/support.types';

export const validateUpsertDescription = [
  body('id')
    .notEmpty()
    .withMessage('شناسه صفحه الزامی است')
    .isIn(Object.values(PAGE_IDS))
    .withMessage('شناسه صفحه نامعتبر است'),
  body('title')
    .notEmpty()
    .withMessage('عنوان الزامی است')
    .isLength({ max: 200 })
    .withMessage('عنوان نباید بیشتر از ۲۰۰ کاراکتر باشد'),
  body('content')
    .notEmpty()
    .withMessage('متن توضیح الزامی است'),
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

export const validateBulkUpsertDescriptions = [
  body('descriptions')
    .isArray()
    .withMessage('descriptions باید به صورت آرایه باشد')
    .notEmpty()
    .withMessage('لیست توضیحات نمی‌تواند خالی باشد'),
  body('descriptions.*.id')
    .notEmpty()
    .withMessage('شناسه صفحه برای همه آیتم‌ها الزامی است'),
  body('descriptions.*.title')
    .notEmpty()
    .withMessage('عنوان برای همه آیتم‌ها الزامی است'),
  body('descriptions.*.content')
    .notEmpty()
    .withMessage('متن توضیح برای همه آیتم‌ها الزامی است'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetDescription = [
  param('id')
    .notEmpty()
    .withMessage('شناسه صفحه الزامی است'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];