const { supabase } = require('../config/database');

class EntryRepository {
    /**
     * Create new entry
     */
    async create(entryData) {
        try {
            const { data, error } = await supabase
                .from('entries')
                .insert([{
                    nama: entryData.nama,
                    no_resi: entryData.no_resi,
                    berat_resi: entryData.berat_resi,
                    berat_aktual: entryData.berat_aktual,
                    selisih: entryData.selisih,
                    foto_url_1: entryData.foto_url_1,
                    foto_url_2: entryData.foto_url_2,
                    catatan: entryData.catatan || entryData.notes || null,
                    status: entryData.status,
                    created_by: entryData.created_by
                }])
                .select('id, nama, no_resi, berat_resi, berat_aktual, selisih, foto_url_1, foto_url_2, catatan, status, created_by, created_at')
                .single();

            if (error) {
                if (error.code === '23505') { // PostgreSQL unique violation
                    throw new Error('No Resi sudah ada dalam database');
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Repository create error:', error);

            if (error.message === 'No Resi sudah ada dalam database') {
                throw error;
            }

            throw new Error('Gagal menyimpan data ke database');
        }
    }

    /**
     * Find all entries with filters
     */
    async findAll(filter, limit, offset) {
        try {
            let query = supabase
                .from('entries')
                .select('id, nama, no_resi, berat_resi, berat_aktual, selisih, foto_url_1, foto_url_2, catatan, status, created_by, created_at, updated_by, updated_at');

            // Apply search filter
            if (filter.search && filter.search.trim() !== '') {
                query = query.or(`nama.ilike.%${filter.search}%,no_resi.ilike.%${filter.search}%`);
            }

            // Apply status filter
            if (filter.status && filter.status !== '') {
                query = query.eq('status', filter.status);
            }

            // Apply username filter
            if (filter.username) {
                query = query.eq('created_by', filter.username);
            }

            // Order by and pagination
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Repository findAll error:', error);
            throw new Error('Gagal mengambil data dari database');
        }
    }

    /**
     * Count entries with filters
     */
    async count(filter) {
        try {
            let query = supabase
                .from('entries')
                .select('*', { count: 'exact', head: true });

            // Apply search filter
            if (filter.search && filter.search.trim() !== '') {
                query = query.or(`nama.ilike.%${filter.search}%,no_resi.ilike.%${filter.search}%`);
            }

            // Apply status filter
            if (filter.status && filter.status !== '') {
                query = query.eq('status', filter.status);
            }

            // Apply username filter
            if (filter.username) {
                query = query.eq('created_by', filter.username);
            }

            const { count, error } = await query;

            if (error) {
                throw error;
            }

            return count || 0;
        } catch (error) {
            console.error('Repository count error:', error);
            return 0;
        }
    }

    /**
     * Find recent entries
     */
    async findRecent(filter, limit) {
        try {
            let query = supabase
                .from('entries')
                .select('id, nama, no_resi, berat_resi, berat_aktual, selisih, foto_url_1, foto_url_2, status, created_by, created_at');

            // Apply username filter
            if (filter.username) {
                query = query.eq('created_by', filter.username);
            }

            // Order by and limit
            query = query
                .order('created_at', { ascending: false })
                .limit(limit);

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Repository findRecent error:', error);
            return [];
        }
    }

    /**
     * Find entry by ID
     */
    async findById(id) {
        try {
            const { data, error } = await supabase
                .from('entries')
                .select('id, nama, no_resi, berat_resi, berat_aktual, selisih, foto_url_1, foto_url_2, catatan, status, created_by, created_at, updated_by, updated_at')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    return null;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Repository findById error:', error);
            return null;
        }
    }

    /**
     * Find entry by no_resi
     */
    async findByNoResi(noResi) {
        try {
            const { data, error } = await supabase
                .from('entries')
                .select('id, no_resi, created_at')
                .eq('no_resi', noResi)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    return null;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Repository findByNoResi error:', error);
            return null;
        }
    }

    /**
     * Update entry
     */
    async update(id, updateData) {
        const updates = {};

        if (updateData.status !== undefined) {
            updates.status = updateData.status;
        }

        if (updateData.catatan !== undefined) {
            updates.catatan = updateData.catatan;
        }

        if (updateData.updated_by) {
            updates.updated_by = updateData.updated_by;
        }

        if (Object.keys(updates).length === 0) {
            throw new Error('Tidak ada data untuk diupdate');
        }

        updates.updated_at = new Date().toISOString();

        try {
            const { data, error } = await supabase
                .from('entries')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
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
        try {
            const { data, error } = await supabase
                .from('entries')
                .delete()
                .eq('id', id)
                .select();

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
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
        try {
            // Get all entries to calculate stats
            const { data, error } = await supabase
                .from('entries')
                .select('selisih, created_at');

            if (error) {
                throw error;
            }

            const total = data.length;
            const today = new Date().toDateString();
            const todayEntries = data.filter(entry =>
                new Date(entry.created_at).toDateString() === today
            );

            const avgSelisih = total > 0
                ? data.reduce((sum, entry) => sum + parseFloat(entry.selisih || 0), 0) / total
                : 0;

            return {
                total,
                today: todayEntries.length,
                avg_selisih: avgSelisih
            };
        } catch (error) {
            console.error('Repository getStats error:', error);
            return { total: 0, today: 0, avg_selisih: 0 };
        }
    }

    /**
     * Find entries for export with date filter
     */
    async findForExport(filter) {
        try {
            let query = supabase
                .from('entries')
                .select('nama, no_resi, berat_resi, berat_aktual, selisih, status, created_by, created_at');

            // Apply date range filters
            if (filter.startDate) {
                query = query.gte('created_at', filter.startDate);
            }

            if (filter.endDate) {
                // Add one day to include the end date
                const endDate = new Date(filter.endDate);
                endDate.setDate(endDate.getDate() + 1);
                query = query.lt('created_at', endDate.toISOString());
            }

            // Order by created_at descending
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Repository findForExport error:', error);
            return [];
        }
    }

    /**
     * Get entries by date range
     */
    async findByDateRange(startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('entries')
                .select('id, nama, no_resi, berat_resi, berat_aktual, selisih, foto_url_1, foto_url_2, status, created_at')
                .gte('created_at', startDate)
                .lte('created_at', endDate + 'T23:59:59.999Z')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Repository findByDateRange error:', error);
            return [];
        }
    }

    /**
     * Get statistics by date range
     */
    async getStatsByDateRange(startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('entries')
                .select('selisih')
                .gte('created_at', startDate)
                .lte('created_at', endDate + 'T23:59:59.999Z');

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                return {
                    total: 0,
                    total_selisih: 0,
                    avg_selisih: 0,
                    min_selisih: 0,
                    max_selisih: 0
                };
            }

            const selisihValues = data.map(entry => parseFloat(entry.selisih || 0));
            const total = data.length;
            const totalSelisih = selisihValues.reduce((sum, val) => sum + val, 0);
            const avgSelisih = totalSelisih / total;
            const minSelisih = Math.min(...selisihValues);
            const maxSelisih = Math.max(...selisihValues);

            return {
                total,
                total_selisih: totalSelisih,
                avg_selisih: avgSelisih,
                min_selisih: minSelisih,
                max_selisih: maxSelisih
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
