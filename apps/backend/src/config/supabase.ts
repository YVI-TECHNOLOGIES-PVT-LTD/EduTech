import { createClient } from '@supabase/supabase-js';
import { env } from './env';

if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}

export const supabase: any = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
