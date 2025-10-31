# 🏆 Top Performer System

Sistem ranking dan leaderboard untuk tracking performa user berdasarkan jumlah entries.

---

## 📊 Features

✅ **2 Leaderboard Types:**
1. **Top Performer Harian** - Ranking berdasarkan entries hari ini
2. **Top Performer Total** - Ranking berdasarkan total entries sepanjang waktu

✅ **Real-time Updates:**
- Otomatis update setiap ada entry baru (via trigger)
- Refresh otomatis setiap 5 menit di dashboard

✅ **Performance Optimized:**
- Menggunakan PostgreSQL Views untuk query cepat
- Cache statistics di tabel `user_statistics`
- Fallback calculation jika view belum ada

---

## 🚀 Setup Instructions

### **STEP 1: Run SQL Setup**

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy semua SQL dari file `top-performer-setup.sql`
3. Jalankan semua query sekaligus (Cmd/Ctrl + Enter)
4. Tunggu sampai selesai (akan create views, tables, functions, triggers)

**Yang akan di-create:**
- ✅ `daily_top_performers` (VIEW) - Top performer hari ini
- ✅ `total_top_performers` (VIEW) - Top performer total
- ✅ `user_statistics` (TABLE) - Cache statistics per user
- ✅ Functions untuk update statistics
- ✅ Triggers untuk auto-update

### **STEP 2: Test SQL Queries**

Jalankan test queries untuk validasi:

```sql
-- Test: Lihat daily top performers
SELECT * FROM daily_top_performers LIMIT 5;

-- Test: Lihat total top performers
SELECT * FROM total_top_performers LIMIT 5;

-- Test: Lihat user statistics
SELECT * FROM user_statistics ORDER BY total_entries DESC LIMIT 10;
```

**Expected Output:**
- Query akan return top 5 users dengan ranking, entries, dan earnings
- Jika belum ada data, result akan kosong (normal)

### **STEP 3: Verify Dashboard**

1. Buka dashboard.html di browser
2. Cek 2 leaderboard sections:
   - **Top Performers Hari Ini** (icon calendar, warna merah)
   - **Top Performers Total** (icon trophy, warna gold)
3. Cek browser console untuk error
4. Verifikasi data muncul atau "Belum ada data"

---

## 📝 How It Works

### **Architecture:**

```
Entry baru dibuat
    ↓
Trigger: trigger_update_stats_on_entry
    ↓
Function: update_user_statistics(username)
    ↓
Update tabel: user_statistics
    ↓
View: daily_top_performers & total_top_performers
    ↓
Dashboard fetch via Supabase client
    ↓
Display di UI
```

### **Data Flow:**

1. **User creates entry** → entries table
2. **Trigger fires** → update_user_statistics()
3. **Statistics calculated:**
   - Total entries count
   - Daily entries count (today)
   - Total earnings (entries * 500)
   - Average selisih
4. **Views refreshed** → daily_top_performers, total_top_performers
5. **Dashboard queries** → Supabase client fetch dari views
6. **UI updates** → Display leaderboard

---

## 🗂️ Database Schema

### **Table: user_statistics**
```sql
id               BIGSERIAL PRIMARY KEY
username         VARCHAR(255) UNIQUE NOT NULL
total_entries    BIGINT DEFAULT 0
total_earnings   DECIMAL(15, 2) DEFAULT 0
daily_entries    BIGINT DEFAULT 0
daily_earnings   DECIMAL(15, 2) DEFAULT 0
avg_selisih      DECIMAL(10, 2) DEFAULT 0
last_entry_date  DATE
last_updated     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### **View: daily_top_performers**
```sql
rank             BIGINT           -- Ranking hari ini
username         VARCHAR          -- Nama user
daily_entries    BIGINT           -- Jumlah entries hari ini
daily_berat      NUMERIC          -- Total berat hari ini
avg_selisih      NUMERIC          -- Rata-rata selisih
daily_earnings   BIGINT           -- Earnings hari ini (entries * 500)
```

### **View: total_top_performers**
```sql
rank             BIGINT           -- Ranking total
username         VARCHAR          -- Nama user
total_entries    BIGINT           -- Total entries sepanjang waktu
total_berat      NUMERIC          -- Total berat
avg_selisih      NUMERIC          -- Rata-rata selisih
total_earnings   BIGINT           -- Total earnings (entries * 500)
first_entry      TIMESTAMP        -- Entry pertama
last_entry       TIMESTAMP        -- Entry terakhir
```

---

## 🔧 Configuration

### **Earnings Calculation:**
Default: **Rp 500 per entry**

Untuk mengubah:
1. Edit di SQL file `top-performer-setup.sql`:
   ```sql
   COUNT(*) * 500    -- Ganti 500 dengan nilai lain
   ```
2. Re-run SQL setup
3. Update dashboard.html:
   ```javascript
   daily_earnings: count * 500  // Ganti 500
   ```

### **Leaderboard Limit:**
Default: **Top 5 users**

Untuk mengubah:
1. Edit di dashboard.html:
   ```javascript
   .limit(5)  // Ganti dengan angka lain
   ```

### **Refresh Interval:**
Default: **5 minutes**

Untuk mengubah dashboard.html:
```javascript
setInterval(fetchLeaderboards, 5 * 60 * 1000);  // 5 minutes
// Ganti dengan: 1 * 60 * 1000 untuk 1 minute, dst
```

---

## 🎨 UI Customization

### **Icons:**
- Daily: `<i class="fas fa-calendar-day"></i>`
- Total: `<i class="fas fa-trophy"></i>`

### **Colors:**
- Daily icon: `--primary-red` (#ff3b3b)
- Total icon: Gold (#FFD700)

### **Ranking Badges:**
- Rank 1: `.rank-1` (Gold)
- Rank 2: `.rank-2` (Silver)
- Rank 3: `.rank-3` (Bronze)
- Rank 4+: Default style

---

## 🧪 Testing

### **Test Scenario 1: No Data**
```
Expected: "Belum ada data hari ini" / "Belum ada data"
Action: Fresh database atau belum ada entries
```

### **Test Scenario 2: Single User**
```
1. Create entry dengan created_by = 'john_doe'
2. Refresh dashboard
3. Expected: john_doe muncul di rank 1 dengan 1 entry
```

### **Test Scenario 3: Multiple Users**
```
1. Create 5 entries: john_doe (3x), jane_doe (2x), bob (1x)
2. Refresh dashboard
3. Expected ranking:
   - Rank 1: john_doe (3 entries, Rp 1,500)
   - Rank 2: jane_doe (2 entries, Rp 1,000)
   - Rank 3: bob (1 entry, Rp 500)
