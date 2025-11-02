const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../config/database');

// ==========================================
// DATA MANAGEMENT API - Server-Side Pagination
// ==========================================

/**
 * GET /api/data-management/entries
 * Fetch entries with server-side pagination
 * Query params:
 *   - page (default: 1)
 *   - limit (default: 100, max: 500)
 *   - sort_by (default: created_at)
 *   - sort_order (default: desc)
 *   - status (optional filter)
 *   - search (optional search in nama/no_resi)
 */
router.get('/entries', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 100, 500); // Max 500
        const sortBy = req.query.sort_by || 'created_at';
        const sortOrder = req.query.sort_order || 'desc';
        const status = req.query.status;
        const search = req.query.search;

            page,
            limit,
            sortBy,
            sortOrder,
            status,
            search
        });

        // Calculate range for pagination
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        // Build query (OPTIMIZED: Exclude foto_url_1, foto_url_2 for performance)
        let query = supabase
            .from('entries')
            .select('id, nama, no_resi, berat_resi, berat_aktual, selisih, status, created_by, created_at, updated_at, notes', { count: 'exact' });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`nama.ilike.%${search}%,no_resi.ilike.%${search}%`);
        }

        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Apply pagination
        query = query.range(start, end);

        // Execute query
        const { data, error, count } = await query;

        if (error) {
            console.error('❌ Error fetching entries:', error);
            throw error;
        }

            count: data.length,
            totalCount: count,
            page,
            totalPages: Math.ceil(count / limit)
        });

        res.json({
            success: true,
            data: data || [],
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
                hasNext: end < count - 1,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('❌ Error in GET /entries:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching entries: ' + error.message,
            data: []
        });
    }
});

/**
 * GET /api/data-management/entries/count
 * Get total count of entries (for stats)
 */
router.get('/entries/count', authenticateToken, async (req, res) => {
    try {

        const { count, error } = await supabase
            .from('entries')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;


        res.json({
            success: true,
            count: count || 0
        });

    } catch (error) {
        console.error('❌ Error in GET /entries/count:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching count: ' + error.message,
            count: 0
        });
    }
});

/**
 * GET /api/data-management/entries/:id
 * Get single entry by ID
 */
router.get('/entries/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);


        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found'
            });
        }


        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('❌ Error in GET /entries/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching entry: ' + error.message
        });
    }
});

/**
 * PUT /api/data-management/entries/:id
 * Update entry by ID
 */
router.put('/entries/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const {
            nama,
            no_resi,
            berat_resi,
            berat_aktual,
            selisih,
            status,
            notes
        } = req.body;


        // Validation
        if (!nama || !no_resi || berat_resi === undefined || berat_aktual === undefined || !status) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: nama, no_resi, berat_resi, berat_aktual, status'
            });
        }

        // Calculate selisih if not provided
        const calculatedSelisih = selisih !== undefined ? selisih : berat_aktual - berat_resi;

        const { data, error } = await supabase
            .from('entries')
            .update({
                nama,
                no_resi,
                berat_resi: parseFloat(berat_resi),
                berat_aktual: parseFloat(berat_aktual),
                selisih: calculatedSelisih,
                status,
                notes: notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) {
            console.error('❌ Error updating entry:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found'
            });
        }


        res.json({
            success: true,
            message: 'Entry updated successfully',
            data: data[0]
        });

    } catch (error) {
        console.error('❌ Error in PUT /entries/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating entry: ' + error.message
        });
    }
});

/**
 * DELETE /api/data-management/entries/:id
 * Delete entry by ID
 */
router.delete('/entries/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);


        const { error } = await supabase
            .from('entries')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Error deleting entry:', error);
            throw error;
        }


        res.json({
            success: true,
            message: 'Entry deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error in DELETE /entries/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting entry: ' + error.message
        });
    }
});

/**
 * GET /api/data-management/stats
 * Get statistics for data management page
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {

        // Get all entries for stats calculation
        const { data: entries, error } = await supabase
            .from('entries')
            .select('selisih, created_at, status');

        if (error) throw error;

        const totalEntries = entries.length;
        const avgSelisih = totalEntries > 0
            ? (entries.reduce((sum, e) => sum + parseFloat(e.selisih || 0), 0) / totalEntries).toFixed(2)
            : 0;

        const today = new Date().toISOString().split('T')[0];
        const todayEntries = entries.filter(e => e.created_at && e.created_at.startsWith(today)).length;


        res.json({
            success: true,
            data: {
                total_entries: totalEntries,
                avg_selisih: avgSelisih,
                today_entries: todayEntries
            }
        });

    } catch (error) {
        console.error('❌ Error in GET /stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stats: ' + error.message
        });
    }
});

module.exports = router;
