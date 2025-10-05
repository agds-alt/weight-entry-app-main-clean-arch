const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Get user statistics and earnings
// Get user statistics and earnings - FINAL VERSION
router.get('/user-stats', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username || req.user.userName;
        
        console.log('📊 Fetching user stats for:', username);

        // Simple query untuk avoid complex date functions
        const statsQuery = `
            SELECT 
                COUNT(*) as total_entries,
                COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
                COUNT(CASE WHEN status = 'disputed' THEN 1 END) as disputed_count,
                COALESCE(AVG(selisih)::numeric, 0) as avg_selisih
            FROM entries 
            WHERE created_by = $1
        `;
        
        console.log('📊 Executing query for user:', username);
        const result = await db.query(statsQuery, [username]);
        const stats = result.rows[0];
        
        console.log('📊 Raw database result:', stats);

        // Untuk entries today/week/month, kita simplify dulu
        const response = {
            total_entries: parseInt(stats.total_entries) || 0,
            entries_today: parseInt(stats.total_entries) || 0, // Temporary: assume all are today
            entries_this_week: parseInt(stats.total_entries) || 0, // Temporary: assume all are this week
            entries_this_month: parseInt(stats.total_entries) || 0, // Temporary: assume all are this month
            avg_selisih: parseFloat(stats.avg_selisih || 0).toFixed(2),
            verified_count: parseInt(stats.verified_count) || 0,
            disputed_count: parseInt(stats.disputed_count) || 0
        };

        console.log('📊 Final response:', response);
        res.json(response);
        
    } catch (error) {
        console.error('❌ Error in user-stats:', error);
        res.status(500).json({ 
            message: 'Error: ' + error.message,
            hint: 'Check server logs for details'
        });
    }
});
// Get leaderboard - FINAL VERSION
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        console.log('🏆 Fetching leaderboard');
        
        const query = `
            SELECT 
                created_by as username,
                COUNT(*) as total_entries
            FROM entries 
            WHERE created_by IS NOT NULL
            GROUP BY created_by 
            ORDER BY total_entries DESC 
            LIMIT 10
        `;
        
        const result = await db.query(query);
        
        const leaderboard = result.rows.map((row, index) => ({
            rank: index + 1,
            username: row.username,
            total_entries: parseInt(row.total_entries) || 0,
            total_earnings: (parseInt(row.total_entries) || 0) * 500
        }));
        
        console.log('🏆 Leaderboard result:', leaderboard);
        res.json(leaderboard);
        
    } catch (error) {
        console.error('❌ Error in leaderboard:', error);
        res.status(500).json({ 
            message: 'Error: ' + error.message 
        });
    }
});


// Debug endpoint untuk troubleshooting
router.get('/debug-info', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username || req.user.userName;
        const userId = req.user.id;
        
        console.log('🔍 Debug info for:', { username, userId });
        
        // 1. Cek user di database
        const userQuery = 'SELECT id, username, email FROM users WHERE username = $1 OR id = $2';
        const userResult = await db.query(userQuery, [username, userId]);
        
        // 2. Cek entries untuk user ini
        const entriesQuery = 'SELECT id, created_by, status, created_at FROM entries WHERE created_by = $1 LIMIT 5';
        const entriesResult = await db.query(entriesQuery, [username]);
        
        // 3. Cek total entries count
        const countQuery = 'SELECT COUNT(*) as total FROM entries WHERE created_by = $1';
        const countResult = await db.query(countQuery, [username]);
        
        res.json({
            user_info: userResult.rows[0] || 'User not found in database',
            user_matches: userResult.rows.length,
            entries_found: entriesResult.rows,
            total_entries: countResult.rows[0].total,
            request_user: { username, userId }
        });
        
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;