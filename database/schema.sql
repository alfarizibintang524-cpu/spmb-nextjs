CREATE TABLE IF NOT EXISTS biodata (
  user_id INT NOT NULL PRIMARY KEY,
  nisn VARCHAR(10) NULL,
  tempat_lahir VARCHAR(100) NULL,
  tanggal_lahir DATE NULL,
  nomor_hp VARCHAR(20) NULL,
  alamat VARCHAR(255) NULL,
  asal_sekolah VARCHAR(150) NULL,
  nama_ortu VARCHAR(150) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_biodata_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pendaftaran (
  user_id INT NOT NULL PRIMARY KEY,
  jurusan_1 VARCHAR(10) NULL,
  jurusan_2 VARCHAR(10) NULL,
  status ENUM('draft','diajukan','diterima','ditolak') NOT NULL DEFAULT 'draft',
  catatan TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pendaftaran_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dokumen (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  jenis ENUM('ijazah_skl','kk','akta','pas_foto','rapor') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  status ENUM('menunggu','valid','ditolak') NOT NULL DEFAULT 'menunggu',
  catatan TEXT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dokumen_user_jenis (user_id, jenis),
  CONSTRAINT fk_dokumen_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tes_tpa (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nilai DECIMAL(5,2) NOT NULL,
  benar INT NOT NULL,
  total INT NOT NULL,
  waktu_selesai TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tes_user (user_id),
  CONSTRAINT fk_tes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS soal_tpa (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pertanyaan TEXT NOT NULL,
  opsi_a VARCHAR(500) NOT NULL,
  opsi_b VARCHAR(500) NOT NULL,
  opsi_c VARCHAR(500) NOT NULL,
  opsi_d VARCHAR(500) NOT NULL,
  jawaban ENUM('a','b','c','d') NOT NULL
);

INSERT IGNORE INTO soal_tpa (id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban) VALUES
(1, 'Lanjutkan pola angka: 2, 4, 8, 16, ...', '18', '24', '32', '36', 'c'),
(2, 'Sinonim kata cermat adalah ...', 'Teliti', 'Cepat', 'Lalai', 'Ragu', 'a'),
(3, 'Jika semua A adalah B dan semua B adalah C, maka ...', 'Semua C adalah A', 'Semua A adalah C', 'Tidak ada A yang C', 'Semua B adalah A', 'b'),
(4, 'Hasil dari 15 × 4 adalah ...', '45', '50', '60', '65', 'c'),
(5, 'Antonim kata optimis adalah ...', 'Yakin', 'Pesimis', 'Semangat', 'Tekun', 'b'),
(6, 'Lanjutkan pola: 3, 6, 9, 12, ...', '13', '14', '15', '18', 'c'),
(7, 'Buku dibaca dengan mata seperti musik didengar dengan ...', 'Tangan', 'Telinga', 'Hidung', 'Kulit', 'b'),
(8, 'Jika 5 pensil berharga Rp10.000, berapa harga 8 pensil?', 'Rp12.000', 'Rp14.000', 'Rp16.000', 'Rp18.000', 'c'),
(9, 'Kata yang tidak sekelompok adalah ...', 'Senin', 'Rabu', 'Jumat', 'Januari', 'd'),
(10, 'Lanjutkan pola huruf: A, C, E, G, ...', 'H', 'I', 'J', 'K', 'b');

CREATE TABLE IF NOT EXISTS pembayaran (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  jumlah INT NOT NULL,
  bukti_path VARCHAR(500) NULL,
  status ENUM('belum','menunggu','lunas','ditolak') NOT NULL DEFAULT 'belum',
  catatan TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pembayaran_user (user_id),
  CONSTRAINT fk_pembayaran_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
