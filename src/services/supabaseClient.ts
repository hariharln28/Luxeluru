import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase') &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'your-actual-supabase-anon-key';

if (!isConfigured) {
  console.warn(
    '[Luxeluru] Supabase credentials are not configured.\n' +
    'Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'Authentication (login, register, Google Sign-In) will not work until this is done.'
  );
}

// Use placeholder values so the app loads without crashing even when unconfigured
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
);

export { isConfigured as supabaseConfigured };
