import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

const stages = new Set(["pendaftaran", "daftar_ulang"]);

function readComponent(body) {
  const tahap = typeof body.tahap === "string" ? body.tahap : "";
  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  const keterangan = typeof body.keterangan === "string" ? body.keterangan.trim() : "";
  const nominal = Number(body.nominal);
  const urutan = Number(body.urutan);
  const wajib = body.wajib === true || body.wajib === 1 || body.wajib === "1"
    ? 1
    : body.wajib === false || body.wajib === 0 || body.wajib === "0" ? 0 : null;
  const aktif = body.aktif === true || body.aktif === 1 || body.aktif === "1"
    ? 1
    : body.aktif === false || body.aktif === 0 || body.aktif === "0" ? 0 : null;
  if (!stages.has(tahap) || !nama || nama.length > 150 || keterangan.length > 2000
    || !Number.isSafeInteger(nominal) || nominal < 0 || nominal > 2147483647
    || !Number.isSafeInteger(urutan) || urutan < 0 || wajib === null || aktif === null) {
    return { error: "Tahap, nama, nominal, keterangan, atau urutan komponen tidak valid." };
  }
  return { component: { tahap, nama, nominal, keterangan: keterangan || null, wajib, aktif, urutan } };
}

export async function GET() {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const [components] = await pool.execute(
      `SELECT id, tahap, nama, nominal, keterangan, wajib, aktif, urutan
       FROM komponen_biaya ORDER BY tahap, urutan, id`
    );
    const [deadlines] = await pool.execute(
      "SELECT tahap, DATE_FORMAT(batas_waktu, '%Y-%m-%d') AS batas_waktu FROM tenggat_pembayaran"
    );
    return Response.json({ komponen_biaya: components, tenggat: deadlines });
  } catch (error) {
    return failure(error, "Komponen biaya admin GET");
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
      return Response.json({ message: "Data komponen biaya tidak valid." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ message: "Data komponen biaya tidak valid." }, { status: 400 });
    }
    const result = readComponent(body);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    const { component } = result;
    const [insert] = await pool.execute(
      `INSERT INTO komponen_biaya (tahap, nama, nominal, keterangan, wajib, aktif, urutan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [component.tahap, component.nama, component.nominal, component.keterangan,
        component.wajib, component.aktif, component.urutan]
    );
    const [rows] = await pool.execute(
      `SELECT id, tahap, nama, nominal, keterangan, wajib, aktif, urutan
       FROM komponen_biaya WHERE id = ?`,
      [insert.insertId]
    );
    return Response.json({ message: "Komponen biaya berhasil ditambahkan.", komponen: rows[0] }, { status: 201 });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return Response.json({ message: "Nama komponen sudah ada pada tahap tersebut." }, { status: 409 });
    }
    return failure(error, "Komponen biaya admin POST");
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
      return Response.json({ message: "Data komponen biaya tidak valid." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ message: "Data komponen biaya tidak valid." }, { status: 400 });
    }
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ message: "ID komponen biaya tidak valid." }, { status: 400 });
    }
    const result = readComponent(body);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    const { component } = result;
    const [update] = await pool.execute(
      `UPDATE komponen_biaya
       SET tahap = ?, nama = ?, nominal = ?, keterangan = ?, wajib = ?, aktif = ?, urutan = ?
       WHERE id = ?`,
      [component.tahap, component.nama, component.nominal, component.keterangan,
        component.wajib, component.aktif, component.urutan, id]
    );
    if (!update.affectedRows) {
      const [rows] = await pool.execute("SELECT id FROM komponen_biaya WHERE id = ?", [id]);
      if (!rows.length) return Response.json({ message: "Komponen biaya tidak ditemukan." }, { status: 404 });
    }
    const [rows] = await pool.execute(
      `SELECT id, tahap, nama, nominal, keterangan, wajib, aktif, urutan
       FROM komponen_biaya WHERE id = ?`,
      [id]
    );
    return Response.json({ message: "Komponen biaya berhasil diperbarui.", komponen: rows[0] });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return Response.json({ message: "Nama komponen sudah ada pada tahap tersebut." }, { status: 409 });
    }
    return failure(error, "Komponen biaya admin PATCH");
  }
}
