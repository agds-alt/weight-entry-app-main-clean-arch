-- ==========================================
-- DEBUG & FIX SCRIPT - Top Performer Not Showing
-- ==========================================

-- ==========================================
-- STEP 1: CHECK IF VIEWS EXIST
-- ==========================================
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('daily_top_performers', 'total_top_performers', 'user_statistics')
ORDER BY table_name;

-- Expected output:
-- daily_top_performers    VIEW
-- total_top_performers    VIEW
-- user_statistics         BASE TABLE


-- ==========================================
-- STEP 2: TEST VIEWS DIRECTLY
-- ==========================================
-- Test daily view
SELECT * FROM daily_top_performers LIMIT 5;

-- Test total view
SELECT * FROM total_top_performers LIMIT 5;

-- Jika error "relation does not exist", berarti view belum di-create
-- Solusi: Re-run SQL dari top-performer-setup.sql


-- ==========================================
-- STEP 3: CHECK RLS POLICIES
-- ==========================================
-- Check policies untuk views
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('daily_top_performers', 'total_top_performers', 'user_statistics')
ORDER BY tablename;

-- Views tidak bisa punya RLS, tapi tabel user_statistics bisa


-- ==========================================
-- STEP 4: MANUAL QUERY - Test apa data bisa diambil
-- ==========================================
-- Query manual untuk daily top performers
SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank,
    created_by as username,
    COUNT(*) as daily_entries,
    COUNT(*) * 500 as daily_earnings,
    AVG(selisih) as avg_selisih
FROM entries
WHERE DATE(created_at) = CURRENT_DATE
    AND created_by IS NOT NULL
    AND created_by != ''
GROUP BY created_by
ORDER BY daily_entries DESC
LIMIT 5;

-- Query manual untuk total top performers
SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank,
    created_by as username,
    COUNT(*) as total_entries,
    COUNT(*) * 500 as total_earnings,
    AVG(selisih) as avg_selisih
FROM entries
WHERE created_by IS NOT NULL
    AND created_by != ''
GROUP BY created_by
ORDER BY total_entries DESC
LIMIT 5;


-- ==========================================
-- STEP 5: FIX - DISABLE RLS ON user_statistics
-- ==========================================
-- Jika user_statistics table ada RLS yang blocking
ALTER TABLE user_statistics DISABLE ROW LEVEL SECURITY;


-- ==========================================
-- STEP 6: FIX - GRANT PERMISSIONS EXPLICITLY
-- ==========================================
-- Grant ke anon (untuk public access)
GRANT SELECT ON user_statistics TO anon;
GRANT SELECT ON entries TO anon;

-- Grant ke authenticated
GRANT SELECT ON user_statistics TO authenticated;
GRANT SELECT ON entries TO authenticated;

-- Grant usage on views (jika ada)
-- Views inherit permissions dari underlying tables


-- ==========================================
-- STEP 7: RE-CREATE VIEWS (jika belum ada)
-- ==========================================

-- Drop existing views
DROP VIEW IF EXISTS daily_top_performers;
DROP VIEW IF EXISTS total_top_performers;

-- Create daily_top_performers view
CREATE OR REPLACE VIEW daily_top_performers AS
SELECT
    RANK() OVER (ORDER BY COUNT(*) DESC) as rank,
    created_by as username,
    COUNT(*) as daily_entries,
    SUM(berat_aktual) as daily_berat,
    AVG(selisih) as avg_selisih,
    COUNT(*) * 500 as daily_earnings
FROM entries
WHERE DATE(created_at) = CURRENT_DATE
    AND created_by IS NOT NULL
    AND created_by != ''
GROUP BY created_by
ORDER BY daily_entries DESC
LIMIT 10;

-- Create total_top_performers view
CREATE OR REPLACE VIEW total_top_performers AS
SELECT
    RANK() OVER (ORDER BY COUNT(*) DESC) as rank,
    created_by as username,
    COUNT(*) as total_entries,
    SUM(berat_aktual) as total_berat,
    AVG(selisih) as avg_selisih,
    COUNT(*) * 500 as total_earnings,
    MIN(created_at) as first_entry,
    MAX(created_at) as last_entry
FROM entries
WHERE created_by IS NOT NULL
    AND created_by != ''
GROUP BY created_by
ORDER BY total_entries DESC
LIMIT 10;

