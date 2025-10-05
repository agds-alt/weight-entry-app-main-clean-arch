// test-api-fixed.js
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPI() {
  try {
    // 1. Health check
    console.log('1️⃣ Testing /api/health...');
    const health = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    console.log('✅ Health:', health.data);
    
    // 2. Login
    console.log('\n2️⃣ Testing login...');
    const login = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (login.status === 200) {
      console.log('✅ Login successful!');
      const token = login.data.accessToken;
      
      // 3. Test protected route
      console.log('\n3️⃣ Testing /api/entries...');
      const entries = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/entries',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Entries:', entries.data);
    } else {
      console.log('❌ Login failed:', login.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Is the server running? (npm run dev)');
    console.log('2. Check if port 3000 is free');
    console.log('3. Try: http://localhost:3000/api/health in browser');
  }
}

testAPI();