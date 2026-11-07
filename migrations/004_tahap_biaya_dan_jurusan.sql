USE spmb;

CREATE TABLE IF NOT EXISTS jurusan (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kode VARCHAR(10) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  keterangan TEXT NULL,
  kuota INT NULL DEFAULT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  urutan INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_jurusan_kode (kode)
);

INSERT INTO jurusan (kode, nama, keterangan, kuota, aktif, urutan)
SELECT 'TKJ', 'Teknik Komputer dan Jaringan', 'Kompetensi jaringan komputer dan administrasi sistem.', NULL, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM jurusan WHERE kode = 'TKJ');

INSERT INTO jurusan (kode, nama, keterangan, kuota, aktif, urutan)
SELECT 'RPL', 'Rekayasa Perangkat Lunak', 'Kompetensi pengembangan aplikasi dan perangkat lunak.', NULL, 1, 2
WHERE NOT EXISTS (SELECT 1 FROM jurusan WHERE kode = 'RPL');

INSERT INTO jurusan (kode, nama, keterangan, kuota, aktif, urutan)
SELECT 'AKL', 'Akuntansi dan Keuangan Lembaga', 'Kompetensi akuntansi dan administrasi keuangan.', NULL, 1, 3
WHERE NOT EXISTS (SELECT 1 FROM jurusan WHERE kode = 'AKL');

INSERT INTO jurusan (kode, nama, keterangan, kuota, aktif, urutan)
SELECT 'MPLB', 'Manajemen Perkantoran dan Layanan Bisnis', 'Kompetensi administrasi perkantoran dan layanan bisnis.', NULL, 1, 4
WHERE NOT EXISTS (SELECT 1 FROM jurusan WHERE kode = 'MPLB');

CREATE TABLE IF NOT EXISTS komponen_biaya (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tahap ENUM('pendaftaran', 'daftar_ulang') NOT NULL,
  nama VARCHAR(150) NOT NULL,
  nominal INT UNSIGNED NOT NULL DEFAULT 0,
  keterangan TEXT NULL,
  wajib TINYINT(1) NOT NULL DEFAULT 1,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  urutan INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_komponen_biaya_tahap_nama (tahap, nama),
  KEY idx_komponen_biaya_tahap_aktif_urutan (tahap, aktif, urutan)
);

INSERT INTO komponen_biaya (tahap, nama, nominal, keterangan, wajib, aktif, urutan)
SELECT 'pendaftaran', 'Biaya Pendaftaran', 150000, 'Biaya pendaftaran calon siswa.', 1, 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM komponen_biaya WHERE tahap = 'pendaftaran' AND nama = 'Biaya Pendaftaran'
);

INSERT INTO komponen_biaya (tahap, nama, nominal, keterangan, wajib, aktif, urutan)
SELECT 'daftar_ulang', 'Uang Pangkal/Gedung', 2500000, 'NOMINAL PLACEHOLDER - ganti dengan angka resmi sekolah.', 1, 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM komponen_biaya WHERE tahap = 'daftar_ulang' AND nama = 'Uang Pangkal/Gedung'
);

INSERT INTO komponen_biaya (tahap, nama, nominal, keterangan, wajib, aktif, urutan)
SELECT 'daftar_ulang', 'Seragam', 750000, 'NOMINAL PLACEHOLDER - ganti dengan angka resmi sekolah.', 1, 1, 2
WHERE NOT EXISTS (
  SELECT 1 FROM komponen_biaya WHERE tahap = 'daftar_ulang' AND nama = 'Seragam'
);

INSERT INTO komponen_biaya (tahap, nama, nominal, keterangan, wajib, aktif, urutan)
SELECT 'daftar_ulang', 'Perlengkapan/Buku', 500000, 'NOMINAL PLACEHOLDER - ganti dengan angka resmi sekolah.', 1, 1, 3
WHERE NOT EXISTS (
  SELECT 1 FROM komponen_biaya WHERE tahap = 'daftar_ulang' AND nama = 'Perlengkapan/Buku'
);

INSERT INTO komponen_biaya (tahap, nama, nominal, keterangan, wajib, aktif, urutan)
SELECT 'daftar_ulang', 'SPP Bulan Pertama', 350000, 'NOMINAL PLACEHOLDER - ganti dengan angka resmi sekolah.', 1, 1, 4
WHERE NOT EXISTS (
  SELECT 1 FROM komponen_biaya WHERE tahap = 'daftar_ulang' AND nama = 'SPP Bulan Pertama'
);

INSERT INTO komponen_biaya (tahap, nama, nominal, keterangan, wajib, aktif, urutan)
SELECT 'daftar_ulang', 'Kegiatan/OSIS', 200000, 'NOMINAL PLACEHOLDER - ganti dengan angka resmi sekolah.', 1, 1, 5
WHERE NOT EXISTS (
  SELECT 1 FROM komponen_biaya WHERE tahap = 'daftar_ulang' AND nama = 'Kegiatan/OSIS'
);

CREATE TABLE IF NOT EXISTS tenggat_pembayaran (
  tahap ENUM('pendaftaran', 'daftar_ulang') NOT NULL PRIMARY KEY,
  batas_waktu DATE NULL DEFAULT NULL
);

INSERT INTO tenggat_pembayaran (tahap, batas_waktu)
SELECT 'pendaftaran', NULL
WHERE NOT EXISTS (SELECT 1 FROM tenggat_pembayaran WHERE tahap = 'pendaftaran');

INSERT INTO tenggat_pembayaran (tahap, batas_waktu)
SELECT 'daftar_ulang', NULL
WHERE NOT EXISTS (SELECT 1 FROM tenggat_pembayaran WHERE tahap = 'daftar_ulang');

SET @spmb_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pembayaran' AND COLUMN_NAME = 'tahap') = 0,
  'ALTER TABLE pembayaran ADD COLUMN tahap ENUM(''pendaftaran'', ''daftar_ulang'') NULL DEFAULT ''pendaftaran''',
  'SELECT 1'
);
PREPARE spmb_stmt FROM @spmb_ddl;
EXECUTE spmb_stmt;
DEALLOCATE PREPARE spmb_stmt;

SET @spmb_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pembayaran' AND COLUMN_NAME = 'nominal') = 0,
  'ALTER TABLE pembayaran ADD COLUMN nominal INT UNSIGNED NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE spmb_stmt FROM @spmb_ddl;
EXECUTE spmb_stmt;
DEALLOCATE PREPARE spmb_stmt;

UPDATE pembayaran SET tahap = 'pendaftaran' WHERE tahap IS NULL;
UPDATE pembayaran SET nominal = jumlah WHERE nominal IS NULL;

SET @spmb_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pembayaran'
     AND INDEX_NAME = 'idx_pembayaran_user_tahap') = 0,
  'ALTER TABLE pembayaran ADD KEY idx_pembayaran_user_tahap (user_id, tahap, created_at)',
  'SELECT 1'
);
PREPARE spmb_stmt FROM @spmb_ddl;
EXECUTE spmb_stmt;
DEALLOCATE PREPARE spmb_stmt;

SET @spmb_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pembayaran'
     AND INDEX_NAME = 'uq_pembayaran_user' AND NON_UNIQUE = 0) > 0,
  'ALTER TABLE pembayaran DROP INDEX uq_pembayaran_user',
  'SELECT 1'
);
PREPARE spmb_stmt FROM @spmb_ddl;
EXECUTE spmb_stmt;
DEALLOCATE PREPARE spmb_stmt;
