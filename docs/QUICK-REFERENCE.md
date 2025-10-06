# ⚡ Quick Reference - Command Cheatsheet

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

---

## 🗄️ Database Commands

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE selisih_berat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Grant privileges
GRANT ALL PRIVILEGES ON selisih_berat.* TO 'user'@'localhost';
FLUSH PRIVILEGES;

# Backup database
mysqldump -u root -p selisih_berat > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u root -p selisih_berat < backup.sql

# Show tables
SHOW TABLES;

# Describe table
DESCRIBE entries;

# Count entries
SELECT COUNT(*) FROM entries;
```

---

## 🔐 Security Commands

```bash
# Generate JWT secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate random password
openssl rand -base64 24

# Hash password with bcrypt (Node.js)
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('password', 10).then(console.log)"
```

---

## 🐳 PM2 Commands

```bash
# Start app
pm2 start src/server.js --name selisih-berat

# List all apps
pm2 list

# View logs
pm2 logs selisih-berat

# Monitor
pm2 monit

# Restart
pm2 restart selisih-berat

# Reload (zero downtime)
pm2 reload selisih-berat

# Stop
pm2 stop selisih-berat

# Delete
pm2 delete selisih-berat

# Save configuration
pm2 save

# Auto-start on reboot
pm2 startup
```

---

## 🌐 Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo nginx -s reload

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Enable site
sudo ln -s /etc/nginx/sites-available/selisih-berat /etc/nginx/sites-enabled/

# Check status
sudo systemctl status nginx
```

---

## 🔒 SSL/Certbot Commands

```bash
# Install SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# List certificates
sudo certbot certificates
```

---

## 🐧 Linux System Commands

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
htop

# Check running processes
ps aux | grep node

# Kill process by PID
kill -9 <PID>

# Find process using port
lsof -i :3000

# Check service status
sudo systemctl status mysql
sudo systemctl status nginx

# View system logs
journalctl -xe
```

---

## 📦 Git Commands

```bash
# Clone repository
git clone <url>

# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "message"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feature-name

# Switch branch
git checkout main

# Merge branch
git merge feature-name

# View commit history
git log --oneline
```

---

## 🔍 Debugging Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check MySQL version
mysql --version

# Test MySQL connection
mysql -u root -p -e "SELECT 1"

# Check if port is in use
netstat -tuln | grep 3000

# Test API endpoint
curl http://localhost:3000/api/health

# Test with headers
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/entries
```

---

## 📊 API Testing (curl)

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get entries (with auth)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/entries

# Create entry
curl -X POST http://localhost:3000/api/entries/submit-with-urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "nama":"Test",
    "no_resi":"RESI001",
    "berat_resi":5.5,
    "berat_aktual":5.0,
    "foto_url_1":"https://example.com/1.jpg",
    "foto_url_2":"https://example.com/2.jpg"
  }'
```

---

## 🔧 Environment Variables

```bash
# View all environment variables
printenv

# View specific variable
echo $NODE_ENV

# Set temporary variable
export NODE_ENV=production

# Load .env file (Node.js)
node -r dotenv/config src/server.js
```

---

## 📦 npm/Package Management

```bash
# Install specific package
npm install express

# Install dev dependency
npm install --save-dev nodemon

# Update package
npm update express

# Remove package
npm uninstall express

# Check outdated packages
npm outdated

# Update all packages
npm update

# Audit vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 🐳 Docker Commands

```bash
# Build image
docker build -t selisih-berat .

# Run container
docker run -p 3000:3000 selisih-berat

# List containers
docker ps

# Stop container
docker stop <container-id>

# View logs
docker logs <container-id>

# Docker Compose
docker-compose up -d
docker-compose down
docker-compose logs -f
```

---

## 📁 File Operations

```bash
# Create directory
mkdir -p src/config

# Copy file
cp .env.example .env

# Move/rename file
mv old.js new.js

# Delete file
rm file.txt

# Delete directory
rm -rf folder/

# Find files
find . -name "*.js"

# Search in files
grep -r "searchterm" .

# Change permissions
chmod 755 script.sh

# Change ownership
chown -R user:group /var/www
```

---

## 🔄 Backup & Restore

```bash
# Backup database
mysqldump -u root -p selisih_berat > backup.sql

# Backup with timestamp
mysqldump -u root -p selisih_berat > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup entire application
tar -czf app_backup.tar.gz /var/www/selisih-berat

# Restore database
mysql -u root -p selisih_berat < backup.sql

# Extract backup
tar -xzf app_backup.tar.gz
```

---

## 📊 Performance Monitoring

```bash
# Monitor system resources
top
htop

# Check disk I/O
iostat

# Monitor network
netstat -tuln
ss -tuln

# Check bandwidth
iftop

# Monitor MySQL
mysqladmin -u root -p processlist

# Analyze slow queries
mysqldumpslow /var/log/mysql/slow-query.log
```

---

## 🚨 Emergency Commands

```bash
# Restart app immediately
pm2 restart selisih-berat

# Kill all Node processes
pkill node

# Restart MySQL
sudo systemctl restart mysql

# Restart Nginx
sudo systemctl restart nginx

# Check error logs
tail -f /var/log/nginx/error.log
pm2 logs selisih-berat --err

# Reboot server (last resort!)
sudo reboot
```

---

## 🔗 Useful URLs (Local Development)

```
Application:     http://localhost:3000
Login:           http://localhost:3000/login.html
Signup:          http://localhost:3000/signup.html
Entry:           http://localhost:3000/entry.html
Dashboard:       http://localhost:3000/dashboard.html
API Health:      http://localhost:3000/api/health
```

---

## 📞 Quick Support Checks

```bash
# 1. Check if app is running
pm2 status

# 2. Check database connection
mysql -u root -p -e "SELECT 1"

# 3. Check logs for errors
pm2 logs selisih-berat --lines 50

# 4. Check disk space
df -h

# 5. Check memory
free -h

# 6. Test API
curl http://localhost:3000/api/health
```

---

## 🎯 Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**⚠️ Change immediately after first login!**

---

## 📚 Documentation Quick Links

- **Full Docs:** `README.md`
- **Quick Start:** `QUICKSTART.md`
- **Frontend:** `FRONTEND-README.md`
- **Deployment:** `DEPLOYMENT-GUIDE.md`
- **Summary:** `FINAL-SUMMARY.md`

---

**Keep this cheatsheet handy for quick reference! 📌**