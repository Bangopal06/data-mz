// =============================================
// SUPABASE CONFIG
// =============================================
const SUPABASE_URL = 'https://mhtefxyvqtmfyrkehjzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odGVmeHl2cXRtZnlya2VoanpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMTUxMjAsImV4cCI6MjEwNjg5MTEyMH0.4zvXoZCHBHdzeZ5wXNZW8bE3ULRwObVEYYNpoHRaYf0';

const { createClient } = supabase;
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supa = supa;
