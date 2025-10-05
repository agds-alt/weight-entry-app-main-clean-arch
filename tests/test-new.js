const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:041294@db.rwxgpbikdxlialoegghq.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ Connected successfully!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Server time:', res.rows[0].now);
    console.log('\n✅ Connection works! Update your .env with:');
    console.log('DATABASE_URL=postgresql://postgres:041294@db.rwxgpbikdxlialoegghq.supabase.co:5432/postgres');
    return client.end();
  })
  .catch(err => {
    console.log('❌ Error:', err.message);
  });