// =============================================
// SUPABASE CONFIG
// =============================================
const SUPABASE_URL = 'https://trhhwsmulxqttleiuhqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyaGh3c211bHhxdHRsZWl1aHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzc3MzMsImV4cCI6MjEwNTg1MzczM30.PFuHQk1--q4LDlNzi34Xn7Q6nqJlKOnXOlp1BvKNKtE';

const { createClient } = supabase;
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supa = supa;
