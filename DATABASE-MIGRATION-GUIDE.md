# 📊 Database Migration Guide

Panduan lengkap untuk menganalisis dan menyamakan struktur database antara project lama dan baru.

---

## 🎯 Tujuan

1. Menganalisis struktur database project BARU
2. Membandingkan dengan database LAMA
3. Menyamakan struktur tabel
4. Migrasi data dengan aman

---

## 📁 Files Yang Tersedia

1. **`database-analysis.sql`** - Scripts untuk analisis struktur database
2. **`database-migration.sql`** - Scripts untuk create tables dan migration
3. **`DATABASE-MIGRATION-GUIDE.md`** - Panduan ini

---

## 🚀 Step-by-Step Guide

### **STEP 1: Analisis Database Baru**

1. Login ke **Supabase Dashboard** project BARU
2. Buka **SQL Editor**
3. Copy-paste query dari `database-analysis.sql`
4. Jalankan query berikut untuk lihat struktur:

#### Query #1: Lihat Semua Tabel
```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Output akan menampilkan:**
- Nama semua tabel yang ada
- Tipe tabel (BASE TABLE, VIEW, dll)

#### Query #2: Lihat Struktur Lengkap Semua Tabel
```sql
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    CASE WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY' ELSE '' END as key_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
```

**Output akan menampilkan:**
- Nama tabel
- Nama kolom
- Tipe data
- Nullable atau tidak
- Primary key atau tidak

5. **Export hasil query** → Click "Download as CSV"
6. Simpan file dengan nama: `db_new_structure.csv`

---

### **STEP 2: Analisis Database Lama**

1. Login ke **Supabase Dashboard** project LAMA
2. Buka **SQL Editor**
3. Jalankan **query yang sama** seperti di STEP 1
4. Export hasil → simpan dengan nama: `db_old_structure.csv`

---

### **STEP 3: Bandingkan Struktur**

1. Buka kedua file CSV di Excel/Google Sheets
2. Bandingkan kolom-kolom:
   - Tabel apa saja yang ada di DB BARU tapi tidak di DB LAMA?
   - Tabel apa saja yang ada di DB LAMA tapi tidak di DB BARU?
   - Kolom apa yang berbeda?
   - Tipe data apa yang berbeda?

**Contoh Comparison:**

| Table Name | Column | DB Lama | DB Baru | Action Required |
|------------|--------|---------|---------|-----------------|
| entries | notes | ❌ Tidak ada | ✅ Ada (TEXT) | Tambah kolom |
| entries | updated_at | ❌ Tidak ada | ✅ Ada (TIMESTAMP) | Tambah kolom |
| users | role | VARCHAR(50) | VARCHAR(100) | Alter tipe data |

---

### **STEP 4: Create Missing Tables di DB Lama**

Jika ada tabel yang ada di DB BARU tapi tidak di DB LAMA:

1. Buka `database-migration.sql`
2. Copy script **CREATE TABLE** yang sesuai
3. Jalankan di DB LAMA (Supabase SQL Editor)

**Contoh:**
```sql
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
```

---

### **STEP 5: Tambah Missing Columns**

Jika ada kolom yang ada di DB BARU tapi tidak di DB LAMA:

```sql
-- Tambah kolom notes
ALTER TABLE entries ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tambah kolom updated_at
ALTER TABLE entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tambah kolom created_by
ALTER TABLE entries ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
```

**Atau gunakan script otomatis dari `database-migration.sql` (Section #7):**
```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'entries' AND column_name = 'notes'
    ) THEN
        ALTER TABLE entries ADD COLUMN notes TEXT;
    END IF;
    -- dst...
END $$;
```

---

### **STEP 6: Alter Existing Columns (Jika Perlu)**

Jika ada tipe data yang berbeda:

```sql
-- Ubah tipe data kolom
ALTER TABLE entries ALTER COLUMN status TYPE VARCHAR(100);

-- Ubah default value
ALTER TABLE entries ALTER COLUMN status SET DEFAULT 'submitted';

-- Tambah constraint
ALTER TABLE entries ALTER COLUMN nama SET NOT NULL;
```

---

### **STEP 7: Create Indexes**

Indexes penting untuk performa query:

```sql
-- Create indexes dari database-migration.sql
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_no_resi ON entries(no_resi);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_created_by ON entries(created_by);
```

Cek apakah index sudah ada:
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

### **STEP 8: Setup Row Level Security (RLS)**

Supabase requires RLS untuk security:

```sql
-- Enable RLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access"
    ON entries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert access"
    ON entries FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update access"
    ON entries FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete access"
    ON entries FOR DELETE
    TO authenticated
    USING (true);
```

Cek RLS policies yang ada:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

### **STEP 9: Create Functions & Triggers**

Copy functions dan triggers dari DB BARU ke DB LAMA:

```sql
-- Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger
DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;
CREATE TRIGGER update_entries_updated_at
    BEFORE UPDATE ON entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

