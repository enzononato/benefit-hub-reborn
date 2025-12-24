import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wyhlezxtfhoolrvuqhfy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aGxlenh0Zmhvb2xydnVxaGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDQ0MDIsImV4cCI6MjA4MDAyMDQwMn0.ThShgHu7Pj5BUl-quRjIgybo8k0864rT3nLW7-Tgp2I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
