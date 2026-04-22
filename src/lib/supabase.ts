import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL ERROR: Supabase environment variables are missing! The application will not be able to fetch data. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your deployment environment.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key'
);
