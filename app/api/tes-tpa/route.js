import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

export async function GET() {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const [results] = await Promise.all([
      pool.execute("SELECT id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d FROM soal_tpa ORDER BY RAND() LIMIT 10"),
      pool.execute("SELECT nilai, benar, total, waktu_selesai FROM tes_tpa WHERE user_id = ?", [auth.session.id]),
    ]);
    return Response.json({ soal: results[0][0], hasil: results[1][0][0] || null });
  } catch (error) { return failure(error, "Tes TPA GET"); }
}

export async function POST(request) {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const [existing] = await pool.execute("SELECT nilai, benar, total FROM tes_tpa WHERE user_id = ?", [auth.session.id]);
    if (existing.length) return Response.json({ message: "Tes hanya dapat dikerjakan satu kali.", hasil: existing[0] }, { status: 409 });
    const body = await request.json();
    const ids = Array.isArray(body.questionIds) ? [...new Set(body.questionIds.map(Number))] : [];
    if (!body.jawaban || typeof body.jawaban !== "object" || ids.length !== 10 ||
        ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
      return Response.json({ message: "Tes harus berisi 10 soal yang valid." }, { status: 400 });
    }
    const [soal] = await pool.execute(
      `SELECT id, jawaban FROM soal_tpa WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    if (soal.length !== ids.length) return Response.json({ message: "Soal tes tidak valid. Muat ulang halaman." }, { status: 400 });
    const benar = soal.reduce((total, question) =>
      total + (String(body.jawaban[question.id] || "").toLowerCase() === question.jawaban ? 1 : 0), 0);
    const nilai = Math.round((benar / soal.length) * 100);
    await pool.execute("INSERT INTO tes_tpa (user_id, nilai, benar, total) VALUES (?, ?, ?, ?)", [auth.session.id, nilai, benar, soal.length]);
    return Response.json({ message: "Tes selesai.", hasil: { nilai, benar, total: soal.length } });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return Response.json({ message: "Tes hanya dapat dikerjakan satu kali." }, { status: 409 });
    }
    return failure(error, "Tes TPA POST");
  }
}
