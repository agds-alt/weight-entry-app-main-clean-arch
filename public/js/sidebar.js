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

                    <!-- Hidden: User Management, Password, Settings - not needed -->
                    <!--
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
                    -->
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

    // Minimal white sidebar styles
    const sidebarStyles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

            :root {
                --sidebar-width: 280px;
                --white: #FFFFFF;
                --gray-50: #FAFAFA;
                --gray-100: #F5F5F5;
                --gray-200: #EEEEEE;
                --gray-300: #E0E0E0;
                --gray-400: #BDBDBD;
                --gray-500: #9E9E9E;
                --gray-600: #757575;
                --gray-700: #616161;
                --gray-800: #424242;
                --gray-900: #212121;
                --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
                --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.12);
                --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.15);
                --border-light: 1px solid #E0E0E0;
                --border-medium: 2px solid #BDBDBD;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                margin: 0;
                padding: 0;
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                transition: padding-left 0.3s ease;
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
                background: var(--white);
                border-right: var(--border-light);
                box-shadow: var(--shadow-lg);
                transition: transform 0.3s ease;
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
                background: var(--gray-900);
                border: none;
                color: var(--white);
                width: 50px;
                height: 50px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: 0 4px 12px rgba(33, 33, 33, 0.2);
                font-family: 'Poppins', sans-serif;
            }

            .sidebar-toggle-btn:hover {
                background: var(--gray-800);
                color: var(--white);
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 8px 20px rgba(33, 33, 33, 0.3);
            }

            .sidebar-toggle-btn:active {
                transform: translateY(-1px) scale(1.02);
                box-shadow: 0 2px 8px rgba(33, 33, 33, 0.2);
            }

            body.sidebar-open .sidebar-toggle-btn {
                left: calc(var(--sidebar-width) + 20px);
            }

            .sidebar-header {
                padding: 24px 20px;
                border-bottom: 2px solid var(--gray-900);
                background: var(--white);
                position: relative;
            }

            .logo-section {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .logo-icon {
                font-size: 24px;
                color: var(--gray-900);
                transition: transform 0.3s;
            }

            .logo-icon:hover {
                transform: scale(1.05);
            }

            .logo-text {
                font-weight: 700;
                font-size: 14px;
                color: var(--gray-900);
                transition: all 0.3s ease;
                line-height: 1.3;
            }

            .user-info {
                padding: 20px;
                border-bottom: var(--border-light);
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.3s;
                background: var(--gray-50);
            }

            .user-info:hover {
                background: var(--gray-100);
            }

            .user-avatar {
                font-size: 36px;
                color: var(--gray-900);
                transition: transform 0.3s;
            }

            .user-avatar:hover {
                transform: scale(1.05);
            }

            .user-details {
                display: flex;
                flex-direction: column;
            }

            .user-name {
                font-weight: 600;
                color: var(--gray-900);
                font-size: 14px;
            }

            .user-role {
                font-size: 11px;
                color: var(--gray-600);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
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
                background: var(--gray-300);
                margin: 12px 20px;
            }

            .nav-link {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                color: var(--gray-700);
                text-decoration: none;
                transition: all 0.3s ease;
                position: relative;
                background: transparent;
                border: none;
                margin: 3px 12px;
                border-radius: 8px;
                font-weight: 500;
                font-size: 14px;
            }

            .nav-link:hover {
                background: var(--gray-100);
                color: var(--gray-900);
                transform: translateX(3px);
            }

            .nav-link.active {
                background: var(--gray-900);
                color: var(--white);
            }

            .nav-link.active::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background: var(--white);
                border-radius: 0 3px 3px 0;
            }

            .nav-link i {
                font-size: 16px;
                width: 20px;
                text-align: center;
                color: var(--gray-600);
                transition: all 0.3s ease;
            }

            .nav-link:hover i {
                color: var(--gray-900);
            }

            .nav-link.active i {
                color: var(--white);
            }

            .nav-text {
                font-weight: 500;
                letter-spacing: 0.3px;
            }

            .nav-footer {
                padding: 16px;
                border-top: var(--border-light);
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .logout-btn {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 13px 16px;
                background: var(--white);
                border: 2px solid var(--gray-900);
                color: var(--gray-900);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 2px 6px rgba(33, 33, 33, 0.1);
                font-family: 'Poppins', sans-serif;
                letter-spacing: 0.3px;
            }

            .logout-btn:hover {
                background: var(--gray-900);
                color: var(--white);
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 6px 16px rgba(33, 33, 33, 0.25);
                border-color: var(--gray-900);
            }

            .logout-btn:active {
                transform: translateY(-1px) scale(1.01);
                box-shadow: 0 2px 8px rgba(33, 33, 33, 0.15);
            }

            .logout-btn i {
                font-size: 16px;
                transition: transform 0.3s ease;
            }

            .logout-btn:hover i {
                transform: translateX(-2px);
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
