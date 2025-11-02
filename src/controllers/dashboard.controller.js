const dashboardService = require('../services/dashboard.service');

class DashboardController {
    /**
     * Get global statistics (all entries from all users)
     */
    async getGlobalStats(req, res) {
        try {

            const stats = await dashboardService.getGlobalStats();

            return res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('❌ Get global stats controller error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Gagal mengambil statistik global'
            });
        }
    }

    /**
     * Get user statistics for dashboard
     */
    async getUserStats(req, res) {
        try {
            const username = req.user?.username || req.user?.userName;
            
            if (!username) {
                return res.status(400).json({
                    success: false,
                    message: 'Username tidak ditemukan'
                });
            }


            const stats = await dashboardService.getUserStats(username);
            
            return res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('❌ Get user stats controller error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Gagal mengambil statistik pengguna'
            });
        }
    }

    /**
     * Get leaderboard data
     */
    async getLeaderboard(req, res) {
        try {
            
            const leaderboard = await dashboardService.getLeaderboard();
            
            return res.json({
                success: true,
                data: leaderboard
            });
        } catch (error) {
            console.error('❌ Get leaderboard controller error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Gagal mengambil data leaderboard'
            });
        }
    }

    /**
     * Get performance data for charts
     */
    async getPerformanceData(req, res) {
        try {
            const username = req.user?.username || req.user?.userName;
            
            if (!username) {
                return res.status(400).json({
                    success: false,
                    message: 'Username tidak ditemukan'
                });
            }


            const performanceData = await dashboardService.getPerformanceData(username);
            
            return res.json({
                success: true,
                data: performanceData
            });
        } catch (error) {
            console.error('❌ Get performance data controller error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Gagal mengambil data performa'
            });
        }
    }
}

module.exports = new DashboardController();