// backend/src/core/middleware/requestLogger.ts

import morgan from 'morgan';
import { stream } from '../logger/winston';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/winston';

export const requestLogger = morgan('combined', { stream });

// Detailed request logger for development
export const detailedRequestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });
  
  next();
};