const db = require('../config/database');

class DashboardRepository {
    /**
     * Get user statistics
     */
    async getUserStats(username) {
        const query = `
            SELECT 
                -- Total entries
                (SELECT COUNT(*) FROM entries WHERE created_by = $1) as total_entries,
                
                -- Today's entries
                (SELECT COUNT(*) FROM entries WHERE created_by = $1 AND DATE(created_at) = CURRENT_DATE) as today_entries,
                
                -- This week's entries
                (SELECT COUNT(*) FROM entries WHERE created_by = $1 AND created_at >= DATE_TRUNC('week', CURRENT_DATE)) as week_entries,
                
                -- This month's entries
                (SELECT COUNT(*) FROM entries WHERE created_by = $1 AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) as month_entries,
                
                -- Average selisih
                (SELECT COALESCE(AVG(selisih), 0) FROM entries WHERE created_by = $1) as avg_selisih,
                
                -- Verified count (assuming status = 'verified')
                (SELECT COUNT(*) FROM entries WHERE created_by = $1 AND status = 'verified') as verified_count
        `;

        try {
            const rows = await db.execute(query, [username]);
            return rows[0] || {};
        } catch (error) {
            console.error('Dashboard repository getUserStats error:', error);
            throw new Error('Gagal mengambil statistik pengguna');
        }
    }

    /**
     * Get leaderboard data
     */
    async getLeaderboard() {
        const query = `
            SELECT 
                created_by as username,
                COUNT(*) as total_entries
            FROM entries 
            GROUP BY created_by 
            ORDER BY total_entries DESC 
            LIMIT 5
        `;

        try {
            const rows = await db.execute(query);
            return rows;
        } catch (error) {
            console.error('Dashboard repository getLeaderboard error:', error);
            throw new Error('Gagal mengambil data leaderboard');
        }
    }

    /**
     * Get performance data for charts
     */
    async getPerformanceData(username) {
        const query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as entries_count
            FROM entries 
            WHERE created_by = $1 
                AND created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `;

        try {
            const rows = await db.execute(query, [username]);
            return rows;
        } catch (error) {
            console.error('Dashboard repository getPerformanceData error:', error);
            throw new Error('Gagal mengambil data performa');
        }
    }
}

module.exports = new DashboardRepository();