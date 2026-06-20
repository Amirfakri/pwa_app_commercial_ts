// backend/src/modules/auth/validators/auth.validator.ts

import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateLogin = [
  body('mobile')
    .notEmpty()
    .withMessage('شماره موبایل الزامی است')
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

export const validateVerifyOtp = [
  body('mobile')
    .notEmpty()
    .withMessage('شماره موبایل الزامی است')
    .matches(/^09[0-9]{9}$/)
    .withMessage('فرمت شماره موبایل نامعتبر است'),
  body('otp')
    .notEmpty()
    .withMessage('کد تأیید الزامی است')
    .isLength({ min: 6, max: 6 })
    .withMessage('کد تأیید باید ۶ رقم باشد'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateSendOtp = [
  body('receptor')
    .notEmpty()
    .withMessage('شماره موبایل الزامی است')
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

export const validateCheckUser = [
  param('mobile')
    .notEmpty()
    .withMessage('شماره موبایل الزامی است')
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