-- Jalankan di Supabase SQL Editor
-- Fix: disable RLS + tambah kolom yang hilang

-- 1. Tambah kolom yang hilang di waqaf_program
ALTER TABLE waqaf_program ADD COLUMN IF NOT EXISTS metode_waqaf TEXT DEFAULT 'tunai';
ALTER TABLE waqaf_program ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Disable RLS untuk semua tabel (app pakai anon key tanpa login)
ALTER TABLE donatur_rutin DISABLE ROW LEVEL SECURITY;
ALTER TABLE prospek_rutin DISABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran_rutin DISABLE ROW LEVEL SECURITY;
ALTER TABLE kotak_infaq DISABLE ROW LEVEL SECURITY;
ALTER TABLE prospek_kotak DISABLE ROW LEVEL SECURITY;
ALTER TABLE pengambilan_kotak DISABLE ROW LEVEL SECURITY;
ALTER TABLE kcs_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE kcs_prospek DISABLE ROW LEVEL SECURITY;
ALTER TABLE kcs_pengambilan DISABLE ROW LEVEL SECURITY;
ALTER TABLE waqaf_program DISABLE ROW LEVEL SECURITY;
ALTER TABLE donatur_waqaf DISABLE ROW LEVEL SECURITY;
ALTER TABLE prospek_waqaf DISABLE ROW LEVEL SECURITY;

-- 3. Grant akses ke anon role
GRANT ALL ON waqaf_program TO anon;
GRANT ALL ON donatur_waqaf TO anon;
GRANT ALL ON prospek_waqaf TO anon;
GRANT ALL ON donatur_rutin TO anon;
GRANT ALL ON prospek_rutin TO anon;
GRANT ALL ON pembayaran_rutin TO anon;
GRANT ALL ON kotak_infaq TO anon;
GRANT ALL ON prospek_kotak TO anon;
GRANT ALL ON pengambilan_kotak TO anon;
GRANT ALL ON kcs_data TO anon;
GRANT ALL ON kcs_prospek TO anon;
GRANT ALL ON kcs_pengambilan TO anon;
