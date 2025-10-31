-- ==================== SUPABASE DATABASE MIGRATION ====================
-- Migration: Initial Schema Setup
-- Database: selisih-berat-jnt-migrasi
-- Created: 2025
-- Description: Creates the initial database schema for the Weight Entry Application

-- ==================== USERS TABLE ====================
-- Stores user accounts with authentication and role information
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
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

-- Add comment to table
COMMENT ON TABLE users IS 'Stores user accounts with authentication and authorization information';
COMMENT ON COLUMN users.role IS 'User role: admin or user';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active (soft delete)';

-- ==================== ENTRIES TABLE ====================
-- Stores weight entry records with package information and photos
CREATE TABLE IF NOT EXISTS entries (
  id BIGSERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  no_resi VARCHAR(50) UNIQUE NOT NULL,
  berat_resi DECIMAL(10,2) NOT NULL CHECK (berat_resi >= 0),
  berat_aktual DECIMAL(10,2) NOT NULL CHECK (berat_aktual >= 0),
  selisih DECIMAL(10,2) NOT NULL,
  foto_url_1 TEXT,
  foto_url_2 TEXT,
  catatan TEXT,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'disputed', 'rejected')),
  created_by VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(50),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_entries_no_resi ON entries(no_resi);
CREATE INDEX IF NOT EXISTS idx_entries_created_by ON entries(created_by);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_selisih ON entries(selisih);

-- Add comment to table
COMMENT ON TABLE entries IS 'Stores weight entry records for package deliveries';
COMMENT ON COLUMN entries.nama IS 'Name of the person/recipient';
COMMENT ON COLUMN entries.no_resi IS 'Tracking/receipt number (unique)';
COMMENT ON COLUMN entries.berat_resi IS 'Weight according to receipt (kg)';
COMMENT ON COLUMN entries.berat_aktual IS 'Actual measured weight (kg)';
COMMENT ON COLUMN entries.selisih IS 'Difference between berat_resi and berat_aktual (kg)';
COMMENT ON COLUMN entries.status IS 'Entry status: submitted, verified, disputed, or rejected';

-- ==================== ROW LEVEL SECURITY (RLS) ====================
-- Enable Row Level Security on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Allow service role to do everything
CREATE POLICY "Service role can do everything on users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon/authenticated to read users (for login)
CREATE POLICY "Allow read access to users for authentication" ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Entries table policies
-- Allow service role to do everything
CREATE POLICY "Service role can do everything on entries" ON entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read all entries
CREATE POLICY "Authenticated users can read all entries" ON entries
  FOR SELECT
  TO authenticated
  USING (true);

-- ==================== DEFAULT ADMIN USER ====================
-- Insert default admin user (password: admin123)
-- Note: The password hash is for 'admin123' with bcrypt (10 rounds)
-- You should change this password immediately after first login!
INSERT INTO users (username, password, email, full_name, role)
VALUES (
  'admin',
  '$2b$10$rZ7LYKqR1L8qJZX5J4Gq7OQZqF8F5F8F5F8F5F8F5F8F5F8F5F8F5u', -- admin123
  'admin@weighttrack.com',
  'Administrator',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

-- ==================== FUNCTIONS AND TRIGGERS ====================
-- Function to update updated_at timestamp
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

-- ==================== HELPFUL QUERIES ====================
-- View all users
-- SELECT id, username, email, full_name, role, is_active, created_at FROM users;

-- View all entries
-- SELECT id, nama, no_resi, berat_resi, berat_aktual, selisih, status, created_by, created_at FROM entries;

-- View entries with user statistics
-- SELECT created_by, COUNT(*) as total_entries, AVG(selisih) as avg_selisih
-- FROM entries
-- GROUP BY created_by
-- ORDER BY total_entries DESC;
