// test-api.js - Test API with authentication
const axios = require('axios'); // npm install axios if needed
const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing API...\n');
    
    // 1. Test Health
    console.log('1️⃣ Health Check:');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅', health.data);
    
    // 2. Test Login
    console.log('\n2️⃣ Login:');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Login success:', loginRes.data.message);
    const token = loginRes.data.accessToken;
    console.log('📌 Token received:', token ? 'Yes' : 'No');
    
    // 3. Test Protected Route
    console.log('\n3️⃣ Get Entries (with token):');
    const entriesRes = await axios.get(`${BASE_URL}/entries`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Entries:', entriesRes.data);
    
    // 4. Test Statistics
    console.log('\n4️⃣ Statistics:');
    const statsRes = await axios.get(`${BASE_URL}/entries/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Stats:', statsRes.data);
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.data.message);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testAPI();