const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { generateTokens, verifyRefreshToken, generateAccessToken } = require('../utils/jwt');
const { isValidEmail } = require('../utils/helpers');

class AuthService {
    /**
     * Register new user
     */
    async register(userData) {
        try {
            // Check if username already exists
            const existingUser = await userRepository.findByUsername(userData.username);
            if (existingUser) {
                throw new Error('Username sudah digunakan');
            }

            // Check if email already exists
            const existingEmail = await userRepository.findByEmail(userData.email);
            if (existingEmail) {
                throw new Error('Email sudah digunakan');
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            // Create user
            const user = {
                username: userData.username.toLowerCase(),
                password: hashedPassword,
                email: userData.email.toLowerCase(),
                full_name: userData.full_name,
                role: userData.role || 'user'
            };

            const newUser = await userRepository.create(user);

            // Generate tokens
            const tokens = generateTokens({
                username: newUser.username,
                role: newUser.role,
                email: newUser.email
            });

            return {
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    full_name: newUser.full_name,
                    role: newUser.role
                },
                tokens
            };
        } catch (error) {
            console.error('Register service error:', error);
            throw new Error(error.message || 'Gagal mendaftarkan user');
        }
    }

    /**
     * Login user
     */
    async login(username, password) {
        try {
            console.log('🔐 Login attempt:', {
                originalUsername: username,
                normalizedUsername: username.toLowerCase(),
                passwordProvided: !!password
            });

            // Find user
            const user = await userRepository.findByUsername(username.toLowerCase());

            if (!user) {
                console.warn('❌ Login failed: User not found', {
                    searchedUsername: username.toLowerCase()
                });
                throw new Error('Username atau password salah');
            }

            console.log('✅ User found:', {
                id: user.id,
                username: user.username,
                is_active: user.is_active
            });

            // Check if user is active
            if (!user.is_active) {
                console.warn('❌ Login failed: User is inactive', {
                    username: user.username,
                    userId: user.id
                });
                throw new Error('Akun Anda telah dinonaktifkan');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                console.warn('❌ Login failed: Invalid password', {
                    username: user.username,
                    userId: user.id
                });
                throw new Error('Username atau password salah');
            }

            console.log('✅ Login successful:', {
                username: user.username,
                userId: user.id,
                role: user.role
            });

            // Update last login
            await userRepository.updateLastLogin(user.id);

            // Generate tokens
            const tokens = generateTokens({
                username: user.username,
                role: user.role,
                email: user.email
            });

            return {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                },
                tokens
            };
        } catch (error) {
            console.error('Login service error:', error.message);
            throw new Error(error.message || 'Gagal login');
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);

            // Get user data
            const user = await userRepository.findByUsername(decoded.username);
            if (!user || !user.is_active) {
                throw new Error('User tidak ditemukan atau tidak aktif');
            }

            // Generate new access token
            const accessToken = generateAccessToken({
                username: user.username,
                role: user.role,
                email: user.email
            });

            return { accessToken };
        } catch (error) {
            console.error('Refresh token service error:', error);
            throw new Error(error.message || 'Gagal refresh token');
        }
    }

    /**
     * Change password
     */
    async changePassword(username, oldPassword, newPassword) {
        try {
            // Find user
            const user = await userRepository.findByUsername(username);
            if (!user) {
                throw new Error('User tidak ditemukan');
            }

            // Verify old password
            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isPasswordValid) {
                throw new Error('Password lama tidak sesuai');
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update password
            await userRepository.updatePassword(user.id, hashedPassword);

            return { success: true };
        } catch (error) {
            console.error('Change password service error:', error);
            throw new Error(error.message || 'Gagal mengubah password');
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        try {
            const user = await userRepository.findByEmail(email.toLowerCase());
            if (!user) {
                // Don't reveal if email exists or not
                return { success: true, message: 'Jika email terdaftar, link reset password akan dikirim' };
            }

            // TODO: Generate reset token and send email
            // For now, just log it

            return { success: true, message: 'Link reset password telah dikirim ke email Anda' };
        } catch (error) {
            console.error('Request password reset service error:', error);
            throw new Error('Gagal memproses permintaan reset password');
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(resetToken, newPassword) {
        try {
            // TODO: Implement token verification and password reset
            // For now, this is a placeholder

            return { success: true };
        } catch (error) {
            console.error('Reset password service error:', error);
            throw new Error('Gagal reset password');
        }
    }

    /**
     * Get user profile
     */
    async getProfile(username) {
        try {
            const user = await userRepository.findByUsername(username);
            if (!user) {
                throw new Error('User tidak ditemukan');
            }

            return {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                created_at: user.created_at
            };
        } catch (error) {
            console.error('Get profile service error:', error);
            throw new Error('Gagal mengambil profil user');
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(username, updateData) {
        try {
            const user = await userRepository.findByUsername(username);
            if (!user) {
                throw new Error('User tidak ditemukan');
            }

            // Prepare update data
            const updates = {};

            if (updateData.full_name) {
                updates.full_name = updateData.full_name;
            }

            if (updateData.email && updateData.email !== user.email) {
                // Check if new email is already used
                const existingEmail = await userRepository.findByEmail(updateData.email.toLowerCase());
                if (existingEmail) {
                    throw new Error('Email sudah digunakan');
                }
                updates.email = updateData.email.toLowerCase();
            }

            if (Object.keys(updates).length === 0) {
                throw new Error('Tidak ada data yang diupdate');
            }

            await userRepository.update(user.id, updates);

            return await this.getProfile(username);
        } catch (error) {
            console.error('Update profile service error:', error);
            throw new Error(error.message || 'Gagal update profil');
        }
    }

    /**
     * Verify user credentials
     */
    async verifyCredentials(username, password) {
        try {
            const user = await userRepository.findByUsername(username.toLowerCase());
            if (!user) {
                return false;
            }

            const isValid = await bcrypt.compare(password, user.password);
            return isValid;
        } catch (error) {
            console.error('Verify credentials error:', error);
            return false;
        }
    }

    /**
     * Check if username is available
     */
    async isUsernameAvailable(username) {
        try {
            const user = await userRepository.findByUsername(username.toLowerCase());
            return !user;
        } catch (error) {
            console.error('Check username availability error:', error);
            return false;
        }
    }

    /**
     * Check if email is available
     */
    async isEmailAvailable(email) {
        try {
            const user = await userRepository.findByEmail(email.toLowerCase());
            return !user;
        } catch (error) {
            console.error('Check email availability error:', error);
            return false;
        }
    }

    /**
     * Logout user (optional - for token blacklisting)
     */
    async logout(token) {
        try {
            // TODO: Implement token blacklisting if needed
            // For JWT, logout is typically handled client-side
            return { success: true };
        } catch (error) {
            console.error('Logout service error:', error);
            throw new Error('Gagal logout');
        }
    }
}

module.exports = new AuthService();