const db = require('../config/database');

class EntryRepository {
    /**
     * Create new entry
     */
    async create(entryData) {
       // Di method create - GANTI query dan values:
const query = `
    INSERT INTO entries (
        nama, no_resi, berat_resi, berat_aktual, selisih,
        foto_url_1, foto_url_2, notes, status, created_by  -- ❗UBAH: catatan → notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, nama, no_resi, berat_resi, berat_aktual, selisih,
              foto_url_1, foto_url_2, notes, status, created_by, created_at  -- ❗UBAH
`;

const values = [
    entryData.nama,
    entryData.no_resi,
    entryData.berat_resi,
    entryData.berat_aktual,
    entryData.selisih,
    entryData.foto_url_1,
    entryData.foto_url_2,
    entryData.notes || null,  // ❗UBAH: catatan → notes
    entryData.status,
    entryData.created_by
];

        try {
            const rows = await db.execute(query, values);
            return rows[0];
        } catch (error) {
            console.error('Repository create error:', error);
            
            if (error.code === '23505') { // PostgreSQL unique violation
                throw new Error('No Resi sudah ada dalam database');
            }
            
            throw new Error('Gagal menyimpan data ke database');
        }
    }

    /**
     * Find all entries with filters
     */
    async findAll(filter, limit, offset) {
        let query = `
            SELECT 
                id, nama, no_resi, berat_resi, berat_aktual, selisih,
                foto_url_1, foto_url_2, catatan, status,
                created_by, created_at, updated_by, updated_at
            FROM entries
            WHERE 1=1
        `;

        const values = [];
        let paramCount = 1;

        if (filter.search && filter.search.trim() !== '') {
            query += ` AND (nama ILIKE $${paramCount} OR no_resi ILIKE $${paramCount + 1})`;
            const searchTerm = `%${filter.search}%`;
            values.push(searchTerm, searchTerm);
            paramCount += 2;
        }

        if (filter.status && filter.status !== '') {
            query += ` AND status = $${paramCount}`;
            values.push(filter.status);
            paramCount++;
        }

        if (filter.username) {
            query += ` AND created_by = $${paramCount}`;
            values.push(filter.username);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC`;
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);

        try {
            const rows = await db.execute(query, values);
            return rows;
        } catch (error) {
            console.error('Repository findAll error:', error);
            throw new Error('Gagal mengambil data dari database');
        }
    }

    /**
     * Count entries with filters
     */
    async count(filter) {
        let query = `SELECT COUNT(*) as total FROM entries WHERE 1=1`;
        const values = [];
        let paramCount = 1;

        if (filter.search && filter.search.trim() !== '') {
            query += ` AND (nama ILIKE $${paramCount} OR no_resi ILIKE $${paramCount + 1})`;
            const searchTerm = `%${filter.search}%`;
            values.push(searchTerm, searchTerm);
            paramCount += 2;
        }

        if (filter.status && filter.status !== '') {
            query += ` AND status = $${paramCount}`;
            values.push(filter.status);
            paramCount++;
        }

        if (filter.username) {
            query += ` AND created_by = $${paramCount}`;
            values.push(filter.username);
        }

        try {
            const rows = await db.execute(query, values);
            return parseInt(rows[0].total);
        } catch (error) {
            console.error('Repository count error:', error);
            return 0;
        }
    }

    /**
     * Find recent entries
     */
    async findRecent(filter, limit) {
        let query = `
            SELECT 
                id, nama, no_resi, berat_resi, berat_aktual, selisih,
                foto_url_1, foto_url_2, status, created_by, created_at
            FROM entries
            WHERE 1=1
        `;

        const values = [];
        let paramCount = 1;

        if (filter.username) {
            query += ` AND created_by = $${paramCount}`;
            values.push(filter.username);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
        values.push(limit);

        try {
            const rows = await db.execute(query, values);
            return rows;
        } catch (error) {
            console.error('Repository findRecent error:', error);
            return [];
        }
    }

    /**
     * Find entry by ID
     */
    async findById(id) {
        const query = `
            SELECT 
                id, nama, no_resi, berat_resi, berat_aktual, selisih,
                foto_url_1, foto_url_2, catatan, status,
                created_by, created_at, updated_by, updated_at
            FROM entries
            WHERE id = $1
        `;

        try {
            const rows = await db.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Repository findById error:', error);
            return null;
        }
    }

    /**
     * Find entry by no_resi
     */
    async findByNoResi(noResi) {
        const query = `
            SELECT id, no_resi, created_at
            FROM entries
            WHERE no_resi = $1
        `;

        try {
            const rows = await db.execute(query, [noResi]);
            return rows[0] || null;
        } catch (error) {
            console.error('Repository findByNoResi error:', error);
            return null;
        }
    }

    /**
     * Update entry
     */
    async update(id, updateData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (updateData.status !== undefined) {
            fields.push(`status = $${paramCount}`);
            values.push(updateData.status);
            paramCount++;
        }

        if (updateData.catatan !== undefined) {
            fields.push(`catatan = $${paramCount}`);
            values.push(updateData.catatan);
            paramCount++;
        }

        if (updateData.updated_by) {
            fields.push(`updated_by = $${paramCount}`);
            values.push(updateData.updated_by);
            paramCount++;
        }

        if (fields.length === 0) {
            throw new Error('Tidak ada data untuk diupdate');
        }

        values.push(id);

        const query = `UPDATE entries SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`;

        try {
            const result = await db.query(query, values);

            if (result.rowCount === 0) {
                throw new Error('Entry tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('Repository update error:', error);
            throw new Error(error.message || 'Gagal update entry');
        }
    }

    /**
     * Delete entry
     */
    async delete(id) {
        const query = `DELETE FROM entries WHERE id = $1`;

        try {
            const result = await db.query(query, [id]);

            if (result.rowCount === 0) {
                throw new Error('Entry tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('Repository delete error:', error);
            throw new Error('Gagal menghapus entry');
        }
    }

    /**
     * Get statistics
     */
    async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as today,
                COALESCE(AVG(selisih), 0) as avg_selisih
            FROM entries
        `;

        try {
            const rows = await db.execute(query);
            return rows[0] || { total: 0, today: 0, avg_selisih: 0 };
        } catch (error) {
            console.error('Repository getStats error:', error);
            return { total: 0, today: 0, avg_selisih: 0 };
        }
    }

    /**
     * Find entries for export with date filter
     */
    async findForExport(filter) {
        let query = `
            SELECT 
                nama, no_resi, berat_resi, berat_aktual, selisih,
                status, created_by, created_at
            FROM entries
            WHERE 1=1
        `;

        const values = [];
        let paramCount = 1;

        if (filter.startDate) {
            query += ` AND created_at::date >= $${paramCount}`;
            values.push(filter.startDate);
            paramCount++;
        }

        if (filter.endDate) {
            query += ` AND created_at::date <= $${paramCount}`;
            values.push(filter.endDate);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC`;

        try {
            const rows = await db.execute(query, values);
            return rows;
        } catch (error) {
            console.error('Repository findForExport error:', error);
            return [];
        }
    }

    /**
     * Get entries by date range
     */
    async findByDateRange(startDate, endDate) {
        const query = `
            SELECT 
                id, nama, no_resi, berat_resi, berat_aktual, selisih,
                foto_url_1, foto_url_2, status, created_at
            FROM entries
            WHERE created_at::date BETWEEN $1 AND $2
            ORDER BY created_at DESC
        `;

        try {
            const rows = await db.execute(query, [startDate, endDate]);
            return rows;
        } catch (error) {
            console.error('Repository findByDateRange error:', error);
            return [];
        }
    }

    /**
     * Get statistics by date range
     */
    async getStatsByDateRange(startDate, endDate) {
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(selisih) as total_selisih,
                AVG(selisih) as avg_selisih,
                MIN(selisih) as min_selisih,
                MAX(selisih) as max_selisih
            FROM entries
            WHERE created_at::date BETWEEN $1 AND $2
        `;

        try {
            const rows = await db.execute(query, [startDate, endDate]);
            return rows[0] || {
                total: 0,
                total_selisih: 0,
                avg_selisih: 0,
                min_selisih: 0,
                max_selisih: 0
            };
        } catch (error) {
            console.error('Repository getStatsByDateRange error:', error);
            return {
                total: 0,
                total_selisih: 0,
                avg_selisih: 0,
                min_selisih: 0,
                max_selisih: 0
            };
        }
    }
}

module.exports = new EntryRepository();