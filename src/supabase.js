import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://kriwaipphtwaucqhzhba.supabase.co';
export const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyaXdhaXBwaHR3YXVjcWh6aGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxOTU3OTksImV4cCI6MjA5Mjc3MTc5OX0.FOJbkXo3-bC5FIL4FaFRjNiHNXUcq9pTyEa4X5mYlk0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);