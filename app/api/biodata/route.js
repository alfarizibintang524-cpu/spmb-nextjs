import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

export async function GET() {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;

  try {
    const [rows] = await pool.execute(
    `SELECT u.nama, u.email, b.nisn, b.tempat_lahir,
            DATE_FORMAT(b.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
            b.nomor_hp, b.alamat, b.asal_sekolah, b.nama_ortu
     FROM users u
     LEFT JOIN biodata b ON b.user_id = u.id
     WHERE u.id = ?`,
    [auth.session.id]
    );

    const r = rows[0] || {};

    return Response.json({
    nama: r.nama || "",
    email: r.email || "",
    nisn: r.nisn || "",
    tempat_lahir: r.tempat_lahir || "",
    tanggal_lahir: r.tanggal_lahir || "",
    nomor_hp: r.nomor_hp || "",
    alamat: r.alamat || "",
    asal_sekolah: r.asal_sekolah || "",
    nama_ortu: r.nama_ortu || "",
    });
  } catch (error) { return failure(error, "Biodata GET"); }
}

export async function POST(request) {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const nisn = String(body.nisn || "").trim();
    const tempat = String(body.tempat_lahir || "").trim();
    const hp = String(body.nomor_hp || "").trim();
    const alamat = String(body.alamat || "").trim();
    const sekolah = String(body.asal_sekolah || "").trim();
    const orangTua = String(body.nama_ortu || "").trim();
    const tanggal = String(body.tanggal_lahir || "");
    if (!/^\d{10}$/.test(nisn) || !/^\d{8,15}$/.test(hp) ||
        !tempat || !alamat || !sekolah || !orangTua ||
        !/^\d{4}-\d{2}-\d{2}$/.test(tanggal) ||
        [tempat, alamat, sekolah, orangTua].some((value) => value.length > 255)) {
      return Response.json({ message: "Lengkapi biodata. NISN harus 10 digit dan nomor HP 8–15 digit." }, { status: 400 });
    }

    await pool.execute(
      `INSERT INTO biodata (user_id, nisn, tempat_lahir, tanggal_lahir, nomor_hp, alamat, asal_sekolah, nama_ortu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nisn = VALUES(nisn),
         tempat_lahir = VALUES(tempat_lahir),
         tanggal_lahir = VALUES(tanggal_lahir),
         nomor_hp = VALUES(nomor_hp),
         alamat = VALUES(alamat),
         asal_sekolah = VALUES(asal_sekolah),
         nama_ortu = VALUES(nama_ortu)`,
      [auth.session.id, nisn, tempat, tanggal, hp, alamat, sekolah, orangTua]
    );

    return Response.json({ message: "Biodata berhasil disimpan." });
  } catch (error) {
    return failure(error, "Biodata POST");
  }
}