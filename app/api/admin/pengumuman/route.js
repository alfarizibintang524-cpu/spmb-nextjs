import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

function readAnnouncement(body) {
  const judul = typeof body.judul === "string" ? body.judul.trim() : "";
  const isi = typeof body.isi === "string" ? body.isi.trim() : "";
  const status = body.status === "terbit" ? "terbit" : body.status === "draft" ? "draft" : "";
  if (!judul || judul.length > 200 || !isi || isi.length > 20000 || !status) {
    return { error: "Judul (maksimal 200 karakter), isi (maksimal 20.000 karakter), dan status wajib valid." };
  }
  return { announcement: { judul, isi, status } };
}

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const [pengumuman] = await pool.execute(
      "SELECT id, judul, isi, status, published_at, created_at, updated_at FROM pengumuman ORDER BY created_at DESC, id DESC"
    );
    return Response.json({ pengumuman });
  } catch (error) {
    return failure(error, "Pengumuman admin GET");
  }
}

export async function POST(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const body = await readBody(request);
    if (!body) return Response.json({ message: "Data pengumuman tidak valid." }, { status: 400 });
    const result = readAnnouncement(body);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    const { judul, isi, status } = result.announcement;
    const [insert] = await pool.execute(
      `INSERT INTO pengumuman (judul, isi, status, published_at)
       VALUES (?, ?, ?, IF(? = 'terbit', CURRENT_TIMESTAMP, NULL))`,
      [judul, isi, status, status]
    );
    const [rows] = await pool.execute(
      "SELECT id, judul, isi, status, published_at, created_at, updated_at FROM pengumuman WHERE id = ?",
      [insert.insertId]
    );
    return Response.json({ message: "Pengumuman berhasil disimpan.", pengumuman: rows[0] }, { status: 201 });
  } catch (error) {
    return failure(error, "Pengumuman admin POST");
  }
}

export async function PATCH(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const body = await readBody(request);
    const id = Number(body?.id);
    if (!body || !Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ message: "ID pengumuman tidak valid." }, { status: 400 });
    }
    const result = readAnnouncement(body);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    const { judul, isi, status } = result.announcement;
    const [update] = await pool.execute(
      `UPDATE pengumuman
       SET judul = ?, isi = ?, status = ?,
           published_at = CASE
             WHEN ? = 'terbit' THEN COALESCE(published_at, CURRENT_TIMESTAMP)
             ELSE published_at
           END
       WHERE id = ?`,
      [judul, isi, status, status, id]
    );
    if (!update.affectedRows) {
      const [existing] = await pool.execute("SELECT id FROM pengumuman WHERE id = ?", [id]);
      if (!existing.length) return Response.json({ message: "Pengumuman tidak ditemukan." }, { status: 404 });
    }
    const [rows] = await pool.execute(
      "SELECT id, judul, isi, status, published_at, created_at, updated_at FROM pengumuman WHERE id = ?",
      [id]
    );
    return Response.json({ message: "Pengumuman berhasil diperbarui.", pengumuman: rows[0] });
  } catch (error) {
    return failure(error, "Pengumuman admin PATCH");
  }
}
