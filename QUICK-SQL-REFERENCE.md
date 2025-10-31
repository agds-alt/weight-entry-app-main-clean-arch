# 🚀 Quick SQL Reference - Supabase

Copy-paste langsung ke Supabase SQL Editor!

---

## 📋 1. LIHAT SEMUA TABEL

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 📊 2. LIHAT STRUKTUR TABEL LENGKAP

```sql
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'entries'  -- GANTI dengan nama tabel
ORDER BY ordinal_position;
```

---

## 🔢 3. HITUNG JUMLAH BARIS SETIAP TABEL

```sql
SELECT
    relname as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

---

## 🗂️ 4. LIHAT SEMUA INDEX

```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 🔗 5. LIHAT FOREIGN KEYS

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
```

---

## 🔐 6. LIHAT RLS POLICIES

```sql
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## ➕ 7. TAMBAH KOLOM BARU

```sql
-- Single column
ALTER TABLE entries ADD COLUMN notes TEXT;

-- Multiple columns
ALTER TABLE entries
    ADD COLUMN notes TEXT,
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

---

## 🔄 8. UBAH TIPE DATA KOLOM

```sql
ALTER TABLE entries
ALTER COLUMN status TYPE VARCHAR(100);
```

---

## 🗑️ 9. HAPUS KOLOM

```sql
ALTER TABLE entries DROP COLUMN column_name;
```

---

## 🔑 10. CREATE PRIMARY KEY

```sql
ALTER TABLE entries ADD PRIMARY KEY (id);
```

---

## 📑 11. CREATE INDEX

```sql
-- Single column
CREATE INDEX idx_entries_status ON entries(status);

-- Multiple columns
CREATE INDEX idx_entries_date_status ON entries(created_at, status);

-- Unique index
CREATE UNIQUE INDEX idx_entries_no_resi ON entries(no_resi);
```

---

## 🗑️ 12. DROP INDEX

```sql
DROP INDEX idx_entries_status;
```

---

## 🔒 13. ENABLE RLS

```sql
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
```

---

## 🔓 14. CREATE RLS POLICY (Allow All)

```sql
-- Read access
CREATE POLICY "Allow read access"
    ON entries FOR SELECT
    TO authenticated
    USING (true);

-- Insert access
CREATE POLICY "Allow insert access"
    ON entries FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Update access
CREATE POLICY "Allow update access"
    ON entries FOR UPDATE
    TO authenticated
    USING (true);

-- Delete access
CREATE POLICY "Allow delete access"
    ON entries FOR DELETE
    TO authenticated
    USING (true);
```

---

## 🗑️ 15. DROP RLS POLICY

```sql
DROP POLICY "policy_name" ON entries;
```

---

## 🔧 16. CREATE TRIGGER (Auto Update Timestamp)

```sql
-- Create function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_entries_updated_at
    BEFORE UPDATE ON entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 💾 17. BACKUP TABLE

```sql
CREATE TABLE entries_backup AS SELECT * FROM entries;
```

---

## 🔄 18. COPY DATA ANTAR TABEL

```sql
INSERT INTO entries_new (nama, no_resi, berat_resi, berat_aktual)
SELECT nama, no_resi, berat_resi, berat_aktual
FROM entries_old;
```

---

## 🧪 19. TEST INSERT DATA

```sql
INSERT INTO entries (nama, no_resi, berat_resi, berat_aktual, status)
VALUES ('Test User', 'TEST123', 1.5, 1.8, 'submitted');
```

---

## 🔍 20. SEARCH DATA

```sql
-- Simple search
SELECT * FROM entries WHERE nama LIKE '%test%';

-- Multiple conditions
SELECT * FROM entries
WHERE status = 'approved'
    AND created_at > NOW() - INTERVAL '7 days';

-- With pagination
SELECT * FROM entries
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

---

## 📊 21. AGGREGATE QUERIES

```sql
-- Count
SELECT COUNT(*) FROM entries;

-- Average
SELECT AVG(selisih) FROM entries;

-- Sum
SELECT SUM(berat_aktual) FROM entries;

-- Group by
SELECT status, COUNT(*)
FROM entries
GROUP BY status;

-- Group by date
SELECT DATE(created_at) as date, COUNT(*)
FROM entries
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🗑️ 22. DELETE DATA

```sql
-- Delete specific
DELETE FROM entries WHERE id = 123;

-- Delete with condition
DELETE FROM entries WHERE status = 'rejected';

-- Delete all (DANGEROUS!)
-- DELETE FROM entries;
```

