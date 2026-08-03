import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import ws from 'ws';

// Service role — bypassa RLS, nunca exponer al frontend.
// Node < 22 has no native WebSocket; supabase-js realtime needs `ws`.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: ws },
  }
);
