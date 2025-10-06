const { Pool } = require('pg');
require('dotenv').config();

// Try different connection methods based on error
let connectionConfig;

if (process.env.DATABASE_URL) {
  // Parse to check format
  const isPooler = process.env.DATABASE_URL.includes('pooler.supabase.com');
  const isPort6543 = process.env.DATABASE_URL.includes(':6543');
  
  connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Add pgbouncer flag if using pooler
    ...(isPooler && isPort6543 ? { statement_timeout: 0 } : {})
  };
} else {
  // Fallback to individual credentials
  connectionConfig = {
    host: process.env.DB_HOST || 'db.rwxgpbikdxlialoegghq.supabase.co',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'D0DP1nTXhdOKP3MA',
    ssl: { rejectUnauthorized: false }
  };
}

console.log('🔄 Attempting database connection...');
console.log('📍 Method:', process.env.DATABASE_URL ? 'Connection String' : 'Individual Credentials');

const pool = new Pool(connectionConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Pool error:', err.message);
});

// Test connection
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ Database connected successfully!');
    console.log('⏰ Server time:', result.rows[0].time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n💡 Fix: Wrong username format in connection string');
      console.error('   Try: postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres');
    }
    
    return false;
  } finally {
    if (client) client.release();
  }
}

// Query functions
async function execute(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Execute error:', error.message);
    throw error;
  }
}

async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

async function queryOne(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('QueryOne error:', error.message);
    throw error;
  }
}

// Initialize tables
async function initializeTables() {
  try {
    // Create users table
    await execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        full_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');

    // Create entries table
    await execute(`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        no_resi VARCHAR(50) UNIQUE NOT NULL,
        berat_resi DECIMAL(10,2) NOT NULL,
        berat_aktual DECIMAL(10,2) NOT NULL,
        selisih DECIMAL(10,2) NOT NULL,
        foto_url_1 TEXT,
        foto_url_2 TEXT,
        catatan TEXT,
        status VARCHAR(20) DEFAULT 'submitted',
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(50),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Entries table ready');

    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist');
      return true;
    }
    console.error('Initialize tables error:', error.message);
    return false;
  }
}

// Create default admin
async function createDefaultAdmin() {
  try {
    const existing = await queryOne('SELECT id FROM users WHERE username = $1', ['admin']);
    if (existing) {
      console.log('ℹ️  Admin user already exists');
      return false;
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await execute(
      `INSERT INTO users (username, password, email, full_name, role) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['admin', hashedPassword, 'admin@weighttrack.com', 'Administrator', 'admin']
    );

    console.log('✅ Default admin created');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    return true;
  } catch (error) {
    console.log('Admin creation:', error.message);
    return false;
  }
}

// Get stats
async function getStats() {
  try {
    const users = await queryOne('SELECT COUNT(*) as count FROM users');
    const entries = await queryOne('SELECT COUNT(*) as count FROM entries');
    return {
      users: parseInt(users?.count || 0),
      entries: parseInt(entries?.count || 0)
    };
  } catch (error) {
    return { users: 0, entries: 0 };
  }
}

// Close pool
async function closePool() {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Close pool error:', error.message);
  }
}

module.exports = {
  pool,
  testConnection,
  execute,
  query,
  queryOne,
  initializeTables,
  createDefaultAdmin,
  getStats,
  closePool
};