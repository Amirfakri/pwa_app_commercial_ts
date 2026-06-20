// backend/src/core/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/winston';
import { AppError } from '../exceptions/AppError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`⚠️ Operational error: ${err.message}`, {
      statusCode: err.statusCode,
      code: err.code,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.error(`❌ Unhandled error: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      details: err.details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle PostgreSQL errors
  if (err.name === 'SequelizeValidationError' || (err as any).code === '23502') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message,
    });
    return;
  }

  if ((err as any).code === '23505') {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: err.message,
    });
    return;
  }

  if ((err as any).code === '23503') {
    res.status(400).json({
      success: false,
      error: 'Foreign key constraint violation',
      details: err.message,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message, stack: err.stack }),
  });
};