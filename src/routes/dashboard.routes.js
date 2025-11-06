const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../config/database');
const dashboardController = require('../controllers/dashboard.controller');

// Get user statistics and earnings
router.get('/user-stats', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username || req.user.userName;


        // Fetch entries for the user
        const { data: entries, error } = await supabase
            .from('entries')
            .select('status, selisih, created_at')
            .eq('created_by', username);

        if (error) {
            throw error;
        }


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

// ==========================================
// LEADERBOARD ENDPOINTS - Using Views & user_statistics table
// ==========================================

// 1. Daily Top Performers (from view)
router.get('/leaderboard/daily', authenticateToken, async (req, res) => {
    try {

        const { data, error } = await supabase
            .from('daily_top_performers')
            .select('*')
            .limit(10);

        if (error) {
            console.error('❌ Error fetching daily_top_performers:', error);
            throw error;
        }

        res.json(data || []);

    } catch (error) {
        console.error('❌ Error in daily leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily leaderboard: ' + error.message,
            data: []
        });
    }
});

// 2. Total Top Performers (from view)
router.get('/leaderboard/total', authenticateToken, async (req, res) => {
    try {

        const { data, error } = await supabase
            .from('total_top_performers')
            .select('*')
            .limit(10);

        if (error) {
            console.error('❌ Error fetching total_top_performers:', error);
            throw error;
        }

        res.json(data || []);

    } catch (error) {
        console.error('❌ Error in total leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching total leaderboard: ' + error.message,
            data: []
        });
    }
});

// 3. User Statistics (from table - with cache)
router.get('/leaderboard/statistics', authenticateToken, async (req, res) => {
    try {

        const { data, error } = await supabase
            .from('user_statistics')
            .select('*')
            .order('total_entries', { ascending: false })
            .limit(10);

        if (error) {
            console.error('❌ Error fetching user_statistics:', error);
            throw error;
        }

        res.json(data || []);

    } catch (error) {
        console.error('❌ Error in statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics: ' + error.message,
            data: []
        });
    }
});

// 4. Legacy leaderboard endpoint (for backward compatibility)
// Now uses user_statistics table for better performance
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {

        const { data, error } = await supabase
            .from('user_statistics')
            .select('username, total_entries, total_earnings, avg_selisih, daily_entries, daily_earnings')
            .order('total_entries', { ascending: false })
            .limit(10);

        if (error) {
            console.error('❌ Error fetching from user_statistics:', error);
            throw error;
        }

        // Transform to legacy format with rank
        const leaderboard = (data || []).map((item, index) => ({
            rank: index + 1,
            username: item.username,
            total_entries: parseInt(item.total_entries) || 0,
            total_earnings: parseFloat(item.total_earnings) || 0,
            avg_selisih: parseFloat(item.avg_selisih) || 0,
            daily_entries: parseInt(item.daily_entries) || 0,
            daily_earnings: parseFloat(item.daily_earnings) || 0
        }));

        res.json(leaderboard);

    } catch (error) {
        console.error('❌ Error in leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leaderboard: ' + error.message,
            data: []
        });
    }
});

// Get daily omzset calculation
router.get('/omzset', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username || req.user.userName;
        console.log('💰 Fetching omzset for:', username);

        // Get today's date range
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        // Fetch today's entries for this user
        const { data: entries, error } = await supabase
            .from('entries')
            .select('id')
            .eq('created_by', username)
            .gte('created_at', todayStart.toISOString())
            .lt('created_at', todayEnd.toISOString());

        if (error) {
            console.error('❌ Error fetching today entries:', error);
            throw error;
        }

        const todayEntries = entries ? entries.length : 0;

        // Formula: (total entries hari ini × 500) + 50,000
        const entryEarnings = todayEntries * 500;
        const dailyBonus = 50000;
        const totalOmzset = entryEarnings + dailyBonus;

        const response = {
            success: true,
            data: {
                today_entries: todayEntries,
                entry_earnings: entryEarnings,
                daily_bonus: dailyBonus,
                total_omzset: totalOmzset,
                date: todayStart.toISOString().split('T')[0]
            }
        };

        console.log('💰 Omzset calculated:', response.data);
        res.json(response);

    } catch (error) {
        console.error('❌ Error calculating omzset:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating omzset: ' + error.message
        });
    }
});

// Debug endpoint for troubleshooting
router.get('/debug-info', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username || req.user.userName;
        const userId = req.user.id;


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
