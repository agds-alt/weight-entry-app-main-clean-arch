const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for backend

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase client not configured');
  console.warn('   Add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

// Upload image to Supabase Storage
async function uploadToSupabase(file, folder, filename) {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  try {
    const { data, error } = await supabase.storage
      .from('weight-entries') // Create this bucket in Supabase dashboard
      .upload(`${folder}/${filename}`, file, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('weight-entries')
      .getPublicUrl(`${folder}/${filename}`);

    return publicUrl;
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Failed to upload to Supabase Storage');
  }
}

// Delete image from Supabase Storage
async function deleteFromSupabase(path) {
  if (!supabase) return;

  try {
    const { error } = await supabase.storage
      .from('weight-entries')
      .remove([path]);

    if (error) console.error('Delete error:', error);
  } catch (error) {
    console.error('Supabase delete error:', error);
  }
}

// Create user with Supabase Auth (optional)
async function createSupabaseUser(email, password, metadata = {}) {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    });

    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Create Supabase user error:', error);
    throw error;
  }
}

// Sign in with Supabase Auth
async function signInSupabase(email, password) {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase sign in error:', error);
    throw error;
  }
}

module.exports = {
  supabase,
  uploadToSupabase,
  deleteFromSupabase,
  createSupabaseUser,
  signInSupabase
};