```

### **Test Scenario 4: Daily vs Total**
```
1. Create entries dari kemarin: john_doe (10x)
2. Create entries hari ini: jane_doe (2x)
3. Expected:
   - Daily: jane_doe rank 1 (2 entries hari ini)
   - Total: john_doe rank 1 (10 total entries)
```

---

## 🐛 Troubleshooting

### **Problem: Leaderboard shows "Belum ada data"**

**Solutions:**
1. Cek entries table ada data:
   ```sql
   SELECT COUNT(*), COUNT(DISTINCT created_by)
   FROM entries
   WHERE created_by IS NOT NULL;
   ```

2. Cek view ada data:
   ```sql
   SELECT * FROM daily_top_performers;
   SELECT * FROM total_top_performers;
   ```

3. Cek browser console untuk error

4. Refresh user statistics:
   ```sql
   DO $$
   DECLARE
       r RECORD;
   BEGIN
       FOR r IN SELECT DISTINCT created_by FROM entries WHERE created_by IS NOT NULL
       LOOP
           PERFORM update_user_statistics(r.created_by);
       END LOOP;
   END $$;
   ```

### **Problem: "Supabase not initialized"**

**Solutions:**
1. Cek Supabase SDK loaded:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```

2. Cek config.js loaded:
   ```html
   <script src="/js/config.js"></script>
   ```

3. Cek credentials di config.js valid

4. Test connection:
   ```javascript
   const supabase = initSupabase();
   testSupabaseConnection();
   ```

### **Problem: Statistics tidak update**

**Solutions:**
1. Cek trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_stats_on_entry';
   ```

2. Re-create trigger jika hilang (run SQL setup lagi)

3. Manual update:
   ```sql
   SELECT update_user_statistics('username_here');
   ```

### **Problem: RLS Policy Error**

**Solutions:**
1. Grant permissions:
   ```sql
   GRANT SELECT ON daily_top_performers TO authenticated, anon;
   GRANT SELECT ON total_top_performers TO authenticated, anon;
   ```

2. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_statistics';
   ```

---

## 📊 Performance Tips

### **1. Indexes**
Sudah di-create otomatis:
- `idx_user_stats_username`
- `idx_user_stats_total_entries`
- `idx_user_stats_daily_entries`

### **2. Materialized Views (Optional)**
Untuk database besar, gunakan MATERIALIZED VIEW:

```sql
CREATE MATERIALIZED VIEW daily_top_performers_mat AS
SELECT * FROM daily_top_performers;

-- Refresh setiap jam via cron
REFRESH MATERIALIZED VIEW daily_top_performers_mat;
```

### **3. Partition Table (Optional)**
Untuk table entries yang sangat besar:
```sql
-- Partition by month
CREATE TABLE entries_partitioned (LIKE entries) PARTITION BY RANGE (created_at);
```

---

## 🔄 Maintenance

### **Daily Reset Statistics**
Run setiap tengah malam untuk reset daily counters:
```sql
SELECT reset_daily_statistics();
```

Setup via pg_cron (Supabase):
```sql
SELECT cron.schedule(
    'reset-daily-stats',
    '0 0 * * *',  -- Every midnight
    'SELECT reset_daily_statistics();'
);
```

### **Cleanup Old Statistics**
Delete statistics user yang inactive > 30 hari:
```sql
DELETE FROM user_statistics
WHERE last_updated < NOW() - INTERVAL '30 days';
```

### **Refresh All Statistics**
Re-calculate semua user statistics:
```sql
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT DISTINCT created_by FROM entries WHERE created_by IS NOT NULL
    LOOP
        PERFORM update_user_statistics(r.created_by);
    END LOOP;
END $$;
```

---

## 📈 Future Enhancements

Potential improvements:
- [ ] Weekly/Monthly leaderboards
- [ ] Category-based leaderboards (by status, by berat range)
- [ ] Historical rankings (rank progression over time)
- [ ] Achievement badges (milestones: 100, 500, 1000 entries)
- [ ] Leaderboard filtering (by date range, by location)
- [ ] Export leaderboard to PDF/Excel
- [ ] Email notifications for rank changes
- [ ] Public leaderboard page

---

## 🆘 Support

Jika ada masalah:
1. Check console logs di browser (F12)
2. Check Supabase logs di dashboard
3. Run test queries di SQL editor
4. Verify RLS policies dan permissions
5. Check trigger dan functions masih ada

---

**Happy Ranking! 🏆**
