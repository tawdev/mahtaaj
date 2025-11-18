/**
 * Supabase Admin Client (service role)
 * Used for privileged CRUD operations in admin dashboards.
 *
 * ⚠️ IMPORTANT: Do NOT expose the service role key in public builds.
 * Only set REACT_APP_SUPABASE_SERVICE_ROLE_KEY for secured admin deployments.
 */

import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://xcsfqzeyooncpqbcqihm.supabase.co';
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdminClient = null;

if (serviceRoleKey) {
  try {
    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    console.log('✅ Supabase admin client ready');
  } catch (err) {
    console.error('❌ Failed to init Supabase admin client:', err);
    supabaseAdminClient = null;
  }
} else {
  console.warn('⚠️ Missing REACT_APP_SUPABASE_SERVICE_ROLE_KEY. Admin writes fallback to public client.');
}

export const supabaseAdmin = supabaseAdminClient;

export const getSupabaseAdmin = () => supabaseAdminClient || supabase;

