# 📦 Aplikasi Selisih Berat - Refactored Version

Aplikasi untuk mencatat dan mengelola selisih berat paket dengan arsitektur yang clean dan terstruktur.

## ✨ Fitur Utama

- 🔐 **Authentication & Authorization** - JWT & Session based
- 📸 **Photo Upload** - Cloudinary integration
- 📊 **Data Management** - CRUD operations dengan pagination
- 📈 **Statistics** - Dashboard analytics
- 📥 **Export Data** - CSV & Excel export
- 🔍 **Search & Filter** - Advanced filtering
- 👥 **User Management** - Admin & User roles
- 🛡️ **Security** - Rate limiting, input validation, helmet

## 🏗️ Arsitektur

Aplikasi ini menggunakan **layered architecture** untuk memisahkan concerns:

```
src/
├── config/           # Configuration files
│   ├── database.js   # Database connection & setup
│   └── cloudinary.js # Cloudinary configuration
├── controllers/      # Request handlers
│   ├── auth.controller.js
│   └── entry.controller.js
├── services/         # Business logic
│   ├── auth.service.js
│   └── entry.service.js
├── repositories/     # Data access layer
│   ├── user.repository.js
│   └── entry.repository.js
├── routes/           # API routes
│   ├── auth.routes.js
│   └── entry.routes.js
├── middleware/       # Express middleware
│   ├── auth.js       # Authentication middleware
│   └── validation.js # Input validation
├── utils/            # Utility functions
│   ├── helpers.js    # Common helpers
│   └── jwt.js        # JWT utilities
└── server.js         # Main application file
```

## 🚀 Installation

### Prerequisites

- Node.js >= 14.x
- MySQL >= 5.7
- Cloudinary account (untuk upload foto)

### Setup Steps

1. **Clone repository**
```bash
git clone <repository-url>
cd weight-entry-app-main
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```
Edit `.env` dan sesuaikan dengan konfigurasi Anda:
- Database credentials
- JWT secrets
- Cloudinary credentials

4. **Setup database**
```bash
# Database dan tables akan dibuat otomatis saat server pertama kali dijalankan
# Atau bisa manual dengan SQL:
mysql -u root -p < database/schema.sql
```

5. **Start server**
```bash
# Development
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123",
  "email": "john@example.com",
  "full_name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login berhasil",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer {accessToken}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "old_password": "password123",
  "new_password": "newpassword123"
}
```

### Entry Endpoints

#### Submit Entry (with file upload)
```http
POST /api/entries/submit
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

nama: John Doe
no_resi: RESI123456
berat_resi: 5.5
berat_aktual: 5.2
catatan: Optional notes
photos: [file1.jpg, file2.jpg]
```

#### Submit Entry (with Cloudinary URLs)
```http
POST /api/entries/submit-with-urls
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "nama": "John Doe",
  "no_resi": "RESI123456",
  "berat_resi": 5.5,
  "berat_aktual": 5.2,
  "foto_url_1": "https://res.cloudinary.com/...",
  "foto_url_2": "https://res.cloudinary.com/...",
  "catatan": "Optional notes"
}
```

#### Get Entries
```http
GET /api/entries?page=1&limit=10&search=&status=
Authorization: Bearer {accessToken}
```

#### Update Entry
```http
PUT /api/entries/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "approved",
  "notes": "Verified"
}
```

#### Delete Entry
```http
DELETE /api/entries/:id
Authorization: Bearer {accessToken}
```

#### Export Entries
```http
GET /api/entries/export?startDate=2024-01-01&endDate=2024-12-31&format=excel
Authorization: Bearer {accessToken}
```

#### Get Statistics
```http
GET /api/entries/statistics
Authorization: Bearer {accessToken}
```

## 🔐 Security Features

### Rate Limiting
- Login: 20 requests per 15 minutes
- Register: 10 requests per hour
- Password reset: 5 requests per hour

### Input Validation
- All inputs are validated and sanitized
- File upload restrictions (size, type)
- SQL injection prevention with parameterized queries

### Authentication
- JWT with access & refresh tokens
- Bcrypt password hashing (10 rounds)
- Optional session-based auth

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);
```

### Entries Table
```sql
CREATE TABLE entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    no_resi VARCHAR(50) UNIQUE NOT NULL,
    berat_resi DECIMAL(10,2) NOT NULL,
    berat_aktual DECIMAL(10,2) NOT NULL,
    selisih DECIMAL(10,2) NOT NULL,
    foto_url_1 VARCHAR(255),
    foto_url_2 VARCHAR(255),
    catatan TEXT,
    status ENUM('submitted', 'reviewed', 'approved', 'rejected') DEFAULT 'submitted',
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(username) ON DELETE CASCADE
);
```

## 📦 Dependencies

### Core
- `express` - Web framework
- `mysql2` - MySQL client
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication

### File Upload
- `multer` - File upload handling
- `cloudinary` - Cloud storage

### Utilities
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `helmet` - Security headers
- `morgan` - Request logging
- `express-session` - Session management

### Export
- `xlsx` - Excel export
- CSV export (native)

## 🛠️ Development

### Scripts
```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run tests (if configured)
npm test

# Lint code
npm run lint
```

### Project Structure Benefits

1. **Separation of Concerns**
   - Controllers handle HTTP requests
   - Services contain business logic
   - Repositories handle data access

2. **Testability**
   - Each layer can be tested independently
   - Easy to mock dependencies

3. **Maintainability**
   - Clear organization
   - Easy to locate and modify code

4. **Scalability**
   - Easy to add new features
   - Modular architecture

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key configurations:
- `JWT_SECRET` - Change this in production!
- `JWT_REFRESH_SECRET` - Change this in production!
- `CLOUDINARY_*` - Get from Cloudinary dashboard
- `DB_*` - Database credentials

### Default Admin Account

When the server starts for the first time:
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT: Change this password immediately in production!**

## 📝 Best Practices

1. **Always use environment variables** for sensitive data
2. **Hash passwords** before storing
3. **Validate all inputs** on both client and server
4. **Use prepared statements** to prevent SQL injection
5. **Implement rate limiting** to prevent abuse
6. **Log important events** for debugging
7. **Handle errors gracefully** with proper error messages

## 🐛 Troubleshooting

### Database Connection Failed
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

### Cloudinary Upload Failed
- Verify Cloudinary credentials
- Check file size limits
- Ensure internet connection

### JWT Token Invalid
- Token may be expired
- Use refresh token endpoint
- Check JWT_SECRET matches

## 📄 License

MIT License

## 👥 Contributors

- Your Name - Initial work

## 🙏 Acknowledgments

- Express.js team
- Cloudinary
- MySQL team