import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

function readMajor(body) {
  const kode = typeof body.kode === "string" ? body.kode.trim().toUpperCase() : "";
  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  const keterangan = typeof body.keterangan === "string" ? body.keterangan.trim() : "";
  const rawKuota = body.kuota;
  const kuota = rawKuota === null || rawKuota === "" ? null : Number(rawKuota);
  const urutan = Number(body.urutan);
  const aktif = body.aktif === true || body.aktif === 1 || body.aktif === "1"
    ? 1
    : body.aktif === false || body.aktif === 0 || body.aktif === "0" ? 0 : null;
  if (!/^[A-Z0-9_-]{1,10}$/.test(kode) || !nama || nama.length > 100
    || keterangan.length > 2000 || (kuota !== null && (!Number.isSafeInteger(kuota) || kuota < 0))
    || !Number.isSafeInteger(urutan) || urutan < 0 || aktif === null) {
    return { error: "Kode, nama, kuota, keterangan, atau urutan jurusan tidak valid." };
  }
  return { major: { kode, nama, keterangan: keterangan || null, kuota, aktif, urutan } };
}

export async function GET() {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const [majors] = await pool.execute(
      `SELECT j.id, j.kode, j.nama, j.keterangan, j.kuota, j.aktif, j.urutan,
              (SELECT COUNT(*) FROM pendaftaran p WHERE p.jurusan_1 = j.kode) AS terisi
       FROM jurusan j ORDER BY j.urutan, j.id`
    );
    return Response.json({ jurusan: majors });
  } catch (error) {
    return failure(error, "Jurusan admin GET");
  }
}

export async function POST(request) {
  const auth = await apiSession(["admin"]);
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
    const result = readMajor(body);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    const { major } = result;
    const [existing] = await pool.execute("SELECT id FROM jurusan WHERE kode = ?", [major.kode]);
    if (existing.length) return Response.json({ message: "Kode jurusan sudah digunakan." }, { status: 409 });
    const [insert] = await pool.execute(
      `INSERT INTO jurusan (kode, nama, keterangan, kuota, aktif, urutan)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [major.kode, major.nama, major.keterangan, major.kuota, major.aktif, major.urutan]
    );
    const [rows] = await pool.execute(
      `SELECT id, kode, nama, keterangan, kuota, aktif, urutan, 0 AS terisi
       FROM jurusan WHERE id = ?`,
      [insert.insertId]
    );
    return Response.json({ message: "Jurusan berhasil ditambahkan.", jurusan: rows[0] }, { status: 201 });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return Response.json({ message: "Kode jurusan sudah digunakan." }, { status: 409 });
    }
    return failure(error, "Jurusan admin POST");
  }
}

export async function PATCH(request) {
  const auth = await apiSession(["admin"]);
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
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ message: "ID jurusan tidak valid." }, { status: 400 });
    }
    const [existingRows] = await pool.execute(
      "SELECT id, aktif, kode FROM jurusan WHERE id = ?",
      [id]
    );
    const existing = existingRows[0];
    if (!existing) return Response.json({ message: "Jurusan tidak ditemukan." }, { status: 404 });

    if (Object.keys(body).length === 2 && Object.hasOwn(body, "aktif")) {
      if (body.aktif !== 0 && body.aktif !== 1 && body.aktif !== false && body.aktif !== true) {
        return Response.json({ message: "Status aktif jurusan tidak valid." }, { status: 400 });
      }
      const aktif = body.aktif === 1 || body.aktif === true ? 1 : 0;
      await pool.execute("UPDATE jurusan SET aktif = ? WHERE id = ?", [aktif, id]);
    } else {
      const result = readMajor(body);
      if (result.error) return Response.json({ message: result.error }, { status: 400 });
      if (result.major.kode !== existing.kode) {
        return Response.json({ message: "Kode jurusan tidak dapat diubah agar data pendaftar lama tetap terhubung." }, { status: 400 });
      }
      await pool.execute(
        `UPDATE jurusan SET nama = ?, keterangan = ?, kuota = ?, aktif = ?, urutan = ?
         WHERE id = ?`,
        [result.major.nama, result.major.keterangan, result.major.kuota,
          result.major.aktif, result.major.urutan, id]
      );
    }
    const [rows] = await pool.execute(
      `SELECT j.id, j.kode, j.nama, j.keterangan, j.kuota, j.aktif, j.urutan,
              (SELECT COUNT(*) FROM pendaftaran p WHERE p.jurusan_1 = j.kode) AS terisi
       FROM jurusan j WHERE j.id = ?`,
      [id]
    );
    return Response.json({ message: "Jurusan berhasil diperbarui.", jurusan: rows[0] });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return Response.json({ message: "Kode jurusan sudah digunakan." }, { status: 409 });
    }
    return failure(error, "Jurusan admin PATCH");
  }
}
