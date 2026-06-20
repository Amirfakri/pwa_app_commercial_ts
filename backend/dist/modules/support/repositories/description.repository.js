"use strict";
// backend/src/modules/support/repositories/description.repository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.descriptionRepository = exports.DescriptionRepository = void 0;
const postgres_1 = require("../../../core/database/postgres");
class DescriptionRepository {
    pool;
    constructor() {
        this.pool = postgres_1.pool;
    }
    async findAll(onlyActive = true) {
        let query = `
      SELECT id, title, content, is_active, created_at, updated_at
      FROM page_descriptions
    `;
        if (onlyActive) {
            query += ` WHERE is_active = true`;
        }
        query += ` ORDER BY id ASC`;
        const { rows } = await this.pool.query(query);
        return rows;
    }
    async findById(id) {
        const { rows } = await this.pool.query(`SELECT id, title, content, is_active, created_at, updated_at
       FROM page_descriptions WHERE id = $1`, [id]);
        return rows[0] || null;
    }
    async findByPageId(pageId) {
        return this.findById(pageId);
    }
    async upsert(data) {
        const { rows } = await this.pool.query(`INSERT INTO page_descriptions (id, title, content, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()
       RETURNING id, title, content, is_active, created_at, updated_at`, [
            data.id,
            data.title,
            data.content,
            data.is_active !== undefined ? data.is_active : true,
        ]);
        return rows[0];
    }
    async bulkUpsert(descriptions) {
        const results = [];
        for (const desc of descriptions) {
            const result = await this.upsert(desc);
            results.push(result);
        }
        return results;
    }
    async update(id, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(data.title);
        }
        if (data.content !== undefined) {
            updates.push(`content = $${paramIndex++}`);
            values.push(data.content);
        }
        if (data.is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(data.is_active);
        }
        if (updates.length === 0)
            return null;
        updates.push(`updated_at = NOW()`);
        values.push(id);
        const { rows } = await this.pool.query(`UPDATE page_descriptions SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        return rows[0] || null;
    }
    async delete(id) {
        const { rowCount } = await this.pool.query('DELETE FROM page_descriptions WHERE id = $1', [id]);
        return (rowCount || 0) > 0;
    }
}
exports.DescriptionRepository = DescriptionRepository;
exports.descriptionRepository = new DescriptionRepository();
