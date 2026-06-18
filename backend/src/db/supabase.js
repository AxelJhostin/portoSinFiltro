import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Service role — bypassa RLS, nunca exponer al frontend
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);
