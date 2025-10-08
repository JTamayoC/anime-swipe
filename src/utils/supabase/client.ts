import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_SUPABASE_URL is not defined. Please set it in your environment.'
  );
}
if (!supabaseKey) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not defined. Please set it in your environment.'
  );
}

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);
