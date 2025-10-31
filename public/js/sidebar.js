// sidebar.js - Holographic Modern Collapsible Sidebar
// Save this in public/js/sidebar.js

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    
    if (!token) {
        // Only redirect if not on public pages
        const publicPages = ['/', '/index.html', '/login.html', '/signup.html', '/forgot-password.html'];
        const currentPath = window.location.pathname;
        
        if (!publicPages.includes(currentPath)) {
            window.location.href = '/login.html';
            return;
        }
        // Don't inject sidebar on public pages
        return;
    }

    // Create sidebar HTML with light theme design
    const sidebarHTML = `
        <button id="sidebarToggle" class="sidebar-toggle-btn">
            <i class="fas fa-bars"></i>
        </button>

        <div id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <div class="logo-section">
                    <i class="fas fa-weight-hanging logo-icon"></i>
                    <span class="logo-text">Aplikasi Deteksi Selisih Berat</span>
                </div>
            </div>

            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-details">
                    <span class="user-name">${userName || 'User'}</span>
                    <span class="user-role">${userRole || 'user'}</span>
                </div>
            </div>

            <nav class="sidebar-nav">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="/dashboard.html" class="nav-link" data-page="dashboard">
                            <i class="fas fa-tachometer-alt"></i>
                            <span class="nav-text">Dashboard</span>
                        </a>
                    </li>
                    
                    <li class="nav-item">
                        <a href="/entry.html" class="nav-link" data-page="entry">
                            <i class="fas fa-edit"></i>
                            <span class="nav-text">Entry Data</span>
                        </a>
                    </li>

                

                    <li class="nav-item">
                        <a href="/data-management.html" class="nav-link" data-page="data-management">
                            <i class="fas fa-database"></i>
                            <span class="nav-text">Manajemen Data</span>
                        </a>
                    </li>

                                        <li class="nav-item">
                        <a href="/foto-management.html" class="nav-link" data-page="foto-management">
                            <i class="fas fa-database"></i>
                            <span class="nav-text">Manajemen Foto</span>
                        </a>
                    </li>

                    <li class="nav-item nav-divider"></li>

                    <li class="nav-item">
                        <a href="/profile.html" class="nav-link" data-page="profile">
                            <i class="fas fa-user"></i>
                            <span class="nav-text">Profil</span>
                        </a>
                    </li>

                                        ${userRole === 'admin' ? `
                    <li class="nav-item">
                        <a href="/user-management.html" class="nav-link" data-page="user-management">
                            <i class="fas fa-users"></i>
                            <span class="nav-text">Manajemen User</span>
                        </a>
                    </li>
                    ` : ''}


                    <li class="nav-item">
                        <a href="/password.html" class="nav-link" data-page="password">
                            <i class="fas fa-key"></i>
                            <span class="nav-text">Ganti Password</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="/settings.html" class="nav-link" data-page="settings">
                            <i class="fas fa-cog"></i>
                            <span class="nav-text">Settings</span>
                        </a>
                    </li>
                </ul>

                <div class="nav-footer">
                   
                    <button id="logoutBtn" class="logout-btn">
                        <i class="fas fa-sign-out-alt"></i>
                        <span class="nav-text">Logout</span>
                    </button>
                </div>
            </nav>
        </div>

        <div id="sidebarOverlay" class="sidebar-overlay"></div>
    `;

    // Light theme sidebar styles
    const sidebarStyles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

            :root {
                --sidebar-width: 280px;
                --primary-red: #ff3b3b;
                --primary-red-dark: #e63535;
                --primary-red-light: #ff6b6b;
                --bg-white: #ffffff;
                --bg-gray: #f5f7fa;
                --text-dark: #2d3748;
                --text-gray: #718096;
                --shadow-3d: 8px 8px 16px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.9);
                --border-radius: 16px;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                margin: 0;
                padding: 0;
                font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            body.sidebar-open {
                padding-left: var(--sidebar-width);
            }

            .sidebar {
                position: fixed;
                top: 0;
                left: 0;
                height: 100vh;
                width: var(--sidebar-width);
                background: var(--bg-white);
                border-right: 1px solid rgba(0, 0, 0, 0.1);
                box-shadow: 4px 0 12px rgba(0, 0, 0, 0.08);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                transform: translateX(0);
                overflow-y: auto;
            }

            body:not(.sidebar-open) .sidebar {
                transform: translateX(-100%);
            }

            .sidebar-toggle-btn {
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 1001;
                background: var(--bg-white);
                border: 1px solid rgba(0, 0, 0, 0.1);
                color: var(--text-dark);
                width: 48px;
                height: 48px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: var(--shadow-3d);
            }

            .sidebar-toggle-btn:hover {
                background: var(--primary-red);
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(255, 59, 59, 0.3);
            }

            body.sidebar-open .sidebar-toggle-btn {
                left: calc(var(--sidebar-width) + 20px);
            }

            .sidebar-header {
                padding: 30px 20px;
                border-bottom: 3px solid var(--primary-red);
                background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
                position: relative;
            }

            .logo-section {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .logo-icon {
                font-size: 28px;
                color: var(--primary-red);
                transition: transform 0.3s;
            }

            .logo-icon:hover {
                transform: scale(1.1);
            }

            .logo-text {
                font-weight: 700;
                font-size: 18px;
                color: var(--text-dark);
                transition: all 0.3s ease;
            }

            .user-info {
                padding: 25px 20px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                gap: 15px;
                transition: all 0.3s;
                background: var(--bg-gray);
            }

            .user-info:hover {
                background: rgba(255, 59, 59, 0.05);
            }

            .user-avatar {
                font-size: 42px;
                color: var(--primary-red);
                transition: transform 0.3s;
            }

            .user-avatar:hover {
                transform: scale(1.1);
            }

            .user-details {
                display: flex;
                flex-direction: column;
            }

            .user-name {
                font-weight: 600;
                color: var(--text-dark);
                font-size: 16px;
            }

            .user-role {
                font-size: 12px;
                color: var(--text-gray);
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 500;
            }

            .sidebar-nav {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 20px 0;
                overflow-y: auto;
            }

            .nav-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .nav-item {
                margin-bottom: 8px;
                position: relative;
            }

            .nav-divider {
                height: 1px;
                background: rgba(0, 0, 0, 0.1);
                margin: 15px 20px;
            }

            .nav-link {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 14px 20px;
                color: var(--text-dark);
                text-decoration: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                background: transparent;
                border: none;
                margin: 4px 10px;
                border-radius: 12px;
            }

            .nav-link:hover {
                background: var(--bg-gray);
                transform: translateX(4px);
            }

            .nav-link.active {
                background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
                color: var(--primary-red);
            }

            .nav-link.active::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: var(--primary-red);
                border-radius: 0 4px 4px 0;
            }

            .nav-link i {
                font-size: 18px;
                width: 24px;
                text-align: center;
                color: var(--text-gray);
                transition: all 0.3s ease;
            }

            .nav-link.active i {
                color: var(--primary-red);
            }

            .nav-link:hover i {
                color: var(--primary-red);
                transform: scale(1.1);
            }

            .nav-text {
                font-weight: 500;
                letter-spacing: 0.3px;
            }

            .nav-footer {
                padding: 20px;
                border-top: 1px solid rgba(0, 0, 0, 0.1);
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .logout-btn {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 14px 20px;
                background: var(--bg-white);
                border: 1px solid rgba(0, 0, 0, 0.1);
                color: var(--primary-red);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 14px;
                font-weight: 600;
                box-shadow: var(--shadow-3d);
            }

            .logout-btn:hover {
                background: var(--primary-red);
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(255, 59, 59, 0.3);
            }

            .sidebar-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px);
                z-index: 999;
                opacity: 0;
                transition: opacity 0.3s;
            }

            body.sidebar-open .sidebar-overlay {
                display: block;
                opacity: 1;
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                body.sidebar-open {
                    padding-left: 0;
                }

                body.sidebar-open .sidebar-toggle-btn {
                    left: 20px;
                }
            }
        </style>
    `;

    // Insert sidebar into page
    document.head.insertAdjacentHTML('beforeend', sidebarStyles);
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    // Load saved sidebar state (default open on desktop)
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState === null) {
        // Default: open on desktop, closed on mobile
        if (window.innerWidth > 768) {
            document.body.classList.add('sidebar-open');
        }
    } else if (savedState === 'true') {
        document.body.classList.add('sidebar-open');
    }

    // Get current page and set active menu
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
    const activeLink = document.querySelector(`[data-page="${currentPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Toggle sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    sidebarToggle.addEventListener('click', function() {
        document.body.classList.toggle('sidebar-open');

        // Save preference
        const isOpen = document.body.classList.contains('sidebar-open');
        localStorage.setItem('sidebarOpen', isOpen);
    });

    // Overlay click closes sidebar
    sidebarOverlay.addEventListener('click', function() {
        document.body.classList.remove('sidebar-open');
        localStorage.setItem('sidebarOpen', 'false');
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            localStorage.clear();
            window.location.href = '/index.html';
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + B to toggle sidebar
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            sidebarToggle.click();
        }
    });

});
