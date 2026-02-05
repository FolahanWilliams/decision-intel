import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for public/browser operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for server-side admin operations (if needed, e.g. bypassing RLS)
export const getServiceSupabase = () => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return createClient(supabaseUrl, serviceKey);
};
