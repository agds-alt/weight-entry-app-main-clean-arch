# 🚨 QUICK FIX - User Login Issue

## Problem
Users in database cannot login because the `users` table is missing required columns.

## Root Cause
- Application code expects: `username`, `password`, `is_active`, `last_login`
- Database has old schema without these columns

## Quick Solution (5 Minutes)

### Option 1: If You Have Users Table Already

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy & Paste** the entire file: `migrations/002_add_username_password_to_users.sql`
3. **Click Run**
4. **Test Login** with:
   - Username: (from email, e.g., `john` from `john@example.com`)
   - Password: `ChangeMe123!`

### Option 2: If You DON'T Have Users Table

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy & Paste** the entire file: `migrations/003_create_users_table_if_not_exists.sql`
3. **Click Run**
4. **Test Login** with:
   - Username: `admin`
   - Password: `admin123`

## Default Credentials After Migration

### For Existing Users (Option 1):
- **Username:** Generated from email (part before @)
- **Password:** `ChangeMe123!`

### For New Installation (Option 2):
- **Username:** `admin`
- **Password:** `admin123`

## Important Notes

⚠️ **BACKUP YOUR DATABASE FIRST!**
```sql
CREATE TABLE users_backup AS SELECT * FROM users;
```

✅ **Your 20K entries are SAFE** - This migration only touches the `users` table, not `entries`

🔒 **Security:** Users MUST change password after first login

## Full Documentation

For detailed migration guide, see: `MIGRATION-GUIDE.md`

## What This Fix Does

✅ Adds `username` column (generated from email)
✅ Adds `password` column (bcrypt hashed)
✅ Adds `is_active` column (default: true)
✅ Adds `last_login` column
✅ Creates indexes for performance
✅ Handles duplicate usernames automatically
✅ **DOES NOT delete or modify existing data**

## Rollback (If Needed)

```sql
-- Remove added columns
ALTER TABLE users DROP COLUMN IF EXISTS username;
ALTER TABLE users DROP COLUMN IF EXISTS password;
ALTER TABLE users DROP COLUMN IF EXISTS is_active;
ALTER TABLE users DROP COLUMN IF EXISTS last_login;

-- Or restore from backup:
TRUNCATE users;
INSERT INTO users SELECT * FROM users_backup;
```

## Still Not Working?

Check:
1. ✅ Migration ran without errors
2. ✅ Columns exist: `SELECT * FROM information_schema.columns WHERE table_name = 'users';`
3. ✅ Users have data: `SELECT username, email, is_active FROM users LIMIT 5;`
4. ✅ Application `.env` has correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
5. ✅ JWT_SECRET is set in `.env`

## Contact

If you still have issues, check error logs in:
- Supabase Dashboard → Logs
- Your application server console
- Browser developer console
