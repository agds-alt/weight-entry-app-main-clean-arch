// test-all.js - Test database and Supabase client
require('dotenv').config();
const { Client } = require('pg');

async function testAll() {
  console.log('🔍 Testing all connections...\n');
  
  // 1. Test Database Connection
  console.log('1️⃣ Testing Database Connection...');
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await dbClient.connect();
    const result = await dbClient.query('SELECT NOW(), current_database()');
    console.log('✅ Database connected!');
    console.log('   Database:', result.rows[0].current_database);
    console.log('   Time:', result.rows[0].now);
    
    // Check tables
    const tables = await dbClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('users', 'entries')
    `);
    console.log('   Tables:', tables.rows.map(r => r.table_name).join(', ') || 'None yet');
    
    await dbClient.end();
  } catch (error) {
    console.log('❌ Database error:', error.message);
    await dbClient.end();
  }
  
  // 2. Test Supabase Client
  console.log('\n2️⃣ Testing Supabase Client...');
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    console.log('✅ Supabase client configured!');
    console.log('   URL:', process.env.SUPABASE_URL);
    console.log('   Service Key: ***' + process.env.SUPABASE_SERVICE_KEY.slice(-10));
    
    // Test Supabase connection
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Try to query a table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is OK
      console.log('   Warning:', error.message);
    } else {
      console.log('   Supabase API working!');
    }
  } else {
    console.log('❌ Supabase client not configured');
  }
  
  console.log('\n✅ Configuration test complete!');
}

testAll();