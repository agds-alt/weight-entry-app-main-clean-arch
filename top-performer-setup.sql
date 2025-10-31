-- ==========================================
-- TOP PERFORMER TRACKING SYSTEM
-- SQL Setup untuk Dashboard Top Performer (Harian & Total)
-- ==========================================

-- ==========================================
-- 1. CREATE VIEW: Daily Top Performers
-- ==========================================
-- View ini menghitung top performer untuk hari ini
CREATE OR REPLACE VIEW daily_top_performers AS
SELECT
    created_by as username,
    COUNT(*) as daily_entries,
    SUM(berat_aktual) as daily_berat,
    AVG(selisih) as avg_selisih,
    -- Asumsi: Rp 500 per entry
    COUNT(*) * 500 as daily_earnings,
    RANK() OVER (ORDER BY COUNT(*) DESC) as rank
FROM entries
WHERE DATE(created_at) = CURRENT_DATE
    AND created_by IS NOT NULL
    AND created_by != ''
GROUP BY created_by
ORDER BY daily_entries DESC
LIMIT 10;


-- ==========================================
-- 2. CREATE VIEW: Total Top Performers (All Time)
-- ==========================================
-- View ini menghitung top performer sepanjang waktu
CREATE OR REPLACE VIEW total_top_performers AS
SELECT
    created_by as username,
    COUNT(*) as total_entries,
    SUM(berat_aktual) as total_berat,
    AVG(selisih) as avg_selisih,
    -- Asumsi: Rp 500 per entry
    COUNT(*) * 500 as total_earnings,
    MIN(created_at) as first_entry,
    MAX(created_at) as last_entry,
    RANK() OVER (ORDER BY COUNT(*) DESC) as rank
FROM entries
WHERE created_by IS NOT NULL
    AND created_by != ''
GROUP BY created_by
ORDER BY total_entries DESC
LIMIT 10;


