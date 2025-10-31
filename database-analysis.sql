-- ==========================================
-- DATABASE STRUCTURE ANALYSIS SCRIPTS
-- Gunakan scripts ini di Supabase SQL Editor
-- ==========================================

-- ==========================================
-- 1. LIHAT SEMUA TABEL DI DATABASE
-- ==========================================
-- Query ini menampilkan semua tabel yang ada di schema public
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- ==========================================
-- 2. LIHAT STRUKTUR DETAIL SEMUA TABEL
-- ==========================================
-- Query ini menampilkan semua kolom dari semua tabel beserta tipe data dan constraints
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    CASE
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        ELSE ''
    END as key_type
FROM information_schema.tables t
JOIN information_schema.columns c
    ON t.table_name = c.table_name
    AND t.table_schema = c.table_schema
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;


-- ==========================================
-- 3. LIHAT STRUKTUR TABEL SPECIFIC (entries)
-- ==========================================
-- Ganti 'entries' dengan nama tabel yang ingin dicek
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'entries'
ORDER BY ordinal_position;


-- ==========================================
-- 4. LIHAT SEMUA INDEXES
-- ==========================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ==========================================
-- 5. LIHAT SEMUA FOREIGN KEYS
-- ==========================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;


-- ==========================================
-- 6. LIHAT SEMUA CONSTRAINTS (PRIMARY KEY, UNIQUE, CHECK)
-- ==========================================
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;


-- ==========================================
-- 7. GENERATE CREATE TABLE STATEMENT
-- ==========================================
-- Query untuk generate CREATE TABLE statement dari tabel yang ada
-- Ganti 'entries' dengan nama tabel yang ingin di-generate
SELECT
    'CREATE TABLE ' || table_name || ' (' ||
    string_agg(
        column_name || ' ' ||
        data_type ||
        CASE
            WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE
            WHEN column_default IS NOT NULL
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        E',\n    '
        ORDER BY ordinal_position
    ) ||
    E'\n);' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'entries'
GROUP BY table_name;


-- ==========================================
-- 8. LIHAT ROW COUNT SEMUA TABEL
-- ==========================================
-- Query untuk menghitung jumlah baris di setiap tabel
SELECT
    schemaname,
    relname as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;


-- ==========================================
-- 9. LIHAT UKURAN SETIAP TABEL
-- ==========================================
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(quote_ident(table_name)::regclass)) as table_size,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass) - pg_relation_size(quote_ident(table_name)::regclass)) as indexes_size
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(quote_ident(table_name)::regclass) DESC;


-- ==========================================
-- 10. EXPORT STRUKTUR LENGKAP SEMUA TABEL (FORMAT READABLE)
-- ==========================================
SELECT
    '-- Table: ' || t.table_name || E'\n' ||
    '-- Columns:' || E'\n' ||
    string_agg(
        '  - ' || c.column_name || ' (' ||
        c.data_type ||
        CASE
            WHEN c.character_maximum_length IS NOT NULL
            THEN '(' || c.character_maximum_length || ')'
            ELSE ''
        END || ')' ||
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN pk.column_name IS NOT NULL THEN ' [PRIMARY KEY]' ELSE '' END,
        E'\n'
        ORDER BY c.ordinal_position
    ) || E'\n\n'
FROM information_schema.tables t
JOIN information_schema.columns c
    ON t.table_name = c.table_name
    AND t.table_schema = c.table_schema
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;


-- ==========================================
-- 11. COMPARE TWO DATABASES (Run di DB lama dan baru, lalu compare hasil)
-- ==========================================
-- Export struktur untuk comparison
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;


-- ==========================================
-- 12. CARI TABEL YANG PUNYA KOLOM TERTENTU
-- ==========================================
-- Contoh: cari semua tabel yang punya kolom 'created_at'
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name = 'created_at'
ORDER BY table_name;


-- ==========================================
-- 13. LIHAT RLS (Row Level Security) POLICIES
-- ==========================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ==========================================
-- 14. LIHAT TRIGGERS
-- ==========================================
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;


-- ==========================================
-- 15. SCRIPT UNTUK COPY STRUKTUR TABEL (tanpa data)
-- ==========================================
-- Jalankan ini untuk create tabel kosong dengan struktur yang sama
-- Ganti 'entries' dan 'entries_new' sesuai kebutuhan
-- CREATE TABLE entries_new (LIKE entries INCLUDING ALL);


-- ==========================================
-- CATATAN PENGGUNAAN:
-- ==========================================
-- 1. Jalankan query #1 untuk lihat semua tabel di project baru
-- 2. Jalankan query #2 atau #10 untuk lihat struktur lengkap
-- 3. Export hasil query dari DB BARU
-- 4. Connect ke DB LAMA dan jalankan query yang sama
-- 5. Compare hasil export untuk lihat perbedaan
-- 6. Gunakan query #7 untuk generate CREATE TABLE jika perlu create tabel baru
-- 7. Gunakan query #5 untuk lihat foreign key relationships
-- 8. Gunakan query #13 untuk lihat RLS policies (penting untuk Supabase)
