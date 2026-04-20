// ============================================================
//  lib/supabase.js
//  Clients Supabase pour usage serveur uniquement (API routes)
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY    = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Variables Supabase manquantes dans .env.local');
}

/**
 * Client avec la clé service_role — bypasse RLS.
 * À utiliser uniquement dans les API routes Next.js (server-side).
 * JAMAIS exposé côté client.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

/**
 * Client avec la clé anon — respecte RLS.
 * Utilisable pour les lectures publiques si nécessaire.
 */
export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
