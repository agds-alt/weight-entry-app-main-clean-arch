const jwt = require('jsonwebtoken');

/**
 * Authenticate JWT token from request
 */
const authenticateToken = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            // Check if user is in session (fallback)
            if (req.session && req.session.user) {
                req.user = req.session.user;
                return next();
            }

            return res.status(401).json({
                message: 'Token tidak ditemukan. Silakan login terlebih dahulu.'
            });
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (error, user) => {
            if (error) {
                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        message: 'Token telah kadaluarsa. Silakan login kembali.'
                    });
                }
                return res.status(403).json({
                    message: 'Token tidak valid.'
                });
            }

            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat autentikasi'
        });
    }
};

/**
 * Authenticate using session
 */
const authenticateSession = (req, res, next) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                message: 'Silakan login terlebih dahulu'
            });
        }

        req.user = req.session.user;
        next();
    } catch (error) {
        console.error('Session authentication error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat autentikasi'
        });
    }
};

/**
 * Authorize specific roles
 * @param  {...string} allowedRoles - Allowed roles
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            const userRole = req.user?.role || req.session?.user?.role;

            if (!userRole) {
                return res.status(401).json({
                    message: 'User tidak terautentikasi'
                });
            }

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    message: 'Anda tidak memiliki akses ke resource ini'
                });
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({
                message: 'Terjadi kesalahan saat otorisasi'
            });
        }
    };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
    return authorizeRoles('admin')(req, res, next);
};

/**
 * Check if user is authenticated (JWT or Session)
 */
const isAuthenticated = (req, res, next) => {
    try {
        // Try JWT first
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            return authenticateToken(req, res, next);
        }

        // Fall back to session
        return authenticateSession(req, res, next);
    } catch (error) {
        console.error('Authentication check error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat memeriksa autentikasi'
        });
    }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                message: 'Refresh token tidak ditemukan'
            });
        }

        jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
            (error, user) => {
                if (error) {
                    return res.status(403).json({
                        message: 'Refresh token tidak valid'
                    });
                }

                req.user = user;
                next();
            }
        );
    } catch (error) {
        console.error('Refresh token verification error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat verifikasi refresh token'
        });
    }
};

/**
 * Optional authentication - sets req.user if authenticated, but doesn't block
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            // Check session
            if (req.session && req.session.user) {
                req.user = req.session.user;
            }
            return next();
        }

        jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key',
            (error, user) => {
                if (!error) {
                    req.user = user;
                }
                next();
            }
        );
    } catch (error) {
        // Continue without authentication
        next();
    }
};

/**
 * Rate limiting middleware
 */
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        try {
            const identifier = req.user?.username || req.ip;
            const now = Date.now();
            
            if (!requests.has(identifier)) {
                requests.set(identifier, []);
            }

            const userRequests = requests.get(identifier);
            
            // Remove old requests outside the window
            const validRequests = userRequests.filter(
                timestamp => now - timestamp < windowMs
            );

            if (validRequests.length >= maxRequests) {
                return res.status(429).json({
                    message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
                });
            }

            validRequests.push(now);
            requests.set(identifier, validRequests);

            next();
        } catch (error) {
            console.error('Rate limiter error:', error);
            next();
        }
    };
};

/**
 * Log user activity
 */
const logActivity = (action) => {
    return (req, res, next) => {
        try {
            const username = req.user?.username || req.session?.user?.username || 'anonymous';
            const timestamp = new Date().toISOString();
            
            
            // TODO: Save to audit_logs table if needed
            
            next();
        } catch (error) {
            console.error('Activity logging error:', error);
            next();
        }
    };
};

/**
 * Check if user owns the resource
 */
const isOwner = (req, res, next) => {
    try {
        const username = req.user?.username || req.session?.user?.username;
        const role = req.user?.role || req.session?.user?.role;

        // Admins can access any resource
        if (role === 'admin') {
            return next();
        }

        // Check if user owns the resource (implementation depends on your data structure)
        // This is a basic implementation
        const resourceOwner = req.body.created_by || req.params.username;
        
        if (resourceOwner && resourceOwner !== username) {
            return res.status(403).json({
                message: 'Anda tidak memiliki akses ke resource ini'
            });
        }

        next();
    } catch (error) {
        console.error('Ownership check error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat memeriksa kepemilikan resource'
        });
    }
};

module.exports = {
    authenticateToken,
    authenticateSession,
    authorizeRoles,
    isAdmin,
    isAuthenticated,
    verifyRefreshToken,
    optionalAuth,
    rateLimiter,
    logActivity,
    isOwner
};