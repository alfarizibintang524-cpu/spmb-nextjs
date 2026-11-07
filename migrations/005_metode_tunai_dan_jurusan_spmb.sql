USE spmb;

SET @spmb_tipe_column_type = (
  SELECT COLUMN_TYPE
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'metode_pembayaran'
    AND COLUMN_NAME = 'tipe'
);
SET @spmb_tipe_is_nullable = (
  SELECT IS_NULLABLE
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'metode_pembayaran'
    AND COLUMN_NAME = 'tipe'
);
SET @spmb_tipe_default = (
  SELECT COLUMN_DEFAULT
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'metode_pembayaran'
    AND COLUMN_NAME = 'tipe'
);
SET @spmb_ddl = IF(
  LEFT(LOWER(COALESCE(@spmb_tipe_column_type, '')), 5) = 'enum('
    AND LOCATE('''tunai''', LOWER(@spmb_tipe_column_type)) = 0,
  CONCAT(
    'ALTER TABLE metode_pembayaran MODIFY COLUMN tipe ',
    LEFT(@spmb_tipe_column_type, CHAR_LENGTH(@spmb_tipe_column_type) - 1),
    ',''tunai'')',
    IF(@spmb_tipe_is_nullable = 'YES', ' NULL', ' NOT NULL'),
    IF(@spmb_tipe_default IS NULL, '', CONCAT(' DEFAULT ', QUOTE(@spmb_tipe_default)))
  ),
  'SELECT 1'
);
PREPARE spmb_stmt FROM @spmb_ddl;
EXECUTE spmb_stmt;
DEALLOCATE PREPARE spmb_stmt;

INSERT INTO metode_pembayaran
  (nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image, petunjuk, aktif, urutan)
SELECT 'Tunai (Cash)', 'tunai', NULL, NULL, NULL, NULL,
       'Bayar tunai langsung kepada panitia dan minta bukti pembayaran.',
       1, 2
WHERE NOT EXISTS (
  SELECT 1 FROM metode_pembayaran WHERE tipe = 'tunai' OR nama = 'Tunai (Cash)'
);

INSERT INTO jurusan (kode, nama, keterangan, kuota, aktif, urutan)
SELECT 'PPLG', 'Pengembangan Perangkat Lunak dan Gim', NULL, NULL, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM jurusan WHERE kode = 'PPLG');

INSERT INTO jurusan (kode, nama, keterangan, kuota, aktif, urutan)
SELECT 'TJKT', 'Teknik Jaringan Komputer dan Telekomunikasi', NULL, NULL, 1, 2
WHERE NOT EXISTS (SELECT 1 FROM jurusan WHERE kode = 'TJKT');

INSERT INTO jurusan (kode, nama, keterangan, kuota, aktif, urutan)
SELECT 'PM', 'Pemasaran', NULL, NULL, 1, 3
WHERE NOT EXISTS (SELECT 1 FROM jurusan WHERE kode = 'PM');

INSERT INTO jurusan (kode, nama, keterangan, kuota, aktif, urutan)
SELECT 'DKV', 'Desain Komunikasi Visual', NULL, NULL, 1, 4
WHERE NOT EXISTS (SELECT 1 FROM jurusan WHERE kode = 'DKV');

INSERT INTO jurusan (kode, nama, keterangan, kuota, aktif, urutan)
SELECT 'PH', 'Perhotelan', NULL, NULL, 1, 5
WHERE NOT EXISTS (SELECT 1 FROM jurusan WHERE kode = 'PH');
