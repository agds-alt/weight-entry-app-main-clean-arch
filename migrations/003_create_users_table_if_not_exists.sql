-- ==========================================
-- MIGRATION: Create users table if it doesn't exist
-- ==========================================
-- SAFE FOR PRODUCTION - Only creates table if it doesn't exist
-- Use this if your database doesn't have a users table yet
-- ==========================================

BEGIN;

-- ==========================================
-- Create users table with complete schema
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Add comments
COMMENT ON TABLE users IS 'Stores user accounts with authentication and authorization information';
COMMENT ON COLUMN users.role IS 'User role: admin or user';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active (soft delete)';

-- ==========================================
-- Create default admin user
-- ==========================================

-- Default admin credentials:
-- Username: admin
-- Password: admin123
-- Email: admin@weighttrack.com
--
-- IMPORTANT: Change these credentials immediately after first login!

INSERT INTO users (username, password, email, full_name, role)
VALUES (
  'admin',
  '$2b$10$iVb.rRQreNH8vTD8NE428exJ/CvWsei4jMTjMZzshfEyzPa7vlC1a', -- admin123
  'admin@weighttrack.com',
  'Administrator',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

-- ==========================================
-- Enable Row Level Security (RLS)
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
DROP POLICY IF EXISTS "Service role can do everything on users" ON users;
CREATE POLICY "Service role can do everything on users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon/authenticated to read users (for login)
DROP POLICY IF EXISTS "Allow read access to users for authentication" ON users;
CREATE POLICY "Allow read access to users for authentication" ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ==========================================
-- Create trigger for updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- ==========================================
-- Validation
-- ==========================================

DO $$
DECLARE
    table_exists BOOLEAN;
    admin_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
    ) INTO table_exists;

    IF table_exists THEN
        SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';

        RAISE NOTICE '===========================================';
        RAISE NOTICE 'USERS TABLE CREATED SUCCESSFULLY';
        RAISE NOTICE '===========================================';
        RAISE NOTICE 'Table: users';
        RAISE NOTICE 'Admin accounts: %', admin_count;
        RAISE NOTICE '===========================================';
        RAISE NOTICE 'DEFAULT ADMIN CREDENTIALS:';
        RAISE NOTICE 'Username: admin';
        RAISE NOTICE 'Password: admin123';
        RAISE NOTICE 'Email: admin@weighttrack.com';
        RAISE NOTICE '===========================================';
        RAISE NOTICE 'IMPORTANT: Change admin password immediately!';
        RAISE NOTICE '===========================================';
    END IF;
END $$;

COMMIT;
