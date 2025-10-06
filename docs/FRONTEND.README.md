# 📱 Frontend Documentation - Aplikasi Selisih Berat

## 🎨 Overview

Frontend aplikasi ini dibangun dengan:
- **Vanilla JavaScript** (ES6+)
- **Bootstrap 5.3** untuk UI framework
- **Font Awesome 6.4** untuk icons
- **CSS3** dengan custom variables dan animations

## 📁 File Structure

```
public/
├── index.html              # Landing/redirect page
├── login.html              # Login page
├── signup.html             # Registration page
├── forgot-password.html    # Password reset page
├── entry.html              # Entry form page (User)
├── dashboard.html          # Admin dashboard
├── 404.html                # Error page
└── style.css               # Global stylesheet
```

## 🚀 Pages Overview

### 1. **index.html** - Landing Page
- Auto-redirect jika sudah login
- Menampilkan fitur aplikasi
- Link ke login & signup

**Features:**
- Auto-check authentication status
- Role-based redirect (Admin → Dashboard, User → Entry)
- Animated landing design

### 2. **login.html** - Login Page
**API Integration:**
```javascript
POST /api/auth/login
Body: { username, password }
Response: { user, accessToken, refreshToken }
```

**Features:**
- Password visibility toggle
- Remember me checkbox
- Real-time validation
- Error handling
- Auto-redirect based on role

**Local Storage:**
```javascript
accessToken    // JWT access token
refreshToken   // JWT refresh token  
userRole       // 'admin' or 'user'
userName       // Username
userEmail      // Email
```

### 3. **signup.html** - Registration Page
**API Integration:**
```javascript
POST /api/auth/register
Body: { username, password, email, full_name }
Response: { user, accessToken, refreshToken }
```

**Features:**
- Real-time username availability check
- Password strength indicator
- Password confirmation validation
- Input sanitization
- Auto-login after successful registration

**Validation Rules:**
- Username: min 3 chars, alphanumeric + underscore only
- Password: min 6 chars
- Email: valid email format
- Full name: min 3 chars

### 4. **forgot-password.html** - Password Reset
**API Integration:**
```javascript
POST /api/auth/request-password-reset
Body: { email }
Response: { success: true, message }
```

**Features:**
- Step-by-step process indicator
- Email validation
- Success confirmation
- Link expiry notification

### 5. **entry.html** - Entry Form Page
**API Integration:**
```javascript
// Submit entry
POST /api/entries/submit-with-urls
Headers: { Authorization: 'Bearer <token>' }
Body: {
  nama, no_resi, berat_resi, berat_aktual,
  foto_url_1, foto_url_2, catatan
}

// Get recent entries
GET /api/entries/recent?limit=10
Headers: { Authorization: 'Bearer <token>' }
```

**Features:**
- Auto-calculate selisih (difference)
- Dual photo upload (Gallery + Camera)
- Real-time image preview
- Cloudinary integration for photo upload
- Recent entries sidebar
- Form validation
- Loading states
- Toast notifications

**Photo Upload Flow:**
1. User selects photos (gallery or camera)
2. Display previews
3. On submit: Upload to Cloudinary first
4. Get Cloudinary URLs
5. Submit URLs + data to backend API
6. Reset form on success

**Access Control:**
- Requires authentication
- Available for all logged-in users
- Admin has additional Dashboard button

### 6. **dashboard.html** - Admin Dashboard
**API Integration:**
```javascript
// Get statistics
GET /api/entries/statistics
Headers: { Authorization: 'Bearer <token>' }

// Get entries with filters
GET /api/entries?page=1&limit=10&search=&status=
Headers: { Authorization: 'Bearer <token>' }

// Update entry
PUT /api/entries/:id
Headers: { Authorization: 'Bearer <token>' }
Body: { status, notes }

// Delete entry
DELETE /api/entries/:id
Headers: { Authorization: 'Bearer <token>' }

// Export data
GET /api/entries/export?format=excel
Headers: { Authorization: 'Bearer <token>' }
```

**Features:**
- Statistics cards (Total, Today, Avg Selisih)
- Advanced search & filters
- Pagination
- Status management (submitted, reviewed, approved, rejected)
- Photo viewer modal
- Edit modal
- Delete with confirmation
- Export to Excel/CSV
- Real-time data updates

**Access Control:**
- **Admin only** - redirects non-admin users to login
- Full CRUD operations
- Bulk export capabilities

### 7. **404.html** - Error Page
- Custom 404 design
- Animated background
- Return to home button

## 🔐 Authentication Flow

### Login Flow
```javascript
1. User enters credentials
2. POST /api/auth/login
3. Save tokens to localStorage
4. Redirect based on role
   - Admin → /dashboard.html
   - User → /entry.html
```

