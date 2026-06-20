-- ============================================
-- PWA App Database - Complete Schema
-- ============================================

-- حذف جداول در صورت وجود (برای ریست کامل)
DROP TABLE IF EXISTS backup_logs CASCADE;
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS sms_batches CASCADE;
DROP TABLE IF EXISTS user_terms_acceptance CASCADE;
DROP TABLE IF EXISTS terms_and_conditions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS daily_messages CASCADE;
DROP TABLE IF EXISTS remittances CASCADE;
DROP TABLE IF EXISTS riz CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS prices CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS token_blacklist CASCADE;
DROP TABLE IF EXISTS user_registrations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS melted_products CASCADE;
DROP TABLE IF EXISTS coins CASCADE;
DROP TABLE IF EXISTS timer CASCADE;

-- ============================================
-- 1. جداول اصلی
-- ============================================

-- جدول ادمین‌ها
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    mobile_number VARCHAR(11) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_main_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول کاربران
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    mobile_number VARCHAR(11) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    code VARCHAR(20) UNIQUE,
    is_blocked BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    device_limit INTEGER DEFAULT 1,
    melted_price_offset DECIMAL(15, 0) DEFAULT 0,
    coin_price_offset DECIMAL(15, 0) DEFAULT 0,
    show_gram BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول درخواست‌های ثبت‌نام
