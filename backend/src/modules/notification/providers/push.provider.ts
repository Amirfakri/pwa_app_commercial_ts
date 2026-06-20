// backend/src/modules/notification/providers/push.provider.ts
export interface IPushResult {
  success: boolean;
  error?: string;
  data?: any;
}

export class PushProviderService {
  async sendToUser(userId: number, title: string, body: string, data?: any): Promise<IPushResult[]> {
    // در حال حاضر غیرفعال است
    console.log(`📱 Push notification would be sent to user ${userId}: ${title} - ${body}`);
    return [{ success: true, data: { message: 'Push disabled' } }];
  }

  async sendToAll(title: string, body: string, data?: any): Promise<IPushResult[]> {
    console.log(`📱 Push notification would be sent to all: ${title} - ${body}`);
    return [{ success: true, data: { message: 'Push disabled' } }];
  }
}

export const pushProviderService = new PushProviderService();