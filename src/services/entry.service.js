const entryRepository = require('../repositories/entry.repository');
const { calculateSelisih } = require('../utils/helpers');

class EntryService {
    /**
     * Create entry dengan Cloudinary URLs (direct dari frontend)
     */
    async createEntryWithUrls(entryData, username) {
        try {
            this.validateEntryData(entryData);

            const selisih = parseFloat(entryData.berat_aktual) - parseFloat(entryData.berat_resi);

            // Langsung simpan ke database dengan URL dari Cloudinary
            const entry = {
                nama: entryData.nama,
                no_resi: entryData.no_resi,
                berat_resi: parseFloat(entryData.berat_resi),
                berat_aktual: parseFloat(entryData.berat_aktual),
                selisih: selisih.toFixed(2),
                foto_url_1: entryData.foto_url_1 || null,
                foto_url_2: entryData.foto_url_2 || null,
                notes: entryData.notes || null,
                status: 'submitted',
                created_by: username
            };

            const result = await entryRepository.create(entry);
            return result;
        } catch (error) {
            console.error('Create entry with URLs error:', error);
            throw new Error(error.message || 'Failed to create entry');
        }
    }

    /**
     * Get entries with pagination
     */
    async getEntries(options) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                status = '',
                username,
                role
            } = options;

            const offset = (page - 1) * limit;
            const filter = {
                search,
                status,
                username: role === 'admin' ? null : username
            };

            const [entries, total] = await Promise.all([
                entryRepository.findAll(filter, limit, offset),
                entryRepository.count(filter)
            ]);

            return {
                data: entries,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Get entries error:', error);
            throw new Error('Failed to get entries');
        }
    }

    /**
     * Get recent entries
     */
    async getRecentEntries(limit = 5, username, role) {
        try {
            const filter = {
                username: role === 'admin' ? null : username
            };

            const entries = await entryRepository.findRecent(filter, limit);
            return { data: entries };
        } catch (error) {
            console.error('Get recent entries error:', error);
            throw new Error('Failed to get recent entries');
        }
    }

    /**
     * Get statistics
     */
    async getStatistics() {
        try {
            const stats = await entryRepository.getStats();
            return {
                totalEntries: stats.total || 0,
                todayEntries: stats.today || 0,
                avgSelisih: parseFloat(stats.avg_selisih || 0).toFixed(2)
            };
        } catch (error) {
            console.error('Get statistics error:', error);
            return {
                totalEntries: 0,
                todayEntries: 0,
                avgSelisih: '0.00'
            };
        }
    }

    /**
     * Update entry
     */
    async updateEntry(id, updateData, username) {
        try {
            const entry = await entryRepository.findById(id);
            if (!entry) {
                throw new Error('Entry not found');
            }

            const updates = {
                updated_by: username
            };

            if (updateData.status) {
                updates.status = updateData.status;
            }

            if (updateData.catatan !== undefined) {
                updates.catatan = updateData.catatan;
            }

            await entryRepository.update(id, updates);
            return { success: true };
        } catch (error) {
            console.error('Update entry error:', error);
            throw new Error(error.message || 'Failed to update entry');
        }
    }

    /**
     * Delete entry
     */
    async deleteEntry(id) {
        try {
            const entry = await entryRepository.findById(id);
            if (!entry) {
                throw new Error('Entry not found');
            }

            await entryRepository.delete(id);
            return { success: true };
        } catch (error) {
            console.error('Delete entry error:', error);
            throw new Error(error.message || 'Failed to delete entry');
        }
    }

    /**
     * Validate entry data
     */
    validateEntryData(data) {
        if (!data.nama || data.nama.trim() === '') {
            throw new Error('Nama harus diisi');
        }

        if (!data.no_resi || data.no_resi.trim() === '') {
            throw new Error('No Resi harus diisi');
        }

        const beratResi = parseFloat(data.berat_resi);
        if (isNaN(beratResi) || beratResi <= 0) {
            throw new Error('Berat Resi harus angka positif');
        }

        const beratAktual = parseFloat(data.berat_aktual);
        if (isNaN(beratAktual) || beratAktual <= 0) {
            throw new Error('Berat Aktual harus angka positif');
        }
    }

    /**
     * Get entries for export
     */
    async getEntriesForExport(options) {
        try {
            const entries = await entryRepository.findForExport(options);
            return entries;
        } catch (error) {
            console.error('Get entries for export error:', error);
            throw new Error('Failed to get export data');
        }
    }
}

module.exports = new EntryService();