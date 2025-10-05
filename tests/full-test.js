// full-test.js
const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: JSON.parse(body)
        });
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  const base = {
    hostname: 'localhost',
    port: 3000,
    headers: { 'Content-Type': 'application/json' }
  };

  // 1. Login
  console.log('1. Login...');
  const login = await request({
    ...base,
    path: '/api/auth/login',
    method: 'POST'
  }, {
    username: 'admin',
    password: 'admin123'
  });
  
  if (login.status !== 200) {
    console.log('❌ Login failed:', login.data);
    return;
  }
  
  console.log('✅ Logged in!');
  const token = login.data.accessToken;
  
  // 2. Get entries
  console.log('\n2. Get entries...');
  const entries = await request({
    ...base,
    path: '/api/entries',
    method: 'GET',
    headers: {
      ...base.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('✅ Entries:', entries.data);
  
  // 3. Create entry
  console.log('\n3. Create entry...');
  const create = await request({
    ...base,
    path: '/api/entries/submit-with-urls',
    method: 'POST',
    headers: {
      ...base.headers,
      'Authorization': `Bearer ${token}`
    }
  }, {
    nama: 'Test Customer',
    no_resi: `TEST${Date.now()}`,
    berat_resi: '5.5',
    berat_aktual: '5.8',
    catatan: 'Test entry'
  });
  console.log('✅ Entry created:', create.data);
}

test().catch(console.error);