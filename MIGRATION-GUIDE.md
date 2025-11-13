# 🔧 MIGRATION GUIDE: Adding Username/Password to Users Table

## ⚠️ IMPORTANT - READ THIS FIRST

This guide helps you safely migrate your **production database** that has 20K entries from the old schema (without username/password) to the new schema (with username/password).

**DO NOT rush this migration!** Follow each step carefully.

---

## 🎯 Problem Identified

Your application code expects a `users` table with:
- `username` (VARCHAR)
- `password` (VARCHAR - bcrypt hashed)
- `is_active` (BOOLEAN)
- `last_login` (TIMESTAMP)

But your production database has an old schema without these columns.

---

## 📊 Pre-Migration Checklist

Before running ANY migration, complete this checklist:

- [ ] **Backup your database** (CRITICAL!)
- [ ] **Test on staging/dev environment first**
- [ ] **Check if users table exists** in your database
- [ ] **Schedule during low-traffic period**
- [ ] **Have rollback plan ready**
- [ ] **Notify your team**

---

## 🔍 Step 1: Identify Your Situation

First, check if you have a `users` table in your Supabase database:

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor**
3. Run this query:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'users'
);
```

**Result:**
- `true` → You have a users table → Go to **SCENARIO A**
- `false` → No users table → Go to **SCENARIO B**

---

## 📋 SCENARIO A: Users Table Already Exists

### What This Migration Does:
1. ✅ Adds `username`, `password`, `is_active`, `last_login` columns
2. ✅ Generates username from existing email addresses
3. ✅ Sets default password that users must change
4. ✅ Keeps ALL existing data intact (20K entries safe!)
5. ✅ Handles duplicate usernames automatically

### Steps:

#### 1. Create Backup (MANDATORY!)

```sql
-- In Supabase SQL Editor:
CREATE TABLE users_backup AS SELECT * FROM users;

-- Verify backup
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM users_backup;
-- These two numbers should match!
```

#### 2. Check Current User Data

```sql
-- See what data you have
SELECT id, email, full_name, role, created_at
FROM users
LIMIT 10;

-- Count total users
SELECT COUNT(*) as total_users FROM users;
```

#### 3. Run Migration Script

Copy the entire contents of:
```
migrations/002_add_username_password_to_users.sql
```

**BEFORE RUNNING:**
1. **Read the script** - understand what it does
2. **Update password hash** - see "Setting Default Password" section below
3. **Test on staging first** - if you have a staging environment

**To Run:**
1. Go to **Supabase Dashboard** → SQL Editor
2. Paste the migration script
3. Click **Run**
4. Watch for NOTICE messages - they show progress

#### 4. Verify Migration Success

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Verify all users have username and password
SELECT
  COUNT(*) as total,
  COUNT(username) as with_username,
  COUNT(password) as with_password,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active
FROM users;

-- See sample data
SELECT id, username, email, full_name, role, is_active
FROM users
LIMIT 10;
```

#### 5. Test Login

**Default Password for All Migrated Users:** `ChangeMe123!`

Try logging in with:
- **Username:** (generated from email, e.g., `john.doe` from `john.doe@example.com`)
- **Password:** `ChangeMe123!`

#### 6. Notify Users

Send email to all users:
```
Subject: Action Required - Reset Your Password

Your account has been migrated to our new system.
Your username is: [username from email]
Your temporary password is: ChangeMe123!

Please login and change your password immediately!
```

---

## 📋 SCENARIO B: Users Table Does NOT Exist

### What This Migration Does:
1. ✅ Creates new `users` table with correct schema
2. ✅ Creates default admin account
3. ✅ Sets up Row Level Security (RLS)
4. ✅ Creates necessary indexes

### Steps:

#### 1. Run Creation Script

Copy the entire contents of:
```
migrations/003_create_users_table_if_not_exists.sql
```

**To Run:**
1. Go to **Supabase Dashboard** → SQL Editor
2. Paste the script
3. Click **Run**

#### 2. Verify Table Created

```sql
-- Check table exists
SELECT * FROM users;

-- Should see 1 admin user
```

#### 3. Test Admin Login

