const { Client } = require('pg');

async function test() {
  const connections = [
    {
      name: 'Pooler Mode',
      url: 'postgresql://postgres.rwxgpbikdxlialoegghq:D0DP1nTXhdOKP3MA@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
    },
    {
      name: 'Direct Mode',  
      url: 'postgresql://postgres:D0DP1nTXhdOKP3MA@db.rwxgpbikdxlialoegghq.supabase.co:5432/postgres'
    }
  ];

  for (const conn of connections) {
    console.log(`\nTesting ${conn.name}...`);
    const client = new Client({
      connectionString: conn.url,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`✅ ${conn.name} WORKS!`);
      console.log('Use in .env:');
      console.log(`DATABASE_URL=${conn.url}`);
      await client.end();
      return;
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }
}

test();