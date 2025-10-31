const { supabase } = require('../config/database');

class DashboardRepository {
    /**
     * Get global statistics (all entries from all users)
     */
    async getGlobalStats() {
        try {
            // Fetch ALL entries from database (override default 1000 limit)
            const { data: entries, error } = await supabase
                .from('entries')
                .select('selisih, status, created_at')
                .limit(100000); // Set high limit to get all entries

            if (error) {
                throw error;
            }

            // Calculate statistics
            const now = new Date();
            const today = now.toDateString();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            startOfWeek.setHours(0, 0, 0, 0);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const stats = {
                total_entries: entries.length,
                today_entries: 0,
                week_entries: 0,
                month_entries: 0,
                avg_selisih: 0,
                verified_count: 0
            };

            let totalSelisih = 0;

            entries.forEach(entry => {
                const entryDate = new Date(entry.created_at);

                // Today's entries
                if (entryDate.toDateString() === today) {
                    stats.today_entries++;
                }

                // This week's entries
                if (entryDate >= startOfWeek) {
                    stats.week_entries++;
                }

                // This month's entries
                if (entryDate >= startOfMonth) {
                    stats.month_entries++;
                }

                // Sum selisih for average
                totalSelisih += parseFloat(entry.selisih || 0);

                // Verified count
                if (entry.status === 'verified') {
                    stats.verified_count++;
                }
            });

            // Calculate average selisih
            stats.avg_selisih = entries.length > 0 ? totalSelisih / entries.length : 0;

            return stats;
        } catch (error) {
            console.error('Dashboard repository getGlobalStats error:', error);
            throw new Error('Gagal mengambil statistik global');
        }
    }

    /**
     * Get user statistics
     * Note: This implementation fetches data and calculates in-memory.
     * For better performance with large datasets, consider creating a Supabase RPC function.
     */
    async getUserStats(username) {
        try {
            // Fetch all entries for the user
            const { data: entries, error } = await supabase
                .from('entries')
                .select('selisih, status, created_at')
                .eq('created_by', username);

            if (error) {
                throw error;
            }

            // Calculate statistics
            const now = new Date();
            const today = now.toDateString();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            startOfWeek.setHours(0, 0, 0, 0);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const stats = {
                total_entries: entries.length,
                today_entries: 0,
                week_entries: 0,
                month_entries: 0,
                avg_selisih: 0,
                verified_count: 0
            };

            let totalSelisih = 0;

            entries.forEach(entry => {
                const entryDate = new Date(entry.created_at);

                // Today's entries
                if (entryDate.toDateString() === today) {
                    stats.today_entries++;
                }

                // This week's entries
                if (entryDate >= startOfWeek) {
                    stats.week_entries++;
                }

                // This month's entries
                if (entryDate >= startOfMonth) {
                    stats.month_entries++;
                }

                // Sum selisih for average
                totalSelisih += parseFloat(entry.selisih || 0);

                // Verified count
                if (entry.status === 'verified') {
                    stats.verified_count++;
                }
            });

            // Calculate average selisih
            stats.avg_selisih = entries.length > 0 ? totalSelisih / entries.length : 0;

            return stats;
        } catch (error) {
            console.error('Dashboard repository getUserStats error:', error);
            throw new Error('Gagal mengambil statistik pengguna');
        }
    }

    /**
     * Get leaderboard data
     */
    async getLeaderboard() {
        try {
            // Fetch all entries grouped by created_by
            const { data: entries, error } = await supabase
                .from('entries')
                .select('created_by');

            if (error) {
                throw error;
            }

            // Count entries per user
            const userCounts = {};
            entries.forEach(entry => {
                const username = entry.created_by;
                userCounts[username] = (userCounts[username] || 0) + 1;
            });

            // Convert to array and sort
            const leaderboard = Object.entries(userCounts)
                .map(([username, total_entries]) => ({
                    username,
                    total_entries
                }))
                .sort((a, b) => b.total_entries - a.total_entries)
                .slice(0, 5); // Top 5

            return leaderboard;
        } catch (error) {
            console.error('Dashboard repository getLeaderboard error:', error);
            throw new Error('Gagal mengambil data leaderboard');
        }
    }

    /**
     * Get performance data for charts (last 7 days)
     */
    async getPerformanceData(username) {
        try {
            // Calculate date 7 days ago
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const { data: entries, error } = await supabase
                .from('entries')
                .select('created_at')
                .eq('created_by', username)
                .gte('created_at', sevenDaysAgo.toISOString());

            if (error) {
                throw error;
            }

            // Group by date
            const dateCounts = {};
            entries.forEach(entry => {
                const date = new Date(entry.created_at).toISOString().split('T')[0];
                dateCounts[date] = (dateCounts[date] || 0) + 1;
            });

            // Convert to array and sort by date
            const performanceData = Object.entries(dateCounts)
                .map(([date, entries_count]) => ({
                    date,
                    entries_count
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            return performanceData;
        } catch (error) {
            console.error('Dashboard repository getPerformanceData error:', error);
            throw new Error('Gagal mengambil data performa');
        }
    }
}

module.exports = new DashboardRepository();
