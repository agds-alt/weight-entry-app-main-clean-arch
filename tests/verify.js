// verify.js - Test the exact connection string
const { Client } = require('pg');
require('dotenv').config();

console.log('Testing connection...');
console.log('Current DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@'));

const client = new Client({
  connectionString: 'postgresql://postgres:D0DP1nTXhdOKP3MA@db.rwxgpbikdxlialoegghq.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ SUCCESS! Connection works!');
    console.log('\nMake sure your .env has:');
    console.log('DATABASE_URL=postgresql://postgres:D0DP1nTXhdOKP3MA@db.rwxgpbikdxlialoegghq.supabase.co:5432/postgres');
    return client.end();
  })
  .catch(err => {
    console.log('❌ Failed:', err.message);
    console.log('\nTrying alternative...');
    
    // Try pooler format
    const client2 = new Client({
      connectionString: 'postgresql://postgres.rwxgpbikdxlialoegghq:D0DP1nTXhdOKP3MA@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
      ssl: { rejectUnauthorized: false }
    });
    
    return client2.connect()
      .then(() => {
        console.log('✅ Alternative works! Use:');
        console.log('DATABASE_URL=postgresql://postgres.rwxgpbikdxlialoegghq:D0DP1nTXhdOKP3MA@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
        return client2.end();
      })
      .catch(err2 => {
        console.log('❌ Both failed. Check Supabase dashboard for correct connection string.');
      });
  });