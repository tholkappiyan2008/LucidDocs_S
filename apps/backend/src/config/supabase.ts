import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error(
      'Supabase is not configured. Please supply SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
    );
  }

  const url = config.supabaseUrl;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(
      `Invalid SUPABASE_URL: "${url}". Must be a valid HTTP or HTTPS URL (e.g., https://your-project.supabase.co). Please check your .env file.`
    );
  }

  supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  const url = config.supabaseUrl;
  const hasValidUrl = url.startsWith('http://') || url.startsWith('https://');
  return Boolean(hasValidUrl && config.supabaseServiceRoleKey);
}
