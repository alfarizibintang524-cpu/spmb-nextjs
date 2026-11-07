USE spmb;

CREATE TABLE IF NOT EXISTS metode_pembayaran (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  tipe ENUM('transfer_bank', 'qris', 'ewallet') NOT NULL,
  nama_bank VARCHAR(100) NULL,
  nomor_rekening VARCHAR(100) NULL,
  atas_nama VARCHAR(150) NULL,
  qr_image VARCHAR(500) NULL,
  petunjuk TEXT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  urutan INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_metode_pembayaran_nama (nama)
);

SET @spmb_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pembayaran' AND COLUMN_NAME = 'metode_id') = 0,
  'ALTER TABLE pembayaran ADD COLUMN metode_id INT NULL',
  'SELECT 1'
);
PREPARE spmb_stmt FROM @spmb_ddl;
EXECUTE spmb_stmt;
DEALLOCATE PREPARE spmb_stmt;

SET @spmb_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pembayaran' AND COLUMN_NAME = 'tanggal_bayar') = 0,
  'ALTER TABLE pembayaran ADD COLUMN tanggal_bayar DATE NULL',
  'SELECT 1'
);
PREPARE spmb_stmt FROM @spmb_ddl;
EXECUTE spmb_stmt;
DEALLOCATE PREPARE spmb_stmt;

SET @spmb_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pembayaran' AND COLUMN_NAME = 'nama_pengirim') = 0,
  'ALTER TABLE pembayaran ADD COLUMN nama_pengirim VARCHAR(150) NULL',
  'SELECT 1'
);
PREPARE spmb_stmt FROM @spmb_ddl;
EXECUTE spmb_stmt;
DEALLOCATE PREPARE spmb_stmt;

SET @spmb_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pembayaran' AND INDEX_NAME = 'idx_pembayaran_metode') = 0,
  'ALTER TABLE pembayaran ADD KEY idx_pembayaran_metode (metode_id)',
  'SELECT 1'
);
PREPARE spmb_stmt FROM @spmb_ddl;
EXECUTE spmb_stmt;
DEALLOCATE PREPARE spmb_stmt;

SET @spmb_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pembayaran'
     AND CONSTRAINT_NAME = 'fk_pembayaran_metode') = 0,
  'ALTER TABLE pembayaran ADD CONSTRAINT fk_pembayaran_metode FOREIGN KEY (metode_id) REFERENCES metode_pembayaran(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE spmb_stmt FROM @spmb_ddl;
EXECUTE spmb_stmt;
DEALLOCATE PREPARE spmb_stmt;
