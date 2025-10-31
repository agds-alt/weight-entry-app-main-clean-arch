const dashboardRepository = require('../repositories/dashboard.repository');

class DashboardService {
    /**
     * Get global statistics (all entries from all users)
     */
    async getGlobalStats() {
        try {
            const stats = await dashboardRepository.getGlobalStats();

            // Calculate earnings (Rp 500 per entry)
            const totalEarnings = stats.total_entries * 500;
            const todayEarnings = stats.today_entries * 500;
            const weekEarnings = stats.week_entries * 500;
            const monthEarnings = stats.month_entries * 500;

            return {
                total_entries: stats.total_entries || 0,
                today_entries: stats.today_entries || 0,
                week_entries: stats.week_entries || 0,
                month_entries: stats.month_entries || 0,
                avg_selisih: parseFloat(stats.avg_selisih || 0).toFixed(2),
                verified_count: stats.verified_count || 0,
                total_earnings: totalEarnings,
                today_earnings: todayEarnings,
                week_earnings: weekEarnings,
                month_earnings: monthEarnings
            };
        } catch (error) {
            console.error('Get global stats service error:', error);
            throw new Error('Failed to get global statistics');
        }
    }

    /**
     * Get user statistics
     */
    async getUserStats(username) {
        try {
            const stats = await dashboardRepository.getUserStats(username);
            
            // Calculate earnings (Rp 500 per entry)
            const totalEarnings = stats.total_entries * 500;
            const todayEarnings = stats.today_entries * 500;
            const weekEarnings = stats.week_entries * 500;
            const monthEarnings = stats.month_entries * 500;

            return {
                total_entries: stats.total_entries || 0,
                today_entries: stats.today_entries || 0,
                week_entries: stats.week_entries || 0,
                month_entries: stats.month_entries || 0,
                avg_selisih: parseFloat(stats.avg_selisih || 0).toFixed(2),
                verified_count: stats.verified_count || 0,
                total_earnings: totalEarnings,
                today_earnings: todayEarnings,
                week_earnings: weekEarnings,
                month_earnings: monthEarnings
            };
        } catch (error) {
            console.error('Get user stats service error:', error);
            throw new Error('Failed to get user statistics');
        }
    }

    /**
     * Get leaderboard data
     */
    async getLeaderboard() {
        try {
            const leaderboard = await dashboardRepository.getLeaderboard();
            
            // Add ranking and calculate earnings
            return leaderboard.map((user, index) => ({
                rank: index + 1,
                username: user.username,
                total_entries: user.total_entries,
                total_earnings: user.total_entries * 500
            }));
        } catch (error) {
            console.error('Get leaderboard service error:', error);
            throw new Error('Failed to get leaderboard data');
        }
    }

    /**
     * Get performance data for charts
     */
    async getPerformanceData(username) {
        try {
            const performanceData = await dashboardRepository.getPerformanceData(username);
            return this.formatPerformanceData(performanceData);
        } catch (error) {
            console.error('Get performance data service error:', error);
            throw new Error('Failed to get performance data');
        }
    }

    /**
     * Format performance data for charts
     */
    formatPerformanceData(data) {
        // Get last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        // Map data to last 7 days
        return last7Days.map(date => {
            const dayData = data.find(d => d.date === date);
            return {
                date: date,
                entries: dayData ? dayData.entries_count : 0,
                earnings: dayData ? dayData.entries_count * 500 : 0
            };
        });
    }
}

module.exports = new DashboardService();