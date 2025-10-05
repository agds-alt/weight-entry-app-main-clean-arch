# 🚀 Complete Deployment Guide - Aplikasi Selisih Berat

## 📋 Table of Contents
1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Troubleshooting](#troubleshooting)

---

## 📁 Project Structure

```
weight-entry-app-main/
├── src/                          # Backend source files
│   ├── config/
│   │   ├── database.js          # MySQL connection & setup
│   │   └── cloudinary.js        # Cloudinary config
│   ├── controllers/
│   │   ├── auth.controller.js   # Authentication handlers
│   │   └── entry.controller.js  # Entry handlers
│   ├── services/
│   │   ├── auth.service.js      # Auth business logic
│   │   └── entry.service.js     # Entry business logic
│   ├── repositories/
│   │   ├── user.repository.js   # User data access
│   │   └── entry.repository.js  # Entry data access
│   ├── routes/
│   │   ├── auth.routes.js       # Auth API routes
│   │   └── entry.routes.js      # Entry API routes
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── validation.js        # Input validation
│   ├── utils/
│   │   ├── helpers.js           # Utility functions
│   │   └── jwt.js               # JWT utilities
│   └── server.js                # Main application file
├── public/                       # Frontend files
│   ├── index.html               # Landing page
│   ├── login.html               # Login page
│   ├── signup.html              # Registration page
│   ├── forgot-password.html     # Password reset
│   ├── entry.html               # Entry form
│   ├── dashboard.html           # Admin dashboard
│   ├── 404.html                 # Error page
│   └── style.css                # Global styles
├── .env                          # Environment variables
├── .env.example                  # Env template
├── package.json                  # Dependencies
├── README.md                     # Project documentation
├── QUICKSTART.md                 # Quick start guide
├── FRONTEND-README.md            # Frontend docs
└── DEPLOYMENT-GUIDE.md           # This file
```

---

## 🔧 Prerequisites

### Required Software
- **Node.js** >= 14.x ([Download](https://nodejs.org/))
- **MySQL** >= 5.7 ([Download](https://dev.mysql.com/downloads/))
- **Git** ([Download](https://git-scm.com/))

### Required Accounts
- **Cloudinary Account** (Free tier: [Sign up](https://cloudinary.com/users/register/free))
- **Domain** (Optional for production)
- **SSL Certificate** (Optional for production)

---

## 💻 Local Development

### Step 1: Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd weight-entry-app-main

# Install dependencies
npm install
```

### Step 2: Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE selisih_berat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
exit
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Minimal .env configuration:**

```env
# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=selisih_berat

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-characters
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=ml_default
```

### Step 4: Cloudinary Setup

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy your Cloud Name, API Key, and API Secret
3. Create an upload preset:
   - Go to Settings → Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Set Mode: **Unsigned**
   - Set Preset name: **ml_default**
   - Save

4. Update frontend files with your Cloudinary cloud name:
   - Open `public/entry.html`
   - Find: `https://api.cloudinary.com/v1_1/ddzzlusek/image/upload`
   - Replace `ddzzlusek` with your cloud name

### Step 5: Start Development Server

```bash
# Start server
npm run dev

# Server will start on http://localhost:3000
```

### Step 6: Test the Application

1. Open browser: `http://localhost:3000`
2. Default admin credentials:
   - Username: `admin`
   - Password: `admin123`
3. **⚠️ IMPORTANT:** Change admin password immediately!

---

## 🌐 Production Deployment

### Option 1: VPS Deployment (DigitalOcean, AWS EC2, etc.)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

#### 2. Clone & Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/selisih-berat
cd /var/www/selisih-berat

# Clone repository
git clone <repository-url> .

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env
```

**Production .env:**

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD=strong_password_here
DB_NAME=selisih_berat

# Strong JWT secrets (generate with: openssl rand -base64 32)
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>

# Cloudinary (production)
CLOUDINARY_CLOUD_NAME=your_production_cloud
CLOUDINARY_API_KEY=your_production_key
CLOUDINARY_API_SECRET=your_production_secret
```

#### 3. Database Setup (Production)

```bash
# Create database user
sudo mysql

CREATE DATABASE selisih_berat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON selisih_berat.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 4. Start with PM2

```bash
# Start application
pm2 start src/server.js --name selisih-berat

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup systemd
```

#### 5. Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/selisih-berat
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/selisih-berat /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 6. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

### Option 2: Heroku Deployment

#### 1. Prepare Application

```bash
# Create Procfile
echo "web: node src/server.js" > Procfile

# Update package.json
"engines": {
  "node": "18.x",
  "npm": "9.x"
}
```

#### 2. Deploy to Heroku

```bash
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create your-app-name

# Add MySQL addon (ClearDB)
heroku addons:create cleardb:ignite

# Get database URL
heroku config:get CLEARDB_DATABASE_URL

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set CLOUDINARY_CLOUD_NAME=your-cloud
# ... set all other env vars

# Deploy
git push heroku main

# Open app
heroku open
```

### Option 3: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USER=root
      - DB_PASSWORD=rootpassword
      - DB_NAME=selisih_berat
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=selisih_berat
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## ⚙️ Environment Configuration

### Generate Strong Secrets

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | Yes | development | Environment mode |
| PORT | Yes | 3000 | Server port |
| CORS_ORIGIN | Yes | * | Allowed CORS origins |
| DB_HOST | Yes | localhost | MySQL host |
| DB_PORT | No | 3306 | MySQL port |
| DB_USER | Yes | root | MySQL user |
| DB_PASSWORD | Yes | - | MySQL password |
| DB_NAME | Yes | selisih_berat | Database name |
| JWT_SECRET | Yes | - | JWT signing secret |
| JWT_REFRESH_SECRET | Yes | - | Refresh token secret |
| JWT_EXPIRY | No | 1h | Token expiry time |
| JWT_REFRESH_EXPIRY | No | 7d | Refresh token expiry |
| CLOUDINARY_CLOUD_NAME | Yes | - | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Yes | - | Cloudinary API key |
| CLOUDINARY_API_SECRET | Yes | - | Cloudinary API secret |

---

## 🐛 Troubleshooting

### Database Connection Failed

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SHOW DATABASES;"

# Check credentials in .env
cat .env | grep DB_
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Cloudinary Upload Failed

1. Check upload preset is **Unsigned**
2. Verify cloud name in frontend code
3. Check API key/secret in .env
4. Check network tab in browser DevTools

### JWT Token Invalid

1. Check JWT_SECRET matches between restarts
2. Clear localStorage in browser
3. Login again to get new token

### Permission Denied (PM2)

```bash
# Fix permissions
sudo chown -R $USER:$USER /var/www/selisih-berat

# Restart PM2
pm2 restart selisih-berat
```

### 502 Bad Gateway (Nginx)

```bash
# Check app is running
pm2 status

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart selisih-berat
sudo systemctl restart nginx
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# View app status
pm2 status

# View logs
pm2 logs selisih-berat

# View metrics
pm2 monit

# Restart app
pm2 restart selisih-berat

# Reload without downtime
pm2 reload selisih-berat
```

### Database Backup

```bash
# Create backup
mysqldump -u root -p selisih_berat > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u root -p selisih_berat < backup_20250101_120000.sql

# Automated daily backup (cron)
0 2 * * * mysqldump -u root -p'password' selisih_berat > /backups/db_$(date +\%Y\%m\%d).sql
```

---

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL in production
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting
- [ ] Setup firewall (ufw)
- [ ] Regular security updates
- [ ] Database regular backups
- [ ] Monitor error logs

---

## 📈 Performance Optimization

### Enable Gzip Compression (Nginx)

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### PM2 Cluster Mode

```bash
# Start with cluster mode (use all CPU cores)
pm2 start src/server.js -i max --name selisih-berat
```

### Database Optimization

```sql
-- Add indexes for better performance
ALTER TABLE entries ADD INDEX idx_created_at (created_at);
ALTER TABLE entries ADD INDEX idx_status (status);
ALTER TABLE entries ADD INDEX idx_no_resi (no_resi);
```

---

## 🎯 Post-Deployment

1. **Test all functionality:**
   - Login/Signup
   - Entry creation
   - Photo upload
   - Dashboard (admin)
   - Export data

2. **Change default credentials**
3. **Setup monitoring** (PM2, logs)
4. **Configure backups**
5. **Setup SSL certificate**
6. **Test on mobile devices**

---

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs selisih-berat`
2. Verify environment variables
3. Test database connection
4. Check Nginx configuration
5. Review browser console for errors

---

**Deployment Complete! 🎉**

Your application should now be live and accessible.