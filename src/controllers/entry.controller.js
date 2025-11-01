const entryService = require('../services/entry.service');
const XLSX = require('xlsx');

class EntryController {
    /**
     * Submit new entry dengan Cloudinary URLs (direct dari frontend)
     */
    async submitEntry(req, res) {
        try {
            const username = req.user?.username || req.session?.user?.username;
            const entryData = req.body;

            console.log('📨 Received entry data from:', username);
            console.log('📊 Entry data:', {
                nama: entryData.nama,
                no_resi: entryData.no_resi,
                berat_resi: entryData.berat_resi,
                berat_aktual: entryData.berat_aktual,
                foto_url_1: entryData.foto_url_1 ? '✅ URL provided' : '❌ No URL',
                foto_url_2: entryData.foto_url_2 ? '✅ URL provided' : '❌ No URL'
            });

            // Validasi data wajib
            if (!entryData.nama || !entryData.no_resi || !entryData.berat_resi || !entryData.berat_aktual) {
                return res.status(400).json({
                    success: false,
                    message: 'Data tidak lengkap. Nama, No. Resi, Berat Resi, dan Berat Aktual harus diisi.'
                });
            }

            // Validasi numeric
            if (isNaN(parseFloat(entryData.berat_resi)) || isNaN(parseFloat(entryData.berat_aktual))) {
                return res.status(400).json({
                    success: false,
                    message: 'Berat Resi dan Berat Aktual harus berupa angka.'
                });
            }

            // Panggil service untuk membuat entry
            const result = await entryService.createEntryWithUrls(entryData, username);

            console.log('✅ Entry created successfully:', {
                id: result.id,
                no_resi: result.no_resi,
                created_at: result.created_at
            });

            return res.status(201).json({
                success: true,
                message: 'Data berhasil disimpan!',
                data: {
                    id: result.id,
                    no_resi: result.no_resi,
                    nama: result.nama,
                    selisih: result.selisih,
                    status: result.status,
                    created_at: result.created_at,
                    foto_urls: {
                        foto1: result.foto_url_1,
                        foto2: result.foto_url_2
                    }
                }
            });

        } catch (error) {
            console.error('❌ Submit entry controller error:', error);
            
            // Handle duplicate no_resi error
            if (error.message.includes('No Resi sudah ada') || error.message.includes('duplicate') || error.message.includes('unique')) {
                return res.status(400).json({
                    success: false,
                    message: 'Nomor Resi sudah ada dalam database. Gunakan nomor resi yang berbeda.'
                });
            }

            // Handle validation errors
            if (error.message.includes('harus diisi') || error.message.includes('harus angka')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(400).json({ 
                success: false,
                message: error.message || 'Gagal menyimpan data ke database' 
            });
        }
    }

    /**
     * Get all entries with pagination and filters
     */
    async getEntries(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                status: req.query.status || '',
                username: req.user?.username || req.session?.user?.username,
                role: req.user?.role || req.session?.user?.role
            };

            console.log('📋 Getting entries with options:', options);

            const result = await entryService.getEntries(options);

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('❌ Get entries controller error:', error);
            return res.status(500).json({ 
                success: false,
                message: error.message || 'Gagal mengambil data dari database' 
            });
        }
    }

    /**
     * Get recent entries
     */
    async getRecentEntries(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const username = req.user?.username || req.session?.user?.username;
            const userRole = req.user?.role || req.session?.user?.role;

            console.log('🕒 Getting recent entries, limit:', limit);

            const result = await entryService.getRecentEntries(limit, username, userRole);

            return res.json({
                success: true,
                data: result.data || []
            });
        } catch (error) {
            console.error('❌ Get recent entries controller error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Gagal memuat data terbaru'
            });
        }
    }

    /**
     * Update entry status or notes
     */
    async updateEntry(req, res) {
        try {
            const { id } = req.params;
            const { status, catatan, notes } = req.body;
            const username = req.user?.username || req.session?.user?.username;

            console.log('✏️ Updating entry:', { id, status, catatan, notes, username });

            if (!id) {
                return res.status(400).json({ 
                    success: false,
                    message: 'ID entry tidak valid' 
                });
            }

            if (!status && catatan === undefined && notes === undefined) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Tidak ada data yang akan diupdate' 
                });
            }

            // Gunakan catatan atau notes (handle both field names)
            const updateData = {
                status,
                catatan: catatan || notes
            };

            await entryService.updateEntry(id, updateData, username);

            return res.json({ 
                success: true,
                message: 'Entry berhasil diupdate' 
            });
        } catch (error) {
            console.error('❌ Update entry controller error:', error);
            
            if (error.message.includes('tidak ditemukan')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({ 
                success: false,
                message: error.message || 'Gagal update data' 
            });
        }
    }

    /**
     * Delete entry
     */
    async deleteEntry(req, res) {
        try {
            const { id } = req.params;
            const username = req.user?.username || req.session?.user?.username;

            console.log('🗑️ Deleting entry:', { id, username });

            if (!id) {
                return res.status(400).json({ 
                    success: false,
                    message: 'ID entry tidak valid' 
                });
            }

            await entryService.deleteEntry(id, username);

            return res.json({ 
                success: true,
                message: 'Entry berhasil dihapus' 
            });
        } catch (error) {
            console.error('❌ Delete entry controller error:', error);
            
            if (error.message.includes('tidak ditemukan')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({ 
                success: false,
                message: error.message || 'Gagal menghapus data' 
            });
        }
    }

    /**
     * Get statistics
     */
    async getStatistics(req, res) {
        try {
            console.log('📊 Getting statistics');

            const stats = await entryService.getStatistics();

            return res.json({
                success: true,
                data: {
                    totalEntries: stats.totalEntries || 0,
                    todayEntries: stats.todayEntries || 0,
                    avgSelisih: stats.avgSelisih || '0.00'
                }
            });
        } catch (error) {
            console.error('❌ Get statistics controller error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Gagal mengambil statistik',
                data: {
                    totalEntries: 0,
                    todayEntries: 0,
                    avgSelisih: '0.00'
                }
            });
        }
    }

    /**
     * Get user earnings/omset
     * Admin: sees all users earnings
     * Regular user: sees only their earnings
     */
    async getUserEarnings(req, res) {
        try {
            const username = req.user?.username || req.session?.user?.username;
            const role = req.user?.role || req.session?.user?.role || 'user';

            console.log('💰 Getting user earnings for:', username, 'role:', role);

            const earnings = await entryService.getUserEarnings(username, role);

            return res.json({
                success: true,
                data: earnings
            });
        } catch (error) {
            console.error('❌ Get user earnings controller error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Gagal mengambil data omset',
                data: role === 'admin' ? [] : {
                    username: username || '',
                    total_entries: 0,
                    total_earnings: 0,
                    today_entries: 0,
                    today_earnings: 0
                }
            });
        }
    }

    /**
     * Export entries to CSV or Excel
     */
    async exportEntries(req, res) {
        try {
            const { startDate, endDate, format = 'csv', columns } = req.query;
            const username = req.user?.username || req.session?.user?.username;
            const userRole = req.user?.role || req.session?.user?.role;

            console.log('📤 Exporting entries:', { startDate, endDate, format, username });

            const options = {
                startDate,
                endDate,
                username: userRole === 'admin' ? null : username
            };

            const entries = await entryService.getEntriesForExport(options);

            if (!entries || entries.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tidak ada data untuk diexport'
                });
            }

            const allColumns = {
                tanggal: {
                    header: 'Tanggal',
                    getValue: (r) => r.created_at ?
                        new Date(r.created_at).toLocaleString('id-ID') : ''
                },
                nama: { header: 'Nama', getValue: (r) => r.nama || '' },
                no_resi: { header: 'No Resi', getValue: (r) => r.no_resi || '' },
                berat_resi: { header: 'Berat Resi (KG)', getValue: (r) => r.berat_resi || '' },
                berat_aktual: { header: 'Berat Aktual (KG)', getValue: (r) => r.berat_aktual || '' },
                selisih: { header: 'Selisih (KG)', getValue: (r) => r.selisih || '' },
                status: { header: 'Status', getValue: (r) => r.status || 'submitted' },
                created_by: { header: 'Dibuat Oleh', getValue: (r) => r.created_by || '' },
                catatan: { header: 'Catatan', getValue: (r) => r.catatan || '' }
            };

            let selectedColumns = columns ? JSON.parse(columns) : Object.keys(allColumns);
            selectedColumns = selectedColumns.filter(col => allColumns[col]);

            if (selectedColumns.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Tidak ada kolom yang valid untuk diexport' 
                });
            }

            const headers = selectedColumns.map(col => allColumns[col].header);
            const rows = entries.map(r =>
                selectedColumns.map(col => allColumns[col].getValue(r))
            );

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `export_data_${timestamp}`;

            if (format === 'excel') {
                return this.exportToExcel(res, headers, rows, filename);
            } else {
                return this.exportToCSV(res, headers, rows, filename);
            }
        } catch (error) {
            console.error('❌ Export entries controller error:', error);
            return res.status(500).json({ 
                success: false,
                message: error.message || 'Gagal export data' 
            });
        }
    }

    /**
     * Export to Excel
     */
    exportToExcel(res, headers, rows, filename) {
        try {
            const workbook = XLSX.utils.book_new();
            const worksheetData = [headers, ...rows];
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            // Set column widths
            const colWidths = headers.map(() => ({ width: 15 }));
            worksheet['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Export');

            const excelBuffer = XLSX.write(workbook, {
                type: 'buffer',
                bookType: 'xlsx',
                bookSST: false
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
            res.send(excelBuffer);
        } catch (error) {
            console.error('❌ Excel export error:', error);
            throw new Error('Gagal membuat file Excel');
        }
    }

    /**
     * Export to CSV
     */
    exportToCSV(res, headers, rows, filename) {
        try {
            const escapeCsvValue = (value) => {
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            };

            const csvContent = [
                headers.map(escapeCsvValue).join(','),
                ...rows.map(row => row.map(escapeCsvValue).join(','))
            ].join('\n');

            const BOM = '\uFEFF';

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
            res.send(BOM + csvContent);
        } catch (error) {
            console.error('❌ CSV export error:', error);
            throw new Error('Gagal membuat file CSV');
        }
    }

    /**
     * Health check untuk entries
     */
    async healthCheck(req, res) {
        try {
            const stats = await entryService.getStatistics();
            
            return res.json({
                success: true,
                message: 'Entries service is healthy',
                data: {
                    totalEntries: stats.totalEntries,
                    database: 'Connected',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('❌ Health check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Entries service is unhealthy',
                error: error.message
            });
        }
    }
}

module.exports = new EntryController();