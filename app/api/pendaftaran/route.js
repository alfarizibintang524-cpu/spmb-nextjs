import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

export async function POST() {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const [rows] = await pool.execute(
      `SELECT b.nisn, b.tempat_lahir, b.tanggal_lahir, b.nomor_hp, b.alamat, b.asal_sekolah, b.nama_ortu,
              p.jurusan_1, p.jurusan_2,
              p.status,
              (SELECT COUNT(*) FROM dokumen d WHERE d.user_id = p.user_id) AS dokumen_count,
              (SELECT COUNT(*) FROM tes_tpa t WHERE t.user_id = p.user_id) AS tes_selesai,
              (SELECT COUNT(*) FROM pembayaran pay WHERE pay.user_id = p.user_id AND pay.status IN ('menunggu','lunas')) AS pembayaran_dikirim
       FROM users u LEFT JOIN biodata b ON b.user_id = u.id LEFT JOIN pendaftaran p ON p.user_id = u.id
       WHERE u.id = ?`,
      [auth.session.id]
    );
    const data = rows[0];
    if (!data?.nisn || !data.tempat_lahir || !data.tanggal_lahir || !data.nomor_hp || !data.alamat ||
        !data.jurusan_1 || !data.jurusan_2 || Number(data.dokumen_count) < 5 ||
        !Number(data.tes_selesai) || !Number(data.pembayaran_dikirim)) {
      return Response.json({ message: "Lengkapi biodata, jurusan, 5 dokumen, tes TPA, dan pembayaran sebelum mengajukan." }, { status: 400 });
    }
    if (data.status === "diterima" || data.status === "diajukan") {
      return Response.json({ message: "Pendaftaran sudah diajukan atau telah diputuskan." }, { status: 409 });
    }
    const [result] = await pool.execute(
      `UPDATE pendaftaran SET status = 'diajukan', catatan = NULL
       WHERE user_id = ? AND status IN ('draft', 'ditolak')`,
      [auth.session.id]
    );
    if (!result.affectedRows) return Response.json({ message: "Pendaftaran tidak dapat diajukan." }, { status: 409 });
    return Response.json({ message: "Pendaftaran berhasil diajukan." });
  } catch (error) { return failure(error, "Pengajuan pendaftaran"); }
}
