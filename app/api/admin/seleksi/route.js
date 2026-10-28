import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

export async function POST(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const id = Number(body.user_id);
    const status = String(body.status || "");
    const note = String(body.catatan || "").trim().slice(0, 1000) || null;
    if (!Number.isSafeInteger(id) || id <= 0 || !["diajukan", "diterima", "ditolak", "draft"].includes(status)) {
      return Response.json({ message: "Perubahan seleksi tidak valid." }, { status: 400 });
    }
    const [result] = await pool.execute(
      "UPDATE pendaftaran SET status = ?, catatan = ? WHERE user_id = ?",
      [status, note, id]
    );
    if (!result.affectedRows) return Response.json({ message: "Pendaftaran tidak ditemukan." }, { status: 404 });
    return Response.json({ message: "Status seleksi berhasil diperbarui." });
  } catch (error) { return failure(error, "Seleksi admin"); }
}
