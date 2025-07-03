import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm'

const supabaseUrl = "https://otbqzngtnzzlfnmckdbe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YnF6bmd0bnp6bGZubWNrZGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjkzOTIsImV4cCI6MjA2MTAwNTM5Mn0.G5_7FVr5tZFA7J_u_jAibPa1QOwD6XWqFd4KAe-GC7M";

export const supabase = createClient(supabaseUrl, supabaseKey);
