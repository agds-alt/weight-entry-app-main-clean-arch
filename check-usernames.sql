-- ================================================
-- USERNAME DIAGNOSTIC QUERIES
-- Run these in your Supabase SQL Editor
-- ================================================

-- Query 1: List all usernames with their properties
-- This shows which usernames might have issues
SELECT
    id,
    username,
    LENGTH(username) as username_length,
    full_name,
    is_active,
    CASE
        WHEN username != LOWER(username) THEN '⚠️ Has uppercase'
        WHEN username != TRIM(username) THEN '⚠️ Has extra whitespace'
        WHEN username LIKE '% %' THEN 'ℹ️ Contains space (OK)'
        ELSE '✅ OK'
    END as status
FROM users
ORDER BY username;

-- Query 2: Find users with potential login issues
-- These users might not be able to login
SELECT
    id,
    username,
    full_name,
    is_active,
    CASE
        WHEN username != LOWER(username) THEN 'Uppercase letters'
        WHEN username != TRIM(username) THEN 'Extra whitespace'
        WHEN NOT is_active THEN 'Account inactive'
    END as issue
FROM users
WHERE
    username != LOWER(username)
    OR username != TRIM(username)
    OR NOT is_active;

-- Query 3: Test specific username lookup (like login does)
-- Replace 'faizal al' with the username you're testing
SELECT
    id,
    username,
    full_name,
    is_active,
    CASE
        WHEN is_active THEN '✅ Active - check password'
        ELSE '❌ INACTIVE - activate user first'
    END as login_status
FROM users
WHERE LOWER(username) = LOWER('faizal al');

-- Query 4: FIX - Normalize all usernames to lowercase and trimmed
-- CAUTION: This will permanently change usernames!
-- Uncomment and run ONLY if you want to apply the fix
/*
UPDATE users
SET username = LOWER(TRIM(username))
WHERE username != LOWER(TRIM(username));
*/

-- Query 5: Activate a specific user (if they're inactive)
-- Replace 'faizal al' with the username
-- Uncomment to run
/*
UPDATE users
SET is_active = true
WHERE LOWER(username) = LOWER('faizal al');
*/
