"use strict";
// backend/src/modules/notification/repositories/notification.repository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = exports.NotificationRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class NotificationRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    // دریافت اعلان‌های یک کاربر خاص (هم عمومی و هم خصوصی)
    async findUserNotifications(userId, filters) {
        const { page = 1, limit = 20, is_read } = filters;
        const offset = (page - 1) * limit;
        let query = `
      SELECT 
        n.id, n.title, n.message_text, n.notification_type, 
        n.is_active, n.start_date, n.end_date, n.audience,
        n.created_at, n.updated_at,
        un.is_read, un.read_at
      FROM notifications n
      LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = $1
      WHERE (
        -- اعلان‌های عمومی
        n.audience = 'all'
        OR 
        -- اعلان‌های خصوصی این کاربر
        (n.audience = 'specific_user' AND n.user_id = $1)
        OR
        -- اعلان‌های نقش این کاربر (اگر کاربر نقش داشته باشد)
        (n.audience = 'specific_role' AND n.role IN (SELECT role FROM users WHERE id = $1))
      )
      AND n.is_active = true
      AND (n.start_date IS NULL OR n.start_date <= NOW())
      AND (n.end_date IS NULL OR n.end_date >= NOW())
    `;
        const params = [userId];
        let paramIndex = 2;
        if (is_read !== undefined) {
            if (is_read) {
                query += ` AND un.is_read = true`;
            }
            else {
                query += ` AND (un.is_read = false OR un.is_read IS NULL)`;
            }
        }
        const countQuery = `
      SELECT COUNT(*) as total FROM (
        ${query}
      ) as subquery
    `;
        query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);
        const [dataResult, countResult] = await Promise.all([
            this.pool.query(query, params),
            this.pool.query(countQuery, params.slice(0, params.length - 2))
        ]);
        return {
            notifications: dataResult.rows,
            total: parseInt(countResult.rows[0]?.total || '0')
        };
    }
    // دریافت اعلان‌های فعال (عمومی) برای نمایش در صفحه اصلی
    async findActive(userId) {
        let query = `
      SELECT id, title, message_text, notification_type, is_active,
             start_date, end_date, audience, user_id, role,
             created_by, created_at, updated_at
      FROM notifications 
      WHERE is_active = true 
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    `;
        if (userId) {
            query += `
        AND (
          audience = 'all'
          OR (audience = 'specific_user' AND user_id = $1)
          OR (audience = 'specific_role' AND role IN (SELECT role FROM users WHERE id = $1))
        )
      `;
            query += ` ORDER BY created_at DESC LIMIT 10`;
            const { rows } = await this.pool.query(query, [userId]);
            return rows;
        }
        else {
            query += ` AND audience = 'all' ORDER BY created_at DESC LIMIT 10`;
            const { rows } = await this.pool.query(query);
            return rows;
        }
    }
    // دریافت همه اعلان‌ها (برای ادمین)
    async findAll(filters) {
        const { is_active, page = 1, limit = 50, audience, user_id } = filters;
        const offset = (page - 1) * limit;
        let query = `
      SELECT n.*, u.first_name, u.last_name, u.code as user_code
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (is_active !== undefined) {
            query += ` AND n.is_active = $${paramIndex++}`;
            params.push(is_active);
        }
        if (audience) {
            query += ` AND n.audience = $${paramIndex++}`;
            params.push(audience);
        }
        if (user_id) {
            query += ` AND n.user_id = $${paramIndex++}`;
            params.push(user_id);
        }
        const countQuery = query.replace('SELECT n.*, u.first_name, u.last_name, u.code as user_code', 'SELECT COUNT(*) as total');
        query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);
        const [dataResult, countResult] = await Promise.all([
            this.pool.query(query, params),
            this.pool.query(countQuery, params.slice(0, params.length - 2))
        ]);
        return {
            notifications: dataResult.rows,
            total: parseInt(countResult.rows[0]?.total || '0')
        };
    }
    async findById(id) {
        const { rows } = await this.pool.query(`SELECT * FROM notifications WHERE id = $1`, [id]);
        return rows[0] || null;
    }
    async create(data, adminId) {
        const { rows } = await this.pool.query(`INSERT INTO notifications (
        title, message_text, notification_type, is_active,
        start_date, end_date, audience, user_id, role,
        created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`, [
            data.title || null,
            data.message_text,
            data.notification_type || 'info',
            data.is_active !== undefined ? data.is_active : true,
            data.start_date || null,
            data.end_date || null,
            data.audience || 'all',
            data.user_id || null,
            data.role || null,
            adminId
        ]);
        // اگر اعلان خصوصی است، رکوردهای user_notifications را ایجاد کن
        if (rows[0].audience === 'specific_user' && rows[0].user_id) {
            await this.createUserNotificationRecord(rows[0].id, rows[0].user_id);
        }
        return rows[0];
    }
    // ایجاد رکورد user_notifications برای اعلان خصوصی
    async createUserNotificationRecord(notificationId, userId) {
        await this.pool.query(`INSERT INTO user_notifications (notification_id, user_id, is_read, read_at, created_at)
       VALUES ($1, $2, false, NULL, NOW())
       ON CONFLICT (notification_id, user_id) DO NOTHING`, [notificationId, userId]);
    }
    // علامت زدن اعلان به عنوان خوانده شده
    async markAsRead(notificationId, userId) {
        const { rowCount } = await this.pool.query(`INSERT INTO user_notifications (notification_id, user_id, is_read, read_at, created_at)
       VALUES ($1, $2, true, NOW(), NOW())
       ON CONFLICT (notification_id, user_id) 
       DO UPDATE SET is_read = true, read_at = NOW()
       RETURNING *`, [notificationId, userId]);
        return (rowCount || 0) > 0;
    }
    // علامت زدن همه اعلان‌های کاربر به عنوان خوانده شده
    async markAllAsRead(userId) {
        // ابتدا اعلان‌های خوانده نشده کاربر را پیدا کن
        const { rows } = await this.pool.query(`SELECT n.id FROM notifications n
       WHERE (
         n.audience = 'all'
         OR (n.audience = 'specific_user' AND n.user_id = $1)
         OR (n.audience = 'specific_role' AND n.role IN (SELECT role FROM users WHERE id = $1))
       )
       AND n.is_active = true
       AND NOT EXISTS (
         SELECT 1 FROM user_notifications un 
         WHERE un.notification_id = n.id AND un.user_id = $1 AND un.is_read = true
       )`, [userId]);
        for (const row of rows) {
            await this.markAsRead(row.id, userId);
        }
        return rows.length;
    }
    // دریافت تعداد اعلان‌های خوانده نشده
    async getUnreadCount(userId) {
        const { rows } = await this.pool.query(`SELECT COUNT(*) as count FROM notifications n
       WHERE (
         n.audience = 'all'
         OR (n.audience = 'specific_user' AND n.user_id = $1)
         OR (n.audience = 'specific_role' AND n.role IN (SELECT role FROM users WHERE id = $1))
       )
       AND n.is_active = true
       AND (n.start_date IS NULL OR n.start_date <= NOW())
       AND (n.end_date IS NULL OR n.end_date >= NOW())
       AND NOT EXISTS (
         SELECT 1 FROM user_notifications un 
         WHERE un.notification_id = n.id AND un.user_id = $1 AND un.is_read = true
       )`, [userId]);
        return parseInt(rows[0]?.count || '0');
    }
    async update(id, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(data.title);
        }
        if (data.message_text !== undefined) {
            updates.push(`message_text = $${paramIndex++}`);
            values.push(data.message_text);
        }
        if (data.notification_type !== undefined) {
            updates.push(`notification_type = $${paramIndex++}`);
            values.push(data.notification_type);
        }
        if (data.is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(data.is_active);
        }
        if (data.start_date !== undefined) {
            updates.push(`start_date = $${paramIndex++}`);
            values.push(data.start_date);
        }
        if (data.end_date !== undefined) {
            updates.push(`end_date = $${paramIndex++}`);
            values.push(data.end_date);
        }
        if (data.audience !== undefined) {
            updates.push(`audience = $${paramIndex++}`);
            values.push(data.audience);
        }
        if (data.user_id !== undefined) {
            updates.push(`user_id = $${paramIndex++}`);
            values.push(data.user_id);
        }
        if (data.role !== undefined) {
            updates.push(`role = $${paramIndex++}`);
            values.push(data.role);
        }
        if (updates.length === 0)
            return null;
        updates.push(`updated_at = NOW()`);
        values.push(id);
        const { rows } = await this.pool.query(`UPDATE notifications SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        return rows[0] || null;
    }
    async delete(id) {
        // ابتدا رکوردهای مرتبط در user_notifications را حذف کن
        await this.pool.query('DELETE FROM user_notifications WHERE notification_id = $1', [id]);
        const { rowCount } = await this.pool.query('DELETE FROM notifications WHERE id = $1', [id]);
        return (rowCount || 0) > 0;
    }
}
exports.NotificationRepository = NotificationRepository;
exports.notificationRepository = new NotificationRepository();