### Protected Pages
```javascript
// Check authentication on page load
const accessToken = localStorage.getItem('accessToken');
const userRole = localStorage.getItem('userRole');

if (!accessToken) {
    window.location.href = '/login.html';
}

// Role-based access
if (userRole !== 'admin') {
    window.location.href = '/entry.html';
}
```

### Token Refresh (Optional)
```javascript
// If accessToken expired
POST /api/auth/refresh-token
Body: { refreshToken }
Response: { accessToken }

// Update localStorage
localStorage.setItem('accessToken', newAccessToken);
```

### Logout Flow
```javascript
1. Call POST /api/auth/logout (optional)
2. localStorage.clear()
3. Redirect to /login.html
```

## 🎨 Styling Guide

### CSS Variables
```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --success-gradient: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    --danger-gradient: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
    --card-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}
```

### Component Classes

**Cards:**
- `.header-card` - Header dengan gradient text
- `.form-card` - Form container dengan top border
- `.stats-card` - Statistics card dengan icon
- `.recent-entries-card` - Sidebar entries

**Buttons:**
- `.btn-primary-gradient` - Primary button dengan gradient
- `.btn-modern` - Modern style button
- `.upload-btn` - File upload button

**Utilities:**
- `.loading-overlay` - Full screen loading
- `.toast-container` - Toast notification container
- `.custom-toast` - Individual toast
- `.preview-grid` - Image preview grid

## 📱 Responsive Design

### Breakpoints
- **Desktop:** > 992px
- **Tablet:** 768px - 992px
- **Mobile:** < 768px

### Mobile Optimizations
- Stack columns vertically
- Larger touch targets (min 44px)
- Simplified navigation
- Bottom-aligned buttons
- Camera capture support

## 🔧 JavaScript Utilities

### Show Toast Notification
```javascript
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div>${message}</div>
    `;
    document.getElementById('toastContainer').appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
```

### Loading States
```javascript
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}
```

### API Call Helper
```javascript
async function apiCall(endpoint, options = {}) {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error('API call failed');
    }

    return await response.json();
}
```

## 📸 Cloudinary Integration

### Setup
```javascript
// Upload preset: 'ml_default'
// Cloud name: 'ddzzlusek' (replace with yours)
// Folder: 'selisih-berat'
```

### Upload Function
```javascript
async function uploadToCloudinary(file, noResi, index) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default');
    formData.append('folder', 'selisih-berat');
    formData.append('public_id', `${noResi}_foto${index}`);

    const response = await fetch(
        'https://api.cloudinary.com/v1_1/ddzzlusek/image/upload',
        { method: 'POST', body: formData }
    );

    const result = await response.json();
    return result.secure_url;
}
```

## 🐛 Error Handling

### API Errors
```javascript
try {
    const response = await fetch('/api/endpoint');
    const result = await response.json();
    
    if (!response.ok) {
        throw new Error(result.message || 'Operation failed');
    }
    
    // Success
    showToast('Success!', 'success');
} catch (error) {
    console.error('Error:', error);
    showToast(error.message, 'error');
}
```

### Token Expiration
```javascript
// If 401 Unauthorized
if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/login.html';
}
```

## 🚀 Deployment

### Build Steps
1. No build process required (vanilla JS)
2. Files can be served directly

### Environment Variables
Update in HTML files:
- Cloudinary cloud name
- Cloudinary upload preset
- API base URL (if different)

### CDN Dependencies
Already included via CDN:
- Bootstrap 5.3
- Font Awesome 6.4
- No additional npm packages needed

## 📝 Best Practices

1. **Always validate on both client and server**
2. **Never store sensitive data in localStorage**
3. **Always use HTTPS in production**
4. **Implement proper error boundaries**
5. **Test on multiple devices**
6. **Optimize images before upload**
7. **Use loading states for better UX**
8. **Implement proper token refresh logic**

## 🔒 Security Considerations

1. **XSS Prevention:** Sanitize all user inputs
2. **CSRF:** Use tokens for state-changing operations
3. **Token Storage:** Consider using httpOnly cookies
4. **CORS:** Configure properly on backend
5. **Content Security Policy:** Implement CSP headers

## 📞 Support

For issues or questions:
- Check browser console for errors
- Verify API endpoints are correct
- Ensure tokens are valid
- Check network tab for failed requests

## 🎯 TODO / Future Enhancements

- [ ] Implement progressive web app (PWA)
- [ ] Add offline support with service workers
- [ ] Implement real-time updates with WebSockets
- [ ] Add dark mode toggle
- [ ] Implement advanced data visualization
- [ ] Add bulk upload functionality
- [ ] Implement user profile page
- [ ] Add notification system