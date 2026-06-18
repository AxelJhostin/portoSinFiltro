import { createClient } from '@supabase/supabase-js';

// Anon key — segura para exponer en el frontend
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
