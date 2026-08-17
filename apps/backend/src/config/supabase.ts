import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from './env';

if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}

// Polyfill global WebSocket for Supabase Realtime in Node.js runtime if not present
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
