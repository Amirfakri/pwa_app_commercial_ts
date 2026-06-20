// backend/src/core/security/cors.ts

import cors from 'cors';
import { Express } from 'express';
import config from '../config/index';
import { logger } from '../logger/winston';

export const configureCors = (app: Express): void => {
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow all localhost origins
      if (config.nodeEnv === 'development') {
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
      }

      // Check against allowed origins
      if (config.security.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Cache-Control',
      'x-csrf-token',
      'x-session-token',
      'x-device-id',
      'x-user-id',
      'Expires',
      'Pragma',
    ],
    exposedHeaders: ['Set-Cookie', 'Content-Length', 'Authorization', 'X-Session-Expires', 'X-Device-Id'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
    maxAge: 86400, // 24 hours
  };

  app.use(cors(corsOptions));
  
  // Handle preflight requests explicitly
  app.options('*', cors(corsOptions));
  
  logger.info('✅ CORS configured');
};