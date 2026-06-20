"use strict";
// backend/src/modules/transaction/services/timer.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timerService = exports.TimerService = void 0;
const postgres_1 = require("../../../core/database/postgres");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
class TimerService {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async getTimer() {
        const { rows } = await this.pool.query('SELECT value FROM timer WHERE id = 1');
        if (rows.length === 0) {
            return 30; // default timer
        }
        return parseInt(rows[0].value, 10);
    }
    async updateTimer(value, adminId) {
        const { rows } = await this.pool.query(`UPDATE timer SET value = $1, updated_at = NOW() WHERE id = 1 RETURNING *`, [value]);
        if (rows.length === 0) {
            const { rows: inserted } = await this.pool.query(`INSERT INTO timer (id, value, updated_at) VALUES (1, $1, NOW()) RETURNING *`, [value]);
            return inserted[0];
        }
        return rows[0];
    }
    calculateRemainingSeconds(createdAt, timerSeconds) {
        const now = (0, moment_timezone_1.default)().tz('Asia/Tehran');
        const created = (0, moment_timezone_1.default)(createdAt).tz('Asia/Tehran');
        const elapsed = now.diff(created, 'seconds');
        return Math.max(0, timerSeconds - elapsed);
    }
    getIranTimeString() {
        return (0, moment_timezone_1.default)().tz('Asia/Tehran').format('YYYY-MM-DD HH:mm:ss');
    }
}
exports.TimerService = TimerService;
exports.timerService = new TimerService();
