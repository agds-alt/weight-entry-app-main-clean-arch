# Migration Guide: From PostgreSQL Pooler to Supabase Client

This guide explains how to migrate from using PostgreSQL pooler to Supabase client SDK.

## What Changed?

The application has been migrated from using direct PostgreSQL connections (via `pg` pooler) to using the Supabase JavaScript SDK client. This provides:

- ✅ Better integration with Supabase features
- ✅ Simplified connection management (no manual pooling)
- ✅ Built-in retry logic and error handling
- ✅ Better TypeScript support
- ✅ Easier deployment (no connection string management)
- ✅ Row Level Security (RLS) support

## Prerequisites

Before starting, make sure you have:

1. A Supabase account at [supabase.com](https://supabase.com)
2. Access to your Supabase project dashboard
3. The database name: `selisih-berat-jnt-migrasi`

## Step 1: Set Up Supabase Database

### 1.1 Create Tables

Go to your Supabase Dashboard > SQL Editor and run the migration script:

```bash
# The migration script is located at:
migrations/001_initial_schema.sql
```

Or copy and paste the SQL from `migrations/001_initial_schema.sql` into the Supabase SQL Editor and click "Run".

This will create:
- `users` table (with indexes and RLS policies)
- `entries` table (with indexes and RLS policies)
- Default admin user (username: `admin`, password: `admin123`)
- Triggers for automatic `updated_at` timestamps

### 1.2 Verify Tables

Check that the tables were created successfully:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

You should see:
- `users`
- `entries`

## Step 2: Configure Environment Variables

### 2.1 Get Your Supabase Credentials

1. Go to Supabase Dashboard > Settings > API
2. Copy the following:
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **anon/public key** (safe to use in client-side code)
   - **service_role key** (⚠️ **NEVER expose in client-side code!**)

### 2.2 Update Your .env File

Replace the old database configuration with Supabase configuration:

**Old configuration (REMOVE):**
```env
# ❌ Remove these old DATABASE_URL configurations
DATABASE_URL=postgresql://...
DB_HOST=...
DB_PORT=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

**New configuration (ADD):**
```env
# ==================== SUPABASE CONFIGURATION ====================
SUPABASE_URL=https://lvsfcxfrvtsjkhbpgllq.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

### 2.3 Important Security Notes

- **SUPABASE_ANON_KEY**: Safe to expose in frontend code
- **SUPABASE_SERVICE_KEY**: ⚠️ **NEVER commit this to Git or expose in client-side code!**
  - Use for backend/server operations only
  - Bypasses Row Level Security (RLS)
  - Has full database access

For production deployment on Vercel:
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_KEY`
3. **DO NOT** commit these to `.env` file in Git

## Step 3: Update Dependencies (Optional)

The migration doesn't require new dependencies as `@supabase/supabase-js` should already be installed. But verify:

```bash
npm list @supabase/supabase-js
```

If not installed:
```bash
npm install @supabase/supabase-js
```

You can optionally remove the `pg` package (but keep it for backward compatibility if needed):
```bash
# Optional: Remove if not used elsewhere
# npm uninstall pg
```

## Step 4: Test the Migration

### 4.1 Start the Application

```bash
npm start
```

You should see:
```
🔄 Attempting database connection...
📍 Method: Supabase Client SDK
📍 Database: selisih-berat-jnt-migrasi
✅ Supabase client connected successfully!
⏰ Server time: 2025-...
📋 Checking database tables...
✅ Users table ready
✅ Entries table ready
✅ All tables initialized successfully
```

### 4.2 Test Authentication

Try logging in with the default admin account:
- Username: `admin`
- Password: `admin123`

⚠️ **Change this password immediately after first login!**

### 4.3 Test Database Operations

Test the following features:
- [ ] User registration
- [ ] User login
- [ ] Create entry
- [ ] View entries
- [ ] Update entry
- [ ] Delete entry
- [ ] Dashboard statistics
- [ ] Leaderboard

## Step 5: Verify Row Level Security (RLS)

The migration automatically sets up RLS policies. Verify they work correctly:

### Test 1: Service Role Access
The backend (using `SUPABASE_SERVICE_KEY`) should have full access.

### Test 2: Anonymous Access
Try accessing data without authentication - it should be restricted.

### Test 3: Authenticated Access
Authenticated users should be able to:
- Read all entries
- Read user information (for authentication)

## Troubleshooting

### Issue: "Missing Supabase configuration"

**Solution:** Make sure `.env` file contains:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### Issue: "Table does not exist"

**Solution:** Run the migration script in Supabase SQL Editor:
```bash
migrations/001_initial_schema.sql
```

### Issue: "Invalid API key"

**Solution:**
1. Check that you copied the correct key from Supabase Dashboard > Settings > API
2. Make sure there are no extra spaces or line breaks
3. Restart your application after updating `.env`

### Issue: "Connection timeout"

**Solution:**
1. Check that your Supabase project is not paused (free tier projects pause after 1 week of inactivity)
2. Verify `SUPABASE_URL` is correct
3. Check your internet connection

### Issue: "RLS policy error"

**Solution:**
- If you get RLS errors, make sure you're using `SUPABASE_SERVICE_KEY` for backend operations
- Check that RLS policies are enabled in Supabase Dashboard > Authentication > Policies

## Rollback (If Needed)

If you need to rollback to the pooler setup:

1. Restore the old `.env` configuration with `DATABASE_URL`
2. Revert the changes in:
   - `src/config/database.js`
   - `src/repositories/*.js`
   - `src/routes/dashboard.routes.js`

3. Or checkout the previous commit:
```bash
git checkout HEAD~1
```

## Performance Optimization (Optional)

For better performance with large datasets, consider creating Supabase RPC (Remote Procedure Call) functions for:
- Complex aggregations in `dashboard.repository.js`
- Statistics calculations in `user.repository.js`
- Heavy queries in `entry.repository.js`

Example RPC function:
```sql
CREATE OR REPLACE FUNCTION get_user_stats(username_param TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_entries', COUNT(*),
    'verified_count', COUNT(*) FILTER (WHERE status = 'verified'),
    'avg_selisih', AVG(selisih)
  )
  FROM entries
  WHERE created_by = username_param;
$$ LANGUAGE sql STABLE;
```

Then call from JavaScript:
```javascript
const { data } = await supabase.rpc('get_user_stats', { username_param: username });
```

## Next Steps

1. ✅ Change default admin password
2. ✅ Set up proper RLS policies for your use case
3. ✅ Configure database backups in Supabase Dashboard
4. ✅ Set up environment variables in Vercel/deployment platform
5. ✅ Test all features thoroughly
6. ✅ Monitor performance and optimize queries if needed

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard > Logs
2. Check application logs: `npm start`
3. Review Supabase documentation: https://supabase.com/docs
4. Check GitHub issues or create a new one

## Summary

You've successfully migrated from PostgreSQL pooler to Supabase client! 🎉

The migration provides:
- ✅ Cleaner code with Supabase SDK
- ✅ Better error handling
- ✅ Easier deployment
- ✅ Built-in security with RLS
- ✅ Better scalability

Your application is now fully integrated with Supabase!