-- ==========================================
-- 3. CREATE TABLE: User Statistics Cache (Optional - untuk performa)
-- ==========================================
-- Table ini untuk cache statistics per user, di-update berkala
CREATE TABLE IF NOT EXISTS user_statistics (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    total_entries BIGINT DEFAULT 0,
    total_earnings DECIMAL(15, 2) DEFAULT 0,
    daily_entries BIGINT DEFAULT 0,
    daily_earnings DECIMAL(15, 2) DEFAULT 0,
    avg_selisih DECIMAL(10, 2) DEFAULT 0,
    last_entry_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_stats_username ON user_statistics(username);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_entries ON user_statistics(total_entries DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_daily_entries ON user_statistics(daily_entries DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_updated ON user_statistics(last_updated);


-- ==========================================
-- 4. FUNCTION: Update User Statistics
-- ==========================================
-- Function untuk update statistics setelah entry baru
CREATE OR REPLACE FUNCTION update_user_statistics(p_username VARCHAR)
RETURNS VOID AS $$
DECLARE
    v_total_entries BIGINT;
    v_total_earnings DECIMAL(15, 2);
    v_daily_entries BIGINT;
    v_daily_earnings DECIMAL(15, 2);
    v_avg_selisih DECIMAL(10, 2);
    v_last_entry_date DATE;
BEGIN
    -- Calculate total stats
    SELECT
        COUNT(*),
        COUNT(*) * 500,
        AVG(selisih)
    INTO
        v_total_entries,
        v_total_earnings,
        v_avg_selisih
    FROM entries
    WHERE created_by = p_username;

    -- Calculate daily stats
    SELECT
        COUNT(*),
        COUNT(*) * 500
    INTO
        v_daily_entries,
        v_daily_earnings
    FROM entries
    WHERE created_by = p_username
        AND DATE(created_at) = CURRENT_DATE;

    -- Get last entry date
    SELECT MAX(DATE(created_at))
    INTO v_last_entry_date
    FROM entries
    WHERE created_by = p_username;

    -- Insert or update
    INSERT INTO user_statistics (
        username,
        total_entries,
        total_earnings,
        daily_entries,
        daily_earnings,
        avg_selisih,
        last_entry_date,
        last_updated
    )
    VALUES (
        p_username,
        v_total_entries,
        v_total_earnings,
        v_daily_entries,
        v_daily_earnings,
        v_avg_selisih,
        v_last_entry_date,
        NOW()
    )
    ON CONFLICT (username) DO UPDATE SET
        total_entries = EXCLUDED.total_entries,
        total_earnings = EXCLUDED.total_earnings,
        daily_entries = EXCLUDED.daily_entries,
        daily_earnings = EXCLUDED.daily_earnings,
        avg_selisih = EXCLUDED.avg_selisih,
        last_entry_date = EXCLUDED.last_entry_date,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 5. TRIGGER: Auto Update Statistics on Entry Insert/Update
-- ==========================================
CREATE OR REPLACE FUNCTION trigger_update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats for the user
    IF NEW.created_by IS NOT NULL AND NEW.created_by != '' THEN
        PERFORM update_user_statistics(NEW.created_by);
    END IF;

    -- Also update old user if username changed
    IF TG_OP = 'UPDATE' AND OLD.created_by IS NOT NULL AND OLD.created_by != '' AND OLD.created_by != NEW.created_by THEN
        PERFORM update_user_statistics(OLD.created_by);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stats_on_entry ON entries;
CREATE TRIGGER trigger_update_stats_on_entry
    AFTER INSERT OR UPDATE ON entries
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_statistics();


-- ==========================================
-- 6. FUNCTION: Get Daily Top Performers (Top 5)
-- ==========================================
CREATE OR REPLACE FUNCTION get_daily_top_performers(limit_count INT DEFAULT 5)
RETURNS TABLE (
    rank BIGINT,
    username VARCHAR,
    daily_entries BIGINT,
    daily_earnings DECIMAL,
    avg_selisih DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM daily_top_performers
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 7. FUNCTION: Get Total Top Performers (Top 5)
-- ==========================================
CREATE OR REPLACE FUNCTION get_total_top_performers(limit_count INT DEFAULT 5)
RETURNS TABLE (
    rank BIGINT,
    username VARCHAR,
    total_entries BIGINT,
    total_earnings DECIMAL,
    avg_selisih DECIMAL,
    first_entry TIMESTAMP WITH TIME ZONE,
    last_entry TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM total_top_performers
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 8. FUNCTION: Reset Daily Statistics (Run setiap tengah malam)
-- ==========================================
CREATE OR REPLACE FUNCTION reset_daily_statistics()
RETURNS VOID AS $$
BEGIN
    -- Reset daily counters di user_statistics
    UPDATE user_statistics
    SET
        daily_entries = 0,
        daily_earnings = 0,
        last_updated = NOW()
    WHERE last_entry_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 9. INITIAL POPULATION: Populate existing users
-- ==========================================
-- Run ini sekali untuk populate data existing users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT DISTINCT created_by
        FROM entries
        WHERE created_by IS NOT NULL AND created_by != ''
    LOOP
        PERFORM update_user_statistics(r.created_by);
    END LOOP;
END $$;


-- ==========================================
-- 10. GRANT PERMISSIONS
-- ==========================================
-- Grant akses ke authenticated users
GRANT SELECT ON daily_top_performers TO authenticated, anon;
GRANT SELECT ON total_top_performers TO authenticated, anon;
GRANT ALL ON user_statistics TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ==========================================
-- 11. TEST QUERIES
-- ==========================================

-- Test: Lihat daily top performers
-- SELECT * FROM daily_top_performers LIMIT 5;

-- Test: Lihat total top performers
-- SELECT * FROM total_top_performers LIMIT 5;

-- Test: Get via function
-- SELECT * FROM get_daily_top_performers(5);
-- SELECT * FROM get_total_top_performers(5);

-- Test: Manual update statistics untuk user tertentu
-- SELECT update_user_statistics('john_doe');

-- Test: Lihat user statistics
-- SELECT * FROM user_statistics ORDER BY total_entries DESC LIMIT 10;


-- ==========================================
-- 12. MAINTENANCE QUERIES
-- ==========================================

-- Refresh semua user statistics
-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN
--         SELECT DISTINCT created_by
--         FROM entries
--         WHERE created_by IS NOT NULL AND created_by != ''
--     LOOP
--         PERFORM update_user_statistics(r.created_by);
--     END LOOP;
-- END $$;

-- Reset daily stats (run setiap tengah malam via cron)
-- SELECT reset_daily_statistics();

-- Delete old statistics (optional)
-- DELETE FROM user_statistics WHERE last_updated < NOW() - INTERVAL '30 days';


-- ==========================================
-- CARA PENGGUNAAN:
-- ==========================================
-- 1. Copy semua SQL di atas ke Supabase SQL Editor
-- 2. Jalankan semua query sekaligus (Cmd/Ctrl + Enter)
-- 3. Tunggu sampai selesai (akan create views, tables, functions, triggers)
-- 4. Test dengan query di section #11
-- 5. Update dashboard.html untuk fetch data dari views/functions ini
-- 6. Selesai! Top performer akan ter-update otomatis setiap ada entry baru

-- ==========================================
-- NOTES:
-- ==========================================
-- - Earning calculation: Rp 500 per entry (sesuaikan jika beda)
-- - Views di-create sebagai MATERIALIZED VIEW jika perlu performa lebih cepat
-- - Trigger otomatis update statistics setiap ada entry baru
-- - Function reset_daily_statistics() bisa di-schedule via pg_cron atau external cron
-- - user_statistics table optional tapi recommended untuk performa
