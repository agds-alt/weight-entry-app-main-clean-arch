# Migration Guide: Using Old Production Database

This guide explains how to use the existing production database (rwxgpbikdxlialoegghq) with the new codebase.

## Why Use Old Database?

- ✅ **18,094 existing entries** preserved
- ✅ **19 active users** no need to re-register
- ✅ **Zero data loss**
- ✅ **No migration of data needed**
- ✅ **Production continues working**

## What We're Doing:

**Strategy:** Add missing columns to old database (not modify code!)

The old database has:
- `users`: id, username, password, role, security_question, security_answer, created_at
- `entries`: id, nama, no_resi, berat_resi, berat_aktual, selisih, foto_url_1, foto_url_2, status, notes, created_by, created_at, updated_at
- `audit_logs`: id, user_id, action, resource, details, timestamp

The new code expects additional columns:
- `users`: + email, full_name, is_active, last_login, updated_at
- `entries`: + catatan (alternative to notes), updated_by

## Step 1: Run Migration SQL

### 1.1 Open Supabase SQL Editor

**For old database (rwxgpbikdxlialoegghq):**

https://app.supabase.com/project/rwxgpbikdxlialoegghq/sql/new

### 1.2 Run Migration Script

Copy and paste the entire content of:
```
migrations/002_adjust_old_database.sql
```

Click **"Run"** button.

### 1.3 Verify Migration

The script will output a summary table showing:
- Total rows in each table
- How many rows have the new columns

Example output:
```
| table_name | total_rows | rows_with_email | rows_with_fullname |
|------------|------------|-----------------|-------------------|
| users      | 19         | 0               | 0                 |
| entries    | 18094      | 18094           | 0                 |
```

**Note:** Existing users won't have email/full_name (they're NULL), but new registrations will save them.

## Step 2: Update Environment Variables

### 2.1 Local Development (.env)

Create `.env` file:

```env
# ==================== SERVER CONFIGURATION ====================
NODE_ENV=development
PORT=3000

# ==================== SESSION CONFIGURATION ====================
SESSION_SECRET=30365625bf625e25426c3a7a9edb5df5d0f2554e62bd6fb555638238bb1f15fe

# ==================== SUPABASE CONFIGURATION ====================
# Old production database (rwxgpbikdxlialoegghq) - 18k+ entries
SUPABASE_URL=https://rwxgpbikdxlialoegghq.supabase.co
SUPABASE_ANON_KEY=<GET_FROM_SUPABASE_DASHBOARD>
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eGdwYmlrZHhsaWFsb2VnZ2hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5NDA0NSwiZXhwIjoyMDc1MTcwMDQ1fQ.k0SbbEdo3Z4ko_eFVk9TIEfj0uTvaJ0t7DIEjdFWzCQ

# ==================== CLOUDINARY CONFIGURATION ====================
CLOUDINARY_CLOUD_NAME=ddzzlusek
CLOUDINARY_API_KEY=399835745611853
CLOUDINARY_API_SECRET=circPVfEcOPuEHFFedtjgwqc7R4

# ... rest of env vars ...

# ==================== JWT ====================
JWT_SECRET=f5998e9658b3029367fbdb8d4fe118862746f86c0dad0e0108fcbfd02f81dd9c5c1dea10470996f4e1164a77392a8a9f00f1f16e8d982f86f113f54edf4fd3b3
JWT_REFRESH_SECRET=30010a15ae1bbeaf394a6cfaa09d2ed1e306e46b00bfca463c733fd036a7eb739ef4d602265d623ebe24435d9ba350caa2d25efebfebd525974e34c90377a2ad
```

**Get SUPABASE_ANON_KEY:**
1. Go to: https://app.supabase.com/project/rwxgpbikdxlialoegghq/settings/api
2. Copy "anon public" key
3. Paste in .env file

### 2.2 Vercel Production (if needed)

Update Vercel environment variables:

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Update/verify:
```
SUPABASE_URL=https://rwxgpbikdxlialoegghq.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...rwxgpbikdxlialoegghq...
```

## Step 3: Test Locally

### 3.1 Start Server

```bash
npm start
```

Expected output:
```
🔄 Attempting database connection...
📍 Method: Supabase Client SDK
📍 Database: rwxgpbikdxlialoegghq (old production DB)
✅ Supabase client connected successfully!
✅ Users table ready
✅ Entries table ready
```

### 3.2 Test Functionality

**Test existing user login:**
```bash
# Open browser: http://localhost:3000
# Login with existing production user
# Should work!
```

**Test dashboard:**
```bash
# Navigate to dashboard
# Should show 18,094+ entries
```

**Test create new entry:**
```bash
# Create new entry
# Should save successfully
```

**Test register new user:**
```bash
# Register new user with email
# Email will be saved to new column
```

## Step 4: Verify Data

### 4.1 Check in Supabase Dashboard

**Table Editor:**
https://app.supabase.com/project/rwxgpbikdxlialoegghq/editor

**Verify:**
- `users` table has new columns: email, full_name, is_active, last_login, updated_at
- `entries` table has new column: catatan, updated_by
- Existing data intact (18k+ entries)
- All users have `is_active = true`

### 4.2 SQL Verification

```sql
-- Count data
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM entries) as total_entries;

-- Should return: 19 users, 18094 entries

-- Check new columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('email', 'full_name', 'is_active', 'last_login', 'updated_at');

-- Should return 5 rows

-- Check entries new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'entries'
  AND column_name IN ('catatan', 'updated_by');

-- Should return 2 rows
```

## Troubleshooting

### Issue: Column already exists

**Error:** `column "email" already exists`

**Solution:** This is OK! It means columns were already added. Skip to Step 2.

### Issue: Can't connect to database

**Error:** `Supabase connection failed`

**Solution:**
1. Check `SUPABASE_URL` is correct: `rwxgpbikdxlialoegghq`
2. Check `SUPABASE_SERVICE_KEY` is for the correct project
3. Verify project is not paused in Supabase dashboard

### Issue: User login fails

**Error:** `Username atau password salah`

**Solution:**
1. Make sure you're using existing production username
2. Check database has 19 users: `SELECT COUNT(*) FROM users;`
3. Try with another production user

### Issue: Entries not showing

**Error:** Dashboard shows 0 entries

**Solution:**
1. Verify database: `SELECT COUNT(*) FROM entries;` should return 18094
2. Check `SUPABASE_URL` is pointing to correct database
3. Restart server

## Benefits After Migration

✅ **All existing data preserved** (18k+ entries, 19 users)
✅ **Code works with old database** (added missing columns)
✅ **Future features supported** (new columns available)
✅ **No downtime** (production continues working)
✅ **Backward compatible** (old data still accessible)
✅ **New fields optional** (existing users work without email)

## What Changed:

### Database Changes:
- Added 5 columns to `users` table
- Added 2 columns to `entries` table
- Added triggers for automatic `updated_at`
- Migrated `notes` → `catatan` data

### Code Changes:
- ✅ Code already expects new schema
- ✅ No code modification needed!
- ✅ Works with migrated database

## Next Steps:

1. ✅ Run migration SQL
2. ✅ Update local .env
3. ✅ Test locally
4. ✅ Verify production (if Vercel env correct)
5. ✅ Start using new features!

## Summary:

**Database:** rwxgpbikdxlialoegghq (old production)
**Data:** 18,094 entries + 19 users preserved
**Method:** Add columns to old DB (not migrate data)
**Result:** Old database now compatible with new code!

🎉 **Migration complete - all data safe!**
