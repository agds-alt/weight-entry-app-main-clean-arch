// test-supabase.js - Test koneksi ke Supabase
require('dotenv').config();
const { Client } = require('pg');

async function testSupabaseConnection() {
  console.log('🚀 Testing Supabase connection...\n');
  
  // Show config (hide password)
  console.log('📋 Configuration:');
  if (process.env.DATABASE_URL) {
    console.log('   Using DATABASE_URL');
  } else {
    console.log('   Host:', process.env.DB_HOST);
    console.log('   Port:', process.env.DB_PORT);
    console.log('   Database:', process.env.DB_NAME);
    console.log('   User:', process.env.DB_USER);
  }
  console.log('');

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
    console.log('🔄 Connecting to Supabase...');
    await client.connect();
    
    console.log('✅ Connected to Supabase!\n');
    
    // Test query
    const res = await client.query('SELECT NOW()');
    console.log('⏰ Server time:', res.rows[0].now);
    
    // Check tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tables = await client.query(tablesQuery);
    
    console.log('\n📊 Tables in database:');
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    } else {
      console.log('   No tables yet');
    }
    
    await client.end();
    console.log('\n✅ Supabase test successful!');
    console.log('👉 Run "npm run dev" to start your app');
    
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