// backend/src/modules/support/services/terms.service.ts

import { termsRepository } from '../repositories/terms.repository';
import { ITermsAndConditions, ICreateTermsInput } from '../types/support.types';

export class TermsService {
  async getActiveTerms(): Promise<ITermsAndConditions | null> {
    return termsRepository.getActiveTerms();
  }

  async getAllVersions(page: number = 1, limit: number = 10) {
    const result = await termsRepository.getAllVersions(page, limit);
    
    const termsWithAdminNames = await Promise.all(
      result.terms.map(async (term) => {
        let createdByName = 'سیستم';
        if (term.created_by) {
          createdByName = await termsRepository.getAdminName(term.created_by);
        }
        return {
          ...term,
          created_by_name: createdByName,
        };
      })
    );

    return {
      terms: termsWithAdminNames,
      total: result.total,
    };
  }

  async createTerms(data: ICreateTermsInput, adminId: number): Promise<ITermsAndConditions> {
    if (!data.content || !data.content.trim()) {
      throw new Error('متن شرایط و قوانین الزامی است');
    }
    return termsRepository.create(data, adminId);
  }

  async acceptTerms(userId: number): Promise<{ success: boolean; message: string; needsRedirect: boolean }> {
    const activeTerms = await termsRepository.getActiveTerms();
    
    if (!activeTerms) {
      return { success: true, message: 'هیچ شرایط و قوانینی برای پذیرش وجود ندارد', needsRedirect: true };
    }

    const alreadyAccepted = await termsRepository.checkUserAcceptedLatest(userId);
    
    if (alreadyAccepted) {
      return { success: true, message: 'شما قبلاً آخرین نسخه شرایط را پذیرفته‌اید', needsRedirect: true };
    }

    await termsRepository.acceptTerms(userId, activeTerms.version);
    
    return {
      success: true,
      message: `شرایط و قوانین نسخه ${activeTerms.version} با موفقیت ثبت شد`,
      needsRedirect: true,
    };
  }

  async checkUserAcceptance(userId: number): Promise<{
    hasAccepted: boolean;
    latestVersion: string | null;
    userVersion: string | null;
    needsAcceptance: boolean;
    terms: ITermsAndConditions | null;
  }> {
    const activeTerms = await termsRepository.getActiveTerms();
    const latestVersion = activeTerms?.version || null;
    
    const acceptance = await termsRepository.getUserAcceptance(userId);
    const userVersion = acceptance?.terms_version || null;
    
    const hasAccepted = !!acceptance;
    const needsAcceptance = latestVersion !== null && userVersion !== latestVersion;

    return {
      hasAccepted,
      latestVersion,
      userVersion,
      needsAcceptance,
      terms: activeTerms,
    };
  }

  async getInitialTerms(): Promise<ITermsAndConditions | null> {
    const activeTerms = await termsRepository.getActiveTerms();
    if (activeTerms) return activeTerms;
    
    const defaultTerms: ICreateTermsInput = {
      content: `لطفاً شرایط و قوانین را مطالعه فرمایید.

1. استفاده از سامانه به معنی پذیرش کامل قوانین می‌باشد.
2. اطلاعات شخصی کاربران محفوظ است و در اختیار شخص ثالث قرار نمی‌گیرد.
3. هرگونه سوء استفاده از سامانه پیگرد قانونی دارد.
4. سامانه حق تغییر قوانین را بدون اطلاع قبلی دارد.
5. کاربران موظف به رعایت قوانین جمهوری اسلامی ایران هستند.

با تشکر از همکاری شما`
    };
    
    return termsRepository.create(defaultTerms, 0);
  }
}

export const termsService = new TermsService();