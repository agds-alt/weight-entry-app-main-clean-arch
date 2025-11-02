const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../config/database');

// ==========================================
// FOTO MANAGEMENT API
// ==========================================

/**
 * GET /api/foto-management/photos
 * Fetch entries that have photos (foto_url_1 or foto_url_2)
 * Query params:
 *   - page (default: 1)
 *   - limit (default: 100, max: 500)
 *   - sort_by (default: created_at)
 *   - sort_order (default: desc)
 */
router.get('/photos', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 100, 500);
        const sortBy = req.query.sort_by || 'created_at';
        const sortOrder = req.query.sort_order || 'desc';


        // Calculate range for pagination
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        // Build query - only entries with photos
        let query = supabase
            .from('entries')
            .select('id, nama, foto_url_1, foto_url_2, created_at', { count: 'exact' })
            .or('foto_url_1.not.is.null,foto_url_2.not.is.null')
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(start, end);

        // Execute query
        const { data, error, count } = await query;

        if (error) {
            console.error('❌ Error fetching photos:', error);
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
        console.error('❌ Error in GET /photos:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching photos: ' + error.message,
            data: []
        });
    }
});

/**
 * GET /api/foto-management/photos/count
 * Get total count of entries with photos
 */
router.get('/photos/count', authenticateToken, async (req, res) => {
    try {

        const { count, error } = await supabase
            .from('entries')
            .select('*', { count: 'exact', head: true })
            .or('foto_url_1.not.is.null,foto_url_2.not.is.null');

        if (error) throw error;


        res.json({
            success: true,
            count: count || 0
        });

    } catch (error) {
        console.error('❌ Error in GET /photos/count:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching count: ' + error.message,
            count: 0
        });
    }
});

/**
 * DELETE /api/foto-management/photos/:entryId/:field
 * Delete a single photo (set foto_url_1 or foto_url_2 to null)
 * Params:
 *   - entryId: The entry ID
 *   - field: 'foto_url_1' or 'foto_url_2'
 */
router.delete('/photos/:entryId/:field', authenticateToken, async (req, res) => {
    try {
        const entryId = parseInt(req.params.entryId);
        const field = req.params.field;

        // Validate field
        if (field !== 'foto_url_1' && field !== 'foto_url_2') {
            return res.status(400).json({
                success: false,
                message: 'Invalid field. Must be foto_url_1 or foto_url_2'
            });
        }


        // Update database - set URL to null
        const { error } = await supabase
            .from('entries')
            .update({ [field]: null })
            .eq('id', entryId);

        if (error) {
            console.error('❌ Error deleting photo:', error);
            throw error;
        }


        res.json({
            success: true,
            message: 'Photo deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error in DELETE /photos/:entryId/:field:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting photo: ' + error.message
        });
    }
});

/**
 * POST /api/foto-management/photos/bulk-delete
 * Bulk delete photos
 * Body: {
 *   photos: [
 *     { entryId: 123, field: 'foto_url_1' },
 *     { entryId: 456, field: 'foto_url_2' }
 *   ]
 * }
 */
router.post('/photos/bulk-delete', authenticateToken, async (req, res) => {
    try {
        const { photos } = req.body;

        if (!photos || !Array.isArray(photos) || photos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request. Photos array is required'
            });
        }


        let successCount = 0;
        let failCount = 0;
        const errors = [];

        // Process each photo deletion
        for (const photo of photos) {
            try {
                const { entryId, field } = photo;

                // Validate
                if (!entryId || (field !== 'foto_url_1' && field !== 'foto_url_2')) {
                    failCount++;
                    errors.push({
                        entryId,
                        field,
                        error: 'Invalid entryId or field'
                    });
                    continue;
                }

                // Delete photo
                const { error } = await supabase
                    .from('entries')
                    .update({ [field]: null })
                    .eq('id', entryId);

                if (error) {
                    failCount++;
                    errors.push({
                        entryId,
                        field,
                        error: error.message
                    });
                } else {
                    successCount++;
                }

            } catch (err) {
                failCount++;
                errors.push({
                    entryId: photo.entryId,
                    field: photo.field,
                    error: err.message
                });
            }
        }


        res.json({
            success: failCount === 0,
            message: `Bulk delete complete: ${successCount} success, ${failCount} failed`,
            successCount,
            failCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('❌ Error in POST /photos/bulk-delete:', error);
        res.status(500).json({
            success: false,
            message: 'Error in bulk delete: ' + error.message
        });
    }
});

module.exports = router;
