"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'khoda123@',
    database: process.env.DB_DATABASE || 'pwa-app1',
});
async function initDatabase() {
    console.log('========================================');
    console.log('📦 Starting database initialization...');
    console.log('========================================\n');
    try {
        // خواندن فایل SQL
        const sqlPath = path_1.default.join(__dirname, 'init.sql');
        const sql = fs_1.default.readFileSync(sqlPath, 'utf8');
        console.log('📄 SQL file loaded successfully');
        console.log('🔄 Executing migrations...\n');
        // اجرای اسکریپت
        await pool.query(sql);
        console.log('\n========================================');
        console.log('✅ Database initialized successfully!');
        console.log('========================================');
        console.log('📊 All tables and indexes created');
        console.log('👑 Default admin: 09123456789');
        console.log('========================================\n');
    }
    catch (error) {
        console.error('\n❌ Error initializing database:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
initDatabase();
