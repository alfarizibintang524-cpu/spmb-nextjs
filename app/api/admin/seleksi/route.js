import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

export async function POST(request) {
  const auth = await apiSession(["admin", "kepsek"]);
  if (auth.error) return auth.error;
  let connection;
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "Data seleksi tidak valid." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ message: "Data seleksi tidak valid." }, { status: 400 });
    }
    const rawIds = Array.isArray(body.user_ids) ? body.user_ids : [body.user_id];
    const ids = [...new Set(rawIds.map(Number))].sort((left, right) => left - right);
    const status = String(body.status || "");
    const allowedStatuses = auth.session.role === "kepsek"
      ? ["diterima", "ditolak"]
      : ["diajukan", "diterima", "ditolak", "draft"];
    if (ids.length === 0 || ids.length > 100 || ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
      || !allowedStatuses.includes(status)) {
      return Response.json({ message: "Perubahan seleksi tidak valid." }, { status: 400 });
    }
    if (body.catatan !== undefined && body.catatan !== null && typeof body.catatan !== "string") {
      return Response.json({ message: "Catatan seleksi tidak valid." }, { status: 400 });
    }
    const rawNote = typeof body.catatan === "string" ? body.catatan.trim() : "";
    if (rawNote.length > 1000) {
      return Response.json({ message: "Catatan seleksi maksimal 1.000 karakter." }, { status: 400 });
    }
    const note = rawNote || null;
    const placeholders = ids.map(() => "?").join(",");

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [registrations] = await connection.execute(
      `SELECT user_id, jurusan_1, status FROM pendaftaran
       WHERE user_id IN (${placeholders}) ORDER BY user_id FOR UPDATE`,
      ids
    );
    if (registrations.length !== ids.length) {
      await connection.rollback();
      return Response.json({ message: "Satu atau lebih pendaftaran tidak ditemukan." }, { status: 404 });
    }
    if (auth.session.role === "kepsek" && registrations.some((registration) => registration.status === "draft")) {
      await connection.rollback();
      return Response.json({ message: "Pendaftar harus mengajukan pendaftaran sebelum dapat ditetapkan." }, { status: 409 });
    }

    if (status === "diterima") {
      const majorCodes = [...new Set(registrations.map((registration) => registration.jurusan_1).filter(Boolean))].sort();
      if (registrations.some((registration) => !registration.jurusan_1)) {
        await connection.rollback();
        return Response.json({ message: "Pendaftar yang lulus harus memiliki pilihan jurusan." }, { status: 409 });
      }
      const majorPlaceholders = majorCodes.map(() => "?").join(",");
      const [majors] = await connection.execute(
        `SELECT kode, kuota FROM jurusan WHERE kode IN (${majorPlaceholders}) ORDER BY kode FOR UPDATE`,
        majorCodes
      );
      if (majors.length !== majorCodes.length) {
        await connection.rollback();
        return Response.json({ message: "Jurusan pendaftar tidak ditemukan. Periksa data pilihan jurusan sebelum menetapkan hasil." }, { status: 409 });
      }
      const [acceptedRows] = await connection.execute(
        `SELECT jurusan_1, COUNT(*) AS terisi FROM pendaftaran
         WHERE status = 'diterima' AND jurusan_1 IN (${majorPlaceholders})
         GROUP BY jurusan_1`,
        majorCodes
      );
      const acceptedByMajor = new Map(acceptedRows.map((row) => [row.jurusan_1, Number(row.terisi)]));
      const additions = new Map();
      for (const registration of registrations) {
        if (registration.status !== "diterima") {
          additions.set(registration.jurusan_1, (additions.get(registration.jurusan_1) || 0) + 1);
        }
      }
      for (const major of majors) {
        const total = (acceptedByMajor.get(major.kode) || 0) + (additions.get(major.kode) || 0);
        if (major.kuota !== null && total > Number(major.kuota)) {
          await connection.rollback();
          return Response.json({
            message: `Kuota jurusan ${major.kode} tidak mencukupi (${acceptedByMajor.get(major.kode) || 0}/${major.kuota} terisi).`,
          }, { status: 409 });
        }
      }
    }

    const [result] = await connection.execute(
      `UPDATE pendaftaran SET status = ?, catatan = COALESCE(?, catatan) WHERE user_id IN (${placeholders})`,
      [status, note, ...ids]
    );
    await connection.commit();
    return Response.json({
      message: `Status seleksi berhasil diperbarui untuk ${result.affectedRows} pendaftar.`,
      updated: result.affectedRows,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    return failure(error, "Seleksi admin");
  } finally {
    connection?.release();
  }
}