CREATE TABLE IF NOT EXISTS user_registrations (
    id SERIAL PRIMARY KEY,
    mobile_number VARCHAR(11) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    national_code VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER REFERENCES admins(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول نشست‌ها
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    device_name VARCHAR(100),
    device_type VARCHAR(50),
    ip_address VARCHAR(50),
    browser VARCHAR(100),
    platform VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول بلاک‌لیست توکن
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    token_type VARCHAR(20) DEFAULT 'access',
    reason VARCHAR(100),
    revoked_by INTEGER,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. جداول قیمت و محصولات
-- ============================================

-- جدول قیمت‌ها
CREATE TABLE IF NOT EXISTS prices (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL,
    buy_price DECIMAL(15, 0),
    sell_price DECIMAL(15, 0),
    is_visible_buy BOOLEAN DEFAULT TRUE,
    is_visible_sell BOOLEAN DEFAULT TRUE,
    display_name VARCHAR(200),
    price_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_code, price_date)
);

-- جدول تاریخچه قیمت‌ها
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL,
    buy_price DECIMAL(15, 0),
    sell_price DECIMAL(15, 0),
    is_visible_buy BOOLEAN DEFAULT TRUE,
    is_visible_sell BOOLEAN DEFAULT TRUE,
    display_name VARCHAR(200),
    price_date DATE NOT NULL,
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول محصولات آبشده
CREATE TABLE IF NOT EXISTS melted_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    min_weight DECIMAL(10, 3) DEFAULT 0.001,
    max_weight DECIMAL(10, 3) DEFAULT 100,
    default_display_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول سکه‌ها
CREATE TABLE IF NOT EXISTS coins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    min_count INTEGER DEFAULT 1,
    max_count INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. جداول تراکنش و تایمر
-- ============================================

-- جدول تراکنش‌ها
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price_id INTEGER REFERENCES prices(id),
    product_code VARCHAR(50) NOT NULL,
    display_name VARCHAR(200),
    type VARCHAR(10) NOT NULL CHECK (type IN ('خرید', 'فروش')),
    coin_quantity INTEGER,
    melted_weight DECIMAL(15, 6),
    amount BIGINT NOT NULL,
    transaction_price DECIMAL(15, 0),
    base_price DECIMAL(15, 0),
    applied_offset DECIMAL(15, 0) DEFAULT 0,
    user_melted_offset DECIMAL(15, 0) DEFAULT 0,
    user_coin_offset DECIMAL(15, 0) DEFAULT 0,
    offset_type VARCHAR(10) CHECK (offset_type IN ('melted', 'coin')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول تایمر
CREATE TABLE IF NOT EXISTS timer (
    id INTEGER PRIMARY KEY DEFAULT 1,
    value INTEGER NOT NULL DEFAULT 30,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. جداول حواله و ریزحساب
-- ============================================

-- جدول حواله‌ها
CREATE TABLE IF NOT EXISTS remittances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('وزنی', 'ریالی', 'سکه')),
    weight DECIMAL(15, 6),
    amount BIGINT,
    coin_count INTEGER,
    recipient VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'در حال بررسی' CHECK (status IN ('در حال بررسی', 'تأییدشده', 'ردشده', 'تحویل شده')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول ریزحساب (حسابداری)
CREATE TABLE IF NOT EXISTS riz (
    id SERIAL PRIMARY KEY,
    user_code VARCHAR(20) NOT NULL,
    document_no VARCHAR(50) NOT NULL,
    invoice_no VARCHAR(50),
    date VARCHAR(20),
    description TEXT,
    weight DECIMAL(15, 6),
    weight_debit DECIMAL(15, 6) DEFAULT 0,
    weight_credit DECIMAL(15, 6) DEFAULT 0,
    rate INTEGER,
    wage DECIMAL(15, 0) DEFAULT 0,
    balance_weight DECIMAL(15, 6) DEFAULT 0,
    debit_amount BIGINT DEFAULT 0,
    credit_amount BIGINT DEFAULT 0,
    balance_amount BIGINT DEFAULT 0,
    raw_json JSONB,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. جداول اعلان و پیامک
-- ============================================

-- جدول اعلان‌ها
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    message_text TEXT NOT NULL,
    notification_type VARCHAR(20) DEFAULT 'info' CHECK (notification_type IN ('info', 'warning', 'success', 'error', 'simple')),
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول پیام‌های روزانه
CREATE TABLE IF NOT EXISTS daily_messages (
    id SERIAL PRIMARY KEY,
    message_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول لاگ پیامک‌ها
CREATE TABLE IF NOT EXISTS sms_logs (
    id VARCHAR(50) PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id),
    receptor VARCHAR(11) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
    sms_id VARCHAR(100),
    provider VARCHAR(50),
    batch_id VARCHAR(50),
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول دسته‌های ارسال گروهی
CREATE TABLE IF NOT EXISTS sms_batches (
    id VARCHAR(50) PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id),
    total_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. جداول قوانین و بکاپ
-- ============================================

-- جدول شرایط و قوانین
CREATE TABLE IF NOT EXISTS terms_and_conditions (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    version VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول پذیرش قوانین توسط کاربران
CREATE TABLE IF NOT EXISTS user_terms_acceptance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    terms_version VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- جدول لاگ بکاپ‌ها
CREATE TABLE IF NOT EXISTS backup_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id),
    tables TEXT,
    record_count INTEGER DEFAULT 0,
    file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. ایندکس‌ها (برای بهبود عملکرد)
-- ============================================

CREATE INDEX idx_users_mobile ON users(mobile_number);
CREATE INDEX idx_users_code ON users(code);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_prices_product ON prices(product_code);
CREATE INDEX idx_prices_date ON prices(price_date);
CREATE INDEX idx_riz_user_code ON riz(user_code);
CREATE INDEX idx_riz_date ON riz(date);
CREATE INDEX idx_remittances_user ON remittances(user_id);
CREATE INDEX idx_remittances_status ON remittances(status);
CREATE INDEX idx_sms_logs_receptor ON sms_logs(receptor);
CREATE INDEX idx_notifications_active ON notifications(is_active);

-- ============================================
-- 8. داده‌های اولیه (Seed Data)
-- ============================================

-- درج ادمین اصلی
INSERT INTO admins (mobile_number, first_name, last_name, is_main_admin, is_active) 
VALUES ('09123456789', 'مدیر', 'سیستم', TRUE, TRUE)
ON CONFLICT (mobile_number) DO NOTHING;

-- درج تایمر پیش‌فرض
INSERT INTO timer (id, value) VALUES (1, 30) ON CONFLICT (id) DO NOTHING;

-- درج محصولات آبشده
INSERT INTO melted_products (name, code, min_weight, max_weight, default_display_name, display_order) VALUES
('طلای ۱۸ عیار', 'AB_FARDA', 0.001, 100, 'طلای ۱۸ عیار', 1),
('طلای ۱۸ عیار (یک روز پس‌فردا)', 'AB_PASFARDA', 0.001, 100, 'طلای ۱۸ عیار (یک روز پس‌فردا)', 2)
ON CONFLICT (code) DO NOTHING;

-- درج سکه‌ها
INSERT INTO coins (name, code, min_count, max_count, display_order) VALUES
('سکه تمام بهار آزادی', 'COIN_1', 1, 50, 1),
('نیم سکه', 'COIN_2', 1, 50, 2),
('ربع سکه', 'COIN_3', 1, 50, 3)
ON CONFLICT (code) DO NOTHING;

-- درج یک نمونه قیمت برای امروز
INSERT INTO prices (product_code, buy_price, sell_price, display_name, price_date) 
SELECT 'AB_FARDA', 3500000, 3550000, 'طلای ۱۸ عیار', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM prices WHERE product_code = 'AB_FARDA' AND price_date = CURRENT_DATE);

INSERT INTO prices (product_code, buy_price, sell_price, display_name, price_date) 
SELECT 'COIN_1', 45000000, 45500000, 'سکه تمام بهار آزادی', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM prices WHERE product_code = 'COIN_1' AND price_date = CURRENT_DATE);

-- درج یک نمونه پیام روزانه
INSERT INTO daily_messages (message_text, is_active) 
SELECT 'به سامانه معاملات طلا خوش آمدید', TRUE
WHERE NOT EXISTS (SELECT 1 FROM daily_messages WHERE is_active = TRUE);

-- درج نسخه اولیه قوانین
INSERT INTO terms_and_conditions (content, version, is_active) 
SELECT 'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ...', '1.0.0', TRUE
WHERE NOT EXISTS (SELECT 1 FROM terms_and_conditions WHERE is_active = TRUE);

-- ============================================
-- 9. نمایش نتیجه نهایی
-- ============================================
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Database initialized successfully!';
    RAISE NOTICE '📊 Total tables created: %', table_count;
    RAISE NOTICE '👑 Admin user created: 09123456789';
    RAISE NOTICE '==========================================';
END $$;