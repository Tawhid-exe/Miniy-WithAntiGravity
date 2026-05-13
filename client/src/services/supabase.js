// ═══════════════════════════════════════════════════════════════
//  supabase.js — Supabase client instance
//  Used by all services and contexts across the app
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
