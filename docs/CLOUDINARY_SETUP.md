# Cloudinary Unsigned Upload Setup Guide

This guide explains how to configure Cloudinary for unsigned uploads in the Weight Entry Application.

## What is Unsigned Upload?

Unsigned upload allows frontend applications to upload files directly to Cloudinary without exposing API credentials (API Key and Secret). This is more secure and recommended for client-side uploads.

## Benefits of Unsigned Upload

- ✅ **More Secure**: No API credentials exposed in frontend code
- ✅ **Better Performance**: Files upload directly from browser to Cloudinary
- ✅ **Simplified Setup**: No need to manage API keys in frontend
- ✅ **Production Ready**: Best practice for production applications

## Prerequisites

1. A Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Your Cloudinary Cloud Name
3. Access to Cloudinary Dashboard

## Step 1: Get Your Cloud Name

1. Go to [Cloudinary Console](https://console.cloudinary.com/console)
2. On the dashboard, you'll see your **Cloud Name** (e.g., `dcg56qkae`)
3. Copy this value - you'll need it for environment configuration

## Step 2: Create Unsigned Upload Preset

### 2.1 Navigate to Upload Settings

1. Go to Cloudinary Dashboard
2. Click **Settings** (gear icon) in the top right
3. Click **Upload** tab
4. Scroll down to **Upload presets** section

### 2.2 Add Upload Preset

1. Click **Add upload preset** button
2. Configure the preset:

   **Preset name**: `selisih_berat`

   **Signing mode**: Select **Unsigned** (IMPORTANT!)

   **Folder**: `selisih_berat` (optional - can also be set in code)

   **Upload manipulations** (recommended):
   - Width: 1200 (limit)
   - Height: 1200 (limit)
   - Quality: Auto:good
   - Format: Auto

   **Access control**:
   - Public (default)

3. Click **Save** button

### 2.3 Verify Preset

After saving, you should see your preset in the list:
- Preset name: `selisih_berat`
- Mode: Unsigned ✅

## Step 3: Configure Environment Variables

### 3.1 Local Development (.env)

Create or update your `.env` file:

```env
# ==================== CLOUDINARY CONFIGURATION ====================
# For image uploads using unsigned upload (no API key/secret needed in frontend)
# Get these from: https://console.cloudinary.com/console
CLOUDINARY_CLOUD_NAME=dcg56qkae
CLOUDINARY_UPLOAD_PRESET=selisih_berat
CLOUDINARY_FOLDER=selisih_berat

# Optional: Only needed for backend/admin operations
# CLOUDINARY_API_KEY=your-api-key (optional)
# CLOUDINARY_API_SECRET=your-api-secret (optional)
```

**Important Notes:**
- `CLOUDINARY_CLOUD_NAME`: Your Cloud Name from Cloudinary dashboard
- `CLOUDINARY_UPLOAD_PRESET`: Must match the preset name you created (unsigned!)
- `CLOUDINARY_FOLDER`: Folder structure in Cloudinary (e.g., `selisih_berat`)
- API Key and Secret are **optional** - only needed for backend admin operations

### 3.2 Production (Vercel/Deployment)

#### For Vercel:

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

   ```
   CLOUDINARY_CLOUD_NAME = dcg56qkae
   CLOUDINARY_UPLOAD_PRESET = selisih_berat
   CLOUDINARY_FOLDER = selisih_berat
   ```

5. Apply to: **Production**, **Preview**, and **Development**
6. Click **Save**

#### For Other Platforms:

Set the same environment variables in your deployment platform's settings.

## Step 4: Test the Configuration

### 4.1 Start Local Server

```bash
npm start
```

### 4.2 Test Upload

1. Open browser: `http://localhost:3000`
2. Login with your credentials
3. Navigate to "Tambah Data" page
4. Fill in the form and upload photos
5. Check browser console:
   ```
   ✅ Cloudinary config loaded: dcg56qkae
   📤 Uploading file to Cloudinary...
   ✅ Cloudinary upload success: https://...
   ```

### 4.3 Verify in Cloudinary

1. Go to [Cloudinary Media Library](https://console.cloudinary.com/console/media_library)
2. Navigate to `selisih_berat` folder
3. You should see your uploaded images

## Step 5: Verify Configuration Endpoint

Test the backend API endpoint:

```bash
curl http://localhost:3000/api/config/cloudinary
```

Expected response:
```json
{
  "success": true,
  "data": {
    "cloudName": "dcg56qkae",
    "uploadPreset": "selisih_berat",
    "folder": "selisih_berat",
    "uploadUrl": "https://api.cloudinary.com/v1_1/dcg56qkae/image/upload"
  }
}
```

## Troubleshooting

### Issue: "Upload preset must be whitelisted for unsigned uploading"

**Solution:**
1. Go to Cloudinary Dashboard → Settings → Upload
2. Find your preset (`selisih_berat`)
3. Make sure **Signing mode** is set to **Unsigned** (NOT Signed!)
4. Save changes and try again

### Issue: "CLOUDINARY_CONFIG is null"

**Solution:**
1. Check that backend server is running
2. Verify `/api/config/cloudinary` endpoint returns data
3. Check browser console for any fetch errors
4. Make sure `.env` file has all required variables

### Issue: "Upload failed: 400 Bad Request"

**Solution:**
1. Verify `CLOUDINARY_UPLOAD_PRESET` matches your preset name exactly
2. Check that preset is **Unsigned** in Cloudinary dashboard
3. Try uploading a smaller image (< 10MB)
4. Check Cloudinary dashboard for error logs

### Issue: "Upload works locally but fails in production"

**Solution:**
1. Verify environment variables are set in Vercel/deployment platform
2. Check that production env vars match local `.env` exactly
3. Redeploy after setting environment variables
4. Check deployment logs for configuration errors

### Issue: Images upload but to wrong folder

**Solution:**
1. Update `CLOUDINARY_FOLDER` in `.env`
2. Or set folder in Cloudinary preset settings
3. Restart server
4. Clear browser cache and try again

## Security Best Practices

### ✅ DO:
- Use **unsigned upload preset** for frontend uploads
- Set reasonable **file size limits** in Cloudinary preset (e.g., 10MB)
- Configure **allowed formats** in preset (e.g., jpg, png only)
- Keep API Secret secure (never commit to Git)
- Use different folders for different environments (dev/staging/prod)

### ❌ DON'T:
- Don't commit `.env` file to Git (use `.env.example` instead)
- Don't use signed uploads in frontend (exposes API Secret)
- Don't hardcode Cloudinary credentials in frontend code
- Don't allow unlimited file sizes or formats

## Advanced Configuration

### Custom Folder Structure

To organize uploads by date or user:

```env
CLOUDINARY_FOLDER=selisih_berat/{date}/{username}
```

Or configure dynamically in `src/config/cloudinary.js`.

### Upload Transformations

Configure in Cloudinary preset:
- **Resize**: Limit to 1200x1200 (saves bandwidth)
- **Quality**: Auto:good (optimizes file size)
- **Format**: Auto (converts to WebP when supported)
- **Strip metadata**: Remove EXIF data (privacy)

### Rate Limiting

Cloudinary automatically rate limits uploads. For additional protection, implement rate limiting in your backend:

```javascript
// Example: Rate limit uploads per user
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // limit each user to 50 uploads per windowMs
});

app.post('/api/entries', uploadLimiter, ...);
```

## Monitoring

### Check Upload Usage

1. Go to Cloudinary Dashboard
2. Click **Reports** → **Usage**
3. Monitor:
   - Transformations used
   - Bandwidth consumed
   - Storage used
   - Total uploads

### Set Up Alerts

1. Go to Settings → Notifications
2. Configure email alerts for:
   - Storage quota (e.g., 90% full)
   - Bandwidth quota (e.g., 90% used)
   - Transformation quota exceeded

## Additional Resources

- [Cloudinary Unsigned Upload Docs](https://cloudinary.com/documentation/upload_images#unsigned_upload)
- [Upload Presets Guide](https://cloudinary.com/documentation/upload_presets)
- [Upload Widget (Alternative)](https://cloudinary.com/documentation/upload_widget)
- [Security Best Practices](https://cloudinary.com/documentation/security)

## Summary Checklist

- [ ] Created unsigned upload preset in Cloudinary dashboard
- [ ] Verified preset mode is **Unsigned**
- [ ] Configured `.env` with correct values
- [ ] Tested local upload successfully
- [ ] Verified images appear in Cloudinary Media Library
- [ ] Set production environment variables (if deploying)
- [ ] Tested production upload (if deployed)
- [ ] Configured file size and format restrictions
- [ ] Set up usage monitoring and alerts

## Next Steps

After completing Cloudinary setup:
1. ✅ Test uploading various image formats
2. ✅ Verify images display correctly in the application
3. ✅ Monitor upload performance and errors
4. ✅ Set up backup/export strategy for images
5. ✅ Configure CDN caching for better performance

---

🎉 **Cloudinary unsigned upload is now configured and ready to use!**

For additional help, check the [main project README](../readme.md) or open an issue on GitHub.
