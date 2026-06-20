"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.termsService = exports.TermsService = void 0;
const terms_repository_1 = require("../repositories/terms.repository");
class TermsService {
    formatDate(date) {
        return date.toLocaleDateString('fa-IR') + ' - ' + date.toLocaleTimeString('fa-IR');
    }
    async getActiveTerms() {
        const terms = await terms_repository_1.termsRepository.getActiveTerms();
        if (!terms)
            return null;
        return {
            id: terms.id,
            content: terms.content,
            version: terms.version,
            created_at: this.formatDate(terms.created_at),
        };
    }
    async getAllVersions(page = 1, limit = 10) {
        const result = await terms_repository_1.termsRepository.getAllVersions(page, limit);
        const termsWithAdminNames = await Promise.all(result.terms.map(async (term) => {
            let createdByName = 'سیستم';
            if (term.created_by) {
                createdByName = await terms_repository_1.termsRepository.getAdminName(term.created_by);
            }
            return {
                id: term.id,
                content: term.content.substring(0, 200) + (term.content.length > 200 ? '...' : ''),
                version: term.version,
                is_active: term.is_active,
                created_at: this.formatDate(term.created_at),
                created_by_name: createdByName,
            };
        }));
        return {
            terms: termsWithAdminNames,
            total: result.total,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit),
            },
        };
    }
    async createTerms(content, adminId) {
        if (!content || !content.trim()) {
            throw new Error('متن شرایط و قوانین الزامی است');
        }
        if (content.length < 10) {
            throw new Error('متن شرایط و قوانین باید حداقل ۱۰ کاراکتر باشد');
        }
        const terms = await terms_repository_1.termsRepository.create(content, adminId);
        return {
            id: terms.id,
            version: terms.version,
            created_at: this.formatDate(terms.created_at),
        };
    }
    async acceptTerms(userId) {
        const activeTerms = await terms_repository_1.termsRepository.getActiveTerms();
        if (!activeTerms) {
            return {
                success: true,
                message: 'هیچ شرایط و قوانینی برای پذیرش وجود ندارد',
                version: null,
            };
        }
        const alreadyAccepted = await this.checkUserAcceptedLatest(userId);
        if (alreadyAccepted) {
            return {
                success: true,
                message: 'شما قبلاً آخرین نسخه شرایط را پذیرفته‌اید',
                version: activeTerms.version,
            };
        }
        await terms_repository_1.termsRepository.acceptTerms(userId, activeTerms.version);
        return {
            success: true,
            message: `شرایط و قوانین نسخه ${activeTerms.version} با موفقیت ثبت شد`,
            version: activeTerms.version,
        };
    }
    async checkUserAcceptedLatest(userId) {
        const latestTerms = await terms_repository_1.termsRepository.getActiveTerms();
        if (!latestTerms)
            return true;
        const acceptance = await terms_repository_1.termsRepository.getUserAcceptance(userId);
        if (!acceptance)
            return false;
        return acceptance.terms_version === latestTerms.version;
    }
    async getUserAcceptanceStatus(userId) {
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
        };
    }
    async debugTerms() {
        let tableExists = false;
        let activeCount = 0;
        let activeTerms = null;
        try {
            const { rows: tableCheck } = await terms_repository_1.termsRepository['pool'].query(`SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'terms_and_conditions'
        ) as exists`);
            tableExists = tableCheck[0]?.exists || false;
            if (tableExists) {
                const { rows } = await terms_repository_1.termsRepository['pool'].query(`SELECT COUNT(*) as count FROM terms_and_conditions WHERE is_active = true`);
                activeCount = parseInt(rows[0]?.count || '0');
                if (activeCount > 0) {
                    activeTerms = await terms_repository_1.termsRepository.getActiveTerms();
                }
            }
        }
        catch (error) {
            console.error('Debug error:', error);
        }
        return {
            table_exists: tableExists,
            active_terms_count: activeCount,
            active_terms: activeTerms,
            server_info: {
                node_version: process.version,
                server_time: new Date().toISOString(),
                server_time_iran: new Date().toLocaleString('fa-IR'),
            },
        };
    }
}
exports.TermsService = TermsService;
exports.termsService = new TermsService();
