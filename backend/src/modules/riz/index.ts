// ============================================
// 6. فایل ایندکس - backend/src/modules/riz/index.ts
// ============================================

import rizRoutes from './routes/riz.routes';
import { rizService } from './services/riz.service';
import { rizRepository } from './repositories/riz.repository';

export {
  rizRoutes,
  rizService,
  rizRepository
};