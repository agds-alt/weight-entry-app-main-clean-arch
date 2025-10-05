const authService = require('../services/auth.service');

class AuthController {
    /**
     * Register new user
     */
    async register(req, res) {
        try {
            const { username, password, email, full_name } = req.body;

            const result = await authService.register({
                username,
                password,
                email,
                full_name
            });

            // Set session if session is enabled
            if (req.session) {
                req.session.user = result.user;
            }

            return res.status(201).json({
                message: 'Registrasi berhasil',
                user: result.user,
                accessToken: result.tokens.accessToken,
                refreshToken: result.tokens.refreshToken
            });
        } catch (error) {
            console.error('Register controller error:', error);
            return res.status(400).json({
                message: error.message || 'Registrasi gagal'
            });
        }
    }

    /**
     * Login user
     */
/**
 * Login user - FIXED VERSION
 * Replace your login function (lines 38-63) with this:
 */
async login(req, res) {
    try {
        const { username, password } = req.body;

        const result = await authService.login(username, password);

        // Set session if session is enabled
        if (req.session) {
            req.session.user = result.user;
        }

        // Use the result object properly!
        return res.json({
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            user: result.user
        });
    } catch (error) {
        console.error('Login controller error:', error);
        return res.status(401).json({
            message: error.message || 'Login gagal'
        });
    }
}

    /**
     * Refresh access token
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    message: 'Refresh token harus disertakan'
                });
            }

            const result = await authService.refreshToken(refreshToken);

            return res.json({
                message: 'Token berhasil direfresh',
                accessToken: result.accessToken
            });
        } catch (error) {
            console.error('Refresh token controller error:', error);
            return res.status(403).json({
                message: error.message || 'Refresh token gagal'
            });
        }
    }

    /**
     * Logout user
     */
    async logout(req, res) {
        try {
            // Destroy session if exists
            if (req.session) {
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Session destroy error:', err);
                    }
                });
            }

            // Optional: Add token to blacklist
            const authHeader = req.headers['authorization'];
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                await authService.logout(token);
            }

            return res.json({
                message: 'Logout berhasil'
            });
        } catch (error) {
            console.error('Logout controller error:', error);
            return res.status(500).json({
                message: 'Logout gagal'
            });
        }
    }

    /**
     * Get current user profile
     */
    async getProfile(req, res) {
        try {
            const username = req.user?.username || req.session?.user?.username;

            if (!username) {
                return res.status(401).json({
                    message: 'User tidak terautentikasi'
                });
            }

            const profile = await authService.getProfile(username);

            return res.json({
                user: profile
            });
        } catch (error) {
            console.error('Get profile controller error:', error);
            return res.status(500).json({
                message: error.message || 'Gagal mengambil profil'
            });
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(req, res) {
        try {
            const username = req.user?.username || req.session?.user?.username;
            const { full_name, email } = req.body;

            if (!username) {
                return res.status(401).json({
                    message: 'User tidak terautentikasi'
                });
            }

            const profile = await authService.updateProfile(username, {
                full_name,
                email
            });

            // Update session if exists
            if (req.session && req.session.user) {
                req.session.user = {
                    ...req.session.user,
                    ...profile
                };
            }

            return res.json({
                message: 'Profil berhasil diupdate',
                user: profile
            });
        } catch (error) {
            console.error('Update profile controller error:', error);
            return res.status(400).json({
                message: error.message || 'Gagal update profil'
            });
        }
    }

    /**
     * Change password
     */
    async changePassword(req, res) {
        try {
            const username = req.user?.username || req.session?.user?.username;
            const { old_password, new_password } = req.body;

            if (!username) {
                return res.status(401).json({
                    message: 'User tidak terautentikasi'
                });
            }

            if (!old_password || !new_password) {
                return res.status(400).json({
                    message: 'Password lama dan baru harus diisi'
                });
            }

            if (new_password.length < 6) {
                return res.status(400).json({
                    message: 'Password baru minimal 6 karakter'
                });
            }

            await authService.changePassword(username, old_password, new_password);

            return res.json({
                message: 'Password berhasil diubah'
            });
        } catch (error) {
            console.error('Change password controller error:', error);
            return res.status(400).json({
                message: error.message || 'Gagal mengubah password'
            });
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    message: 'Email harus diisi'
                });
            }

            const result = await authService.requestPasswordReset(email);

            return res.json({
                message: result.message
            });
        } catch (error) {
            console.error('Request password reset controller error:', error);
            return res.status(500).json({
                message: 'Gagal memproses permintaan reset password'
            });
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(req, res) {
        try {
            const { token, new_password } = req.body;

            if (!token || !new_password) {
                return res.status(400).json({
                    message: 'Token dan password baru harus diisi'
                });
            }

            if (new_password.length < 6) {
                return res.status(400).json({
                    message: 'Password minimal 6 karakter'
                });
            }

            await authService.resetPassword(token, new_password);

            return res.json({
                message: 'Password berhasil direset'
            });
        } catch (error) {
            console.error('Reset password controller error:', error);
            return res.status(400).json({
                message: error.message || 'Gagal reset password'
            });
        }
    }

    /**
     * Check if username is available
     */
    async checkUsername(req, res) {
        try {
            const { username } = req.query;

            if (!username) {
                return res.status(400).json({
                    message: 'Username harus diisi'
                });
            }

            const isAvailable = await authService.isUsernameAvailable(username);

            return res.json({
                available: isAvailable,
                message: isAvailable ? 'Username tersedia' : 'Username sudah digunakan'
            });
        } catch (error) {
            console.error('Check username controller error:', error);
            return res.status(500).json({
                message: 'Gagal memeriksa username'
            });
        }
    }

    /**
     * Check if email is available
     */
    async checkEmail(req, res) {
        try {
            const { email } = req.query;

            if (!email) {
                return res.status(400).json({
                    message: 'Email harus diisi'
                });
            }

            const isAvailable = await authService.isEmailAvailable(email);

            return res.json({
                available: isAvailable,
                message: isAvailable ? 'Email tersedia' : 'Email sudah digunakan'
            });
        } catch (error) {
            console.error('Check email controller error:', error);
            return res.status(500).json({
                message: 'Gagal memeriksa email'
            });
        }
    }

    /**
     * Verify token (health check for authentication)
     */
    async verifyToken(req, res) {
        try {
            const username = req.user?.username || req.session?.user?.username;

            if (!username) {
                return res.status(401).json({
                    valid: false,
                    message: 'Token tidak valid'
                });
            }

            return res.json({
                valid: true,
                user: {
                    username: req.user?.username || req.session?.user?.username,
                    role: req.user?.role || req.session?.user?.role
                }
            });
        } catch (error) {
            console.error('Verify token controller error:', error);
            return res.status(500).json({
                valid: false,
                message: 'Gagal memverifikasi token'
            });
        }
    }
}

module.exports = new AuthController();