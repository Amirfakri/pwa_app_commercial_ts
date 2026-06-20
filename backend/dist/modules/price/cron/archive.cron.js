"use strict";
// backend/src/modules/price/cron/archive.cron.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initArchiveCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const history_repository_1 = require("../repositories/history.repository");
const initArchiveCron = () => {
    // Run every day at midnight (00:00:00)
    node_cron_1.default.schedule('0 0 * * *', async () => {
        try {
            const yesterday = (0, moment_timezone_1.default)().tz('Asia/Tehran').subtract(1, 'day').format('YYYY-MM-DD');
            const archivedCount = await history_repository_1.historyRepository.archiveYesterdayPrices(yesterday);
            if (archivedCount > 0) {
                console.log(`📦 Archived ${archivedCount} price records for date: ${yesterday}`);
            }
        }
        catch (err) {
            console.error('❌ Error archiving prices:', err);
        }
    });
};
exports.initArchiveCron = initArchiveCron;
