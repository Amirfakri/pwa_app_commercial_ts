// backend/src/modules/notification/index.ts

import notificationRoutes from './routes/notification.routes';
import smsRoutes from './routes/sms.routes';
import dailyMessageRoutes from './routes/dailyMessage.routes';
import { notificationService } from './services/notification.service';
import { smsService } from './services/sms.service';
import { dailyMessageService } from './services/dailyMessage.service';
import { smsProviderService } from './providers/sms.provider';
import { notificationRepository } from './repositories/notification.repository';

export {
  notificationRoutes,
  smsRoutes,
  dailyMessageRoutes,
  notificationService,
  smsService,
  dailyMessageService,
  smsProviderService,
  notificationRepository
};