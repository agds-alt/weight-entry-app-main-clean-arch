const { supabase } = require('../config/database');

class DashboardRepository {
    /**
     * Get global statistics (all entries from all users)
     */
    async getGlobalStats() {
        try {
            console.log('🔍 Fetching global stats using COUNT queries...');

            // Calculate date boundaries
            const now = new Date();
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);

            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            startOfWeek.setHours(0, 0, 0, 0);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Run all COUNT queries in parallel for better performance
            const [
                totalResult,
                todayResult,
                weekResult,
                monthResult,
                recentResult
            ] = await Promise.all([
                // Total count (all time)
                supabase.from('entries').select('*', { count: 'exact', head: true }),

                // Today count
                supabase.from('entries').select('*', { count: 'exact', head: true })
                    .gte('created_at', today.toISOString()),

                // This week count
                supabase.from('entries').select('*', { count: 'exact', head: true })
                    .gte('created_at', startOfWeek.toISOString()),

                // This month count
                supabase.from('entries').select('*', { count: 'exact', head: true })
                    .gte('created_at', startOfMonth.toISOString()),

                // Fetch recent entries for avg_selisih and verified_count
                supabase.from('entries').select('selisih, status')
                    .gte('created_at', startOfMonth.toISOString())
                    .limit(1000)
            ]);

            if (totalResult.error) throw totalResult.error;
            if (todayResult.error) throw todayResult.error;
            if (weekResult.error) throw weekResult.error;
            if (monthResult.error) throw monthResult.error;
            if (recentResult.error) throw recentResult.error;

            console.log(`✅ Total entries: ${totalResult.count}`);
            console.log(`✅ Today entries: ${todayResult.count}`);
            console.log(`✅ Week entries: ${weekResult.count}`);
            console.log(`✅ Month entries: ${monthResult.count}`);

            // Calculate avg_selisih and verified_count from recent data
            const recentEntries = recentResult.data || [];
            let totalSelisih = 0;
            let selisihCount = 0;
            let verifiedCount = 0;

            recentEntries.forEach(entry => {
                // Sum selisih for average
                const selisih = parseFloat(entry.selisih || 0);
                if (!isNaN(selisih)) {
                    totalSelisih += selisih;
                    selisihCount++;
                }

                // Count verified entries
                if (entry.status === 'verified') {
                    verifiedCount++;
                }
            });

            const avgSelisih = selisihCount > 0 ? totalSelisih / selisihCount : 0;

            const stats = {
                total_entries: totalResult.count,
                today_entries: todayResult.count,
                week_entries: weekResult.count,
                month_entries: monthResult.count,
                avg_selisih: avgSelisih,
                verified_count: verifiedCount
            };

            console.log('📊 Final global stats:', {
                total: stats.total_entries,
                today: stats.today_entries,
                week: stats.week_entries,
                month: stats.month_entries,
                avg_selisih: avgSelisih.toFixed(2)
            });

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
