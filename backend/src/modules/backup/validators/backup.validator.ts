import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateSqlBackup = [
  body('start_date')
    .notEmpty()
    .withMessage('تاریخ شروع الزامی است')
    .isISO8601()
    .withMessage('فرمت تاریخ شروع نامعتبر است'),
  body('end_date')
    .notEmpty()
    .withMessage('تاریخ پایان الزامی است')
    .isISO8601()
    .withMessage('فرمت تاریخ پایان نامعتبر است'),
  body('tables')
    .isArray()
    .withMessage('لیست جداول باید به صورت آرایه باشد')
    .notEmpty()
    .withMessage('حداقل یک جدول را انتخاب کنید'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateCleanupBackups = [
  body('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('تعداد روز باید بین ۱ تا ۳۶۵ باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetBackupHistory = [
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