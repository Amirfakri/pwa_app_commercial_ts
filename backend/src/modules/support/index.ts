// backend/src/modules/support/index.ts
import termsRoutes from './routes/terms.routes';
import descriptionRoutes from './routes/description.routes';
import { termsService } from './services/terms.service';
import { descriptionService } from './services/description.service';
import { termsRepository } from './repositories/terms.repository';
import { descriptionRepository } from './repositories/description.repository';

export {
  termsRoutes,
  descriptionRoutes,
  termsService,
  descriptionService,
  termsRepository,
  descriptionRepository
};