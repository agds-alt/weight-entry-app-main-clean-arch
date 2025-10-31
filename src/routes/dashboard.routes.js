const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../config/database');
const dashboardController = require('../controllers/dashboard.controller');

// Get user statistics and earnings
router.get('/user-stats', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username || req.user.userName;

        console.log('📊 Fetching user stats for:', username);

        // Fetch entries for the user
        const { data: entries, error } = await supabase
            .from('entries')
            .select('status, selisih, created_at')
            .eq('created_by', username);

        if (error) {
            throw error;
        }

        console.log('📊 Retrieved entries count:', entries.length);

        // Calculate statistics
        const now = new Date();
        const today = now.toDateString();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let totalEntries = entries.length;
        let entriesToday = 0;
        let entriesThisWeek = 0;
        let entriesThisMonth = 0;
        let verifiedCount = 0;
        let disputedCount = 0;
        let totalSelisih = 0;

        entries.forEach(entry => {
            const entryDate = new Date(entry.created_at);

            if (entryDate.toDateString() === today) entriesToday++;
            if (entryDate >= startOfWeek) entriesThisWeek++;
            if (entryDate >= startOfMonth) entriesThisMonth++;

            if (entry.status === 'verified') verifiedCount++;
            if (entry.status === 'disputed') disputedCount++;

            totalSelisih += parseFloat(entry.selisih || 0);
        });

        const response = {
            total_entries: totalEntries,
            entries_today: entriesToday,
            entries_this_week: entriesThisWeek,
            entries_this_month: entriesThisMonth,
            avg_selisih: totalEntries > 0 ? (totalSelisih / totalEntries).toFixed(2) : '0.00',
            verified_count: verifiedCount,
            disputed_count: disputedCount
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

// Get global statistics (all entries from all users)
router.get('/global-stats', authenticateToken, dashboardController.getGlobalStats);

// Get leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        console.log('🏆 Fetching leaderboard');

        // Fetch all entries with created_by
        const { data: entries, error } = await supabase
            .from('entries')
            .select('created_by')
            .not('created_by', 'is', null);

        if (error) {
            throw error;
        }

        // Count entries per user
        const userCounts = {};
        entries.forEach(entry => {
            const username = entry.created_by;
            userCounts[username] = (userCounts[username] || 0) + 1;
        });

        // Convert to array, sort, and add rankings
        const leaderboard = Object.entries(userCounts)
            .map(([username, total_entries]) => ({
                username,
                total_entries
            }))
            .sort((a, b) => b.total_entries - a.total_entries)
            .slice(0, 10) // Top 10
            .map((item, index) => ({
                rank: index + 1,
                username: item.username,
                total_entries: item.total_entries,
                total_earnings: item.total_entries * 500
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

// Debug endpoint for troubleshooting
router.get('/debug-info', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username || req.user.userName;
        const userId = req.user.id;

        console.log('🔍 Debug info for:', { username, userId });

        // 1. Check user in database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, username, email')
            .or(`username.eq.${username},id.eq.${userId}`)
            .limit(1);

        if (userError) {
            throw userError;
        }

        // 2. Check entries for this user
        const { data: entriesData, error: entriesError } = await supabase
            .from('entries')
            .select('id, created_by, status, created_at')
            .eq('created_by', username)
            .limit(5);

        if (entriesError) {
            throw entriesError;
        }

        // 3. Count total entries
        const { count: totalEntries, error: countError } = await supabase
            .from('entries')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', username);

        if (countError) {
            throw countError;
        }

        res.json({
            user_info: userData && userData.length > 0 ? userData[0] : 'User not found in database',
            user_matches: userData ? userData.length : 0,
            entries_found: entriesData || [],
            total_entries: totalEntries || 0,
            request_user: { username, userId }
        });

    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
