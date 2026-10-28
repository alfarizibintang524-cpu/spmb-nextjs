import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

export async function POST(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const type = String(body.type || "");
    const status = String(body.status || "");
    const note = String(body.catatan || "").trim().slice(0, 1000) || null;
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0 || !["dokumen", "pembayaran"].includes(type)) {
      return Response.json({ message: "Data verifikasi tidak valid." }, { status: 400 });
    }
    const allowed = type === "dokumen" ? ["valid", "ditolak"] : ["lunas", "ditolak"];
    if (!allowed.includes(status)) return Response.json({ message: "Status verifikasi tidak valid." }, { status: 400 });
    const table = type === "dokumen" ? "dokumen" : "pembayaran";
    const [result] = await pool.execute(`UPDATE ${table} SET status = ?, catatan = ? WHERE id = ?`, [status, note, id]);
    if (!result.affectedRows) return Response.json({ message: "Data tidak ditemukan." }, { status: 404 });
    return Response.json({ message: "Verifikasi berhasil disimpan." });
  } catch (error) { return failure(error, "Verifikasi admin"); }
}