-- Grant select on views
GRANT SELECT ON daily_top_performers TO anon, authenticated;
GRANT SELECT ON total_top_performers TO anon, authenticated;


-- ==========================================
-- STEP 8: ALTERNATIVE - Query from user_statistics directly
-- ==========================================
-- Jika views masih tidak work, query langsung dari user_statistics

-- Daily top performers dari user_statistics
SELECT
    ROW_NUMBER() OVER (ORDER BY daily_entries DESC) as rank,
    username,
    daily_entries,
    daily_earnings,
    avg_selisih
FROM user_statistics
WHERE daily_entries > 0
ORDER BY daily_entries DESC
LIMIT 5;

-- Total top performers dari user_statistics
SELECT
    ROW_NUMBER() OVER (ORDER BY total_entries DESC) as rank,
    username,
    total_entries,
    total_earnings,
    avg_selisih
FROM user_statistics
ORDER BY total_entries DESC
LIMIT 5;


-- ==========================================
-- STEP 9: VERIFY FIX
-- ==========================================
-- Test semua query setelah fix
SELECT 'Testing daily view...' as test;
SELECT * FROM daily_top_performers LIMIT 3;

SELECT 'Testing total view...' as test;
SELECT * FROM total_top_performers LIMIT 3;

SELECT 'Testing user_statistics...' as test;
SELECT * FROM user_statistics ORDER BY total_entries DESC LIMIT 3;


-- ==========================================
-- STEP 10: CHECK PERMISSIONS ON ENTRIES TABLE
-- ==========================================
-- Pastikan entries table bisa di-access
SELECT
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND table_name = 'entries'
ORDER BY grantee, privilege_type;

-- Jika anon atau authenticated tidak ada, grant:
GRANT SELECT ON entries TO anon, authenticated;


-- ==========================================
-- DIAGNOSTIC SUMMARY
-- ==========================================
-- Run ini untuk summary status
SELECT
    'Views Exist' as check_type,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('daily_top_performers', 'total_top_performers')
    AND table_type = 'VIEW'
UNION ALL
SELECT
    'user_statistics has data',
    COUNT(*)
FROM user_statistics
UNION ALL
SELECT
    'entries with created_by',
    COUNT(*)
FROM entries
WHERE created_by IS NOT NULL
UNION ALL
SELECT
    'entries today',
    COUNT(*)
FROM entries
WHERE DATE(created_at) = CURRENT_DATE;


-- ==========================================
-- QUICK FIX SCRIPT (Run semua ini sekaligus)
-- ==========================================
/*
-- Copy paste semua di bawah ini dan run sekaligus:

ALTER TABLE user_statistics DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON user_statistics TO anon, authenticated;
GRANT SELECT ON entries TO anon, authenticated;

DROP VIEW IF EXISTS daily_top_performers;
DROP VIEW IF EXISTS total_top_performers;

CREATE OR REPLACE VIEW daily_top_performers AS
SELECT
    RANK() OVER (ORDER BY COUNT(*) DESC) as rank,
    created_by as username,
    COUNT(*) as daily_entries,
    SUM(berat_aktual) as daily_berat,
    AVG(selisih) as avg_selisih,
    COUNT(*) * 500 as daily_earnings
FROM entries
WHERE DATE(created_at) = CURRENT_DATE
    AND created_by IS NOT NULL
    AND created_by != ''
GROUP BY created_by
ORDER BY daily_entries DESC
LIMIT 10;

CREATE OR REPLACE VIEW total_top_performers AS
SELECT
    RANK() OVER (ORDER BY COUNT(*) DESC) as rank,
    created_by as username,
    COUNT(*) as total_entries,
    SUM(berat_aktual) as total_berat,
    AVG(selisih) as avg_selisih,
    COUNT(*) * 500 as total_earnings,
    MIN(created_at) as first_entry,
    MAX(created_at) as last_entry
FROM entries
WHERE created_by IS NOT NULL
    AND created_by != ''
GROUP BY created_by
ORDER BY total_entries DESC
LIMIT 10;

GRANT SELECT ON daily_top_performers TO anon, authenticated;
GRANT SELECT ON total_top_performers TO anon, authenticated;

-- Test
SELECT * FROM daily_top_performers LIMIT 5;
SELECT * FROM total_top_performers LIMIT 5;
*/
