// setup-admin.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function setupAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Generate hash using same bcrypt settings as your app
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    // Update admin
    const result = await client.query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id',
      [hash, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin password updated!');
    } else {
      // Create admin if doesn't exist
      await client.query(
        'INSERT INTO users (username, password, email, full_name, role) VALUES ($1, $2, $3, $4, $5)',
        ['admin', hash, 'admin@example.com', 'Administrator', 'admin']
      );
      console.log('✅ Admin created!');
    }
    
    console.log('Username: admin');
    console.log('Password: admin123');
    
    // Test the login
    const testUser = await client.query('SELECT password FROM users WHERE username = $1', ['admin']);
    const isValid = await bcrypt.compare('admin123', testUser.rows[0].password);
    console.log('Password verification:', isValid ? '✅ Working' : '❌ Failed');
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupAdmin();