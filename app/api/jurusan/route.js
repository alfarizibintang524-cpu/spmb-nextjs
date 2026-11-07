import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

export async function GET() {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const [selectedRows] = await pool.execute(
      "SELECT jurusan_1 FROM pendaftaran WHERE user_id = ?",
      [auth.session.id]
    );
    const [majors] = await pool.execute(
      `SELECT j.kode, j.nama, j.keterangan, j.kuota,
              (SELECT COUNT(*) FROM pendaftaran p WHERE p.jurusan_1 = j.kode) AS terisi
       FROM jurusan j
       WHERE j.aktif = 1 AND j.kode IN ('PPLG', 'TJKT', 'PM', 'DKV', 'PH')
       ORDER BY j.urutan, j.id`
    );
    return Response.json({
      jurusan_dipilih: selectedRows[0]?.jurusan_1 || "",
      jurusan: majors,
    });
  } catch (error) {
    return failure(error, "Jurusan GET");
  }
}

export async function POST(request) {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "Data jurusan tidak valid." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ message: "Data jurusan tidak valid." }, { status: 400 });
    }
    const code = typeof body.kode === "string" ? body.kode.trim() : "";
    if (!code || code.length > 10) {
      return Response.json({ message: "Pilih satu jurusan dari daftar yang tersedia." }, { status: 400 });
    }
    const [majorRows] = await pool.execute(
      "SELECT kode, kuota FROM jurusan WHERE kode = ? AND aktif = 1 AND kode IN ('PPLG', 'TJKT', 'PM', 'DKV', 'PH')",
      [code]
    );
    const major = majorRows[0];
    if (!major) {
      return Response.json({ message: "Jurusan tidak tersedia. Muat ulang halaman lalu pilih jurusan aktif." }, { status: 400 });
    }
    if (major.kuota !== null) {
      const [countRows] = await pool.execute(
        "SELECT COUNT(*) AS terisi FROM pendaftaran WHERE jurusan_1 = ? AND user_id <> ?",
        [code, auth.session.id]
      );
      if (Number(countRows[0].terisi) >= Number(major.kuota)) {
        return Response.json({ message: "Kuota jurusan sudah penuh. Silakan pilih jurusan lain." }, { status: 409 });
      }
    }
    await pool.execute(
      `INSERT INTO pendaftaran (user_id, jurusan_1) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE jurusan_1 = VALUES(jurusan_1)`,
      [auth.session.id, code]
    );
    return Response.json({ message: "Jurusan yang dipilih berhasil disimpan." });
  } catch (error) {
    return failure(error, "Jurusan POST");
  }
}
