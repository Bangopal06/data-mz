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

-- =============================================
-- PETUGAS TABLE (jalankan jika belum ada)
-- =============================================
CREATE TABLE IF NOT EXISTS petugas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  jabatan TEXT,
  status TEXT DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE petugas DISABLE ROW LEVEL SECURITY;
GRANT ALL ON petugas TO anon;

-- =============================================
-- SCS - Santri Cinta Sedekah (jalankan jika belum ada)
-- =============================================
CREATE TABLE IF NOT EXISTS scs_santri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  panggilan TEXT,
  kelas TEXT,
  halaqoh TEXT,
  status TEXT DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS scs_pembayaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id UUID REFERENCES scs_santri(id) ON DELETE CASCADE,
  nama_santri TEXT,
  kelas TEXT,
  halaqoh TEXT,
  nominal BIGINT DEFAULT 0,
  tgl_bayar DATE NOT NULL,
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS s3_ustadz (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  panggilan TEXT,
  amanah TEXT,
  hp TEXT,
  status TEXT DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE scs_santri DISABLE ROW LEVEL SECURITY;
ALTER TABLE scs_pembayaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE s3_ustadz DISABLE ROW LEVEL SECURITY;
GRANT ALL ON scs_santri TO anon;
GRANT ALL ON scs_pembayaran TO anon;
GRANT ALL ON s3_ustadz TO anon;

-- s3_pembayaran (sedekah ustadz/ustadzah)
CREATE TABLE IF NOT EXISTS s3_pembayaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ustadz_id UUID REFERENCES s3_ustadz(id) ON DELETE CASCADE,
  nama_ustadz TEXT,
  amanah TEXT,
  nominal BIGINT DEFAULT 0,
  tgl_bayar DATE NOT NULL,
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE s3_pembayaran DISABLE ROW LEVEL SECURITY;
GRANT ALL ON s3_pembayaran TO anon;
