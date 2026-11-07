USE spmb;

ALTER TABLE pembayaran
  MODIFY COLUMN status ENUM(
    'belum',
    'menunggu',
    'lunas',
    'ditolak',
    'menunggu_verifikasi',
    'diterima'
  ) NOT NULL DEFAULT 'belum';
