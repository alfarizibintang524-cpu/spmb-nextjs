import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

function readSchedule(body) {
  const judul = typeof body.judul === "string" ? body.judul.trim() : "";
  const mulaiAt = typeof body.mulai_at === "string" ? body.mulai_at.trim() : "";
  const selesaiAt = typeof body.selesai_at === "string" ? body.selesai_at.trim() : "";
  const keterangan = typeof body.keterangan === "string" ? body.keterangan.trim() : "";
  const aktif = body.aktif === true || body.aktif === 1 || body.aktif === "1";
  const datetimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!judul || judul.length > 150 || keterangan.length > 2000
    || (mulaiAt && (!datetimePattern.test(mulaiAt) || Number.isNaN(Date.parse(mulaiAt))))
    || (selesaiAt && (!datetimePattern.test(selesaiAt) || Number.isNaN(Date.parse(selesaiAt))))
    || (mulaiAt && selesaiAt && Date.parse(mulaiAt) >= Date.parse(selesaiAt))) {
    return { error: "Judul, waktu, atau keterangan jadwal tidak valid. Waktu selesai harus setelah waktu mulai." };
  }
  return {
    schedule: {
      judul,
      mulaiAt: mulaiAt ? `${mulaiAt.replace("T", " ")}:00` : null,
      selesaiAt: selesaiAt ? `${selesaiAt.replace("T", " ")}:00` : null,
      keterangan: keterangan || null,
      aktif: aktif ? 1 : 0,
    },
  };
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
    const [jadwal] = await pool.execute(
      `SELECT id, judul, DATE_FORMAT(mulai_at, '%Y-%m-%dT%H:%i') AS mulai_at,
              DATE_FORMAT(selesai_at, '%Y-%m-%dT%H:%i') AS selesai_at,
              keterangan, aktif, created_at
       FROM jadwal_tes_tpa ORDER BY mulai_at DESC, id DESC`
    );
    return Response.json({ jadwal });
  } catch (error) {
    return failure(error, "Jadwal TPA admin GET");
  }
}

export async function POST(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  let connection;
  try {
    const body = await readBody(request);
    if (!body) return Response.json({ message: "Data jadwal tidak valid." }, { status: 400 });
    const result = readSchedule(body);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    connection = await pool.getConnection();
    await connection.beginTransaction();
    if (result.schedule.aktif) await connection.execute("UPDATE jadwal_tes_tpa SET aktif = 0");
    const [insert] = await connection.execute(
      `INSERT INTO jadwal_tes_tpa (judul, mulai_at, selesai_at, keterangan, aktif)
       VALUES (?, ?, ?, ?, ?)`,
      [result.schedule.judul, result.schedule.mulaiAt, result.schedule.selesaiAt,
        result.schedule.keterangan, result.schedule.aktif]
    );
    await connection.commit();
    const [rows] = await pool.execute(
      `SELECT id, judul, DATE_FORMAT(mulai_at, '%Y-%m-%dT%H:%i') AS mulai_at,
              DATE_FORMAT(selesai_at, '%Y-%m-%dT%H:%i') AS selesai_at, keterangan, aktif, created_at
       FROM jadwal_tes_tpa WHERE id = ?`,
      [insert.insertId]
    );
    return Response.json({ message: "Jadwal tes berhasil ditambahkan.", jadwal: rows[0] }, { status: 201 });
  } catch (error) {
    if (connection) await connection.rollback();
    return failure(error, "Jadwal TPA admin POST");
  } finally {
    connection?.release();
  }
}

export async function PATCH(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  let connection;
  try {
    const body = await readBody(request);
    const id = Number(body?.id);
    if (!body || !Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ message: "ID jadwal tidak valid." }, { status: 400 });
    }
    const result = readSchedule(body);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute("SELECT id FROM jadwal_tes_tpa WHERE id = ? FOR UPDATE", [id]);
    if (!existing.length) {
      await connection.rollback();
      return Response.json({ message: "Jadwal tes tidak ditemukan." }, { status: 404 });
    }
    if (result.schedule.aktif) {
      await connection.execute("UPDATE jadwal_tes_tpa SET aktif = 0 WHERE id <> ?", [id]);
    }
    await connection.execute(
      `UPDATE jadwal_tes_tpa
       SET judul = ?, mulai_at = ?, selesai_at = ?, keterangan = ?, aktif = ?
       WHERE id = ?`,
      [result.schedule.judul, result.schedule.mulaiAt, result.schedule.selesaiAt,
        result.schedule.keterangan, result.schedule.aktif, id]
    );
    await connection.commit();
    const [rows] = await pool.execute(
      `SELECT id, judul, DATE_FORMAT(mulai_at, '%Y-%m-%dT%H:%i') AS mulai_at,
              DATE_FORMAT(selesai_at, '%Y-%m-%dT%H:%i') AS selesai_at, keterangan, aktif, created_at
       FROM jadwal_tes_tpa WHERE id = ?`,
      [id]
    );
    return Response.json({ message: "Jadwal tes berhasil diperbarui.", jadwal: rows[0] });
  } catch (error) {
    if (connection) await connection.rollback();
    return failure(error, "Jadwal TPA admin PATCH");
  } finally {
    connection?.release();
  }
}