Cek triggers yang ada:
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

### **STEP 10: Validasi & Testing**

1. **Validasi struktur sudah sama:**

```sql
-- Run di DB LAMA dan DB BARU, compare hasilnya
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

2. **Test CRUD operations:**

```sql
-- Insert test data
INSERT INTO entries (nama, no_resi, berat_resi, berat_aktual, status)
VALUES ('Test User', 'TEST123', 1.5, 1.8, 'submitted');

-- Read
SELECT * FROM entries WHERE no_resi = 'TEST123';

-- Update
UPDATE entries SET status = 'approved' WHERE no_resi = 'TEST123';

-- Delete
DELETE FROM entries WHERE no_resi = 'TEST123';
```

3. **Test aplikasi:**
   - Connect aplikasi ke DB LAMA
   - Test semua fitur (create, read, update, delete)
   - Test upload foto
   - Test filter dan export

---

### **STEP 11: Grant Permissions**

Pastikan permissions sudah di-set:

```sql
-- Grant ke authenticated users
GRANT ALL ON entries TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON earnings TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

## 🔍 Useful Queries untuk Troubleshooting

### Cek Row Count
```sql
SELECT
    relname as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### Cek Table Size
```sql
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as total_size
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(quote_ident(table_name)::regclass) DESC;
```

### Cari Tabel dengan Kolom Tertentu
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'created_at'
ORDER BY table_name;
```

### Export CREATE TABLE Statement
```sql
SELECT
    'CREATE TABLE ' || table_name || ' (' ||
    string_agg(
        column_name || ' ' || data_type ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        ', '
        ORDER BY ordinal_position
    ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'entries'
GROUP BY table_name;
```

---

## ⚠️ Important Notes

### 🔒 Safety First
- **BACKUP DULU** sebelum alter table: `CREATE TABLE entries_backup AS SELECT * FROM entries;`
- **Test di development environment** dulu sebelum production
- **Jangan delete data** sebelum yakin migration berhasil

### 🎯 Best Practices
- Gunakan **transactions** untuk batch operations:
  ```sql
  BEGIN;
  -- Your SQL commands here
  COMMIT; -- atau ROLLBACK jika ada error
  ```
- Buat **migration script** yang bisa di-rollback
- Document semua perubahan yang dilakukan

### ⚡ Performance Tips
- Create **indexes** untuk kolom yang sering di-query
- Gunakan **EXPLAIN ANALYZE** untuk cek query performance:
  ```sql
  EXPLAIN ANALYZE SELECT * FROM entries WHERE status = 'approved';
  ```
- Monitor **slow queries** di Supabase Dashboard

---

## 📊 Checklist Migration

```
□ Step 1: Analisis DB Baru - Export structure
□ Step 2: Analisis DB Lama - Export structure
□ Step 3: Bandingkan struktur - Create comparison table
□ Step 4: Create missing tables
□ Step 5: Tambah missing columns
□ Step 6: Alter existing columns
□ Step 7: Create indexes
□ Step 8: Setup RLS policies
□ Step 9: Create functions & triggers
□ Step 10: Validasi & testing
□ Step 11: Grant permissions
□ Final: Test aplikasi end-to-end
```

---

## 🆘 Troubleshooting

### Problem: "Permission denied for table"
**Solution:**
```sql
GRANT ALL ON entries TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### Problem: "Column does not exist"
**Solution:**
```sql
-- Cek kolom yang ada
SELECT column_name FROM information_schema.columns WHERE table_name = 'entries';

-- Tambah kolom yang missing
ALTER TABLE entries ADD COLUMN your_column_name TEXT;
```

### Problem: "RLS policy violation"
**Solution:**
```sql
-- Disable RLS temporarily (development only!)
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;

-- Atau tambah policy yang lebih permissive
CREATE POLICY "Allow all operations" ON entries USING (true) WITH CHECK (true);
```

### Problem: "Foreign key constraint fails"
**Solution:**
```sql
-- Cek foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';

-- Drop foreign key jika perlu
ALTER TABLE your_table DROP CONSTRAINT your_constraint_name;
```

---

## 📞 Support

Jika ada masalah:
1. Cek error message di Supabase logs
2. Run validation queries dari `database-analysis.sql`
3. Compare hasil dengan expected structure
4. Test di development environment dulu

---

## ✅ Success Criteria

Migration dianggap sukses jika:
- ✅ Semua tabel dari DB BARU sudah ada di DB LAMA
- ✅ Semua kolom sudah sesuai (nama, tipe data, constraints)
- ✅ Indexes sudah di-create
- ✅ RLS policies sudah di-set
- ✅ Functions & triggers berfungsi
- ✅ Aplikasi bisa CRUD tanpa error
- ✅ Data integrity terjaga (no data loss)

---

**Good luck dengan migration! 🚀**
