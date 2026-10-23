import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
export const admin = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
