
import rateLimit from 'express-rate-limit';
import { redis } from '../database/redis';
import { logger } from '../logger/winston';

export const rateLimiters = {
  general: rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many auth requests',
  }),
  
  otp: rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: 'Too many OTP requests',
  }),
  
  transactions: rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many transaction requests',
  }),
  
  reports: rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: 'Too many report requests',
  }),
  
  upload: rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: 'Too many upload requests',
  }),
};
