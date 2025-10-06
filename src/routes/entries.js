// routes/entries.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Create new entry
router.post('/', async (req, res) => {
    try {
        const { nama, no_resi, berat_resi, berat_aktual, foto_url_1, foto_url_2, notes } = req.body;
        const username = req.user.username;

        // Calculate selisih
        const selisih = berat_resi - berat_aktual;

        const { data, error } = await supabase
            .from('entries')
            .insert([
                {
                    nama,
                    no_resi,
                    berat_resi,
                    berat_aktual,
                    selisih,
                    foto_url_1,
                    foto_url_2,
                    notes,
                    created_by: username,
                    status: 'submitted'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data,
            message: 'Entry berhasil ditambahkan! Reward: Rp 800'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user entries with pagination
router.get('/', async (req, res) => {
    try {
        const username = req.user.username;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
            .from('entries')
            .select('*', { count: 'exact' })
            .eq('created_by', username)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            data,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;