// backend/src/modules/admin/validators/admin.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// ==================== اعتبارسنجی کاربران ====================

export const validateCreateUser = [
  body('mobile_number')
    .notEmpty()
    .withMessage('شماره موبایل الزامی است')
    .matches(/^09[0-9]{9}$/)
    .withMessage('فرمت شماره موبایل نامعتبر است'),
  body('first_name')
    .optional()
    .isString()
    .withMessage('نام باید متن باشد')
    .isLength({ max: 100 })
    .withMessage('نام نباید بیشتر از 100 کاراکتر باشد'),
  body('last_name')
    .optional()
    .isString()
    .withMessage('نام خانوادگی باید متن باشد')
    .isLength({ max: 100 })
    .withMessage('نام خانوادگی نباید بیشتر از 100 کاراکتر باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  },
];

export const validateUpdateUser = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('شناسه کاربر نامعتبر است'),
  body('code')
    .optional()
    .isString()
    .withMessage('کد کاربر باید متن باشد')
    .isLength({ min: 2, max: 50 })
    .withMessage('کد کاربر باید بین 2 تا 50 کاراکتر باشد')
    .matches(/^[A-Za-z0-9_\-]+$/)
    .withMessage('کد کاربر فقط می‌تواند شامل حروف انگلیسی، اعداد، خط تیره و زیرخط باشد'),
  body('mobile_number')
    .optional()
    .matches(/^09[0-9]{9}$/)
    .withMessage('فرمت شماره موبایل نامعتبر است'),
  body('first_name')
    .optional()
    .isString()
    .withMessage('نام باید متن باشد')
    .isLength({ max: 100 })
    .withMessage('نام نباید بیشتر از 100 کاراکتر باشد'),
  body('last_name')
    .optional()
    .isString()
    .withMessage('نام خانوادگی باید متن باشد')
    .isLength({ max: 100 })
    .withMessage('نام خانوادگی نباید بیشتر از 100 کاراکتر باشد'),
  body('device_limit')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('محدودیت دستگاه باید عدد بین 1 تا 10 باشد'),
  body('melted_price_offset')
    .optional()
    .isFloat()
    .withMessage('افست قیمت آبشده باید عدد باشد'),
  body('coin_price_offset')
    .optional()
    .isFloat()
    .withMessage('افست قیمت سکه باید عدد باشد'),
  body('is_blocked')
    .optional()
    .isBoolean()
    .withMessage('وضعیت بلاک باید true/false باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  },
];

// ==================== اعتبارسنجی ادمین‌ها ====================

export const validateCreateAdmin = [
  body('mobile_number')
    .notEmpty()
    .withMessage('شماره موبایل الزامی است')
    .matches(/^09[0-9]{9}$/)
    .withMessage('فرمت شماره موبایل نامعتبر است'),
  body('first_name')
    .notEmpty()
    .withMessage('نام الزامی است')
    .isString()
    .withMessage('نام باید متن باشد')
    .isLength({ max: 100 })
    .withMessage('نام نباید بیشتر از 100 کاراکتر باشد'),
  body('last_name')
    .notEmpty()
    .withMessage('نام خانوادگی الزامی است')
    .isString()
    .withMessage('نام خانوادگی باید متن باشد')
    .isLength({ max: 100 })
    .withMessage('نام خانوادگی نباید بیشتر از 100 کاراکتر باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  },
];

export const validateUpdateAdmin = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('شناسه ادمین نامعتبر است'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('وضعیت فعال باید true/false باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  },
];

// ==================== اعتبارسنجی صفحه‌بندی ====================

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('صفحه باید عدد مثبت باشد'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد'),
  query('search')
    .optional()
    .isString()
    .withMessage('جستجو باید متن باشد'),
  query('is_blocked')
    .optional()
    .isBoolean()
    .withMessage('وضعیت بلاک باید true/false باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  },
];

// ==================== اعتبارسنجی محصولات آبشده ====================

export const validateCreateMeltedProduct = [
  body('code')
    .notEmpty()
    .withMessage('کد محصول الزامی است')
    .isString()
    .withMessage('کد محصول باید متن باشد')
    .isLength({ max: 50 })
    .withMessage('کد محصول نباید بیشتر از 50 کاراکتر باشد'),
  body('name')
    .notEmpty()
    .withMessage('نام محصول الزامی است')
    .isString()
    .withMessage('نام محصول باید متن باشد')
    .isLength({ max: 100 })
    .withMessage('نام محصول نباید بیشتر از 100 کاراکتر باشد'),
  body('min_weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('حداقل وزن باید عدد مثبت باشد'),
  body('max_weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('حداکثر وزن باید عدد مثبت باشد'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('وضعیت فعال باید true/false باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  },
];

// ==================== اعتبارسنجی سکه‌ها ====================

export const validateCreateCoin = [
  body('code')
    .notEmpty()
    .withMessage('کد سکه الزامی است')
    .isString()
    .withMessage('کد سکه باید متن باشد')
    .isLength({ max: 50 })
    .withMessage('کد سکه نباید بیشتر از 50 کاراکتر باشد'),
  body('name')
    .notEmpty()
    .withMessage('نام سکه الزامی است')
    .isString()
    .withMessage('نام سکه باید متن باشد')
    .isLength({ max: 100 })
    .withMessage('نام سکه نباید بیشتر از 100 کاراکتر باشد'),
  body('min_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('حداقل تعداد باید عدد صحیح مثبت باشد'),
  body('max_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('حداکثر تعداد باید عدد صحیح مثبت باشد'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('وضعیت فعال باید true/false باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  },
];

// ==================== اعتبارسنجی تایمر ====================

export const validateUpdateTimer = [
  body('value')
    .notEmpty()
    .withMessage('مقدار تایمر الزامی است')
    .isInt({ min: 5, max: 300 })
    .withMessage('تایمر باید بین ۵ تا ۳۰۰ ثانیه باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  },
];