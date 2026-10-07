-- =============================================
-- ADMIN LEMBAGA SOSIAL - SUPABASE SCHEMA
-- Jalankan di Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Donatur Rutin
CREATE TABLE IF NOT EXISTS donatur_rutin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  hp TEXT,
  alamat TEXT,
  kota TEXT,
  program TEXT,
  nominal BIGINT DEFAULT 0,
  metode TEXT DEFAULT 'transfer',
  tgl_mulai DATE,
  status TEXT DEFAULT 'aktif',
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calon Donatur Rutin
CREATE TABLE IF NOT EXISTS prospek_rutin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  hp TEXT,
  alamat TEXT,
  kota TEXT,
  nominal_potensi BIGINT DEFAULT 0,
  status TEXT DEFAULT 'baru',
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pembayaran Donatur Rutin
CREATE TABLE IF NOT EXISTS pembayaran_rutin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donatur_id UUID REFERENCES donatur_rutin(id) ON DELETE CASCADE,
  nama_donatur TEXT,
  nominal BIGINT NOT NULL,
  tgl_bayar DATE NOT NULL,
  metode TEXT,
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kotak Infaq
CREATE TABLE IF NOT EXISTS kotak_infaq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_kotak TEXT NOT NULL,
  nama_toko TEXT NOT NULL,
  pemilik TEXT,
  hp TEXT,
  alamat TEXT,
  kecamatan TEXT,
  kota TEXT,
  frekuensi TEXT DEFAULT 'bulanan',
  petugas TEXT,
  nominal_terakhir BIGINT DEFAULT 0,
  tgl_ambil DATE,
  status TEXT DEFAULT 'aktif',
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prospek Kotak Infaq
CREATE TABLE IF NOT EXISTS prospek_kotak (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_toko TEXT NOT NULL,
  pemilik TEXT,
  hp TEXT,
  alamat TEXT,
  kecamatan TEXT,
  kota TEXT,
  status TEXT DEFAULT 'baru',
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pengambilan Kotak Infaq
CREATE TABLE IF NOT EXISTS pengambilan_kotak (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kotak_id UUID REFERENCES kotak_infaq(id) ON DELETE CASCADE,
  nama_kotak TEXT,
  nama_toko TEXT,
  tgl_ambil DATE NOT NULL,
  nominal BIGINT NOT NULL,
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KCS
CREATE TABLE IF NOT EXISTS kcs_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_kotak TEXT NOT NULL,
  nama_toko TEXT NOT NULL,
  pemilik TEXT,
  hp TEXT,
  alamat TEXT,
  kecamatan TEXT,
  kota TEXT,
  frekuensi TEXT DEFAULT 'bulanan',
  petugas TEXT,
  nominal_terakhir BIGINT DEFAULT 0,
  tgl_ambil DATE,
  status TEXT DEFAULT 'aktif',
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prospek KCS
CREATE TABLE IF NOT EXISTS kcs_prospek (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_toko TEXT NOT NULL,
  pemilik TEXT,
  hp TEXT,
  alamat TEXT,
  kecamatan TEXT,
  kota TEXT,
  status TEXT DEFAULT 'baru',
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pengambilan KCS
CREATE TABLE IF NOT EXISTS kcs_pengambilan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kcs_id UUID REFERENCES kcs_data(id) ON DELETE CASCADE,
  nama_kotak TEXT,
  nama_toko TEXT,
  tgl_ambil DATE NOT NULL,
  nominal BIGINT NOT NULL,
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program Waqaf
CREATE TABLE IF NOT EXISTS waqaf_program (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  deskripsi TEXT,
  kategori TEXT DEFAULT 'sosial',
  target BIGINT DEFAULT 0,
  terkumpul BIGINT DEFAULT 0,
  tgl_mulai DATE,
  tgl_target DATE,
  status TEXT DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donatur Waqaf
CREATE TABLE IF NOT EXISTS donatur_waqaf (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  hp TEXT,
  alamat TEXT,
  kota TEXT,
  program_id UUID REFERENCES waqaf_program(id),
  nominal BIGINT DEFAULT 0,
  tgl_donasi DATE,
  metode TEXT,
  status TEXT DEFAULT 'lunas',
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prospek Waqaf
CREATE TABLE IF NOT EXISTS prospek_waqaf (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  hp TEXT,
  kota TEXT,
  program_id UUID REFERENCES waqaf_program(id),
  nominal_potensi BIGINT DEFAULT 0,
  status TEXT DEFAULT 'baru',
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_donatur_rutin BEFORE UPDATE ON donatur_rutin FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_kotak_infaq BEFORE UPDATE ON kotak_infaq FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_kcs_data BEFORE UPDATE ON kcs_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Disable RLS untuk semua tabel (akses publik via anon key)
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
