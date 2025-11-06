// dashboard.js - Fixed Version
class RealtimeDashboard {
    constructor() {
        this.currentUser = null;
        this.stats = {
            total_entries: 0,
            entries_today: 0,
            entries_this_week: 0,
            entries_this_month: 0,
            avg_selisih: 0,
            verified_count: 0
        };
        this.init();
    }

    async init() {
        await this.getUserInfo();
        await this.loadDashboardData();
        this.setupPolling();
    }

    async getUserInfo() {
        this.currentUser = {
            id: localStorage.getItem('userId'),
            username: localStorage.getItem('userName'),
            role: localStorage.getItem('userRole')
        };
        
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome back, ${this.currentUser.username}! 👋`;
        }
    }

    async loadDashboardData() {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                console.error('No access token found');
                this.showErrorNotification('Silakan login kembali');
                return;
            }

            console.log('🔄 Loading dashboard data...');

            const [statsResponse, dailyLeaderboardResponse, totalLeaderboardResponse] = await Promise.all([
                fetch('/api/dashboard/global-stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch('/api/dashboard/leaderboard/daily', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch('/api/dashboard/leaderboard/total', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            // Handle stats response
            if (statsResponse.ok) {
                const response = await statsResponse.json();
                console.log('📊 Global stats response from API:', response);
                // Extract data from {success: true, data: {...}} format
                this.stats = response.data || response;
                this.updateDashboardUI();
            } else {
                console.error('Stats API error:', statsResponse.status);
                this.showErrorNotification('Gagal memuat data statistik');
            }

            // Handle daily leaderboard response
            if (dailyLeaderboardResponse.ok) {
                const dailyData = await dailyLeaderboardResponse.json();
                console.log('🔥 Daily leaderboard data from API:', dailyData);
                this.updateDailyLeaderboard(dailyData);
            } else {
                console.error('Daily leaderboard API error:', dailyLeaderboardResponse.status);
            }

            // Handle total leaderboard response
            if (totalLeaderboardResponse.ok) {
                const totalData = await totalLeaderboardResponse.json();
                console.log('🏆 Total leaderboard data from API:', totalData);
                this.updateTotalLeaderboard(totalData);
            } else {
                console.error('Total leaderboard API error:', totalLeaderboardResponse.status);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showErrorNotification('Error koneksi: ' + error.message);
            
            // Fallback data
            this.stats = {
                total_entries: 0,
                entries_today: 0,
                entries_this_week: 0,
                entries_this_month: 0,
                avg_selisih: 0,
                verified_count: 0
            };
            this.updateDashboardUI();
        }
    }

    setupPolling() {
        // Poll every 30 seconds for updates
        setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }

    updateDashboardUI() {
        console.log('🔄 Updating UI with stats:', this.stats);
        
        // Calculate earnings based on Rp 500
        const totalEarnings = (this.stats.total_entries || 0) * 500;
        const todayEarnings = (this.stats.entries_today || 0) * 500;
        const weekEarnings = (this.stats.entries_this_week || 0) * 500;
        const monthEarnings = (this.stats.entries_this_month || 0) * 500;

        // Update earnings card
        this.updateElement('totalEarnings', 'innerHTML', `${this.formatCurrency(totalEarnings)}<sup>,-</sup>`);
        this.updateElement('totalEntriesCount', 'textContent', this.stats.total_entries || 0);

        // 🔥 Update NEW Global Total Entries Card (prominent display with animation)
        const globalTotal = this.stats.total_entries || 0;
        this.updateElement('globalTotalEntries', 'textContent', globalTotal.toLocaleString('id-ID'));
        console.log('📊 Global Total Entries displayed:', globalTotal);

        // 📸 Update NEW Global Total Photos Card (entries × 2 because each entry has 2 photos)
        const globalTotalPhotos = globalTotal * 2;
        this.updateElement('globalTotalPhotos', 'textContent', globalTotalPhotos.toLocaleString('id-ID'));
        console.log('📸 Global Total Photos displayed:', globalTotalPhotos);

        // Update period earnings
        this.updateElement('todayEarnings', 'textContent', this.formatCurrency(todayEarnings));
        this.updateElement('weekEarnings', 'textContent', this.formatCurrency(weekEarnings));
        this.updateElement('monthEarnings', 'textContent', this.formatCurrency(monthEarnings));

        // Update stats cards (handle both old and new field names)
        this.updateElement('todayEntries', 'textContent', this.stats.today_entries || this.stats.entries_today || 0);
        this.updateElement('weekEntries', 'textContent', this.stats.week_entries || this.stats.entries_this_week || 0);
        
        // FIX: Handle string/number for avg_selisih
        const avgSelisih = parseFloat(this.stats.avg_selisih || 0);
        this.updateElement('avgSelisih', 'textContent', `${avgSelisih.toFixed(2)} kg`);
        
        this.updateElement('verifiedCount', 'textContent', this.stats.verified_count || 0);

        // Update progress and level
        this.updateUserLevel();
        this.updateCompletionRate();
    }

    updateElement(elementId, property, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element[property] = value;
        } else {
            console.warn(`Element #${elementId} not found`);
        }
    }

    updateUserLevel() {
        const entries = this.stats.total_entries || 0;
        let level, nextLevel;
        
        if (entries >= 1000) {
            level = { name: 'Diamond', class: 'level-diamond', next: null };
        } else if (entries >= 500) {
            level = { name: 'Gold', class: 'level-gold', next: 1000 };
        } else if (entries >= 200) {
            level = { name: 'Silver', class: 'level-silver', next: 500 };
        } else if (entries >= 100) {
            level = { name: 'Bronze', class: 'level-bronze', next: 200 };
        } else {
            level = { name: 'Beginner', class: 'level-beginner', next: 100 };
        }

        const levelElement = document.getElementById('userLevel');
        if (levelElement) {
            levelElement.className = `user-level ${level.class}`;
            levelElement.innerHTML = `<i class="fas fa-medal me-1"></i> ${level.name}`;
        }

        // Update progress bar
        const progressBar = document.getElementById('levelProgress');
        const progressText = document.getElementById('progressText');
        
        if (progressBar && progressText) {
            if (level.next) {
                const progress = Math.min(100, ((entries % level.next) / level.next) * 100);
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${entries}/${level.next} entries`;
            } else {
                progressBar.style.width = '100%';
                progressText.textContent = 'Max Level Reached!';
            }
        }
    }

    updateCompletionRate() {
        const completionElement = document.getElementById('completionRate');
        if (completionElement) {
            const target = 50; // target harian
            const today = this.stats.entries_today || 0;
            const rate = Math.min(100, Math.round((today / target) * 100));
            completionElement.textContent = `${rate}%`;
        }
    }

    updateDailyLeaderboard(leaderboard) {
        console.log('🔥 updateDailyLeaderboard called with:', leaderboard);

        if (!leaderboard || !Array.isArray(leaderboard)) {
            console.error('❌ Invalid daily leaderboard data:', leaderboard);
            return;
        }

        if (leaderboard.length === 0) {
            console.log('⚠️ No daily entries yet');
            this.safeUpdateElement('dailyLeaderboardList', '<p style="text-align: center; color: var(--text-gray); padding: 20px;">Belum ada data hari ini</p>');
            return;
        }

        console.log(`✅ Processing ${leaderboard.length} daily leaderboard entries`);

        const leaderboardHtml = leaderboard.map((user, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const dailyEntries = user.daily_entries || 0;
            const dailyEarnings = user.daily_earnings || (dailyEntries * 500);

            return `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">${rank}</div>
                    <div class="leaderboard-user">
                        <div class="leaderboard-name">${user.username}</div>
                        <div class="leaderboard-entries">
                            <span style="font-weight: 600; color: var(--primary-red);">${dailyEntries} entries hari ini</span>
                        </div>
                    </div>
                    <div class="leaderboard-earnings">${this.formatCurrency(dailyEarnings)}</div>
                </div>
            `;
        }).join('');

        this.safeUpdateElement('dailyLeaderboardList', leaderboardHtml);
    }

    updateTotalLeaderboard(leaderboard) {
        console.log('🏆 updateTotalLeaderboard called with:', leaderboard);

        if (!leaderboard || !Array.isArray(leaderboard)) {
            console.error('❌ Invalid total leaderboard data:', leaderboard);
            return;
        }

        if (leaderboard.length === 0) {
            console.warn('⚠️ No leaderboard data');
            return;
        }

        console.log(`✅ Processing ${leaderboard.length} total leaderboard entries`);

        const leaderboardHtml = leaderboard.map((user, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const totalEntries = user.total_entries || 0;
            const totalEarnings = user.total_earnings || (totalEntries * 500);

            return `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">${rank}</div>
                    <div class="leaderboard-user">
                        <div class="leaderboard-name">${user.username}</div>
                        <div class="leaderboard-entries">
                            <span style="font-weight: 600;">${totalEntries} total entries</span>
                        </div>
                    </div>
                    <div class="leaderboard-earnings">${this.formatCurrency(totalEarnings)}</div>
                </div>
            `;
        }).join('');

        this.safeUpdateElement('totalLeaderboardList', leaderboardHtml);
    }

    safeUpdateElement(elementId, html, retryCount = 0, maxRetries = 5) {
        const element = document.getElementById(elementId);

        if (element) {
            console.log(`📝 Updating #${elementId}...`);
            element.innerHTML = html;
            console.log(`✅ #${elementId} updated successfully!`);
            return true;
        } else {
            console.warn(`⚠️ Element #${elementId} not found (attempt ${retryCount + 1}/${maxRetries})`);

            if (retryCount < maxRetries) {
                // Retry after delay
                const delay = 100 * (retryCount + 1); // Increasing delay: 100ms, 200ms, 300ms...
                console.log(`⏳ Retrying in ${delay}ms...`);

                setTimeout(() => {
                    this.safeUpdateElement(elementId, html, retryCount + 1, maxRetries);
                }, delay);
            } else {
                console.error(`❌ Element #${elementId} not found after ${maxRetries} attempts!`);
                console.error(`🔍 Available elements:`, document.querySelectorAll('[id]'));
            }
            return false;
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount).replace('IDR', 'Rp');
    }

    showRealtimeNotification(message) {
        this.showNotification(message, 'var(--neon-cyan)');
    }

    showErrorNotification(message) {
        this.showNotification(message, 'var(--neon-magenta)');
    }

    showNotification(message, color) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.dashboard-notification');
        existingNotifications.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = 'dashboard-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: var(--dark-bg);
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Loaded, waiting for sidebar...');

    // Small delay to ensure sidebar.js has finished injecting
    setTimeout(() => {
        console.log('🚀 Initializing RealtimeDashboard...');
        new RealtimeDashboard();
    }, 100);
});