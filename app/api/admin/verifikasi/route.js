import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";
import { getPaymentSchemaStatus } from "@/lib/payment-schema";

export async function POST(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "Data verifikasi tidak valid." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ message: "Data verifikasi tidak valid." }, { status: 400 });
    }
    const type = String(body.type || "");
    const status = String(body.status || "");
    if (body.catatan !== undefined && body.catatan !== null && typeof body.catatan !== "string") {
      return Response.json({ message: "Catatan verifikasi tidak valid." }, { status: 400 });
    }
    const rawNote = typeof body.catatan === "string" ? body.catatan.trim() : "";
    if (rawNote.length > 1000) {
      return Response.json({ message: "Catatan verifikasi maksimal 1.000 karakter." }, { status: 400 });
    }
    const note = rawNote || null;
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0 || !["dokumen", "pembayaran"].includes(type)) {
      return Response.json({ message: "Data verifikasi tidak valid." }, { status: 400 });
    }
    const allowed = type === "dokumen" ? ["valid", "ditolak"] : ["lunas", "diterima", "ditolak"];
    if (!allowed.includes(status)) return Response.json({ message: "Status verifikasi tidak valid." }, { status: 400 });
    const table = type === "dokumen" ? "dokumen" : "pembayaran";
    if (type === "pembayaran") {
      const schema = await getPaymentSchemaStatus();
      if (!schema.ready) return Response.json({ message: schema.message }, { status: 503 });
      const tahap = body.tahap;
      const nominal = Number(body.nominal);
      if (!["pendaftaran", "daftar_ulang"].includes(tahap)
        || !Number.isSafeInteger(nominal) || nominal < 0) {
        return Response.json({ message: "Tahap atau nominal pembayaran tidak valid." }, { status: 400 });
      }
      if (status === "ditolak" && !note) {
        return Response.json({ message: "Catatan alasan penolakan wajib diisi." }, { status: 400 });
      }
      const [result] = await pool.execute(
        `UPDATE pembayaran SET status = ?, catatan = ?
         WHERE id = ? AND tahap = ? AND nominal = ?
           AND status IN ('menunggu', 'menunggu_verifikasi')`,
        [status, note, id, tahap, nominal]
      );
      if (!result.affectedRows) {
        const [rows] = await pool.execute("SELECT id, tahap, nominal FROM pembayaran WHERE id = ?", [id]);
        if (!rows.length) return Response.json({ message: "Pembayaran tidak ditemukan." }, { status: 404 });
        if (rows[0].tahap !== tahap || Number(rows[0].nominal) !== nominal) {
          return Response.json({ message: "Tahap atau nominal pembayaran berubah. Muat ulang data sebelum memverifikasi." }, { status: 409 });
        }
        return Response.json({ message: "Pembayaran sudah diverifikasi atau tidak lagi menunggu." }, { status: 409 });
      }
      return Response.json({ message: "Verifikasi pembayaran berhasil disimpan." });
    }
    const [result] = await pool.execute(`UPDATE ${table} SET status = ?, catatan = ? WHERE id = ?`, [status, note, id]);
    if (!result.affectedRows) return Response.json({ message: "Data tidak ditemukan." }, { status: 404 });
    return Response.json({ message: "Verifikasi berhasil disimpan." });
  } catch (error) { return failure(error, "Verifikasi admin"); }
}
