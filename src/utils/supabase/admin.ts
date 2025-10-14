'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_SUPABASE_URL is not defined. Please set it in your environment.'
  );
}
if (!supabaseKey) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_SUPABASE_KEY is not defined. Please set it in your environment.'
  );
}

export const getSupabaseAdmin = () => createClient(supabaseUrl, supabaseKey);
