-- ================================================
-- IMMEDIATE FIX for Current Login Issues
-- Copy and paste these commands into Supabase SQL Editor
-- ================================================

-- Step 1: Check current usernames and identify conflicts
SELECT
    id,
    username,
    LOWER(username) as normalized,
    full_name,
    email,
    is_active,
    created_at
FROM users
ORDER BY LOWER(username), created_at;

-- Step 2: Fix "Faizal al" → "faizal al" (ID 21)
-- This will allow the user to login immediately
UPDATE users
SET username = 'faizal al'
WHERE id = 21;

-- Step 3: Check for "dani" conflict
-- This will show you all users with "dani" (case-insensitive)
SELECT
    id,
    username,
    full_name,
    email,
    is_active,
    created_at,
    last_login
FROM users
WHERE LOWER(username) = 'dani'
ORDER BY created_at;

-- Step 4: Resolve "dani" conflict
-- Option A: If one account is the main one, rename the duplicate
-- Uncomment the appropriate line after checking which is which:

-- If ID X is the duplicate, rename it to "dani2"
-- UPDATE users SET username = 'dani2' WHERE id = X;

-- OR Option B: Keep the older account, rename the newer one
-- UPDATE users SET username = 'dani2' WHERE LOWER(username) = 'dani' AND id != (SELECT MIN(id) FROM users WHERE LOWER(username) = 'dani');

-- Step 5: After resolving conflicts, normalize ALL remaining usernames
-- This is SAFE to run after fixing conflicts above
UPDATE users
SET username = LOWER(TRIM(REGEXP_REPLACE(username, '\s+', ' ', 'g')))
WHERE username != LOWER(TRIM(REGEXP_REPLACE(username, '\s+', ' ', 'g')));

-- Step 6: Verify all usernames are normalized
SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN username = LOWER(TRIM(username)) THEN 1 END) as normalized_users,
    COUNT(CASE WHEN username != LOWER(TRIM(username)) THEN 1 END) as still_needs_fix
FROM users;

-- Step 7: Check final result
SELECT
    id,
    username,
    full_name,
    is_active,
    '✅ Normalized' as status
FROM users
ORDER BY username;
