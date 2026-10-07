-- =============================================
-- ADMIN LEMBAGA SOSIAL - SUPABASE SCHEMA
-- Jalankan di Supabase SQL Editor
-- =============================================

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- DONATUR RUTIN
-- =============================================
CREATE TABLE donatur_rutin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  hp TEXT,
  alamat TEXT,
  kota TEXT,
  program TEXT,
  nominal BIGINT DEFAULT 0,
  metode TEXT DEFAULT 'transfer',
  tgl_mulai DATE,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','tidak_aktif','berhenti')),
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prospek_rutin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  hp TEXT,
  alamat TEXT,
  kota TEXT,
  nominal_potensi BIGINT DEFAULT 0,
  status TEXT DEFAULT 'baru' CHECK (status IN ('baru','dihubungi','survei')),
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pembayaran_rutin (
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

-- =============================================
-- KOTAK INFAQ
-- =============================================
CREATE TABLE kotak_infaq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_kotak TEXT NOT NULL,
  nama_toko TEXT NOT NULL,
  pemilik TEXT,
  hp TEXT,
  alamat TEXT,
  kecamatan TEXT,
  kota TEXT,
  frekuensi TEXT DEFAULT 'bulanan' CHECK (frekuensi IN ('mingguan','dua_mingguan','bulanan')),
  petugas TEXT,
  nominal_terakhir BIGINT DEFAULT 0,
  tgl_ambil DATE,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','tidak_aktif')),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prospek_kotak (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_toko TEXT NOT NULL,
  pemilik TEXT,
  hp TEXT,
  alamat TEXT,
  kecamatan TEXT,
  kota TEXT,
  status TEXT DEFAULT 'baru' CHECK (status IN ('baru','dihubungi','survei')),
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pengambilan_kotak (
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

-- =============================================
-- KCS
-- =============================================
CREATE TABLE kcs_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_kotak TEXT NOT NULL,
  nama_toko TEXT NOT NULL,
  pemilik TEXT,
  hp TEXT,
  alamat TEXT,
  kecamatan TEXT,
  kota TEXT,
  frekuensi TEXT DEFAULT 'bulanan' CHECK (frekuensi IN ('mingguan','dua_mingguan','bulanan')),
  petugas TEXT,
  nominal_terakhir BIGINT DEFAULT 0,
  tgl_ambil DATE,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','tidak_aktif')),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kcs_prospek (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_toko TEXT NOT NULL,
  pemilik TEXT,
  hp TEXT,
  alamat TEXT,
  kecamatan TEXT,
  kota TEXT,
  status TEXT DEFAULT 'baru' CHECK (status IN ('baru','dihubungi','survei')),
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kcs_pengambilan (
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

-- =============================================
-- WAQAF
-- =============================================
CREATE TABLE waqaf_program (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  deskripsi TEXT,
  kategori TEXT DEFAULT 'sosial',
  target BIGINT DEFAULT 0,
  terkumpul BIGINT DEFAULT 0,
  tgl_mulai DATE,
  tgl_target DATE,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','selesai','ditangguhkan')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE donatur_waqaf (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  hp TEXT,
  alamat TEXT,
  kota TEXT,
  program_id UUID REFERENCES waqaf_program(id),
  nominal BIGINT DEFAULT 0,
  tgl_donasi DATE,
  metode TEXT DEFAULT 'transfer',
  status TEXT DEFAULT 'lunas' CHECK (status IN ('lunas','cicilan','pending')),
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prospek_waqaf (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  hp TEXT,
  kota TEXT,
  program_id UUID REFERENCES waqaf_program(id),
  nominal_potensi BIGINT DEFAULT 0,
  status TEXT DEFAULT 'baru' CHECK (status IN ('baru','dihubungi','survei')),
  petugas TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUTO UPDATE updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_donatur_rutin BEFORE UPDATE ON donatur_rutin FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER t_kotak_infaq BEFORE UPDATE ON kotak_infaq FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER t_kcs_data BEFORE UPDATE ON kcs_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS - semua authenticated bisa akses
-- =============================================
ALTER TABLE donatur_rutin ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospek_rutin ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran_rutin ENABLE ROW LEVEL SECURITY;
ALTER TABLE kotak_infaq ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospek_kotak ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengambilan_kotak ENABLE ROW LEVEL SECURITY;
ALTER TABLE kcs_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE kcs_prospek ENABLE ROW LEVEL SECURITY;
ALTER TABLE kcs_pengambilan ENABLE ROW LEVEL SECURITY;
ALTER TABLE waqaf_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE donatur_waqaf ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospek_waqaf ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated user bisa semua
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['donatur_rutin','prospek_rutin','pembayaran_rutin',
    'kotak_infaq','prospek_kotak','pengambilan_kotak',
    'kcs_data','kcs_prospek','kcs_pengambilan',
    'waqaf_program','donatur_waqaf','prospek_waqaf']
  LOOP
    EXECUTE format('CREATE POLICY "auth_all_%s" ON %s FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;
