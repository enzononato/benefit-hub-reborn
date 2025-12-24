import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ebcgkxdxpqftlsvvdcnk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViY2dreGR4cHFmdGxzdnZkY25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5ODE3MjksImV4cCI6MjA1MDU1NzcyOX0.P9K-t9mXVjc2j5zqfNJYhfbTGVlmg5-Ao55BQSfW6x0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
