require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Initialize Express app first
const app = express();
const PORT = process.env.PORT || 3000;

// Load database config with error handling
let db;
try {
    db = require('./config/database');
} catch (error) {
    console.error('❌ Failed to load database config:', error.message);
    if (process.env.VERCEL !== '1') {
        throw error;
    }
    // In Vercel, create dummy db object
    db = {
        testConnection: async () => false,
        initializeTables: async () => false,
        createDefaultAdmin: async () => false,
        closePool: async () => {}
    };
}

// Trust proxy (important for rate limiting behind proxy)
app.set('trust proxy', 1);

// Middleware
//app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
//}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Session configuration (optional - use if not using JWT)
if (process.env.USE_SESSION === 'true') {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your-session-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }));
}

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes - Load with error handling
try {
    const dashboardRoutes = require('./routes/dashboard.routes');
    const authRoutes = require('./routes/auth.routes');
    const entryRoutes = require('./routes/entry.routes');
    const dataManagementRoutes = require('./routes/data-management.routes');
    const fotoManagementRoutes = require('./routes/foto-management.routes');

    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/entries', entryRoutes);
    app.use('/api/data-management', dataManagementRoutes);
    app.use('/api/foto-management', fotoManagementRoutes);
} catch (error) {
    console.error('❌ Failed to load routes:', error.message);
    if (process.env.VERCEL !== '1') {
        throw error;
    }
    // In Vercel, log but continue - health check will still work
    console.error('⚠️ Routes not loaded, only health check will work');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Cloudinary config endpoint for frontend
app.get('/api/config/cloudinary', (req, res) => {
    try {
        const cloudinary = require('./config/cloudinary');
        const config = cloudinary.getUnsignedConfig();

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Cloudinary config error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Cloudinary not configured'
        });
    }
});



// Root endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Selisih Berat API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            entries: '/api/entries',
            health: '/api/health'
        }
    });
});

// Serve frontend for non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    } else {
        res.status(404).json({ message: 'Endpoint tidak ditemukan' });
    }
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    // Handle multer errors
    if (error.name === 'MulterError') {
        return res.status(400).json({
            message: 'Error upload file: ' + error.message
        });
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Token tidak valid'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token telah kadaluarsa'
        });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validasi gagal',
            errors: error.errors
        });
    }

    // Default error
    res.status(error.status || 500).json({
        message: error.message || 'Terjadi kesalahan pada server',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});


// Initialize database and start server
async function startServer() {
    try {
        // In serverless (Vercel), skip all initialization
        // Let each request handle its own connection lazily
        if (process.env.VERCEL === '1') {
            console.log('✅ Serverless mode - skipping initialization');
            return;
        }

        // Local development mode - do full initialization
        console.log('🚀 Starting server in local mode...');

        // Test database connection
        const dbConnected = await db.testConnection();
        if (!dbConnected) {
            console.error('❌ Database connection failed. Please check your configuration.');
            process.exit(1);
        }

        // Initialize database tables
        await db.initializeTables();

        // Create default admin user
        await db.createDefaultAdmin();

        // Test Cloudinary connection (optional)
        const cloudinary = require('./config/cloudinary');
        if (cloudinary.isConfigured()) {
            const cloudinaryConnected = await cloudinary.testConnection();
            if (cloudinaryConnected) {
                console.log('✅ Cloudinary connected');
            } else {
                console.log('⚠️ Cloudinary connection failed');
            }
        }

        // Start HTTP server
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }
    }
}



// Handle graceful shutdown (skip in serverless)
if (process.env.VERCEL !== '1') {
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, closing connections...');
        await db.closePool();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('SIGINT received, closing connections...');
        await db.closePool();
        process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
}

// Initialize on startup only if not in serverless
// In Vercel, skip initialization to avoid cold start crashes
if (process.env.VERCEL === '1') {
    console.log('✅ Vercel serverless - app module loaded');
} else {
    // Local mode - start server
    startServer().catch(err => {
        console.error('Startup error:', err);
        process.exit(1);
    });
}

// Export app for Vercel serverless
module.exports = app;