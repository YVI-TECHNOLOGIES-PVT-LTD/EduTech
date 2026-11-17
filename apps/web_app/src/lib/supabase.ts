import { createClient } from '@supabase/supabase-js';

// Default to the project's Supabase instance if environment variables are not set
const DEFAULT_SUPABASE_URL = 'https://blvseyhzsehfwdmevtyp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdnNleWh6c2VoZndkbWV2dHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzgwMzksImV4cCI6MjEwMTMxNDAzOX0.FEm6WhmAlZasA-W90wQqmbMxjOb2lPpD4MlPGOMJ1q4';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl =
  typeof envUrl === 'string' && envUrl.trim().length > 0 ? envUrl.trim() : DEFAULT_SUPABASE_URL;

const supabaseKey =
  typeof envKey === 'string' && envKey.trim().length > 0
    ? envKey.trim()
    : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
