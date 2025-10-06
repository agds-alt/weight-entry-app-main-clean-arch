# Weight Entry App - Real-Time Dashboard & Analytics Platform

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://serat69.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

> A comprehensive, enterprise-grade web application for real-time weight entry management, automated earnings calculation, and competitive performance analytics.

**[Live Demo](https://serat69.vercel.app)** | **[Documentation](#documentation)** | **[Quick Start](#quick-start)**

---

## 🎯 Overview

Transform operational data into actionable business intelligence with automated revenue tracking, real-time analytics, and gamified team performance.

### Key Highlights

- 💰 **Automated Revenue Tracking** - Rp 500 per entry with instant calculations
- 📊 **Real-Time Analytics** - Live updates every 30 seconds via WebSocket + Polling
- 🏆 **Gamification System** - Level progression (Bronze → Silver → Gold → Diamond)
- 📱 **Mobile Optimized** - Responsive design for field operations
- 🔒 **Enterprise Security** - JWT authentication with role-based access control

---

## ✨ Features

### Dashboard & Analytics
- Live statistics with 30-second auto-refresh
- Performance metrics (Today/Week/Month)
- Visual progress tracking with Chart.js
- Average weight discrepancy calculations

### Competitive Leaderboard
- Real-time team rankings
- Performance comparison tools
- Achievement badges and rewards
- Earnings analytics

### Data Management
- Bulk entry operations
- Photo documentation via Cloudinary
- Verification workflow (Submitted → Verified)
- Advanced filtering and search

### Security & Access Control
- JWT token authentication
- Password hashing with bcrypt
- Role management (Admin/User)
- SQL injection prevention
- XSS protection with Helmet.js

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- PostgreSQL database (Supabase recommended)
- Cloudinary account for photo storage

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/weight-entry-app.git
cd weight-entry-app

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials (see Configuration below)

# Start the application
npm start

# Access at http://localhost:3000
```

### Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars

# Cloudinary (Photo Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

### Database Setup

The database tables are automatically created on first run. Default admin credentials:
- **Username:** `admin`
- **Password:** `admin123`

**⚠️ Change these immediately in production!**

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Database      │
│                 │    │                  │    │                 │
│ • Dashboard     │◄───│ • Express.js     │◄───│ • PostgreSQL   │
│ • Real-time UI  │    │ • JWT Auth       │    │ • Supabase     │
│ • Bootstrap 5   │    │ • REST API       │    │ • Real-time    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                         ┌───────────────┐
                         │ Cloud Services│
                         │ • Cloudinary  │
                         │ • CDN         │
                         └───────────────┘
```

---

## 📁 Project Structure

```
weight-entry-app/
│
├── 📚 docs/                                    # Documentation
│   ├── DEPLOYMENT-GUIDE.md                    # Deployment instructions
│   ├── FINAL-SUMMARY.md                       # Project summary
│   ├── FRONTEND.README.md                     # Frontend documentation
│   ├── QUICK-REFERENCE.md                     # API quick reference
│   └── QUICKSTART.md                          # Quick start guide
│
├── 🌐 public/                                  # Frontend Static Files
│   ├── 📄 HTML Pages
│   │   ├── index.html                         # Landing page
│   │   ├── login.html                         # Login page
│   │   ├── signup.html                        # Registration page
│   │   ├── dashboard.html                     # Main dashboard
│   │   ├── entry.html                         # Data entry form
│   │   ├── data-management.html               # Data management
│   │   ├── report.html                        # Reports & analytics
│   │   ├── profile.html                       # User profile
│   │   ├── settings.html                      # Settings page
│   │   ├── user-management.html               # User management (admin)
│   │   ├── forgot-password.html               # Password recovery
│   │   └── 404.html                           # Error page
│   │
│   ├── 🎨 Stylesheets
│   │   └── sys.css                            # Main stylesheet
│   │
│   ├── ⚡ JavaScript Files
│   │   ├── login.js                           # Login functionality
│   │   └── js/
│   │       ├── dashboard.js                   # Dashboard logic
│   │       ├── entry-form-resi.js            # Entry form handler
│   │       ├── data-management.js            # Data management logic
│   │       └── sidebar.js                     # Sidebar component
│   │
│   └── 📦 Assets
│       └── (images, fonts, icons)
│
├── ⚙️ src/                                     # Backend Source Code
│   │
│   ├── 🔧 config/                             # Configuration Files
│   │   ├── cloudinary.js                      # Cloudinary setup
│   │   ├── database.js                        # Database connection
│   │   ├── supabase.js                        # Supabase client
│   │   └── test-supabase.js                  # Supabase testing
│   │
│   ├── 🎮 controllers/                        # Request Controllers
│   │   ├── auth.controller.js                 # Authentication logic
│   │   ├── dashboard.controller.js            # Dashboard data
│   │   └── entry.controller.js                # Entry operations
│   │
│   ├── 🛡️ middleware/                         # Middleware Functions
│   │   ├── auth.js                            # JWT authentication
│   │   └── validation.js                      # Input validation
│   │
│   ├── 💾 repositories/                       # Data Access Layer
│   │   ├── dashboard.repository.js            # Dashboard queries
│   │   ├── entry.repository.js                # Entry queries
│   │   └── user.repository.js                 # User queries
│   │
│   ├── 🛤️ routes/                             # API Routes
│   │   ├── auth.routes.js                     # Auth endpoints
│   │   ├── dashboard.routes.js                # Dashboard endpoints
│   │   ├── entries.js                         # Entry endpoints
│   │   └── entry.routes.js                    # Entry routes
│   │
│   ├── 🏢 services/                           # Business Logic
│   │   ├── auth.service.js                    # Auth services
│   │   ├── dashboard.service.js               # Dashboard services
│   │   └── entry.service.js                   # Entry services
│   │
│   ├── 🔨 utils/                              # Utility Functions
│   │   ├── googleSheets.js                    # Google Sheets integration
│   │   ├── helpers.js                         # Helper functions
│   │   ├── jwt.js                             # JWT utilities
│   │   └── server.js                          # Server utilities
│   │
│   └── 🧪 tests/                              # Test Files
│       ├── auth.test.js
│       ├── dashboard.test.js
│       └── entry.test.js
│
├── 📋 Root Configuration Files
│   ├── .env                                    # Environment variables (create this)
│   ├── .env.example                           # Environment template
│   ├── .gitignore                             # Git ignore rules
│   ├── package.json                           # Dependencies & scripts
│   ├── package-lock.json                      # Dependency lock file
│   ├── README.md                              # This file
│   └── LICENSE                                # License file
│
└── 🚀 Deployment Files
    ├── vercel.json                            # Vercel configuration
    └── netlify.toml                           # Netlify configuration (optional)
```

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/refresh` | Refresh token |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/user-stats` | User statistics & earnings |
| GET | `/api/dashboard/leaderboard` | Team rankings |
| GET | `/api/dashboard/performance` | Performance metrics |

### Data Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/entries` | Create weight entry |
| GET | `/api/entries` | List entries (with filters) |
| PUT | `/api/entries/:id` | Update entry |
| DELETE | `/api/entries/:id` | Delete entry |

**Full API Documentation:** See [API Reference](docs/QUICK-REFERENCE.md)

---

## 🛠️ Technology Stack

**Frontend:** HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5, Chart.js  
**Backend:** Node.js, Express.js, PostgreSQL  
**Authentication:** JWT, bcrypt  
**Database:** Supabase (PostgreSQL)  
**Storage:** Cloudinary  
**Deployment:** Vercel

---

## 📊 Business Metrics

The application tracks key performance indicators:

- **Total Entries** - All-time submission count
- **Daily/Weekly/Monthly Progress** - Performance trends
- **Average Discrepancy** - Weight variance analysis
- **Verification Rate** - Process efficiency
- **Earnings** - Revenue tracking (Rp 500 per entry)

---

## 🔒 Security

- ✅ JWT token authentication
- ✅ Password hashing (bcrypt)
- ✅ SQL injection prevention
- ✅ XSS protection (Helmet.js)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Rate limiting
- ✅ Secure HTTP headers

---

## 📱 Mobile Support

- Touch-friendly interface
- Responsive design (mobile-first)
- Progressive Web App ready
- Optimized for cellular networks
- Works across all device sizes

---

## 🚢 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on git push

**Detailed Guide:** [Deployment Documentation](docs/DEPLOYMENT-GUIDE.md)

---

## 📚 Documentation

- [Quick Start Guide](docs/QUICKSTART.md)
- [Deployment Guide](docs/DEPLOYMENT-GUIDE.md)
- [Frontend Documentation](docs/FRONTEND.README.md)
- [API Reference](docs/QUICK-REFERENCE.md)
- [Final Summary](docs/FINAL-SUMMARY.md)

---

## 🤝 Contributing

This is a portfolio project showcasing full-stack development skills. While primarily for demonstration, suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available for educational purposes. For commercial use inquiries, contact the developer.

---

## 👨‍💻 About the Developer

**Abdul Gofur** - Full Stack Developer

This is my first full-stack project, demonstrating proficiency in:
- Modern JavaScript stack (Node.js, Express, PostgreSQL)
- RESTful API architecture
- Real-time data processing
- Responsive UI/UX design
- Production deployment and DevOps

**🌐 Portfolio:** [serat69.vercel.app](https://serat69.vercel.app)  
**📧 Email:** agdscid@gmail.com  
**💼 GitHub:** [Your GitHub Profile]

---

## 🙏 Acknowledgments

- Bootstrap team for the UI framework
- Supabase for database hosting
- Cloudinary for media storage
- Vercel for deployment platform

---

<div align="center">

### ⭐ If you find this project helpful, please give it a star!

---

**Weight Entry App** © 2024 by **Abdul Gofur**

Built with ❤️ and ☕ as a Full-Stack Portfolio Project

---

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Now-2ea44f?style=for-the-badge)](https://serat69.vercel.app)
[![Email Me](https://img.shields.io/badge/📧_Email-Contact_Me-orange?style=for-the-badge)](mailto:agdscid@gmail.com)
[![GitHub](https://img.shields.io/badge/💻_Source_Code-View_on_GitHub-black?style=for-the-badge)](https://github.com/your-username/weight-entry-app)

---

**Made in Indonesia** 🇮🇩 | **Powered by Modern Web Technologies** 🚀

*Transforming Business Operations Through Technology*

</div>