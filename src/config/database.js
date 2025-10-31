const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client for database operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration!');
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY)');
  throw new Error('Supabase configuration missing');
}

console.log('🔄 Attempting database connection...');
console.log('📍 Method: Supabase Client SDK');
console.log('📍 Database: selisih-berat-jnt-migrasi');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  db: {
    schema: 'public'
  }
});

// Legacy pool export for backward compatibility (deprecated)
const pool = {
  query: async (text, params) => {
    console.warn('⚠️  Direct pool.query() is deprecated. Use Supabase client methods instead.');
    throw new Error('Direct SQL queries not supported with Supabase client. Use repository methods.');
  }
};

// Test connection
async function testConnection() {
  try {
    // Test connection by querying a table (users table should exist)
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && !error.message.includes('does not exist')) {
      throw error;
    }

    console.log('✅ Supabase client connected successfully!');
    console.log('⏰ Server time:', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check SUPABASE_URL in .env');
    console.error('   2. Check SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY in .env');
    console.error('   3. Verify project is not paused in Supabase dashboard');
    return false;
  }
}

// Query functions (using Supabase RPC for raw SQL if needed)
async function execute(query, params = []) {
  console.warn('⚠️  execute() uses raw SQL. Consider using Supabase query builder instead.');
  try {
    // For DDL queries (CREATE TABLE, etc.), use RPC with a custom function
    // or handle specific cases
    if (query.trim().toUpperCase().startsWith('CREATE TABLE')) {
      // Execute via RPC or handle table creation separately
      throw new Error('Use initializeTables() for table creation');
    }
    throw new Error('Raw SQL execute() not supported. Use Supabase query builder.');
  } catch (error) {
    console.error('Execute error:', error.message);
    throw error;
  }
}

async function query(text, params) {
  console.warn('⚠️  query() uses raw SQL. Consider using Supabase query builder instead.');
  try {
    // For complex queries, consider using Supabase RPC functions
    throw new Error('Raw SQL query() not supported. Use Supabase query builder or RPC.');
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

async function queryOne(text, params = []) {
  console.warn('⚠️  queryOne() uses raw SQL. Consider using Supabase query builder instead.');
  try {
    // For complex queries, consider using Supabase RPC functions
    throw new Error('Raw SQL queryOne() not supported. Use Supabase query builder or RPC.');
  } catch (error) {
    console.error('QueryOne error:', error.message);
    throw error;
  }
}

// Initialize tables - Note: Tables should be created via Supabase dashboard or migrations
async function initializeTables() {
  try {
    console.log('📋 Checking database tables...');

    // Check if users table exists
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError && usersError.message.includes('does not exist')) {
      console.error('❌ Users table does not exist!');
      console.error('\n💡 Create tables in Supabase:');
      console.error('   1. Go to Supabase Dashboard > SQL Editor');
      console.error('   2. Run the following SQL:\n');
      console.error(`
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id BIGSERIAL PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(50),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
      return false;
    }

    console.log('✅ Users table ready');

    // Check if entries table exists
    const { error: entriesError } = await supabase
      .from('entries')
      .select('id')
      .limit(1);

    if (entriesError && entriesError.message.includes('does not exist')) {
      console.error('❌ Entries table does not exist! (See SQL above)');
      return false;
    }

    console.log('✅ Entries table ready');
    console.log('✅ All tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Initialize tables error:', error.message);
    return false;
  }
}

// Create default admin
async function createDefaultAdmin() {
  try {
    // Check if admin exists
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (existing) {
      console.log('ℹ️  Admin user already exists');
      return false;
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username: 'admin',
        password: hashedPassword,
        email: 'admin@weighttrack.com',
        full_name: 'Administrator',
        role: 'admin'
      }])
      .select();

    if (error) {
      throw error;
    }

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
    // Count users
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Count entries
    const { count: entriesCount, error: entriesError } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true });

    if (entriesError) throw entriesError;

    return {
      users: usersCount || 0,
      entries: entriesCount || 0
    };
  } catch (error) {
    console.error('Get stats error:', error.message);
    return { users: 0, entries: 0 };
  }
}

// Close connection (Supabase client doesn't need explicit closing)
async function closePool() {
  try {
    // Supabase client doesn't require explicit connection closing
    console.log('ℹ️  Supabase client cleanup (no action needed)');
  } catch (error) {
    console.error('Close connection error:', error.message);
  }
}

module.exports = {
  supabase,      // Export Supabase client for direct use
  pool,          // Deprecated - kept for backward compatibility
  testConnection,
  execute,       // Deprecated - use Supabase query builder
  query,         // Deprecated - use Supabase query builder
  queryOne,      // Deprecated - use Supabase query builder
  initializeTables,
  createDefaultAdmin,
  getStats,
  closePool
};