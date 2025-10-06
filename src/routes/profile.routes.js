<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Management - WeightTracker Pro</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

        :root {
            --neon-cyan: #00f3ff;
            --neon-magenta: #ff00ff;
            --neon-lime: #00ff9d;
            --neon-blue: #0066ff;
            --dark-bg: #0a0a0f;
            --dark-surface: rgba(15, 15, 25, 0.95);
            --dark-text: #e0e0ff;
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
            --hologram-gradient: linear-gradient(45deg, var(--neon-cyan) 0%, var(--neon-magenta) 25%, var(--neon-lime) 50%, var(--neon-blue) 75%, var(--neon-cyan) 100%);
            --shadow-holographic: 0 10px 30px rgba(0, 243, 255, 0.3), 0 0 20px rgba(255, 0, 255, 0.2), 0 0 10px rgba(0, 255, 136, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Space Grotesk', sans-serif;
            background: var(--dark-bg);
            color: var(--dark-text);
            min-height: 100vh;
            overflow-x: hidden;
            position: relative;
        }

        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 50%, rgba(0, 243, 255, 0.1) 0%, transparent 50%), 
                        radial-gradient(circle at 80% 80%, rgba(255, 0, 255, 0.1) 0%, transparent 50%);
            animation: holographicFloat 20s ease infinite;
            pointer-events: none;
            z-index: -1;
        }

        @keyframes holographicFloat {
            0%, 100% { transform: rotate(0deg) scale(1); }
            33% { transform: rotate(3deg) scale(1.05); }
            66% { transform: rotate(-2deg) scale(1.02); }
        }

        .main-content {
            padding: 30px;
            min-height: 100vh;
            position: relative;
            z-index: 1;
        }

        .password-container {
            max-width: 900px;
            margin: 0 auto;
            perspective: 1000px;
        }

        .header-card {
            background: var(--dark-surface);
            backdrop-filter: blur(20px) saturate(180%);
            border-radius: 30px;
            padding: 50px;
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
            transform: perspective(1000px) rotateX(5deg);
            transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow: var(--shadow-holographic);
            border: 1px solid var(--glass-border);
        }

        .header-card:hover {
            transform: perspective(1000px) rotateX(0deg) translateY(-10px);
        }

        .header-icon {
            width: 90px;
            height: 90px;
            background: var(--hologram-gradient);
            background-size: 400% 400%;
            border-radius: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 42px;
            color: white;
            margin-bottom: 25px;
            box-shadow: var(--shadow-holographic);
            animation: holographicWave 6s linear infinite;
        }

        @keyframes holographicWave {
            0% { background-position: 0% 50%; }
            100% { background-position: 400% 50%; }
        }

        .header-title {
            font-size: 42px;
            font-weight: 700;
            background: var(--hologram-gradient);
            background-size: 400% 400%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: holographicWave 8s linear infinite;
            margin-bottom: 15px;
        }

        .header-subtitle {
            color: var(--neon-cyan);
            font-size: 18px;
            font-weight: 500;
        }

        .form-card {
            background: var(--dark-surface);
            backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 35px;
            margin-bottom: 25px;
            transform: perspective(1000px) rotateX(3deg);
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow: var(--shadow-holographic);
            border: 1px solid var(--glass-border);
            position: relative;
            overflow: hidden;
        }

        .form-card:hover {
            transform: perspective(1000px) rotateX(0deg) translateY(-8px);
        }

        .form-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--glass-border);
            color: var(--neon-cyan);
        }

        .password-input-group {
            position: relative;
            margin-bottom: 25px;
        }

        .form-label {
            color: var(--neon-lime);
            font-weight: 500;
            margin-bottom: 10px;
        }

        .form-control {
            background: rgba(38, 41, 69, 0.8);
            border: 1px solid var(--glass-border);
            color: var(--dark-text);
            border-radius: 15px;
            padding: 16px 50px 16px 20px;
            font-size: 16px;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
            font-family: 'Space Grotesk', sans-serif;
        }

        .form-control:focus {
            background: rgba(38, 41, 69, 0.9);
            border-color: var(--neon-cyan);
            color: var(--dark-text);
            box-shadow: 0 0 25px rgba(0, 243, 255, 0.4);
            outline: none;
            transform: translateY(-3px);
        }

        .password-toggle {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--neon-cyan);
            cursor: pointer;
            padding: 8px;
            transition: all 0.3s;
            border-radius: 8px;
        }

        .password-toggle:hover {
            color: var(--neon-magenta);
            background: rgba(255, 0, 255, 0.1);
            transform: translateY(-50%) scale(1.2);
        }

        .btn-holographic {
            background: var(--hologram-gradient);
            background-size: 400% 400%;
            color: white;
            border: none;
            padding: 16px 35px;
            border-radius: 15px;
            font-weight: 600;
            font-family: 'Space Grotesk', sans-serif;
            transition: all 0.3s;
            animation: holographicWave 8s linear infinite;
            box-shadow: var(--shadow-holographic);
            position: relative;
            overflow: hidden;
            letter-spacing: 0.5px;
        }

        .btn-holographic:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 15px 30px rgba(0, 243, 255, 0.5);
            animation: holographicWave 4s linear infinite;
        }

        .btn-reset {
            background: linear-gradient(45deg, var(--neon-magenta), #cc00cc);
        }

        .strength-card {
            background: var(--dark-surface);
            backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 35px;
            margin-bottom: 25px;
            transform: perspective(1000px) rotateX(2deg);
            transition: all 0.4s;
            box-shadow: var(--shadow-holographic);
            border: 1px solid var(--glass-border);
        }

        .strength-meter {
            height: 12px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            overflow: hidden;
            margin: 25px 0;
            position: relative;
            border: 1px solid var(--glass-border);
        }

        .strength-meter-fill {
            height: 100%;
            width: 0%;
            border-radius: 10px;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            background: var(--hologram-gradient);
            background-size: 400% 400%;
            animation: holographicWave 3s linear infinite;
        }

        .strength-text {
            font-size: 20px;
            font-weight: 600;
            text-align: center;
            margin-bottom: 20px;
        }

        .strength-indicators {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-top: 25px;
        }

        .indicator {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 15px;
            background: var(--glass-bg);
            border-radius: 12px;
            border: 1px solid var(--glass-border);
            transition: all 0.3s;
        }

        .indicator.valid {
            background: rgba(0, 255, 136, 0.1);
            border-color: var(--neon-lime);
            color: var(--neon-lime);
            transform: scale(1.05);
        }

        .alert-holographic {
            background: var(--dark-surface);
            backdrop-filter: blur(20px);
            color: var(--neon-lime);
            border: 1px solid var(--neon-lime);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
            display: none;
        }

        .alert-holographic.show {
            display: block;
            animation: slideDown 0.6s;
        }

        .alert-holographic.error {
            color: #ff6b6b;
            border-color: #ff6b6b;
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
        }

        @keyframes slideDown {
            from {
                transform: translateY(-50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid var(--neon-cyan);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .header-card { padding: 30px 20px; }
            .header-title { font-size: 32px; }
            .form-card { padding: 25px 20px; }
            .strength-indicators { grid-template-columns: 1fr; }
            .main-content { padding: 20px; }
        }
    </style>
</head>
<body>
    <script src="/js/sidebar.js"></script>

    <div class="main-content">
        <div class="password-container">
            <div class="header-card">
                <div class="header-icon">
                    <i class="fas fa-key"></i>
                </div>
                <h1 class="header-title">Password Management</h1>
                <p class="header-subtitle">Kelola keamanan akun Anda dengan teknologi holografik canggih</p>
            </div>

            <div class="alert-holographic" id="alertMessage"></div>

            <div class="form-card">
                <h3 class="form-title">
                    <i class="fas fa-lock me-2"></i>
                    Ganti Password
                </h3>

                <form id="changePasswordForm">
                    <div class="password-input-group">
                        <label class="form-label">Password Lama</label>
                        <input type="password" class="form-control" id="oldPassword" placeholder="Masukkan password lama" required>
                        <button type="button" class="password-toggle" data-target="oldPassword">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>

                    <div class="password-input-group">
                        <label class="form-label">Password Baru</label>
                        <input type="password" class="form-control" id="newPassword" placeholder="Masukkan password baru" required>
                        <button type="button" class="password-toggle" data-target="newPassword">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>

                    <div class="password-input-group">
                        <label class="form-label">Konfirmasi Password Baru</label>
                        <input type="password" class="form-control" id="confirmPassword" placeholder="Konfirmasi password baru" required>
                        <button type="button" class="password-toggle" data-target="confirmPassword">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>

                    <div class="d-flex gap-3 mt-4 flex-wrap">
                        <button type="submit" class="btn btn-holographic" id="submitBtn">
                            <i class="fas fa-save me-2"></i>
                            Update Password
                            <span class="spinner ms-2"></span>
                        </button>
                        <button type="button" class="btn btn-holographic btn-reset" onclick="resetForm()">
                            <i class="fas fa-redo me-2"></i>
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            <div class="strength-card">
                <h3 class="form-title">
                    <i class="fas fa-shield-alt me-2"></i>
                    Password Strength Analyzer
                </h3>
                <div class="strength-meter">
                    <div class="strength-meter-fill" id="strengthMeter"></div>
                </div>
                <div class="text-center mb-4">
                    <span id="strengthText" class="strength-text">Enter a password to analyze security level</span>
                </div>
                <div class="strength-indicators">
                    <div class="indicator" id="lengthIndicator">
                        <i class="fas fa-check-circle"></i>
                        <span>Minimal 8 karakter</span>
                    </div>
                    <div class="indicator" id="uppercaseIndicator">
                        <i class="fas fa-check-circle"></i>
                        <span>Huruf kapital</span>
                    </div>
                    <div class="indicator" id="lowercaseIndicator">
                        <i class="fas fa-check-circle"></i>
                        <span>Huruf kecil</span>
                    </div>
                    <div class="indicator" id="numberIndicator">
                        <i class="fas fa-check-circle"></i>
                        <span>Angka</span>
                    </div>
                    <div class="indicator" id="specialIndicator">
                        <i class="fas fa-check-circle"></i>
                        <span>Karakter khusus</span>
                    </div>
                    <div class="indicator" id="noSpaceIndicator">
                        <i class="fas fa-check-circle"></i>
                        <span>Tanpa spasi</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Password toggle visibility
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = this.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            });
        });

        // Password strength checker
        const newPasswordInput = document.getElementById('newPassword');
        const strengthMeter = document.getElementById('strengthMeter');
        const strengthText = document.getElementById('strengthText');

        newPasswordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });

        function checkPasswordStrength(password) {
            const indicators = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[^A-Za-z0-9]/.test(password),
                noSpace: !/\s/.test(password)
            };

            document.getElementById('lengthIndicator').classList.toggle('valid', indicators.length);
            document.getElementById('uppercaseIndicator').classList.toggle('valid', indicators.uppercase);
            document.getElementById('lowercaseIndicator').classList.toggle('valid', indicators.lowercase);
            document.getElementById('numberIndicator').classList.toggle('valid', indicators.number);
            document.getElementById('specialIndicator').classList.toggle('valid', indicators.special);
            document.getElementById('noSpaceIndicator').classList.toggle('valid', indicators.noSpace);

            let strength = Object.values(indicators).filter(Boolean).length;

            if (password.length === 0) {
                strengthText.textContent = 'Enter a password to analyze security level';
                strengthMeter.style.width = '0%';
            } else if (strength <= 2) {
                strengthText.textContent = 'Weak Security Level';
                strengthText.style.color = '#ff6b6b';
                strengthMeter.style.width = '33%';
            } else if (strength <= 4) {
                strengthText.textContent = 'Medium Security Level';
                strengthText.style.color = '#fdcb6e';
                strengthMeter.style.width = '66%';
            } else {
                strengthText.textContent = 'Strong Holographic Security';
                strengthText.style.color = '#26de81';
                strengthMeter.style.width = '100%';
            }
        }

        // Form submission
        document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const spinner = document.querySelector('.spinner');
            const submitBtn = document.getElementById('submitBtn');
            const alertMessage = document.getElementById('alertMessage');

            if (newPassword !== confirmPassword) {
                showAlert('Password baru dan konfirmasi tidak cocok!', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showAlert('Password minimal 6 karakter!', 'error');
                return;
            }

            spinner.style.display = 'inline-block';
            submitBtn.disabled = true;

            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch('/api/profile/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        oldPassword,
                        newPassword
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    showAlert('Password berhasil diperbarui!', 'success');
                    this.reset();
                    checkPasswordStrength('');
                } else {
                    showAlert(result.message || 'Gagal mengubah password', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Terjadi kesalahan. Silakan coba lagi.', 'error');
            } finally {
                spinner.style.display = 'none';
                submitBtn.disabled = false;
            }
        });

        function showAlert(message, type) {
            const alertMessage = document.getElementById('alertMessage');
            alertMessage.textContent = message;
            alertMessage.className = 'alert-holographic show ' + (type === 'error' ? 'error' : '');
            
            setTimeout(() => {
                alertMessage.classList.remove('show');
            }, 5000);
        }

        function resetForm() {
            document.getElementById('changePasswordForm').reset();
            checkPasswordStrength('');
            document.querySelectorAll('.password-toggle').forEach(toggle => {
                const icon = toggle.querySelector('i');
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            });
            document.querySelectorAll('.form-control').forEach(input => {
                if (input.type === 'text' && input.id.includes('Password')) {
                    input.type = 'password';
                }
            });
        }
    </script>
</body>
</html>