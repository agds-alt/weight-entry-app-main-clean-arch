// ==========================================
// SUPABASE CONFIGURATION FILE
// config.js
// ==========================================

// LANGKAH SETUP:
// 1. Buka Dashboard Supabase: https://app.supabase.com
// 2. Pilih project Anda
// 3. Buka Settings > API
// 4. Copy "Project URL" dan "anon public" key
// 5. Paste ke variabel di bawah ini

const SUPABASE_CONFIG = {
    // Ganti dengan Project URL Anda
    // Format: https://xxxxxxxxxxxxx.supabase.co
    url: 'https://rwxgpbikdxlialoegghq.supabase.co',
    
    // Ganti dengan anon/public key Anda
    // Format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eGdwYmlrZHhsaWFsb2VnZ2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTQwNDUsImV4cCI6MjA3NTE3MDA0NX0.qxOwPHR9XSzSwaDUyo5a11Ok2Irs7I4N45uJPiyi4Ug',
    
    // Tabel yang digunakan
    tables: {
        entries: 'entries',
        users: 'users'
    }
};

// Validasi konfigurasi
function validateConfig() {
    if (SUPABASE_CONFIG.url === 'YOUR_PROJECT_URL_HERE' || 
        SUPABASE_CONFIG.anonKey === 'YOUR_ANON_KEY_HERE') {
        console.error('⚠️ PERHATIAN: Supabase belum dikonfigurasi!');
        console.error('📝 Silakan edit file config.js dan masukkan credentials Supabase Anda');
        return false;
    }
    return true;
}

// Initialize Supabase Client
let supabaseClient = null;

function initSupabase() {
    if (!validateConfig()) {
        return null;
    }
    
    try {
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        console.log('✅ Supabase client initialized successfully');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        return null;
    }
}

// Test Connection
async function testSupabaseConnection() {
    if (!supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return false;
    }
    
    try {
        const { count, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tables.entries)
            .select('*', { count: 'exact', head: true });
            
        if (error) {
            console.error('❌ Connection test failed:', error.message);
            return false;
        }
        
        console.log('✅ Connection successful! Total entries:', count);
        return true;
    } catch (err) {
        console.error('❌ Connection error:', err);
        return false;
    }
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        initSupabase,
        testSupabaseConnection
    };
}