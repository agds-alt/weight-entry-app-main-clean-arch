// login.js - Save this file in your public folder
// This external script will work with CSP

document.addEventListener('DOMContentLoaded', function() {
    // Clear any existing session
    localStorage.clear();

    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const messageDiv = document.getElementById('message');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const icon = togglePassword.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                showMessage('Username dan password harus diisi', 'danger');
                return;
            }

            setLoading(true);
            showMessage('Memproses login...', 'info');

            try {
                console.log('Attempting login for:', username);
                
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();
                console.log('Login response:', result);

                if (response.ok) {
                    // Check for different possible token field names
                    const token = result.accessToken || result.token || result.access_token;
                    const refreshToken = result.refreshToken || result.refresh_token || '';
                    
                    if (token) {
                        // Save to localStorage
                        localStorage.setItem('accessToken', token);
                        if (refreshToken) {
                            localStorage.setItem('refreshToken', refreshToken);
                        }
                        
                        // Save user info
                        if (result.user) {
                            localStorage.setItem('userRole', result.user.role || 'user');
                            localStorage.setItem('userName', result.user.username || username);
                            localStorage.setItem('userEmail', result.user.email || '');
                        }

                        showMessage('Login berhasil! Mengalihkan...', 'success');
                        console.log('Login successful, redirecting...');

                        // Redirect based on role
                        const userRole = result.user?.role || 'user';
                        setTimeout(function() {
                            if (userRole === 'admin') {
                                console.log('Redirecting to dashboard...');
                                window.location.href = '/dashboard.html';
                            } else {
                                console.log('Redirecting to entry...');
                                window.location.href = '/entry.html';
                            }
                        }, 1000);
                    } else {
                        console.error('No token in response:', result);
                        showMessage('Response tidak mengandung token. Periksa server.', 'danger');
                    }
                } else {
                    console.error('Login failed:', result);
                    showMessage(result.message || 'Login gagal. Periksa username dan password.', 'danger');
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage('Terjadi kesalahan koneksi. Silakan coba lagi.', 'danger');
            } finally {
                setLoading(false);
            }
        });
    }

    function showMessage(message, type) {
        const iconMap = {
            success: 'check-circle',
            danger: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        if (messageDiv) {
            messageDiv.innerHTML = `
                <div class="alert alert-${type} d-flex align-items-center" role="alert">
                    <i class="fas fa-${iconMap[type]} me-2"></i>
                    <div>${message}</div>
                </div>
            `;
        }
    }

    function setLoading(isLoading) {
        if (loginBtn) {
            loginBtn.disabled = isLoading;
            if (isLoading) {
                loginBtn.innerHTML = '<span class="spinner-border me-2"></span> Memproses...';
            } else {
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Login';
            }
        }
    }
    
    // Log that script loaded
    console.log('Login script loaded successfully');
});