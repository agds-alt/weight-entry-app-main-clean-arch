-- ==========================================
-- MIGRATION: Add username and password to existing users table
-- ==========================================
-- SAFE FOR PRODUCTION - This will NOT delete any existing data
-- This migration adds username, password, is_active, and last_login columns
-- to an existing users table that only has email
-- ==========================================

-- ==========================================
-- BACKUP REMINDER
-- ==========================================
-- BEFORE RUNNING THIS MIGRATION:
-- 1. Create backup: CREATE TABLE users_backup AS SELECT * FROM users;
-- 2. Test on staging environment first
-- 3. Run during low-traffic period
-- ==========================================

BEGIN;

-- ==========================================
-- STEP 1: Add new columns (if they don't exist)
-- ==========================================

-- Add username column (will be generated from email)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(50);
        RAISE NOTICE 'Column username added';
    ELSE
        RAISE NOTICE 'Column username already exists, skipping';
    END IF;
END $$;

-- Add password column (will use default password initially)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password VARCHAR(255);
        RAISE NOTICE 'Column password added';
    ELSE
        RAISE NOTICE 'Column password already exists, skipping';
    END IF;
END $$;

-- Add is_active column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Column is_active added';
    ELSE
        RAISE NOTICE 'Column is_active already exists, skipping';
    END IF;
END $$;

-- Add last_login column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Column last_login added';
    ELSE
        RAISE NOTICE 'Column last_login already exists, skipping';
    END IF;
END $$;

-- ==========================================
-- STEP 2: Generate username from email for existing users
-- ==========================================

-- Generate username from email (take part before @)
-- Example: john.doe@example.com -> john.doe
UPDATE users
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL;

-- Handle duplicate usernames by adding numbers
-- This ensures all usernames are unique
DO $$
DECLARE
    r RECORD;
    new_username VARCHAR(50);
    counter INTEGER;
BEGIN
    -- Find duplicate usernames
    FOR r IN
        SELECT username, COUNT(*) as count
        FROM users
        WHERE username IS NOT NULL
        GROUP BY username
        HAVING COUNT(*) > 1
    LOOP
        counter := 1;
        -- For each duplicate, add a number suffix
        FOR r IN
            SELECT id, username, email
            FROM users
            WHERE username = r.username
            ORDER BY created_at
            OFFSET 1  -- Skip the first one
        LOOP
            new_username := r.username || counter;

            -- Make sure new username doesn't exist
            WHILE EXISTS (SELECT 1 FROM users WHERE username = new_username) LOOP
                counter := counter + 1;
                new_username := r.username || counter;
            END LOOP;

            UPDATE users SET username = new_username WHERE id = r.id;
            counter := counter + 1;

            RAISE NOTICE 'Updated duplicate username: % -> %', r.username, new_username;
        END LOOP;
    END LOOP;
END $$;

-- ==========================================
-- STEP 3: Set default password for existing users
-- ==========================================

-- Default password: "ChangeMe123!" (hashed with bcrypt, 10 rounds)
-- Users MUST change this password on first login
-- Hash generated with: bcrypt.hash('ChangeMe123!', 10)
UPDATE users
SET password = '$2b$10$a2XBYXFnWXrSBG3HWNAhSumU1MzzfPLnlIvdOYN47n5uivxZsIPta'
WHERE password IS NULL;

-- ==========================================
-- STEP 4: Set is_active to true for all existing users
-- ==========================================

UPDATE users
SET is_active = true
WHERE is_active IS NULL;

-- ==========================================
-- STEP 5: Add constraints
-- ==========================================

-- Make username NOT NULL and UNIQUE
ALTER TABLE users
    ALTER COLUMN username SET NOT NULL;

-- Add unique constraint on username
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
        RAISE NOTICE 'Unique constraint added on username';
    ELSE
        RAISE NOTICE 'Unique constraint on username already exists';
    END IF;
END $$;

-- Make password NOT NULL
ALTER TABLE users
    ALTER COLUMN password SET NOT NULL;

-- ==========================================
-- STEP 6: Create indexes for performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- ==========================================
-- STEP 7: Update role constraint if needed
-- ==========================================

-- Drop old constraint if exists and recreate with proper values
DO $$
BEGIN
    -- Check if role column has old constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        -- Drop existing constraint (name might vary)
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    END IF;

    -- Add new constraint
    ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('admin', 'user'));

    RAISE NOTICE 'Role constraint updated';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Role constraint already exists, skipping';
END $$;

-- ==========================================
-- STEP 8: Validation and Summary
-- ==========================================

DO $$
DECLARE
    total_users INTEGER;
    users_with_username INTEGER;
    users_with_password INTEGER;
    users_active INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO users_with_username FROM users WHERE username IS NOT NULL;
    SELECT COUNT(*) INTO users_with_password FROM users WHERE password IS NOT NULL;
    SELECT COUNT(*) INTO users_active FROM users WHERE is_active = true;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'MIGRATION SUMMARY:';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Users with username: %', users_with_username;
    RAISE NOTICE 'Users with password: %', users_with_password;
    RAISE NOTICE 'Active users: %', users_active;
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'DEFAULT PASSWORD: ChangeMe123!';
    RAISE NOTICE 'All existing users should change their password!';
    RAISE NOTICE '===========================================';
END $$;

-- View updated table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
    AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;

-- ==========================================
-- ROLLBACK PLAN (if something goes wrong)
-- ==========================================
-- If you need to rollback:
--
-- BEGIN;
-- ALTER TABLE users DROP COLUMN IF EXISTS username;
-- ALTER TABLE users DROP COLUMN IF EXISTS password;
-- ALTER TABLE users DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_login;
--
-- -- Restore from backup if needed:
-- -- TRUNCATE users;
-- -- INSERT INTO users SELECT * FROM users_backup;
-- COMMIT;
-- ==========================================