**Default Admin Credentials:**
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@weighttrack.com`

**⚠️ CHANGE THIS PASSWORD IMMEDIATELY!**

#### 4. Create User Accounts

For your existing 20K entries, you need to identify who created them:

```sql
-- Check who created entries
SELECT DISTINCT created_by, COUNT(*) as entry_count
FROM entries
GROUP BY created_by
ORDER BY entry_count DESC;
```

Then create user accounts for each `created_by`:

```sql
-- Example: Create user for each creator
-- (You'll need to do this for each unique created_by)

-- First, install bcryptjs and generate password hash:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('InitialPass123', 10).then(hash => console.log(hash));"

INSERT INTO users (username, password, email, full_name, role)
VALUES
  ('user1', '$2b$10$[hash_here]', 'user1@example.com', 'User One', 'user'),
  ('user2', '$2b$10$[hash_here]', 'user2@example.com', 'User Two', 'user');
```

---

## 🔐 Setting Default Password

The migration scripts use a default password. **You should generate a secure hash:**

### Generate Password Hash:

```bash
# In your project directory:
npm install bcryptjs

# Generate hash for "ChangeMe123!"
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('ChangeMe123!', 10).then(hash => console.log(hash));"
```

**Then update the migration SQL file:**

Find this line in `002_add_username_password_to_users.sql`:
```sql
SET password = '$2b$10$rGKJ5YXxKZqF5F8F5F8F5.eHZQZqF5F8F5F8F5F8F5F8F5F8F5F8F5e'
```

Replace with your generated hash.

---

## 🔄 Rollback Plan (If Something Goes Wrong)

### If Migration Fails:

```sql
BEGIN;

-- Remove added columns
ALTER TABLE users DROP COLUMN IF EXISTS username;
ALTER TABLE users DROP COLUMN IF EXISTS password;
ALTER TABLE users DROP COLUMN IF EXISTS is_active;
ALTER TABLE users DROP COLUMN IF EXISTS last_login;

COMMIT;
```

### If Data Gets Corrupted:

```sql
BEGIN;

-- Clear users table
TRUNCATE users;

-- Restore from backup
INSERT INTO users SELECT * FROM users_backup;

-- Verify
SELECT COUNT(*) FROM users;

COMMIT;
```

---

## ✅ Post-Migration Tasks

After successful migration:

1. **Test Login**
   - Try logging in as admin
   - Try logging in as regular user
   - Verify password change works

2. **Update Application**
   - Make sure `.env` has correct database credentials
   - Restart your application server
   - Test all auth flows

3. **Monitor Errors**
   - Check server logs for authentication errors
   - Monitor Supabase logs
   - Watch for failed login attempts

4. **Clean Up**
   - After 1 week of stable operation:
   ```sql
   DROP TABLE IF EXISTS users_backup;
   ```

5. **Security**
   - Force all users to change password
   - Implement password reset flow
   - Enable 2FA (optional)

---

## 🐛 Troubleshooting

### Issue: "Column 'username' does not exist"

**Solution:** Migration didn't run completely. Check Supabase SQL logs for errors.

### Issue: "Duplicate key violation on username"

**Solution:** Two users have same email prefix. The migration handles this automatically, but check:
```sql
SELECT username, COUNT(*)
FROM users
GROUP BY username
HAVING COUNT(*) > 1;
```

### Issue: Users can't login after migration

**Checklist:**
- [ ] Verify `username` column exists and is populated
- [ ] Verify `password` column has hashed passwords (should start with `$2b$`)
- [ ] Verify `is_active` is `true`
- [ ] Check application `.env` has correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- [ ] Check JWT_SECRET is set in `.env`

### Issue: Password hash is invalid

**Solution:** Regenerate password hash:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword', 10).then(console.log);"
```

---

## 📞 Support

If you encounter issues:

1. **Check Logs:**
   - Supabase Dashboard → Logs
   - Your application server logs
   - Browser console (for client-side errors)

2. **Verify Database State:**
   ```sql
   -- See full table structure
   \d users

   -- Or:
   SELECT * FROM information_schema.columns
   WHERE table_name = 'users';
   ```

3. **Test Query:**
   ```sql
   -- Test if login query works
   SELECT id, username, password, email, is_active
   FROM users
   WHERE username = 'admin';
   ```

---

## 📝 Summary

### For SCENARIO A (Table Exists):
1. ✅ Backup database
2. ✅ Run `002_add_username_password_to_users.sql`
3. ✅ Verify migration
4. ✅ Test login
5. ✅ Notify users

### For SCENARIO B (No Table):
1. ✅ Run `003_create_users_table_if_not_exists.sql`
2. ✅ Create user accounts
3. ✅ Test login
4. ✅ Start using application

---

## ⏰ Recommended Migration Timeline

1. **Day 0 (Today):** Read this guide, understand the migration
2. **Day 1:** Test migration on staging/dev environment
3. **Day 2:** Schedule production migration window
4. **Day 3:** Execute migration during low-traffic period
5. **Day 3-4:** Monitor for issues, support users
6. **Day 7+:** Clean up backup tables

---

**Good luck with your migration! 🚀**

If you need help, review the error messages carefully - they often tell you exactly what went wrong.
