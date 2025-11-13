const { supabase } = require('../config/database');

class UserRepository {
    /**
     * Create new user
     */
    async create(userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    username: userData.username,
                    password: userData.password,
                    email: userData.email,
                    full_name: userData.full_name,
                    role: userData.role || 'user'
                }])
                .select('id, username, email, full_name, role, created_at')
                .single();

            if (error) {
                if (error.code === '23505') { // PostgreSQL unique violation
                    throw new Error('Username atau email sudah digunakan');
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('User repository create error:', error);

            if (error.message === 'Username atau email sudah digunakan') {
                throw error;
            }

            throw new Error('Gagal membuat user');
        }
    }

    /**
     * Find user by username (case-insensitive)
     */
    async findByUsername(username) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, username, password, email, full_name, role, is_active, created_at, updated_at, last_login')
                .ilike('username', username)  // Case-insensitive search
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    return null;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('User repository findByUsername error:', error);
            return null;
        }
    }

    /**
     * Find user by email
     */
    async findByEmail(email) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, username, password, email, full_name, role, is_active, created_at, updated_at')
                .eq('email', email)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    return null;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('User repository findByEmail error:', error);
            return null;
        }
    }

    /**
     * Find user by ID
     */
    async findById(id) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, username, email, full_name, role, is_active, created_at, updated_at, last_login')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    return null;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('User repository findById error:', error);
            return null;
        }
    }

    /**
     * Find all users
     */
    async findAll(filter = {}, limit = 50, offset = 0) {
        try {
            let query = supabase
                .from('users')
                .select('id, username, email, full_name, role, is_active, created_at, last_login');

            // Apply filters
            if (filter.role) {
                query = query.eq('role', filter.role);
            }

            if (filter.is_active !== undefined) {
                query = query.eq('is_active', filter.is_active);
            }

            if (filter.search) {
                // Supabase doesn't support OR with multiple fields directly, so we need to use a workaround
                // For now, we'll search by username only. For more complex searches, consider using RPC
                query = query.or(`username.ilike.%${filter.search}%,email.ilike.%${filter.search}%,full_name.ilike.%${filter.search}%`);
            }

            // Order by and pagination
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('User repository findAll error:', error);
            return [];
        }
    }

    /**
     * Count users
     */
    async count(filter = {}) {
        try {
            let query = supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // Apply filters
            if (filter.role) {
                query = query.eq('role', filter.role);
            }

            if (filter.is_active !== undefined) {
                query = query.eq('is_active', filter.is_active);
            }

            if (filter.search) {
                query = query.or(`username.ilike.%${filter.search}%,email.ilike.%${filter.search}%,full_name.ilike.%${filter.search}%`);
            }

            const { count, error } = await query;

            if (error) {
                throw error;
            }

            return count || 0;
        } catch (error) {
            console.error('User repository count error:', error);
            return 0;
        }
    }

    /**
     * Update user
     */
    async update(id, updateData) {
        const updates = {};

        if (updateData.email !== undefined) {
            updates.email = updateData.email;
        }

        if (updateData.full_name !== undefined) {
            updates.full_name = updateData.full_name;
        }

        if (updateData.role !== undefined) {
            updates.role = updateData.role;
        }

        if (updateData.is_active !== undefined) {
            updates.is_active = updateData.is_active;
        }

        if (Object.keys(updates).length === 0) {
            throw new Error('Tidak ada data untuk diupdate');
        }

        updates.updated_at = new Date().toISOString();

        try {
            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('User tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('User repository update error:', error);
            throw new Error(error.message || 'Gagal update user');
        }
    }

    /**
     * Update password
     */
    async updatePassword(id, hashedPassword) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    password: hashedPassword,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('User tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('User repository updatePassword error:', error);
            throw new Error('Gagal update password');
        }
    }

    /**
     * Update last login time
     */
    async updateLastLogin(id) {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    last_login: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                throw error;
            }

            return { success: true };
        } catch (error) {
            console.error('User repository updateLastLogin error:', error);
            return { success: false };
        }
    }

    /**
     * Delete user (soft delete by setting is_active = false)
     */
    async softDelete(id) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('User tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('User repository softDelete error:', error);
            throw new Error('Gagal menghapus user');
        }
    }

    /**
     * Delete user permanently
     */
    async delete(id) {
        try {
            const { data, error } = await supabase
                .from('users')
                .delete()
                .eq('id', id)
                .select();

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('User tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('User repository delete error:', error);
            throw new Error('Gagal menghapus user');
        }
    }

    /**
     * Activate user
     */
    async activate(id) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('User tidak ditemukan');
            }

            return { success: true };
        } catch (error) {
            console.error('User repository activate error:', error);
            throw new Error('Gagal mengaktifkan user');
        }
    }

    /**
     * Get user statistics
     * Note: This requires a Supabase RPC function for optimal performance
     * For now, we'll fetch all users and calculate in-memory
     */
    async getStats() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role, is_active, created_at');

            if (error) {
                throw error;
            }

            const stats = {
                total: data.length,
                total_admin: 0,
                total_user: 0,
                total_active: 0,
                today_registered: 0
            };

            const today = new Date().toDateString();

            data.forEach(user => {
                if (user.role === 'admin') stats.total_admin++;
                if (user.role === 'user') stats.total_user++;
                if (user.is_active) stats.total_active++;

                const userDate = new Date(user.created_at).toDateString();
                if (userDate === today) stats.today_registered++;
            });

            return stats;
        } catch (error) {
            console.error('User repository getStats error:', error);
            return {
                total: 0,
                total_admin: 0,
                total_user: 0,
                total_active: 0,
                today_registered: 0
            };
        }
    }

    /**
     * Check if username exists (case-insensitive)
     */
    async usernameExists(username) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .ilike('username', username)  // Case-insensitive search
                .maybeSingle();

            if (error) {
                throw error;
            }

            return !!data;
        } catch (error) {
            console.error('User repository usernameExists error:', error);
            return false;
        }
    }

    /**
     * Check if email exists
     */
    async emailExists(email) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return !!data;
        } catch (error) {
            console.error('User repository emailExists error:', error);
            return false;
        }
    }
}

module.exports = new UserRepository();
