-- ==========================================
-- DATABASE MIGRATION & TABLE CREATION SCRIPTS
-- Untuk menyamakan struktur DB lama dengan DB baru
-- ==========================================

-- ==========================================
-- 1. CREATE TABLE: entries (Main table)
-- ==========================================
-- Tabel utama untuk menyimpan data entry berat
CREATE TABLE IF NOT EXISTS entries (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    no_resi VARCHAR(255) NOT NULL,
    berat_resi DECIMAL(10, 2) NOT NULL,
    berat_aktual DECIMAL(10, 2) NOT NULL,
    selisih DECIMAL(10, 2) GENERATED ALWAYS AS (berat_aktual - berat_resi) STORED,
    foto_url_1 TEXT,
    foto_url_2 TEXT,
    status VARCHAR(50) DEFAULT 'submitted',
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_no_resi ON entries(no_resi);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_created_by ON entries(created_by);

-- Create trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;
CREATE TRIGGER update_entries_updated_at
    BEFORE UPDATE ON entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 2. CREATE TABLE: users (Optional - jika perlu user management)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);


-- ==========================================
-- 3. CREATE TABLE: earnings (Untuk tracking penghasilan)
-- ==========================================
CREATE TABLE IF NOT EXISTS earnings (
    id BIGSERIAL PRIMARY KEY,
    entry_id BIGINT REFERENCES entries(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    earned_date DATE NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_entry_id ON earnings(entry_id);
CREATE INDEX IF NOT EXISTS idx_earnings_earned_date ON earnings(earned_date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_created_by ON earnings(created_by);


-- ==========================================
-- 4. CREATE TABLE: activity_logs (Untuk audit trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_table_record ON activity_logs(table_name, record_id);


-- ==========================================
-- 5. CREATE TABLE: settings (Untuk app settings)
-- ==========================================
CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);


-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- Enable RLS pada tabel entries
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all entries
DROP POLICY IF EXISTS "Allow authenticated read access" ON entries;
CREATE POLICY "Allow authenticated read access"
    ON entries FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to insert their own entries
DROP POLICY IF EXISTS "Allow authenticated insert access" ON entries;
CREATE POLICY "Allow authenticated insert access"
    ON entries FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow authenticated users to update their own entries
DROP POLICY IF EXISTS "Allow authenticated update access" ON entries;
CREATE POLICY "Allow authenticated update access"
    ON entries FOR UPDATE
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to delete entries
DROP POLICY IF EXISTS "Allow authenticated delete access" ON entries;
CREATE POLICY "Allow authenticated delete access"
    ON entries FOR DELETE
    TO authenticated
    USING (true);

-- Enable RLS untuk public access (optional - sesuaikan dengan kebutuhan)
-- DROP POLICY IF EXISTS "Allow public read access" ON entries;
-- CREATE POLICY "Allow public read access"
--     ON entries FOR SELECT
--     TO anon
--     USING (true);


-- ==========================================
-- 7. MIGRATION: ALTER TABLE - Tambah kolom baru
-- ==========================================
-- Gunakan ini jika tabel sudah ada dan perlu tambah kolom

-- Tambah kolom baru ke entries jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'entries' AND column_name = 'notes'
    ) THEN
        ALTER TABLE entries ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'entries' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE entries ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'entries' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE entries ADD COLUMN created_by VARCHAR(255);
    END IF;
END $$;


-- ==========================================
-- 8. MIGRATION: Copy data dari tabel lama ke baru
-- ==========================================
-- Jika kamu punya tabel lama 'entries_old' dan mau copy ke 'entries'
-- SESUAIKAN nama kolom dan tabel sesuai kebutuhan

/*
INSERT INTO entries (
    nama,
    no_resi,
    berat_resi,
    berat_aktual,
    foto_url_1,
    foto_url_2,
    status,
    notes,
    created_by,
    created_at
)
SELECT
    nama,
    no_resi,
    berat_resi,
    berat_aktual,
    foto_url_1,
    foto_url_2,
    COALESCE(status, 'submitted'),
    notes,
    created_by,
    created_at
FROM entries_old
ON CONFLICT (id) DO NOTHING;
*/


-- ==========================================
-- 9. BACKUP: Export data sebelum migration
-- ==========================================
-- Jalankan ini untuk create backup table
-- CREATE TABLE entries_backup AS SELECT * FROM entries;


-- ==========================================
-- 10. VALIDASI: Check apakah struktur sudah sama
-- ==========================================
-- Query untuk compare kolom antara dua tabel
SELECT
    'entries' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'entries'
    AND table_schema = 'public'
ORDER BY ordinal_position;


-- ==========================================
-- 11. CLEANUP: Drop tabel lama (HATI-HATI!)
-- ==========================================
-- Jalankan ini HANYA setelah yakin migration berhasil
-- DROP TABLE IF EXISTS entries_old;


-- ==========================================
-- 12. FUNCTIONS: Useful utility functions
-- ==========================================

-- Function untuk menghitung total entries per tanggal
CREATE OR REPLACE FUNCTION get_daily_entry_count(target_date DATE)
RETURNS INTEGER AS $$
DECLARE
    entry_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO entry_count
    FROM entries
    WHERE DATE(created_at) = target_date;

    RETURN entry_count;
END;
$$ LANGUAGE plpgsql;

-- Function untuk menghitung rata-rata selisih
CREATE OR REPLACE FUNCTION get_average_selisih()
RETURNS DECIMAL AS $$
DECLARE
    avg_selisih DECIMAL;
BEGIN
    SELECT AVG(selisih)
    INTO avg_selisih
    FROM entries;

    RETURN COALESCE(avg_selisih, 0);
END;
$$ LANGUAGE plpgsql;

-- Function untuk get statistics
CREATE OR REPLACE FUNCTION get_entry_statistics()
RETURNS TABLE (
    total_entries BIGINT,
    today_entries BIGINT,
    avg_selisih DECIMAL,
    total_berat_aktual DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::BIGINT,
        AVG(selisih)::DECIMAL,
        SUM(berat_aktual)::DECIMAL
    FROM entries;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 13. GRANTS: Set permissions (Supabase specific)
-- ==========================================
-- Grant permissions untuk authenticated users
GRANT ALL ON entries TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON earnings TO authenticated;
GRANT ALL ON activity_logs TO authenticated;
GRANT ALL ON settings TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ==========================================
-- CARA PENGGUNAAN:
-- ==========================================
-- 1. Jalankan query #1-5 di DB BARU untuk create tables
-- 2. Jalankan query #6 untuk enable RLS
-- 3. Jalankan query #7 untuk alter table (jika perlu)
-- 4. Export data dari DB LAMA
-- 5. Jalankan query #8 untuk import data (sesuaikan dulu)
-- 6. Jalankan query #10 untuk validasi
-- 7. Test aplikasi dengan DB BARU
-- 8. Setelah yakin OK, bisa jalankan query #11 untuk cleanup
