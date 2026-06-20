// backend/src/modules/auth/index.ts

import authRoutes from './routes/auth.routes';
import { authenticateSession, requireAdmin, AuthRequest } from './middlewares/auth.middleware';
import { authService } from './services/auth.service';
import { sessionService } from './services/session.service';
import { userRepository } from './repositories/user.repository';
import { sessionRepository } from './repositories/session.repository';

export {
  authRoutes,
  authenticateSession,
  requireAdmin,
  AuthRequest,
  authService,
  sessionService,
  userRepository,
  sessionRepository,
};