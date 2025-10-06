const db = require('../config/database');

class UserRepository {
    /**
     * Create new user
     */
    async create(userData) {
        const query = `
            INSERT INTO users (username, password, email, full_name, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, email, full_name, role, created_at
        `;

        const values = [
            userData.username,
            userData.password,
            userData.email,
            userData.full_name,
            userData.role || 'user'
        ];

        try {
            const rows = await db.execute(query, values);
            return rows[0];
        } catch (error) {
            console.error('User repository create error:', error);
            
            if (error.code === '23505') { // PostgreSQL unique violation
                throw new Error('Username atau email sudah digunakan');
            }
            
            throw new Error('Gagal membuat user');
        }
    }

    /**
     * Find user by username
     */
    async findByUsername(username) {
        const query = `
            SELECT id, username, password, email, full_name, role, is_active, 
                   created_at, updated_at, last_login
            FROM users
            WHERE username = $1
        `;

        try {
            const rows = await db.execute(query, [username]);
            return rows[0] || null;
        } catch (error) {
            console.error('User repository findByUsername error:', error);
            return null;
        }
    }

    /**
     * Find user by email
     */
    async findByEmail(email) {
        const query = `
            SELECT id, username, password, email, full_name, role, is_active,
                   created_at, updated_at
            FROM users
            WHERE email = $1
        `;

        try {
            const rows = await db.execute(query, [email]);
            return rows[0] || null;
        } catch (error) {
            console.error('User repository findByEmail error:', error);
            return null;
        }
    }

    /**
     * Find user by ID
     */
    async findById(id) {
        const query = `
            SELECT id, username, email, full_name, role, is_active,
                   created_at, updated_at, last_login
            FROM users
            WHERE id = $1
        `;

        try {
            const rows = await db.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('User repository findById error:', error);
            return null;
        }
    }

    /**
     * Find all users
     */
    async findAll(filter = {}, limit = 50, offset = 0) {
        let query = `
            SELECT id, username, email, full_name, role, is_active,
                   created_at, last_login
            FROM users
            WHERE 1=1
        `;

        const values = [];
        let paramCount = 1;

        if (filter.role) {
            query += ` AND role = $${paramCount}`;
            values.push(filter.role);
            paramCount++;
        }

        if (filter.is_active !== undefined) {
            query += ` AND is_active = $${paramCount}`;
            values.push(filter.is_active);
            paramCount++;
        }

        if (filter.search) {
            query += ` AND (username ILIKE $${paramCount} OR email ILIKE $${paramCount + 1} OR full_name ILIKE $${paramCount + 2})`;
            const searchTerm = `%${filter.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
            paramCount += 3;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);

        try {
            const rows = await db.execute(query, values);
            return rows;
        } catch (error) {
            console.error('User repository findAll error:', error);
            return [];
        }
    }

    /**
     * Count users
     */
    async count(filter = {}) {
        let query = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
        const values = [];
        let paramCount = 1;

        if (filter.role) {
            query += ` AND role = $${paramCount}`;
            values.push(filter.role);
            paramCount++;
        }

        if (filter.is_active !== undefined) {
            query += ` AND is_active = $${paramCount}`;
            values.push(filter.is_active);
            paramCount++;
        }

        if (filter.search) {
            query += ` AND (username ILIKE $${paramCount} OR email ILIKE $${paramCount + 1} OR full_name ILIKE $${paramCount + 2})`;
            const searchTerm = `%${filter.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        try {
            const rows = await db.execute(query, values);
            return parseInt(rows[0].total);
        } catch (error) {
            console.error('User repository count error:', error);
            return 0;
        }
    }

    /**
     * Update user
     */
    async update(id, updateData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (updateData.email !== undefined) {
            fields.push(`email = $${paramCount}`);
            values.push(updateData.email);
            paramCount++;
        }

        if (updateData.full_name !== undefined) {
            fields.push(`full_name = $${paramCount}`);
            values.push(updateData.full_name);
            paramCount++;
        }

        if (updateData.role !== undefined) {
            fields.push(`role = $${paramCount}`);
            values.push(updateData.role);
            paramCount++;
        }

        if (updateData.is_active !== undefined) {
            fields.push(`is_active = $${paramCount}`);
            values.push(updateData.is_active);
            paramCount++;
        }

        if (fields.length === 0) {
            throw new Error('Tidak ada data untuk diupdate');
        }

        values.push(id);

        const query = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`;

        try {
            const result = await db.query(query, values);

            if (result.rowCount === 0) {
                throw new Error('User tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('User repository update error:', error);
            throw new Error(error.message || 'Gagal update user');
        }
    }

    /**
     * Update password
     */
    async updatePassword(id, hashedPassword) {
        const query = `
            UPDATE users 
            SET password = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `;

        try {
            const result = await db.query(query, [hashedPassword, id]);

            if (result.rowCount === 0) {
                throw new Error('User tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('User repository updatePassword error:', error);
            throw new Error('Gagal update password');
        }
    }

    /**
     * Update last login time
     */
    async updateLastLogin(id) {
        const query = `
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP
            WHERE id = $1
        `;

        try {
            await db.execute(query, [id]);
            return { success: true };
        } catch (error) {
            console.error('User repository updateLastLogin error:', error);
            return { success: false };
        }
    }

    /**
     * Delete user (soft delete by setting is_active = false)
     */
    async softDelete(id) {
        const query = `
            UPDATE users 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;

        try {
            const result = await db.query(query, [id]);

            if (result.rowCount === 0) {
                throw new Error('User tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('User repository softDelete error:', error);
            throw new Error('Gagal menghapus user');
        }
    }

    /**
     * Delete user permanently
     */
    async delete(id) {
        const query = `DELETE FROM users WHERE id = $1`;

        try {
            const result = await db.query(query, [id]);

            if (result.rowCount === 0) {
                throw new Error('User tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('User repository delete error:', error);
            throw new Error('Gagal menghapus user');
        }
    }

    /**
     * Activate user
     */
    async activate(id) {
        const query = `
            UPDATE users 
            SET is_active = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;

        try {
            const result = await db.query(query, [id]);

            if (result.rowCount === 0) {
                throw new Error('User tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('User repository activate error:', error);
            throw new Error('Gagal mengaktifkan user');
        }
    }

    /**
     * Get user statistics
     */
    async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admin,
                COUNT(CASE WHEN role = 'user' THEN 1 END) as total_user,
                COUNT(CASE WHEN is_active = true THEN 1 END) as total_active,
                COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as today_registered
            FROM users
        `;

        try {
            const rows = await db.execute(query);
            return rows[0] || {
                total: 0,
                total_admin: 0,
                total_user: 0,
                total_active: 0,
                today_registered: 0
            };
        } catch (error) {
            console.error('User repository getStats error:', error);
            return {
                total: 0,
                total_admin: 0,
                total_user: 0,
                total_active: 0,
                today_registered: 0
            };
        }
    }

    /**
     * Check if username exists
     */
    async usernameExists(username) {
        const query = `SELECT id FROM users WHERE username = $1`;

        try {
            const rows = await db.execute(query, [username]);
            return rows.length > 0;
        } catch (error) {
            console.error('User repository usernameExists error:', error);
            return false;
        }
    }

    /**
     * Check if email exists
     */
    async emailExists(email) {
        const query = `SELECT id FROM users WHERE email = $1`;

        try {
            const rows = await db.execute(query, [email]);
            return rows.length > 0;
        } catch (error) {
            console.error('User repository emailExists error:', error);
            return false;
        }
    }
}

module.exports = new UserRepository();