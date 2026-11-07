import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

const stages = new Set(["pendaftaran", "daftar_ulang"]);

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function PATCH(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "Data batas waktu tidak valid." }, { status: 400 });
    }
    const tahap = body && typeof body === "object" && !Array.isArray(body) ? body.tahap : "";
    const batasWaktu = body?.batas_waktu;
    if (!stages.has(tahap) || (batasWaktu !== null && !isValidDate(batasWaktu))) {
      return Response.json({ message: "Tahap atau tanggal batas waktu tidak valid." }, { status: 400 });
    }
    await pool.execute(
      `INSERT INTO tenggat_pembayaran (tahap, batas_waktu) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE batas_waktu = VALUES(batas_waktu)`,
      [tahap, batasWaktu]
    );
    return Response.json({ message: "Batas waktu pembayaran berhasil disimpan." });
  } catch (error) {
    return failure(error, "Tenggat pembayaran admin PATCH");
  }
}
