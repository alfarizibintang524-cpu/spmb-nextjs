import bcrypt from "bcryptjs";
import pool from "../lib/db.js";

const jurusan = ["TKJ", "RPL", "AKL", "MPLB"];
const jenisDokumen = ["ijazah_skl", "kk", "akta", "pas_foto", "rapor"];

try {
  const password = await bcrypt.hash("Demo12345", 12);
  for (let index = 1; index <= 8; index += 1) {
    const email = `demo${index}@spmb.test`;
    await pool.execute(
      `INSERT INTO users (nama, email, password, role)
       VALUES (?, ?, ?, 'calon_siswa')
       ON DUPLICATE KEY UPDATE nama = VALUES(nama), password = VALUES(password)`,
      [`Siswa Demo ${index}`, email, password]
    );
    const [rows] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
    const userId = Number(rows[0].id);
    await pool.execute(
      `INSERT INTO biodata (user_id, nisn, tempat_lahir, tanggal_lahir, nomor_hp, alamat, asal_sekolah, nama_ortu)
       VALUES (?, ?, 'Depok', '2009-04-12', ?, 'Depok', 'SMP Negeri 1 Depok', ?)
       ON DUPLICATE KEY UPDATE nisn = VALUES(nisn)`,
      [userId, String(1000000000 + index), `0812345678${String(index).padStart(2, "0")}`, `Orang Tua ${index}`]
    );
    await pool.execute(
      `INSERT INTO pendaftaran (user_id, jurusan_1, status, catatan)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE jurusan_1 = VALUES(jurusan_1)`,
      [userId, jurusan[(index - 1) % jurusan.length],
        index <= 4 ? "diajukan" : index <= 6 ? "diterima" : "ditolak",
        index > 4 ? "Hasil seleksi demo." : null]
    );
    for (const [docIndex, jenis] of jenisDokumen.entries()) {
      if ((index + docIndex) % 3 === 0) continue;
      await pool.execute(
        `INSERT INTO dokumen (user_id, jenis, file_path, status, catatan)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [userId, jenis, "/asset/logo-sekolah.png", (index + docIndex) % 2 ? "valid" : "menunggu", null]
      );
    }
    await pool.execute(
      `INSERT INTO tes_tpa (user_id, nilai, benar, total)
       VALUES (?, ?, ?, 10) ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)`,
      [userId, 50 + index * 5, 5 + Math.floor(index / 2)]
    );
    const paymentStatus = index % 3 === 0 ? "menunggu" : "lunas";
    const [existingPayment] = await pool.execute(
      `SELECT id FROM pembayaran WHERE user_id = ? AND tahap = 'pendaftaran'
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [userId]
    );
    if (existingPayment.length) {
      await pool.execute(
        `UPDATE pembayaran SET jumlah = 150000, nominal = 150000,
           bukti_path = '/asset/logo-sekolah.png', status = ? WHERE id = ?`,
        [paymentStatus, existingPayment[0].id]
      );
    } else {
      await pool.execute(
        `INSERT INTO pembayaran (user_id, jumlah, nominal, tahap, bukti_path, status)
         VALUES (?, 150000, 150000, 'pendaftaran', '/asset/logo-sekolah.png', ?)`,
        [userId, paymentStatus]
      );
    }
  }
  console.log("Seed 8 calon siswa demo berhasil. Password: Demo12345");
} catch (error) {
  console.error("Seed demo gagal:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
