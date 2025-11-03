// test-supabase.js - Test koneksi ke Supabase
require('dotenv').config();
const { Client } = require('pg');

async function testSupabaseConnection() {
  
  // Show config (hide password)
  if (process.env.DATABASE_URL) {
  } else {
  }

  // Create client
  const config = process.env.DATABASE_URL 
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'postgres',
        ssl: { rejectUnauthorized: false }
      };

  const client = new Client(config);

  try {
    await client.connect();
    
    
    // Test query
    const res = await client.query('SELECT NOW()');
    
    // Check tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tables = await client.query(tablesQuery);
    
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
      });
    } else {
    }
    
    await client.end();
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('password')) {
      console.error('\n🔧 Fix:');
      console.error('1. Check password di Supabase Dashboard');
      console.error('2. Settings > Database > Connection string');
      console.error('3. Update DB_PASSWORD di .env');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n🔧 Fix:');
      console.error('1. Check DB_HOST di .env');
      console.error('2. Format: db.xxxxx.supabase.co');
    } else if (error.message.includes('timeout')) {
      console.error('\n🔧 Fix:');
      console.error('1. Check internet connection');
      console.error('2. Coba lagi dalam beberapa detik');
    }
    
    process.exit(1);
  }
}

// Run test
testSupabaseConnection();