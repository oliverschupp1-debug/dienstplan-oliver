import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bnczqecafushiiraznng.supabase.co"


const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuY3pxZWNhZnVzaGlpcmF6bm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzYzODIsImV4cCI6MjA5MzY1MjM4Mn0.3hDY52xnriOsybii3sj5KwGGSChoADXk4_k9sOH9QYY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
