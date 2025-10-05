// debug-token.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Check JWT_SECRET
console.log('JWT_SECRET from env:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('JWT_SECRET value:', process.env.JWT_SECRET || 'your-secret-key-change-in-production');

// Test token generation and verification
const payload = { username: 'admin', role: 'admin' };
const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const token = jwt.sign(payload, secret, { expiresIn: '15m' });
console.log('\nGenerated token:', token);

try {
  const decoded = jwt.verify(token, secret);
  console.log('\n✅ Token verification successful:', decoded);
} catch (error) {
  console.log('\n❌ Token verification failed:', error.message);
}

// Test with actual login
const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(body) });
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testActualToken() {
  // Login
  const login = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'admin',
    password: 'admin123'
  });

  if (login.data.accessToken) {
    console.log('\n📌 Token from login:', login.data.accessToken);
    
    // Try to decode it
    try {
      const decoded = jwt.verify(login.data.accessToken, secret);
      console.log('✅ Login token is valid:', decoded);
    } catch (error) {
      console.log('❌ Login token invalid:', error.message);
      console.log('\nProblem: JWT_SECRET mismatch between generation and verification');
    }
  }
}

testActualToken();