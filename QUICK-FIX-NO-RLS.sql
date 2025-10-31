-- ==========================================
-- QUICK FIX - Top Performer Dashboard (Tanpa RLS)
-- Copy paste semua dan run sekaligus di Supabase SQL Editor
-- ==========================================

-- 1. Grant SELECT permission ke semua (tanpa RLS)
GRANT SELECT ON user_statistics TO anon, authenticated, postgres;
GRANT SELECT ON entries TO anon, authenticated, postgres;

-- 2. Pastikan user_statistics tidak punya RLS
ALTER TABLE user_statistics DISABLE ROW LEVEL SECURITY;

-- 3. Drop dan re-create views (pastikan format column sesuai)
DROP VIEW IF EXISTS daily_top_performers CASCADE;
DROP VIEW IF EXISTS total_top_performers CASCADE;

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

-- 4. Grant SELECT ke views juga
GRANT SELECT ON daily_top_performers TO anon, authenticated, postgres;
GRANT SELECT ON total_top_performers TO anon, authenticated, postgres;

-- 5. Test query (harus return data!)
SELECT '=== Testing daily_top_performers ===' as test_section;
SELECT * FROM daily_top_performers LIMIT 5;

SELECT '=== Testing total_top_performers ===' as test_section;
SELECT * FROM total_top_performers LIMIT 5;

SELECT '=== Testing user_statistics ===' as test_section;
SELECT username, total_entries, daily_entries FROM user_statistics ORDER BY total_entries DESC LIMIT 5;

-- ==========================================
-- EXPECTED OUTPUT:
-- ==========================================
-- Kamu seharusnya melihat data dari views dan user_statistics
-- Daily performers: User dengan entries hari ini (2025-10-31)
-- Total performers: User dengan most entries sepanjang waktu
--
-- Jika masih "No rows returned", berarti masalah di dashboard JavaScript
-- Check browser console (F12) untuk error messages
-- ==========================================
