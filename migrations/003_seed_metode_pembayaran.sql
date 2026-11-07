USE spmb;

INSERT INTO metode_pembayaran
  (nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image, petunjuk, aktif, urutan)
SELECT 'Transfer BCA', 'transfer_bank', 'BCA', NULL, NULL, NULL,
       'Admin: lengkapi nomor rekening dan nama pemilik sebelum metode ini digunakan siswa.',
       1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM metode_pembayaran WHERE nama = 'Transfer BCA'
);

INSERT INTO metode_pembayaran
  (nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image, petunjuk, aktif, urutan)
SELECT 'Transfer BRI', 'transfer_bank', 'BRI', NULL, NULL, NULL,
       'Admin: lengkapi nomor rekening dan nama pemilik sebelum metode ini digunakan siswa.',
       1, 2
WHERE NOT EXISTS (
  SELECT 1 FROM metode_pembayaran WHERE nama = 'Transfer BRI'
);

INSERT INTO metode_pembayaran
  (nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image, petunjuk, aktif, urutan)
SELECT 'Transfer Mandiri', 'transfer_bank', 'Mandiri', NULL, NULL, NULL,
       'Admin: lengkapi nomor rekening dan nama pemilik sebelum metode ini digunakan siswa.',
       1, 3
WHERE NOT EXISTS (
  SELECT 1 FROM metode_pembayaran WHERE nama = 'Transfer Mandiri'
);

INSERT INTO metode_pembayaran
  (nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image, petunjuk, aktif, urutan)
SELECT 'Transfer BNI', 'transfer_bank', 'BNI', NULL, NULL, NULL,
       'Admin: lengkapi nomor rekening dan nama pemilik sebelum metode ini digunakan siswa.',
       1, 4
WHERE NOT EXISTS (
  SELECT 1 FROM metode_pembayaran WHERE nama = 'Transfer BNI'
);

INSERT INTO metode_pembayaran
  (nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image, petunjuk, aktif, urutan)
SELECT 'QRIS', 'qris', NULL, NULL, NULL, NULL,
       'Admin: unggah gambar QRIS sebelum metode ini digunakan siswa.',
       1, 5
WHERE NOT EXISTS (
  SELECT 1 FROM metode_pembayaran WHERE nama = 'QRIS'
);
