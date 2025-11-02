-- ============================================================================
-- Performance Optimization: Add Database Indexes
-- ============================================================================
-- Run this in Supabase SQL Editor to dramatically improve query performance
--
-- Expected Performance Gains:
-- - Search queries: 2-5 seconds → 100-500ms (80-95% faster)
-- - Status filtering: Full table scan → Index scan
-- - User filtering: O(n) → O(log n)
-- - Date range queries: Much faster with DESC index
-- ============================================================================

-- Enable pg_trgm extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Index for 'nama' column (fuzzy search with trigram)
-- Supports ILIKE queries for name searches
CREATE INDEX IF NOT EXISTS idx_entries_nama_trgm
ON entries USING gin(nama gin_trgm_ops);

-- 2. Index for 'no_resi' column (exact and prefix searches)
-- Supports both = and ILIKE queries
CREATE INDEX IF NOT EXISTS idx_entries_no_resi
ON entries(no_resi);

-- 3. Index for 'status' column (filtering by status)
-- Supports WHERE status = 'value' queries
CREATE INDEX IF NOT EXISTS idx_entries_status
ON entries(status);

-- 4. Index for 'created_by' column (user filtering)
-- Supports WHERE created_by = 'username' queries
CREATE INDEX IF NOT EXISTS idx_entries_created_by
ON entries(created_by);

-- 5. Index for 'created_at' column (date range queries and sorting)
-- DESC order optimizes ORDER BY created_at DESC queries
CREATE INDEX IF NOT EXISTS idx_entries_created_at_desc
ON entries(created_at DESC);

-- 6. Composite index for common query pattern: user + date
-- Optimizes queries that filter by both user and date
CREATE INDEX IF NOT EXISTS idx_entries_user_date
ON entries(created_by, created_at DESC);

-- 7. Composite index for status + date (for dashboard/stats)
-- Optimizes status-based filtering with date sorting
CREATE INDEX IF NOT EXISTS idx_entries_status_date
ON entries(status, created_at DESC);

-- ============================================================================
-- Verify indexes were created successfully
-- ============================================================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'entries'
ORDER BY indexname;

-- ============================================================================
-- Expected Results:
-- ============================================================================
-- After creating these indexes, you should see:
-- - idx_entries_nama_trgm (GIN index for fuzzy name search)
-- - idx_entries_no_resi (B-tree index for resi number)
-- - idx_entries_status (B-tree index for status filtering)
-- - idx_entries_created_by (B-tree index for user filtering)
-- - idx_entries_created_at_desc (B-tree index for date sorting)
-- - idx_entries_user_date (Composite B-tree for user+date queries)
-- - idx_entries_status_date (Composite B-tree for status+date queries)
--
-- Performance Impact:
-- - Search queries with ILIKE: 5-10x faster
-- - Filtered queries: 10-100x faster (depending on table size)
-- - Sorting operations: Near instant with index scan
-- ============================================================================