---

## 🔄 23. UPDATE DATA

```sql
-- Update single record
UPDATE entries
SET status = 'approved'
WHERE id = 123;

-- Update multiple records
UPDATE entries
SET status = 'approved'
WHERE created_at < '2024-01-01';

-- Update with calculation
UPDATE entries
SET berat_aktual = berat_aktual * 1.1
WHERE id = 123;
```

---

## 🎯 24. GRANT PERMISSIONS

```sql
-- Grant all on table
GRANT ALL ON entries TO authenticated;

-- Grant specific permissions
GRANT SELECT, INSERT, UPDATE ON entries TO authenticated;

-- Grant on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

## 📏 25. CHECK CONSTRAINTS

```sql
-- Add check constraint
ALTER TABLE entries
ADD CONSTRAINT check_berat_positive
CHECK (berat_aktual > 0);

-- Drop constraint
ALTER TABLE entries
DROP CONSTRAINT check_berat_positive;
```

---

## 🔄 26. RENAME TABLE/COLUMN

```sql
-- Rename table
ALTER TABLE entries RENAME TO entries_new;

-- Rename column
ALTER TABLE entries
RENAME COLUMN old_name TO new_name;
```

---

## 📊 27. CREATE VIEW

```sql
CREATE VIEW entries_summary AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_entries,
    AVG(selisih) as avg_selisih,
    SUM(berat_aktual) as total_berat
FROM entries
GROUP BY DATE(created_at);
```

---

## 🗑️ 28. DROP TABLE (HATI-HATI!)

```sql
DROP TABLE IF EXISTS table_name;
```

---

## 🧹 29. VACUUM (Clean Up)

```sql
-- Reclaim storage
VACUUM entries;

-- Full vacuum
VACUUM FULL entries;

-- Analyze table statistics
ANALYZE entries;
```

---

## 📈 30. EXPLAIN QUERY (Check Performance)

```sql
EXPLAIN ANALYZE
SELECT * FROM entries
WHERE status = 'approved';
```

---

## 🔍 31. CARI TABEL DENGAN KOLOM TERTENTU

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'created_at'
    AND table_schema = 'public';
```

---

## 📊 32. LIHAT TABLE SIZE

```sql
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(quote_ident(table_name)::regclass) DESC;
```

---

## 🔄 33. TRANSACTIONS

```sql
-- Start transaction
BEGIN;

-- Your SQL commands
UPDATE entries SET status = 'approved' WHERE id = 1;
INSERT INTO logs (message) VALUES ('Updated entry 1');

-- Commit if success
COMMIT;

-- Or rollback if error
-- ROLLBACK;
```

---

## 💡 34. COMMON PATTERNS

### Pattern: Soft Delete
```sql
-- Add deleted_at column
ALTER TABLE entries ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Soft delete
UPDATE entries SET deleted_at = NOW() WHERE id = 123;

-- Query active records
SELECT * FROM entries WHERE deleted_at IS NULL;
```

### Pattern: Audit Trail
```sql
ALTER TABLE entries
    ADD COLUMN created_by VARCHAR(255),
    ADD COLUMN updated_by VARCHAR(255),
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### Pattern: UUID Primary Key
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL
);
```

---

## ⚡ Pro Tips

1. **Always backup before major changes:**
   ```sql
   CREATE TABLE entries_backup AS SELECT * FROM entries;
   ```

2. **Use transactions for batch operations:**
   ```sql
   BEGIN;
   -- Your operations
   COMMIT;
   ```

3. **Create indexes for frequently queried columns:**
   ```sql
   CREATE INDEX idx_entries_status ON entries(status);
   ```

4. **Use EXPLAIN to check query performance:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM entries WHERE status = 'approved';
   ```

5. **Grant permissions after creating tables:**
   ```sql
   GRANT ALL ON entries TO authenticated;
   ```

---

## 🆘 Emergency Commands

### Reset RLS (Development Only!)
```sql
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;
```

### Kill Long Running Queries
```sql
-- Find long running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 minutes';

-- Kill specific query
SELECT pg_terminate_backend(pid);
```

### Reset Sequence
```sql
-- Find max id
SELECT MAX(id) FROM entries;

-- Reset sequence (replace 1234 with max id + 1)
ALTER SEQUENCE entries_id_seq RESTART WITH 1234;
```

---

**Bookmark halaman ini untuk referensi cepat! 📌**
