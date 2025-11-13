# Login Issue Fix: Username Normalization

## Problem Description

Some users cannot login even with the correct password. The error message shows:
```
Username atau password salah
```

## Root Cause

The issue is caused by **username case sensitivity and whitespace inconsistency** in the database:

1. **Login Process**: When users try to login, the system converts their username to lowercase (e.g., "Faizal Al" → "faizal al")
2. **Database Storage**: Some usernames may be stored with:
   - **Uppercase letters** (e.g., "Faizal Al", "FAIZAL AL")
   - **Extra whitespace** (e.g., " faizal al ", "faizal  al")
   - **Inconsistent format** from manual database entry or migration

3. **Lookup Mismatch**: The login query uses case-insensitive search (`ILIKE`), but if usernames have extra whitespace or were stored before normalization was implemented, they won't match.

## Examples of Problematic Usernames

| Stored in DB | User Types | Login Result |
|---|---|---|
| "Faizal Al" | "faizal al" | ❌ FAILS (case mismatch) |
| " faizal al " | "faizal al" | ❌ FAILS (whitespace) |
| "faizal  al" (2 spaces) | "faizal al" (1 space) | ❌ FAILS (whitespace count) |
| "faizal al" | "faizal al" | ✅ SUCCESS |

## Diagnostic Steps

### Option 1: Check via Supabase SQL Editor

1. Open your Supabase project
2. Go to **SQL Editor**
3. Run the queries from `check-usernames.sql`:

```sql
-- See all usernames and their status
SELECT
    id,
    username,
    full_name,
    is_active,
    CASE
        WHEN username != LOWER(username) THEN '⚠️ Has uppercase'
        WHEN username != TRIM(username) THEN '⚠️ Has extra whitespace'
        ELSE '✅ OK'
    END as status
FROM users
ORDER BY username;
```

### Option 2: Run Diagnostic Script

```bash
node check-users.js
```

This will show:
- All usernames in the database
- Which ones have uppercase letters
- Which ones have extra whitespace
- Recommendations for fixing them

### Option 3: Check Server Logs

With the updated `auth.service.js`, when a user tries to login, you'll see detailed logs:

```
🔐 Login attempt: {
  originalUsername: 'Faizal Al',
  normalizedUsername: 'faizal al',
  passwordProvided: true
}
❌ Login failed: User not found { searchedUsername: 'faizal al' }
```

This tells you the user is searching for "faizal al" but it's stored differently in the database.

## Fix Solutions

### Solution 1: Automatic Normalization Script (RECOMMENDED)

Run the normalization script to fix all usernames at once:

```bash
node fix-username-normalization.js
```

This script will:
1. ✅ Find all usernames with uppercase or extra whitespace
2. ✅ Check for conflicts (duplicate usernames after normalization)
3. ✅ Convert all usernames to lowercase and trim whitespace
4. ✅ Normalize multiple spaces to single spaces
5. ✅ Provide a detailed report

**Example output:**
```
Found 3 users needing normalization:

1. User ID 5:
   Original:   "Faizal Al"
   Normalized: "faizal al"
   Full Name:  Faizal Al-Rahman

✅ Updated: "Faizal Al" → "faizal al"
✅ Successfully updated: 3 users
```

### Solution 2: Manual SQL Fix

If you prefer to fix manually via Supabase SQL Editor:

```sql
-- Normalize all usernames to lowercase and trimmed
UPDATE users
SET username = LOWER(TRIM(REGEXP_REPLACE(username, '\s+', ' ', 'g')))
WHERE username != LOWER(TRIM(REGEXP_REPLACE(username, '\s+', ' ', 'g')));
```

### Solution 3: Fix Specific User

To fix a specific user who can't login:

**Via Supabase SQL Editor:**
```sql
-- Fix username for "Faizal Al"
UPDATE users
SET username = LOWER(TRIM(username))
WHERE id = [user_id];  -- Replace with actual user ID
```

**Or activate if inactive:**
```sql
UPDATE users
SET is_active = true
WHERE LOWER(username) = LOWER('faizal al');
```

## Preventing Future Issues

The codebase has been updated to automatically normalize usernames:

### 1. Registration (already implemented)
```javascript
// src/services/auth.service.js:30
username: userData.username.toLowerCase()
```

### 2. Login (already implemented)
```javascript
// src/services/auth.service.js:68
const user = await userRepository.findByUsername(username.toLowerCase());
```

### 3. Frontend Input (already implemented)
```javascript
// public/login.js:35
const username = document.getElementById('username').value.trim();
```

## Verification

After applying the fix, verify users can login:

1. Check the normalized usernames:
```bash
node check-users.js
```

2. Test login via browser console or Postman:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "faizal al", "password": "actual_password"}'
```

3. Check server logs for the detailed login flow

## Common Troubleshooting

### User still can't login after normalization

1. **Check if user is active:**
   ```sql
   SELECT username, is_active FROM users WHERE username = 'faizal al';
   ```
   If `is_active = false`, activate the user:
   ```sql
   UPDATE users SET is_active = true WHERE username = 'faizal al';
   ```

2. **Verify password:**
   - Password might be incorrect
   - Password might not be bcrypt hashed
   - Check password format:
     ```sql
     SELECT username, LEFT(password, 10) FROM users WHERE username = 'faizal al';
     ```
   - Should start with `$2b$` or `$2a$` (bcrypt format)

3. **Check for duplicate usernames:**
   ```sql
   SELECT username, COUNT(*) as count
   FROM users
   GROUP BY username
   HAVING COUNT(*) > 1;
   ```

## Summary

✅ **What was fixed:**
- Added detailed login logging to identify the exact failure point
- Created normalization script to fix existing usernames
- Created diagnostic SQL queries for quick checks
- Usernames are now consistently stored as lowercase and trimmed

✅ **What you need to do:**
1. Run `node fix-username-normalization.js` to normalize existing usernames
2. Test login for affected users
3. Monitor server logs for any remaining issues

✅ **Future prevention:**
- All new registrations automatically normalize usernames
- Login process consistently handles case-insensitive matching
- Detailed logs help identify issues quickly
