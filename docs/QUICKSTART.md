# 🚀 Quick Start Guide

Panduan cepat untuk menjalankan aplikasi Selisih Berat.

## 📋 Prerequisites

Pastikan sudah terinstall:
- ✅ Node.js (v14 atau lebih tinggi)
- ✅ MySQL (v5.7 atau lebih tinggi)
- ✅ npm atau yarn

## ⚡ Setup dalam 5 Menit

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE selisih_berat;
exit
```

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env dengan editor favorit
nano .env  # atau code .env
```

Minimal configuration yang harus diisi:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=selisih_berat

# JWT Secrets (ganti dengan random string)
JWT_SECRET=your-super-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Cloudinary (opsional untuk testing)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Start Server
```bash
npm run dev
```

Tunggu sampai muncul:
```
✅ Database connected successfully
✅ Users table ready
✅ Entries table ready
✅ Default admin user created

🌐 Server running on: http://localhost:3000
```

## 🎯 Testing API

### 1. Test Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Login dengan Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Simpan `accessToken` dari response!

### 3. Test Create Entry
```bash
curl -X POST http://localhost:3000/api/entries/submit-with-urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "nama": "Test User",
    "no_resi": "RESI001",
    "berat_resi": 5.5,
    "berat_aktual": 5.0,
    "foto_url_1": "https://via.placeholder.com/400",
    "foto_url_2": "https://via.placeholder.com/400",
    "catatan": "Testing entry"
  }'
```

### 4. Test Get Entries
```bash
curl http://localhost:3000/api/entries \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## 🔧 Common Issues & Solutions

### Issue: Database Connection Failed
**Solution:**
```bash
# Check MySQL is running
sudo service mysql status

# Restart MySQL
sudo service mysql restart

# Verify credentials
mysql -u root -p
```

### Issue: Port Already in Use
**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Issue: JWT Token Invalid
**Solution:**
- Make sure `JWT_SECRET` in `.env` is not empty
- Get new token by logging in again
- Check token is sent in `Authorization: Bearer <token>` header

### Issue: Cloudinary Upload Failed
**Solution:**
- Verify Cloudinary credentials in `.env`
- For testing without Cloudinary, use the `/submit-with-urls` endpoint
- Or set dummy URLs: `foto_url_1: "https://via.placeholder.com/400"`

## 📱 Testing with Postman

### 1. Import Collection
Create a new collection in Postman with these requests:

**Environment Variables:**
```
base_url: http://localhost:3000
access_token: (will be set after login)
```

**Collection Structure:**
```
Selisih Berat API/
├── Auth/
│   ├── Register
│   ├── Login
│   ├── Get Profile
│   └── Change Password
└── Entries/
    ├── Submit Entry
    ├── Get Entries
    ├── Update Entry
    ├── Delete Entry
    └── Export Entries
```

### 2. Setup Authorization
After login:
1. Copy `accessToken` from response
2. Set as environment variable `access_token`
3. Use in Authorization header: `Bearer {{access_token}}`

## 🎨 Frontend Integration

### Example: Login Form (HTML + JavaScript)
```html
<form id="loginForm">
  <input type="text" id="username" placeholder="Username" required>
  <input type="password" id="password" placeholder="Password" required>
  <button type="submit">Login</button>
</form>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: document.getElementById('username').value,
      password: document.getElementById('password').value
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Save token
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    alert('Login successful!');
  } else {
    alert(data.message);
  }
});
</script>
```

### Example: Create Entry Form
```html
<form id="entryForm">
  <input type="text" id="nama" placeholder="Nama" required>
  <input type="text" id="no_resi" placeholder="No Resi" required>
  <input type="number" id="berat_resi" placeholder="Berat Resi" step="0.01" required>
  <input type="number" id="berat_aktual" placeholder="Berat Aktual" step="0.01" required>
  <textarea id="catatan" placeholder="Catatan (opsional)"></textarea>
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('entryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:3000/api/entries/submit-with-urls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      nama: document.getElementById('nama').value,
      no_resi: document.getElementById('no_resi').value,
      berat_resi: parseFloat(document.getElementById('berat_resi').value),
      berat_aktual: parseFloat(document.getElementById('berat_aktual').value),
      catatan: document.getElementById('catatan').value,
      foto_url_1: 'https://via.placeholder.com/400',
      foto_url_2: 'https://via.placeholder.com/400'
    })
  });
  
  const data = await response.json();
  alert(data.message);
});
</script>
```

## 📚 Next Steps

1. **Ubah Default Password Admin**
   ```bash
   POST /api/auth/change-password
   {
     "old_password": "admin123",
     "new_password": "your_new_secure_password"
   }
   ```

2. **Buat User Baru**
   ```bash
   POST /api/auth/register
   {
     "username": "john_doe",
     "password": "password123",
     "email": "john@example.com",
     "full_name": "John Doe"
   }
   ```

3. **Setup Cloudinary** (untuk upload foto)
   - Daftar di [cloudinary.com](https://cloudinary.com)
   - Get credentials dari dashboard
   - Update `.env` file

4. **Deploy ke Production**
   - Set `NODE_ENV=production`
   - Use strong JWT secrets
   - Enable HTTPS
   - Setup proper CORS origins
   - Configure rate limiting

## 🆘 Need Help?

- 📖 Baca [README.md](README.md) untuk dokumentasi lengkap
- 🐛 Check server logs di console
- 💬 Contact support atau buat issue di repository

## ✅ Checklist

- [ ] Database running
- [ ] Dependencies installed
- [ ] `.env` configured
- [ ] Server started successfully
- [ ] Admin login works
- [ ] Can create entries
- [ ] Can list entries

Selamat! Aplikasi siap digunakan! 🎉