-- ==================== MIGRATION: Adjust Old Database Schema ====================
-- Purpose: Add missing columns to old database to match new code
-- Database: rwxgpbikdxlialoegghq (old production database with 18k+ entries)
-- Run this in: Supabase SQL Editor
-- URL: https://app.supabase.com/project/rwxgpbikdxlialoegghq/sql/new

-- ==================== USERS TABLE - Add Missing Columns ====================

-- Add email column
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- Add full_name column
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- Add is_active column (default true for existing users)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add last_login column
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Add updated_at column
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

COMMENT ON COLUMN users.email IS 'User email address (added for new features)';
COMMENT ON COLUMN users.full_name IS 'User full name (added for new features)';
COMMENT ON COLUMN users.is_active IS 'Whether user account is active (soft delete)';
COMMENT ON COLUMN users.last_login IS 'Last login timestamp';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp';

-- ==================== ENTRIES TABLE - Add Missing Columns ====================

-- Add catatan column (alternative to notes)
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS catatan TEXT;

-- Add updated_by column
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);

-- Migrate existing data from notes to catatan
UPDATE entries
SET catatan = notes
WHERE catatan IS NULL AND notes IS NOT NULL;

COMMENT ON COLUMN entries.catatan IS 'Notes/catatan for the entry (migrated from notes field)';
COMMENT ON COLUMN entries.updated_by IS 'Username who last updated this entry';

-- ==================== TRIGGERS - Auto-update timestamps ====================

-- Function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for entries table
DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== VERIFICATION ====================

-- Verify users table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Verify entries table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'entries'
ORDER BY ordinal_position;

-- Show summary
SELECT
  'users' as table_name,
  COUNT(*) as total_rows,
  COUNT(email) as rows_with_email,
  COUNT(full_name) as rows_with_fullname
FROM users
UNION ALL
SELECT
  'entries' as table_name,
  COUNT(*) as total_rows,
  COUNT(catatan) as rows_with_catatan,
  COUNT(updated_by) as rows_with_updatedby
FROM entries;

-- ==================== NOTES ====================
-- After running this migration:
-- 1. All existing 18k+ entries are preserved
-- 2. All 19 users remain active (is_active = true by default)
-- 3. notes field data is copied to catatan field
-- 4. Future updates will use catatan field
-- 5. No data loss, only schema additions
-- 6. Code can now use new fields without errors
