"use strict";
// backend/src/modules/support/services/terms.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.termsService = exports.TermsService = void 0;
const terms_repository_1 = require("../repositories/terms.repository");
class TermsService {
    async getActiveTerms() {
        return terms_repository_1.termsRepository.getActiveTerms();
    }
    async getAllVersions(page = 1, limit = 10) {
        const result = await terms_repository_1.termsRepository.getAllVersions(page, limit);
        const termsWithAdminNames = await Promise.all(result.terms.map(async (term) => {
            let createdByName = 'سیستم';
            if (term.created_by) {
                createdByName = await terms_repository_1.termsRepository.getAdminName(term.created_by);
            }
            return {
                ...term,
                created_by_name: createdByName,
            };
        }));
        return {
            terms: termsWithAdminNames,
            total: result.total,
        };
    }
    async createTerms(data, adminId) {
        if (!data.content || !data.content.trim()) {
            throw new Error('متن شرایط و قوانین الزامی است');
        }
        return terms_repository_1.termsRepository.create(data, adminId);
    }
    async acceptTerms(userId) {
        const activeTerms = await terms_repository_1.termsRepository.getActiveTerms();
        if (!activeTerms) {
            return { success: true, message: 'هیچ شرایط و قوانینی برای پذیرش وجود ندارد', needsRedirect: true };
        }
        const alreadyAccepted = await terms_repository_1.termsRepository.checkUserAcceptedLatest(userId);
        if (alreadyAccepted) {
            return { success: true, message: 'شما قبلاً آخرین نسخه شرایط را پذیرفته‌اید', needsRedirect: true };
        }
        await terms_repository_1.termsRepository.acceptTerms(userId, activeTerms.version);
        return {
            success: true,
            message: `شرایط و قوانین نسخه ${activeTerms.version} با موفقیت ثبت شد`,
            needsRedirect: true,
        };
    }
    async checkUserAcceptance(userId) {
        const activeTerms = await terms_repository_1.termsRepository.getActiveTerms();
        const latestVersion = activeTerms?.version || null;
        const acceptance = await terms_repository_1.termsRepository.getUserAcceptance(userId);
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
    async getInitialTerms() {
        const activeTerms = await terms_repository_1.termsRepository.getActiveTerms();
        if (activeTerms)
            return activeTerms;
        const defaultTerms = {
            content: `لطفاً شرایط و قوانین را مطالعه فرمایید.

1. استفاده از سامانه به معنی پذیرش کامل قوانین می‌باشد.
2. اطلاعات شخصی کاربران محفوظ است و در اختیار شخص ثالث قرار نمی‌گیرد.
3. هرگونه سوء استفاده از سامانه پیگرد قانونی دارد.
4. سامانه حق تغییر قوانین را بدون اطلاع قبلی دارد.
5. کاربران موظف به رعایت قوانین جمهوری اسلامی ایران هستند.

با تشکر از همکاری شما`
        };
        return terms_repository_1.termsRepository.create(defaultTerms, 0);
    }
}
exports.TermsService = TermsService;
exports.termsService = new TermsService();
