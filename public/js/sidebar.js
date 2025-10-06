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

    // Create sidebar HTML with holographic design
    const sidebarHTML = `
        <div id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <div class="logo-section">
                    <i class="fas fa-weight-hanging logo-icon"></i>
                    <span class="logo-text">WeightTracker Pro</span>
                </div>
                <button id="sidebarToggle" class="sidebar-toggle">
                    <i class="fas fa-bars"></i>
                </button>
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
                        <a href="/report.html" class="nav-link" data-page="report">
                            <i class="fas fa-chart-bar"></i>
                            <span class="nav-text">Report & Analytics</span>
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
                        <a href="/data-management.html" class="nav-link" data-page="data-management">
                            <i class="fas fa-database"></i>
                            <span class="nav-text">Manajemen Data</span>
                        </a>
                    </li>

                                        <li class="nav-item">
                        <a href="/data-management.html" class="nav-link" data-page="foto-management">
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

    // Holographic sidebar styles
    const sidebarStyles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
            
            :root {
                --sidebar-width: 280px;
                --sidebar-collapsed-width: 80px;
                --neon-cyan: #00f3ff;
                --neon-magenta: #ff00ff;
                --neon-lime: #00ff9d;
                --neon-blue: #0066ff;
                --dark-bg: #0a0a0f;
                --dark-sidebar: rgba(15, 15, 25, 0.95);
                --dark-text: #e0e0ff;
                --glass-bg: rgba(255, 255, 255, 0.05);
                --glass-border: rgba(255, 255, 255, 0.1);
                --hologram-gradient: linear-gradient(
                    45deg,
                    var(--neon-cyan) 0%,
                    var(--neon-magenta) 25%,
                    var(--neon-lime) 50%,
                    var(--neon-blue) 75%,
                    var(--neon-cyan) 100%
                );
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
                transition: background-color 0.3s;
                background: var(--dark-bg);
                color: var(--dark-text);
            }

            body.sidebar-active {
                padding-left: var(--sidebar-width);
            }

            body.sidebar-collapsed {
                padding-left: var(--sidebar-collapsed-width);
            }

            .sidebar {
                position: fixed;
                top: 0;
                left: 0;
                height: 100vh;
                width: var(--sidebar-width);
                background: var(--dark-sidebar);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border-right: 1px solid var(--glass-border);
                box-shadow: 
                    0 0 50px rgba(0, 243, 255, 0.1),
                    inset 0 0 100px rgba(255, 0, 255, 0.05);
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                transform: translateX(0);
                overflow: hidden;
            }

            .sidebar::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--hologram-gradient);
                opacity: 0.03;
                animation: hologramShift 8s ease-in-out infinite;
                z-index: -1;
            }

            @keyframes hologramShift {
                0%, 100% { 
                    filter: hue-rotate(0deg) blur(20px);
                    transform: scale(1.2) rotate(0deg);
                }
                25% { 
                    filter: hue-rotate(90deg) blur(25px);
                    transform: scale(1.3) rotate(90deg);
                }
                50% { 
                    filter: hue-rotate(180deg) blur(30px);
                    transform: scale(1.25) rotate(180deg);
                }
                75% { 
                    filter: hue-rotate(270deg) blur(25px);
                    transform: scale(1.3) rotate(270deg);
                }
            }

            body.sidebar-collapsed .sidebar {
                width: var(--sidebar-collapsed-width);
            }

            .sidebar-header {
                padding: 25px 20px;
                background: linear-gradient(
                    135deg,
                    rgba(0, 243, 255, 0.1) 0%,
                    rgba(255, 0, 255, 0.1) 50%,
                    rgba(0, 255, 157, 0.1) 100%
                );
                border-bottom: 1px solid var(--glass-border);
                position: relative;
                overflow: hidden;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .sidebar-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%2300F3FF' fill-opacity='0.05' d='M45,-74.4C58.4,-67.8,69.4,-55.8,77.2,-41.8C85,-27.8,89.6,-11.9,89.5,0.1C89.3,12.1,84.4,24.2,76.6,34.7C68.8,45.2,58.1,54.1,45.8,60.9C33.5,67.7,19.6,72.4,4.7,65.9C-10.2,59.4,-21.3,41.7,-32.7,30.2C-44.1,18.7,-55.7,13.4,-63.5,2.7C-71.3,-8.1,-75.3,-24.3,-69.9,-36.2C-64.5,-48.1,-49.7,-55.7,-34.8,-61.6C-19.9,-67.5,-4.9,-71.7,8.8,-73.9C22.6,-76.1,31.6,-81,45,-74.4Z' transform='translate(100 100)'/%3E%3C/svg%3E");
                animation: float 15s ease-in-out infinite;
            }

            @keyframes float {
                0%, 100% { 
                    transform: translate(0, 0) rotate(0deg) scale(1);
                }
                33% { 
                    transform: translate(10px, -10px) rotate(120deg) scale(1.1);
                }
                66% { 
                    transform: translate(-5px, 5px) rotate(240deg) scale(0.9);
                }
            }

            .logo-section {
                display: flex;
                align-items: center;
                gap: 12px;
                position: relative;
                z-index: 1;
            }

            .logo-icon {
                font-size: 26px;
                background: var(--hologram-gradient);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                animation: pulseGlow 3s ease-in-out infinite;
                filter: drop-shadow(0 0 10px rgba(0, 243, 255, 0.5));
            }

            @keyframes pulseGlow {
                0%, 100% { 
                    transform: scale(1) rotate(0deg);
                    filter: drop-shadow(0 0 10px rgba(0, 243, 255, 0.5));
                }
                50% { 
                    transform: scale(1.1) rotate(5deg);
                    filter: drop-shadow(0 0 20px rgba(255, 0, 255, 0.7));
                }
            }

            .logo-text {
                font-weight: 700;
                font-size: 18px;
                background: linear-gradient(135deg, var(--neon-cyan), var(--neon-lime));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                transition: all 0.3s ease;
                text-shadow: 0 0 30px rgba(0, 243, 255, 0.3);
            }

            body.sidebar-collapsed .logo-text {
                opacity: 0;
                width: 0;
                overflow: hidden;
            }

            .sidebar-toggle {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid var(--glass-border);
                color: var(--neon-cyan);
                padding: 10px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                position: relative;
                z-index: 1;
                font-size: 16px;
            }

            .sidebar-toggle:hover {
                background: rgba(0, 243, 255, 0.2);
                transform: rotate(90deg) scale(1.1);
                box-shadow: 0 0 20px rgba(0, 243, 255, 0.4);
                border-color: var(--neon-cyan);
            }

            .user-info {
                padding: 25px 20px;
                border-bottom: 1px solid var(--glass-border);
                display: flex;
                align-items: center;
                gap: 15px;
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
            }

            .user-info::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(0, 243, 255, 0.1),
                    transparent
                );
                transition: left 0.5s ease;
            }

            .user-info:hover::before {
                left: 100%;
            }

            .user-avatar {
                font-size: 42px;
                background: var(--hologram-gradient);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                animation: float3d 4s ease-in-out infinite;
                filter: drop-shadow(0 0 15px rgba(255, 0, 255, 0.3));
            }

            @keyframes float3d {
                0%, 100% { 
                    transform: translateY(0px) rotateY(0deg) scale(1);
                }
                25% { 
                    transform: translateY(-8px) rotateY(90deg) scale(1.05);
                }
                50% { 
                    transform: translateY(0px) rotateY(180deg) scale(1);
                }
                75% { 
                    transform: translateY(8px) rotateY(270deg) scale(1.05);
                }
            }

            .user-details {
                display: flex;
                flex-direction: column;
                transition: opacity 0.3s;
            }

            body.sidebar-collapsed .user-details {
                opacity: 0;
                width: 0;
                overflow: hidden;
            }

            .user-name {
                font-weight: 600;
                color: var(--neon-lime);
                font-size: 16px;
                text-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
            }

            .user-role {
                font-size: 12px;
                color: var(--neon-cyan);
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 500;
                text-shadow: 0 0 5px rgba(0, 243, 255, 0.3);
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
                background: linear-gradient(90deg, transparent, var(--neon-magenta), transparent);
                margin: 20px;
                position: relative;
            }

            .nav-divider::before {
                content: '';
                position: absolute;
                top: -2px;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, var(--neon-cyan), transparent);
                animation: scanLine 2s linear infinite;
            }

            @keyframes scanLine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .nav-link {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 14px 20px;
                color: var(--dark-text);
                text-decoration: none;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                position: relative;
                overflow: hidden;
                background: transparent;
                border: none;
                border-radius: 0;
                margin: 0 10px;
                border-radius: 12px;
            }

            .nav-link::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(0, 243, 255, 0.1),
                    transparent
                );
                transition: left 0.5s ease;
            }

            .nav-link:hover::before {
                left: 100%;
            }

            .nav-link:hover {
                background: rgba(255, 255, 255, 0.05);
                transform: translateX(8px) perspective(500px) rotateY(10deg);
                box-shadow: 
                    -5px 0 15px rgba(0, 243, 255, 0.3),
                    inset 0 0 20px rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(0, 243, 255, 0.2);
            }

            .nav-link.active {
                background: rgba(255, 255, 255, 0.08);
                transform: perspective(500px) rotateY(5deg);
                box-shadow: 
                    -8px 0 25px rgba(255, 0, 255, 0.4),
                    inset 0 0 30px rgba(0, 243, 255, 0.1);
                border: 1px solid rgba(255, 0, 255, 0.3);
            }

            .nav-link.active::after {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: var(--hologram-gradient);
                animation: slideIn 0.3s ease-out;
                border-radius: 0 4px 4px 0;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(-100%) scaleX(0);
                }
                to {
                    transform: translateX(0) scaleX(1);
                }
            }

            .nav-link i {
                font-size: 18px;
                width: 24px;
                text-align: center;
                background: var(--hologram-gradient);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                transition: all 0.3s ease;
            }

            .nav-link:hover i {
                transform: scale(1.2) rotate(10deg);
                filter: drop-shadow(0 0 8px currentColor);
            }

            .nav-text {
                transition: all 0.3s ease;
                font-weight: 500;
                letter-spacing: 0.5px;
            }

            body.sidebar-collapsed .nav-text {
                opacity: 0;
                width: 0;
                overflow: hidden;
            }

            .nav-footer {
                padding: 20px;
                border-top: 1px solid var(--glass-border);
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .theme-btn {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 14px 20px;
                background: linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(0, 243, 255, 0.1) 100%);
                border: 1px solid rgba(0, 102, 255, 0.3);
                color: var(--neon-blue);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                font-size: 14px;
                font-weight: 600;
                backdrop-filter: blur(10px);
            }

            .theme-btn:hover {
                background: linear-gradient(135deg, rgba(0, 102, 255, 0.2) 0%, rgba(0, 243, 255, 0.2) 100%);
                transform: translateY(-3px) scale(1.02);
                box-shadow: 
                    0 10px 25px rgba(0, 102, 255, 0.3),
                    0 0 30px rgba(0, 243, 255, 0.2);
                border-color: var(--neon-cyan);
            }

            .logout-btn {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 14px 20px;
                background: linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%);
                border: 1px solid rgba(255, 0, 0, 0.3);
                color: #ff6b6b;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                font-size: 14px;
                font-weight: 600;
                backdrop-filter: blur(10px);
            }

            .logout-btn:hover {
                background: linear-gradient(135deg, rgba(255, 0, 0, 0.2) 0%, rgba(255, 0, 255, 0.2) 100%);
                transform: translateY(-3px) scale(1.02);
                box-shadow: 
                    0 10px 25px rgba(255, 0, 0, 0.3),
                    0 0 30px rgba(255, 0, 255, 0.2);
                border-color: #ff6b6b;
                color: #fff;
            }

            body.sidebar-collapsed .theme-btn,
            body.sidebar-collapsed .logout-btn {
                padding: 14px;
                justify-content: center;
            }

            body.sidebar-collapsed .theme-btn i,
            body.sidebar-collapsed .logout-btn i {
                margin: 0;
            }

            .sidebar-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(10px);
                z-index: 999;
                opacity: 0;
                transition: opacity 0.3s;
            }

            body.sidebar-active .sidebar-overlay.active {
                display: block;
                opacity: 1;
            }

            /* Tooltips for collapsed sidebar */
            body.sidebar-collapsed .nav-link {
                position: relative;
            }

            body.sidebar-collapsed .nav-link::after {
                content: attr(data-tooltip);
                position: absolute;
                left: 100%;
                top: 50%;
                transform: translateY(-50%);
                margin-left: 15px;
                padding: 10px 15px;
                background: var(--dark-sidebar);
                backdrop-filter: blur(20px);
                color: var(--neon-cyan);
                border-radius: 8px;
                font-size: 14px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
                z-index: 1001;
                border: 1px solid var(--glass-border);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                font-weight: 500;
            }

            body.sidebar-collapsed .nav-link:hover::after {
                opacity: 1;
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                body.sidebar-active {
                    padding-left: 0;
                }

                .sidebar {
                    transform: translateX(-100%);
                    width: 280px;
                }

                body.sidebar-active .sidebar {
                    transform: translateX(0);
                }

                body.sidebar-active .sidebar-overlay {
                    display: block;
                    opacity: 1;
                }

                body.sidebar-collapsed {
                    padding-left: 0;
                }

                body.sidebar-collapsed .sidebar {
                    transform: translateX(-100%);
                }
            }

            /* Main content adjustment */
            .main-content {
                transition: all 0.3s;
                padding: 20px;
                min-height: 100vh;
                background: var(--dark-bg);
            }

            /* Loading animation for sidebar */
            @keyframes slideInLeft {
                from {
                    transform: translateX(-100%) perspective(1000px) rotateY(30deg);
                    opacity: 0;
                }
                to {
                    transform: translateX(0) perspective(1000px) rotateY(0deg);
                    opacity: 1;
                }
            }



            /* Aurora background effect */
            .sidebar::after {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: conic-gradient(
                    from 0deg at 50% 50%,
                    var(--neon-cyan) 0deg,
                    var(--neon-magenta) 120deg,
                    var(--neon-lime) 240deg,
                    var(--neon-cyan) 360deg
                );
                opacity: 0.03;
                animation: auroraSpin 20s linear infinite;
                z-index: -2;
            }

            @keyframes auroraSpin {
                0% { transform: rotate(0deg) scale(1); }
                50% { transform: rotate(180deg) scale(1.1); }
                100% { transform: rotate(360deg) scale(1); }
            }
        </style>
    `;

    // Insert sidebar into page
    document.head.insertAdjacentHTML('beforeend', sidebarStyles);
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    document.body.classList.add('sidebar-active');

    // Add tooltips for collapsed sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        const text = link.querySelector('.nav-text').textContent;
        link.setAttribute('data-tooltip', text);
    });

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
        document.body.classList.toggle('sidebar-collapsed');
        
        // Save preference
        const isCollapsed = document.body.classList.contains('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
        
        // Add holographic animation effect
        this.style.transform = 'rotate(180deg) scale(1.1)';
        setTimeout(() => {
            this.style.transform = '';
        }, 300);
    });

    // Load saved preference
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        document.body.classList.add('sidebar-collapsed');
    }

   

    // Mobile overlay
    sidebarOverlay.addEventListener('click', function() {
        document.body.classList.remove('sidebar-active');
        sidebarOverlay.classList.remove('active');
    });

    // Mobile menu toggle
    if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-active');
        
        // Create mobile menu button if not exists
        if (!document.getElementById('mobileMenuBtn')) {
            const mobileMenuBtn = document.createElement('button');
            mobileMenuBtn.id = 'mobileMenuBtn';
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            mobileMenuBtn.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 998;
                background: linear-gradient(135deg, rgba(0, 243, 255, 0.2) 0%, rgba(255, 0, 255, 0.2) 100%);
                backdrop-filter: blur(20px);
                color: var(--neon-cyan);
                border: 1px solid var(--glass-border);
                width: 50px;
                height: 50px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(0, 243, 255, 0.2);
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            `;
            
            document.body.appendChild(mobileMenuBtn);
            
            mobileMenuBtn.addEventListener('click', function() {
                document.body.classList.toggle('sidebar-active');
                sidebarOverlay.classList.toggle('active');
                this.style.transform = 'rotate(90deg) scale(1.1)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 300);
            });

            mobileMenuBtn.addEventListener('mouseenter', function() {
                this.style.boxShadow = '0 15px 40px rgba(0, 243, 255, 0.4)';
                this.style.transform = 'scale(1.05)';
            });

            mobileMenuBtn.addEventListener('mouseleave', function() {
                this.style.boxShadow = '0 10px 30px rgba(0, 243, 255, 0.2)';
                this.style.transform = 'scale(1)';
            });
        }
    }

    // Logout functionality with holographic animation
    document.getElementById('logoutBtn').addEventListener('click', function() {
        // Add loading animation
        const originalHTML = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Logging out...';
        this.disabled = true;
        
        // Add holographic effect
        this.style.background = 'linear-gradient(135deg, rgba(255, 0, 0, 0.3) 0%, rgba(255, 0, 255, 0.3) 100%)';
        
        setTimeout(() => {
            if (confirm('Apakah Anda yakin ingin logout?')) {
                localStorage.clear();
                window.location.href = '/index.html';
            } else {
                this.innerHTML = originalHTML;
                this.disabled = false;
                this.style.background = '';
            }
        }, 500);
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + B to toggle sidebar
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            sidebarToggle.click();
        }
        
   
    });

    // Add holographic wave effect on hover for all interactive elements
    document.querySelectorAll('.nav-link, .theme-btn, .logout-btn, .sidebar-toggle').forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.filter = 'brightness(1.2) drop-shadow(0 0 10px rgba(0, 243, 255, 0.3))';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.filter = '';
        });
    });
});