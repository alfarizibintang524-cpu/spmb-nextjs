import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

const pilihan = ["PPLG", "TJKT", "PM", "DKV", "PH"];

export async function GET() {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const [rows] = await pool.execute("SELECT jurusan_1, jurusan_2 FROM pendaftaran WHERE user_id = ?", [auth.session.id]);
    return Response.json(rows[0] || { jurusan_1: "", jurusan_2: "" });
  } catch (error) { return failure(error, "Jurusan GET"); }
}

export async function POST(request) {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const first = String(body.jurusan_1 || "");
    const second = String(body.jurusan_2 || "");
    if (!pilihan.includes(first) || !pilihan.includes(second) || first === second) {
      return Response.json({ message: "Pilih dua jurusan berbeda dari daftar yang tersedia." }, { status: 400 });
    }
    await pool.execute(
      `INSERT INTO pendaftaran (user_id, jurusan_1, jurusan_2) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE jurusan_1 = VALUES(jurusan_1), jurusan_2 = VALUES(jurusan_2)`,
      [auth.session.id, first, second]
    );
    return Response.json({ message: "Pilihan jurusan berhasil disimpan." });
  } catch (error) { return failure(error, "Jurusan POST"); }
}
